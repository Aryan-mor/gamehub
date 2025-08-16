import type { GameHubContext } from '@/plugins';

export interface PhotoContext {
	isPlaying: boolean;
	boardCards: string[];
	seatInfoByUser: Record<string, any>;
	actingUuid?: string;
	currentBetGlobal: number;
	isDetailed?: boolean;
	telegramIdToUuid: Record<number, string>;
}

function normalizeCardToAssetName(code: string): string {
	// Accept formats like 'A♠', 'As', 'AS', 'aS', '10h', 'Td', '10_of_hearts'
	const trimmed = String(code).trim();
	if (trimmed.includes('_of_')) return trimmed; // already normalized
	const suitMap: Record<string, string> = {
		'♠': 'spades', S: 'spades', s: 'spades',
		'♥': 'hearts', H: 'hearts', h: 'hearts',
		'♦': 'diamonds', D: 'diamonds', d: 'diamonds',
		'♣': 'clubs', C: 'clubs', c: 'clubs'
	};
	const rankMap: Record<string, string> = {
		A: 'ace', a: 'ace',
		K: 'king', k: 'king',
		Q: 'queen', q: 'queen',
		J: 'jack', j: 'jack',
		T: '10', t: '10'
	};
	// Match unicode suit form or letter suit form
	const m = trimmed.match(/^(10|[2-9TJQKA]|[2-9tjqka])([♠♥♦♣SHDCshdc])$/);
	if (!m) return trimmed;
	const rawRank = m[1];
	const rawSuit = m[2];
	const rank = rankMap[rawRank] || rawRank; // 2-9 or '10'
	const suit = suitMap[rawSuit] || rawSuit;
	return `${rank}_of_${suit}`;
}

function normalizeCards(list: string[] | undefined | null, length?: number): string[] {
	const arr = Array.isArray(list) ? list.map(normalizeCardToAssetName) : [];
	if (typeof length === 'number' && arr.length < length) {
		return [...arr, ...Array.from({ length: length - arr.length }, () => 'blank')];
	}
	return arr;
}

export async function sendOrEditPhotoToUsers(
	hub: GameHubContext,
	roomId: string,
	chatIds: number[],
	caption: string,
	inlineKeyboard: Array<Array<{ text: string; callback_data: string }>>,
	photoCtx: PhotoContext
): Promise<void> {
	// Prefer per-user updates (edit caption when possible), fallback to sending new photo
	const { usersMessageHistory } = await import('@/plugins/smart-reply');
	const { InputFile } = await import('grammy');

	for (const chatId of chatIds) {
		const chatIdStr = String(chatId);
		const previous = usersMessageHistory[chatIdStr];
		const isInitiator = String((hub as any)?.from?.id ?? '') === chatIdStr;
		const callbackMsg = (hub as any)?.callbackQuery?.message as { message_id?: number; chat?: { id?: number | string } } | undefined;
		const isSameMessage = Boolean(previous && callbackMsg && String(callbackMsg.chat?.id ?? '') === chatIdStr && previous.messageId === callbackMsg.message_id);

		try {
			// Build per-user card list for template
			const userUuid = photoCtx.telegramIdToUuid[chatId];
			const seat = userUuid ? photoCtx.seatInfoByUser[userUuid] : undefined;
			const showHole = Boolean(seat && seat.inHand !== false && Array.isArray(seat.hole));
			const board = normalizeCards(photoCtx.boardCards, 5);
			const hole = showHole ? normalizeCards(seat.hole as string[], 2) : ['blank', 'blank'];
			const cardsForTemplate = [...board, ...hole]; // poker-table expects: 5 board + 2 player cards

			// Generate buffer with card-image-service (dynamic import to avoid build-time coupling)
			const service = await import('../../../../../../packages/card-image-service/dist/index.js').catch(() => null as any);
			if (!service || typeof service.generateTemplateBufferOnly !== 'function') {
				// Fallback: edit/send text only
				await hub.sendOrEditMessageToUsers([chatId], caption, { parse_mode: 'HTML', reply_markup: { inline_keyboard: inlineKeyboard } });
				continue;
			}
			const buffer: Buffer = await service.generateTemplateBufferOnly('poker-table', cardsForTemplate, 'general', `room:${roomId}`, 'webp', true);

			// Try edit caption first when safe
			if (isInitiator && isSameMessage) {
				try {
					await (hub as any).api.editMessageCaption(chatId, previous.messageId, {
						caption,
						parse_mode: 'HTML',
						reply_markup: { inline_keyboard: inlineKeyboard }
					});
					continue;
				} catch {
					// fallthrough to replace
				}
			}

			// Replace previous message with a new photo message
			if (previous) {
				try { await (hub as any).api.deleteMessage(previous.chatId, previous.messageId); } catch {}
			}
			const sent = await (hub as any).api.sendPhoto(chatIdStr, new InputFile(buffer, 'poker-table.webp'), {
				caption,
				parse_mode: 'HTML',
				reply_markup: { inline_keyboard: inlineKeyboard }
			});
			usersMessageHistory[chatIdStr] = {
				chatId: chatIdStr,
				messageId: (sent as any).message_id,
				timestamp: Date.now(),
				userId: chatIdStr,
				messageType: 'room_info',
				roomId,
			};
		} catch (err) {
			(hub as any)?.log?.error?.('photoMessenger.sendOrEditPhotoToUsers failed', {
				roomId,
				chatId,
				error: err instanceof Error ? err.message : String(err)
			});
			// Fallback: send text only
			await hub.sendOrEditMessageToUsers([chatId], caption, { parse_mode: 'HTML', reply_markup: { inline_keyboard: inlineKeyboard } });
		}
	}
}


