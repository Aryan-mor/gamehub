import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import type { GameHubContext } from '@/plugins';

export interface CardInfo {
	userCards: string[];
	boardCards: string[];
	handId: string;
}

function normalizeCardCodeToAssetName(code: string): string {
	// Accept formats like 'A♠', 'K♥', 'Q♦', 'J♣', '10♠', 'T♣', '9♠', etc.
	const rankMap: Record<string, string> = {
		A: 'ace',
		K: 'king',
		Q: 'queen',
		J: 'jack',
		T: '10',
	};
	const suitMap: Record<string, string> = {
		'♠': 'spades',
		'♥': 'hearts',
		'♦': 'diamonds',
		'♣': 'clubs',
	};
	// Handle 10 as two chars or T as one char
	const match = code.match(/^(10|[2-9TJQKA])([♠♥♦♣])$/);
	if (!match) return code; // fallback to given code
	const [, rawRank, rawSuit] = match;
	const rank = rankMap[rawRank] || rawRank; // digits 2-9 or '10'
	const suit = suitMap[rawSuit] || rawSuit;
	return `${rank}_of_${suit}`;
}

function normalizeCardsForAssets(cards: string[]): string[] {
	return cards.map(normalizeCardCodeToAssetName);
}

export async function getUserCardsAndBoard(roomId: string, userId: string): Promise<CardInfo | null> {
	logFunctionStart('cardService.getUserCardsAndBoard', { roomId, userId });
	
	try {
		const { supabaseFor } = await import('@/lib/supabase');
		const poker = supabaseFor('poker');
		
		// Get current hand for the room
		const { data: handData, error: handError } = await poker
			.from('hands')
			.select('id, board')
			.eq('room_id', roomId)
			.order('created_at', { ascending: false })
			.limit(1)
			.single();
		
		if (handError || !handData) {
			logFunctionEnd('cardService.getUserCardsAndBoard', { found: false, reason: 'no_hand' });
			return null;
		}
		
		// Get user's seat and cards
		const { data: seatData, error: seatError } = await poker
			.from('seats')
			.select('hole')
			.eq('hand_id', handData.id)
			.eq('user_id', userId)
			.single();
		
		if (seatError || !seatData || !seatData.hole) {
			logFunctionEnd('cardService.getUserCardsAndBoard', { found: false, reason: 'no_seat_or_cards' });
			return null;
		}
		
		const userCards = seatData.hole as string[];
		const boardCards = (handData.board as string[]) || [];
		
		logFunctionEnd('cardService.getUserCardsAndBoard', { 
			found: true, 
			userCardsCount: userCards.length,
			boardCardsCount: boardCards.length,
			handId: handData.id
		});
		
		return {
			userCards,
			boardCards,
			handId: handData.id
		};
		
	} catch (err) {
		logError('cardService.getUserCardsAndBoard', err as Error, { roomId, userId });
		return null;
	}
}

/**
 * Build photo blocks (user hand and board) for a given user in a room, without sending.
 * Returns null if cards are not available yet.
 */
// buildCardBlocksForUser removed in single-photo flow

export async function sendCardImagesToUser(
	ctx: GameHubContext,
	roomId: string,
	userId: string,
	targetChatId: string | number
): Promise<boolean> {
	logFunctionStart('cardService.sendCardImagesToUser', { roomId, userId, targetChatId: String(targetChatId) });
	
	try {
		const cardInfo = await getUserCardsAndBoard(roomId, userId);
		if (!cardInfo) {
			logFunctionEnd('cardService.sendCardImagesToUser', { success: false, reason: 'no_cards' });
			return false;
		}
		
		// Try to use card-image-service for buffer generation only
		try {
			// Dynamic import with fallback
			const cardImageService = await import('../../../../../../packages/card-image-service/dist/index.js').catch(() => null);
			if (!cardImageService) {
				throw new Error('Card image service not available');
			}
			const { generateTemplateBufferOnly } = cardImageService;
			const { InputFile } = await import('grammy');
			
			const userCardsAssets = normalizeCardsForAssets(cardInfo.userCards);
			const boardCardsAssets = normalizeCardsForAssets(cardInfo.boardCards);
			
			// Generate user's hand image buffer using player-hand template
			const userHandBuffer = await generateTemplateBufferOnly(
				'player-hand',
				userCardsAssets,
				'general',
				`Hand ${cardInfo.handId}`,
				'webp',
				true
			);
			
			const userHandCaption = `🃏 <b>Your Cards:</b>\n${cardInfo.userCards.join(' ')}`;
			await (ctx as any).api.sendPhoto(String(targetChatId), new InputFile(userHandBuffer, 'hand.webp'), {
				caption: userHandCaption,
				parse_mode: 'HTML'
			});
			
			// Generate board image if there are board cards
			if (boardCardsAssets.length > 0) {
				const boardBuffer = await generateTemplateBufferOnly(
					'table-only',
					boardCardsAssets,
					'general',
					`Board ${cardInfo.handId}`,
					'webp',
					true
				);
				
				const boardCardsCaption = `🎴 <b>Community Cards:</b>\n${cardInfo.boardCards.join(' ')}`;
				await (ctx as any).api.sendPhoto(String(targetChatId), new InputFile(boardBuffer, 'board.webp'), {
					caption: boardCardsCaption,
					parse_mode: 'HTML'
				});
			}
			
		} catch (cardServiceError) {
			// Fallback to text-only if card-image-service fails
			logError('cardService.sendCardImagesToUser', cardServiceError as Error, { 
				roomId, 
				userId, 
				targetChatId: String(targetChatId),
				fallback: 'text-only'
			});
			
			// Send user's hand with text representation (as text, not caption-only)
			const userHandCaption = `🃏 <b>Your Cards:</b>\n${cardInfo.userCards.join(' ')}`;
			await (ctx as any).api.sendMessage(String(targetChatId), userHandCaption, { parse_mode: 'HTML' });
			
			// Send board cards if they exist
			if (cardInfo.boardCards.length > 0) {
				const boardCardsCaption = `🎴 <b>Community Cards:</b>\n${cardInfo.boardCards.join(' ')}`;
				await (ctx as any).api.sendMessage(String(targetChatId), boardCardsCaption, { parse_mode: 'HTML' });
			}
		}
		
		logFunctionEnd('cardService.sendCardImagesToUser', { success: true });
		return true;
		
	} catch (err) {
		logError('cardService.sendCardImagesToUser', err as Error, { roomId, userId, targetChatId: String(targetChatId) });
		return false;
	}
}
