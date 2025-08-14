import type { PokerRoom } from './types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { buildPlayingView, buildWaitingView } from './views';
import { usersMessageHistory } from '@/plugins/smart-reply';
import type { InputMediaPhoto, InlineKeyboardMarkup } from 'grammy/types';

// Shared inline button type
type Btn = { text: string } & ({ callback_data: string } | { switch_inline_query: string });

export async function createRoom(params: Omit<PokerRoom, 'players' | 'readyPlayers' | 'playerNames'>): Promise<PokerRoom> {
  logFunctionStart('roomService.createRoom', { roomId: params.id, createdBy: params.createdBy });
  try {
    const repo = await import('@/actions/games/poker/room/services/roomRepo');
    const created = await repo.createRoom(params);
    logFunctionEnd('roomService.createRoom', { mode: 'db', roomId: created.id });
    return created;
  } catch (err) {
    logError('roomService.createRoom', err as Error, { roomId: params.id });
    throw err;
  }
}

export async function getRoom(roomId: string): Promise<PokerRoom | undefined> {
  try {
    const repo = await import('@/actions/games/poker/room/services/roomRepo');
    return await repo.getRoom(roomId);
  } catch (err) {
    logError('roomService.getRoom', err as Error, { roomId });
    return undefined;
  }
}

export async function addPlayer(roomId: string, userId: string): Promise<void> {
  const repo = await import('@/actions/games/poker/room/services/roomRepo');
  await repo.addPlayer(roomId, userId);
}

export async function removePlayer(roomId: string, userId: string): Promise<void> {
  const repo = await import('@/actions/games/poker/room/services/roomRepo');
  await repo.removePlayer(roomId, userId);
}

export async function markReady(roomId: string, userId: string): Promise<void> {
  const repo = await import('@/actions/games/poker/room/services/roomRepo');
  await repo.setReady(roomId, userId, true);
}

export async function markNotReady(roomId: string, userId: string): Promise<void> {
  const repo = await import('@/actions/games/poker/room/services/roomRepo');
  await repo.setReady(roomId, userId, false);
}

// Central function to broadcast room info to all players
import type { GameHubContext } from '@/plugins';
import type { HandlerContext } from '@/modules/core/handler';

export async function broadcastRoomInfo(
  ctx: GameHubContext | HandlerContext,
  roomId: string,
  targetUserIds?: string[],
  isDetailed?: boolean
): Promise<void> {
  logFunctionStart('roomService.broadcastRoomInfo', { roomId, targetUserIds });
  
  try {
    const escapeHtml = (input: string): string =>
      input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    // Get room data
    const room = await getRoom(roomId);
    if (!room) {
      logError('roomService.broadcastRoomInfo', new Error('room not found'), { roomId });
      return;
    }

    // Get all players if no specific users provided
    const userIds = targetUserIds || room.players;
    
    // Generate room info message
    const playerCount = room.players.length;
    const maxPlayers = room.maxPlayers || 2;
    const smallBlind = room.smallBlind || 200;
    const bigBlind = smallBlind * 2;
    const timeout = room.turnTimeoutSec || 120;
    const timeoutMinutes = Math.round(timeout / 60);
    const lastUpdate = room.lastUpdate ? new Date(room.lastUpdate).toISOString() : 'Unknown';
    
    // Get player names and map UUID → Telegram chat ID
    const { getByIds } = await import('@/api/users');
    const dbUsers = await getByIds(room.players);
    const adminId = room.createdBy;
    const idToDisplayName: Record<string, string> = {};
    const idToTelegramId: Record<string, number> = {};
    for (const u of dbUsers) {
      const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
      const display = fullName || u.first_name || u.username || String(u.telegram_id) || 'Unknown';
      idToDisplayName[String(u.id)] = escapeHtml(display);
      idToTelegramId[String(u.id)] = Number(u.telegram_id);
    }
    let playerNames = room.players
      .map((uid) => {
        const name = idToDisplayName[uid] || 'Unknown';
        const isAdmin = uid === adminId;
        return `${name} ${isAdmin ? '👑 ' : ''}`;
      })
      .join('\n');
    
    // Inline keyboard and message builders
    const gctx: GameHubContext = (typeof (ctx as GameHubContext).t === 'function')
      ? (ctx as GameHubContext)
      : (ctx as HandlerContext).ctx as unknown as GameHubContext;
    const adminTelegramId = idToTelegramId[adminId];
    const hasAtLeastTwoPlayers = (room.players?.length ?? 0) >= 2;
    const telegramIdToUuid: Record<number, string> = Object.fromEntries(
      Object.entries(idToTelegramId).map(([uuid, tg]) => [tg as number, uuid])
    );

    // If playing, enrich per-user context (light placeholder using seats/pots when available)
    const isPlaying = room.status === 'playing';
    let potTotal: number | undefined;
    const seatInfoByUser: Record<string, { stack: number; bet: number; hole?: string[] | null }> = {};
    let actingUuid: string | undefined;
    let currentBetGlobal: number = 0;
    let boardCards: string[] = [];
    if (isPlaying) {
      try {
        const { supabaseFor } = await import('@/lib/supabase');
        const poker = supabaseFor('poker');
        // latest hand by room
        const { data: hands } = await poker.from('hands').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(1);
        const hand = hands && hands[0];
        const handId = hand?.id;
        boardCards = Array.isArray(hand?.board) ? (hand?.board as string[]) : [];
        if (handId) {
          const { listSeatsByHand } = await import('./seatsRepo');
          const seats = await listSeatsByHand(String(handId));
          for (const s of seats) seatInfoByUser[s.user_id] = { stack: s.stack, bet: s.bet, hole: s.hole };
          if (typeof hand?.acting_pos === 'number') {
            const actingSeat = seats.find((s) => Number(s.seat_pos) === Number(hand.acting_pos));
            actingUuid = actingSeat?.user_id;
          }
          const { data: pots } = await poker.from('pots').select('*').eq('hand_id', handId);
          potTotal = (pots || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
          currentBetGlobal = Number(hand?.current_bet || 0);
        }
      } catch {
        // non-blocking
      }
    }

    // Mark acting player with an icon in the list, if available
    if (isPlaying && actingUuid) {
      const lines = playerNames.split('\n');
      playerNames = room.players.map((uid, idx) => {
        const base = lines[idx] || '';
        return uid === actingUuid ? `${base} 🎯` : base;
      }).join('\n');
    }

    const view = (isPlaying ? buildPlayingView : buildWaitingView)({
      roomId,
      playerNames,
      smallBlind,
      bigBlind,
      maxPlayers,
      playerCount,
      timeoutMinutes,
      lastUpdateIso: escapeHtml(lastUpdate),
      hasAtLeastTwoPlayers,
      t: gctx.t.bind(gctx),
      // per-user extras filled when sending to each user below
    }, isDetailed);
    
    // Resolve recipient chat IDs:
    // - If explicit targetUserIds provided (Telegram IDs as strings), use them
    // - Else map room player UUIDs → Telegram chat IDs via idToTelegramId
    let recipientChatIds: number[] = [];
    if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
      const numeric = targetUserIds.map((id) => Number(id)).filter((n) => Number.isFinite(n));
      if (numeric.length === targetUserIds.length) {
        recipientChatIds = numeric;
      } else {
        // Assume provided IDs are UUIDs → map to telegram ids
        recipientChatIds = targetUserIds
          .map((uuid) => idToTelegramId[uuid])
          .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
      }
    } else {
      // Default recipients
      recipientChatIds = room.players
        .map((uuid) => idToTelegramId[uuid])
        .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
      // When playing, send to all players by default for game state updates
      // This ensures all players get notified when game starts or state changes
    }

    const usePhotoFlow = Boolean((gctx as any)?.api?.sendPhoto) && process.env.POKER_SINGLE_PHOTO_FLOW !== 'false';

    if (recipientChatIds.length === 0) {
      // Fallback: try explicit targetUserIds if any; otherwise use initiator chat id
      const initiatorId = Number((gctx as any)?.from?.id);
      const fallback = (Array.isArray(targetUserIds) && targetUserIds.length > 0)
        ? targetUserIds.map((id) => Number(id)).filter((n) => Number.isFinite(n))
        : (Number.isFinite(initiatorId) ? [initiatorId] : []);
      if (fallback.length === 0) {
        logError('roomService.broadcastRoomInfo', new Error('no_recipients'), { roomId, targetUserIds });
        return;
      }
      // Use fallback recipients
      if (usePhotoFlow) {
        // Photo flow for fallback recipients (single message)
        const { inline_keyboard } = { inline_keyboard: view.keyboardForPlayer } as { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
        await sendOrEditPhotoToUsers(gctx, roomId, fallback, view.message, inline_keyboard, {
          isPlaying,
          boardCards,
          seatInfoByUser,
          actingUuid,
          currentBetGlobal,
          isDetailed,
          idToTelegramId,
          telegramIdToUuid,
          adminId
        });
      } else {
        const send = (ctx as any).sendOrEditMessageToUsers ?? (gctx as any).sendOrEditMessageToUsers;
        await send(
          fallback,
          view.message,
          {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: view.keyboardForPlayer }
          }
        );
      }
      logFunctionEnd('roomService.broadcastRoomInfo', {
        roomId,
        targetUserIds: fallback.length,
        messageLength: view.message.length,
        note: 'fallback'
      });
      return;
    }

    // Split recipients into admin and non-admin for personalized keyboards
    const adminRecipients = adminTelegramId ? recipientChatIds.filter((id) => id === adminTelegramId) : [];
    const nonAdminRecipients = adminTelegramId ? recipientChatIds.filter((id) => id !== adminTelegramId) : recipientChatIds;

    if (adminRecipients.length > 0) {
      const adminInfo = seatInfoByUser[adminId];
      const adminCanCheck = typeof adminInfo?.bet === 'number' ? adminInfo.bet >= currentBetGlobal : false;
      const showDetailsText = gctx.t('poker.room.buttons.showDetails') || '📋 Show Details';
      const showSummaryText = gctx.t('poker.room.buttons.showSummary') || '📝 Show Summary';
      
      const actingRows: Btn[][] = [
        ...(adminCanCheck
          ? [
              [{ text: gctx.t('poker.game.buttons.check'), callback_data: 'g.pk.r.ck' }],
              [{ text: gctx.t('poker.actions.raise'), callback_data: 'g.pk.r.rs' }],
              [{ text: gctx.t('poker.game.buttons.fold'), callback_data: 'g.pk.r.fd' }]
            ]
          : [
              [{ text: gctx.t('poker.game.buttons.call'), callback_data: 'g.pk.r.cl' }],
              [{ text: gctx.t('poker.actions.raise'), callback_data: 'g.pk.r.rs' }],
              [{ text: gctx.t('poker.game.buttons.fold'), callback_data: 'g.pk.r.fd' }]
            ]
        ),
        [{ text: isDetailed ? showSummaryText : showDetailsText, callback_data: `g.pk.r.in?detailed=${!isDetailed}` }]
      ];
      const waitingRows: Btn[][] = [
        [{ text: gctx.t('bot.buttons.refresh'), callback_data: 'g.pk.r.in' }],
        [{ text: isDetailed ? showSummaryText : showDetailsText, callback_data: `g.pk.r.in?detailed=${!isDetailed}` }]
      ];

      const isAdminActing = actingUuid && adminId === actingUuid;
      const keyboard = isPlaying ? (isAdminActing ? actingRows : waitingRows) : view.keyboardForAdmin;

      // Build personalized caption
      const base = view.message;
      const extraParts: string[] = [];
      const yourStackLabel = gctx.t('poker.game.field.yourStack') || 'Your stack';
      const yourBetLabel = gctx.t('poker.game.field.yourBet') || 'Your bet';
      const potLabel = gctx.t('poker.game.field.potLabel') || 'Pot';
      if (typeof adminInfo?.stack === 'number') extraParts.push(`${yourStackLabel}: ${adminInfo.stack}`);
      if (typeof adminInfo?.bet === 'number') extraParts.push(`${yourBetLabel}: ${adminInfo.bet}`);
      if (typeof potTotal === 'number') extraParts.push(`${potLabel}: ${potTotal}`);
      const extrasLine = extraParts.join(' | ');
      let cardsBlock = '';
      if (adminInfo?.hole && Array.isArray(adminInfo.hole) && adminInfo.hole.length > 0) {
        const cardsText = adminInfo.hole.join(' ');
        cardsBlock = `${gctx.t('poker.game.section.yourCards')}: ${cardsText}\n\n`;
      }
      const adminCaption = [base, [cardsBlock, extrasLine].filter(Boolean).join('')].filter(Boolean).join('\n\n');

      if (usePhotoFlow) {
        await sendOrEditPhotoToUsers(gctx, roomId, adminRecipients, adminCaption, keyboard, {
          isPlaying,
          boardCards,
          seatInfoByUser,
          actingUuid,
          currentBetGlobal,
          isDetailed,
          idToTelegramId,
          telegramIdToUuid,
          adminId
        });
      } else {
        const send = (ctx as any).sendOrEditMessageToUsers ?? (gctx as any).sendOrEditMessageToUsers;
        await send(
          adminRecipients,
          adminCaption,
          {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: keyboard }
          }
        );
      }
    }

    if (nonAdminRecipients.length > 0) {
      if (isPlaying) {
        for (const chatId of nonAdminRecipients) {
          const uuid = telegramIdToUuid[chatId];
          const info = uuid ? seatInfoByUser[uuid] : undefined;
          const base = view.message;
          const extraParts: string[] = [];
          
          // Debug: log seat info
          (gctx as any)?.log?.debug?.('roomService.broadcastRoomInfo:seatInfo', { 
            chatId, uuid, info, seatInfoByUser: Object.keys(seatInfoByUser) 
          });
          
          const yourStackLabel = gctx.t('poker.game.field.yourStack') || 'Your stack';
          const yourBetLabel = gctx.t('poker.game.field.yourBet') || 'Your bet';
          const potLabel = gctx.t('poker.game.field.potLabel') || 'Pot';
          if (info && typeof info.stack === 'number') extraParts.push(`${yourStackLabel}: ${info.stack}`);
          if (info && typeof info.bet === 'number') extraParts.push(`${yourBetLabel}: ${info.bet}`);
          if (typeof potTotal === 'number') extraParts.push(`${potLabel}: ${potTotal}`);
          const extrasLine = extraParts.join(' | ');
          let cardsBlock = '';
          if (info?.hole && Array.isArray(info.hole) && info.hole.length > 0) {
            const cardsText = info.hole.join(' ');
            cardsBlock = `${gctx.t('poker.game.section.yourCards')}: ${cardsText}\n\n`;
          }
          const message = [base, [cardsBlock, extrasLine].filter(Boolean).join('')].filter(Boolean).join('\n\n');
          const isActing = actingUuid && uuid === actingUuid;
          const userInfo = info;
          const canCheck = typeof userInfo?.stack === 'number' && typeof userInfo?.bet === 'number'
            ? userInfo.bet >= currentBetGlobal
            : false;
          const showDetailsText = gctx.t('poker.room.buttons.showDetails') || '📋 Show Details';
          const showSummaryText = gctx.t('poker.room.buttons.showSummary') || '📝 Show Summary';
          
          const actingRows: Btn[][] = [
            ...(canCheck
              ? [
                  [{ text: gctx.t('poker.game.buttons.check'), callback_data: 'g.pk.r.ck' }],
                  [{ text: gctx.t('poker.actions.raise'), callback_data: 'g.pk.r.rs' }],
                  [{ text: gctx.t('poker.game.buttons.fold'), callback_data: 'g.pk.r.fd' }]
                ]
              : [
                  [{ text: gctx.t('poker.game.buttons.call'), callback_data: 'g.pk.r.cl' }],
                  [{ text: gctx.t('poker.actions.raise'), callback_data: 'g.pk.r.rs' }],
                  [{ text: gctx.t('poker.game.buttons.fold'), callback_data: 'g.pk.r.fd' }]
                ]
            ),
            [{ text: isDetailed ? showSummaryText : showDetailsText, callback_data: `g.pk.r.in?detailed=${!isDetailed}` }]
          ];
          const waitingRows: Btn[][] = [
            [{ text: gctx.t('bot.buttons.refresh'), callback_data: 'g.pk.r.in' }],
            [{ text: isDetailed ? showSummaryText : showDetailsText, callback_data: `g.pk.r.in?detailed=${!isDetailed}` }]
          ];

          if (usePhotoFlow) {
            await sendOrEditPhotoToUsers(gctx, roomId, [chatId], message, isActing ? actingRows : waitingRows, {
              isPlaying,
              boardCards,
              seatInfoByUser,
              actingUuid,
              currentBetGlobal,
              isDetailed,
              idToTelegramId,
              telegramIdToUuid,
              adminId
            });
          } else {
            const send = (ctx as any).sendOrEditMessageToUsers ?? (gctx as any).sendOrEditMessageToUsers;
            await send(
              [chatId],
              message,
              {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: isActing ? actingRows : waitingRows }
              }
            );
          }
        }
      } else {
        if (usePhotoFlow) {
          await sendOrEditPhotoToUsers(gctx, roomId, nonAdminRecipients, view.message, view.keyboardForPlayer, {
            isPlaying,
            boardCards,
            seatInfoByUser,
            actingUuid,
            currentBetGlobal,
            isDetailed,
            idToTelegramId,
            telegramIdToUuid,
            adminId
          });
        } else {
          const send = (ctx as any).sendOrEditMessageToUsers ?? (gctx as any).sendOrEditMessageToUsers;
          await send(
            nonAdminRecipients,
            view.message,
            {
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: view.keyboardForPlayer }
            }
          );
        }
      }
    }

    // Also update the group room message if possible (so all members in the group see the update)
    try {
      const roomsApi = await import('@/api/rooms');
      const dbRoom: any = await roomsApi.getById(roomId);
      const lastChatId = Number(dbRoom?.last_chat_id);
      if (Number.isFinite(lastChatId) && (gctx as any)?.telegram?.sendMessage) {
        // Skip group broadcast during playing to avoid leaking private context
        if (!isPlaying) {
          await (gctx as any).telegram.sendMessage(lastChatId, view.message, {
            parseMode: 'HTML',
            replyMarkup: { inline_keyboard: view.keyboardForPlayer }
          });
        }
      }
    } catch {
      // Ignore group broadcast errors in environments/tests without telegram plugin
      (gctx as unknown as { log?: { debug?: (msg: string, obj: unknown) => void } })?.log?.debug?.('roomService.broadcastRoomInfo:group-send:skipped', { roomId });
    }
    
    logFunctionEnd('roomService.broadcastRoomInfo', { 
      roomId, 
      targetUserIds: userIds.length,
      messageLength: view.message.length 
    });
  } catch (err) {
    logError('roomService.broadcastRoomInfo', err as Error, { roomId, targetUserIds });
  }
}


// --- helpers for photo-based updates ---

type SendPhotoContext = GameHubContext;

interface PhotoSendContext {
  isPlaying: boolean;
  boardCards: string[];
  seatInfoByUser: Record<string, { stack: number; bet: number; hole?: string[] | null }>;
  actingUuid?: string;
  currentBetGlobal: number;
  isDetailed?: boolean;
  idToTelegramId: Record<string, number>;
  telegramIdToUuid: Record<number, string>;
  adminId: string;
}

function normalizeCardCodeToAssetName(code: string): string {
  const rankMap: Record<string, string> = { A: 'ace', K: 'king', Q: 'queen', J: 'jack', T: '10' };
  const suitMap: Record<string, string> = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
  const match = code.match(/^(10|[2-9TJQKA])([♠♥♦♣])$/);
  if (!match) return code;
  const [, rawRank, rawSuit] = match;
  const rank = rankMap[rawRank] || rawRank;
  const suit = suitMap[rawSuit] || rawSuit;
  return `${rank}_of_${suit}`;
}

function toAssetCards(board: string[], hole: string[]): string[] {
  // poker-table template positions:
  // [ flop-1, flop-2, flop-3, turn, river, player-1, player-2 ]
  const paddedBoard = [
    board[0] ?? 'blank',
    board[1] ?? 'blank',
    board[2] ?? 'blank',
    board[3] ?? 'blank',
    board[4] ?? 'blank',
  ];
  const paddedHole = [hole[0] ?? 'blank', hole[1] ?? 'blank'];
  return [...paddedBoard, ...paddedHole].map(normalizeCardCodeToAssetName);
}

async function getTemplateFileId(cardsAssets: string[], debugTag?: string): Promise<{ fileId?: string; usedTemplate: 'poker-table' | 'full-game' } > {
  // Prefer poker-table; both support 5 board + 2 hole
  const templateId: 'poker-table' | 'full-game' = 'poker-table';
  // Generate and send to card service channel to obtain a reusable fileId
  // Then read it from cache
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cardImageService = require('../../../../../../packages/card-image-service/src');
  const { generateAndSendTemplateImage, generateTemplateRequestHash, ImageCache } = cardImageService as {
    generateAndSendTemplateImage: (
      templateId: string,
      cards: string[],
      style?: string,
      debugTag?: string,
      format?: 'png' | 'webp' | 'jpeg',
      transparent?: boolean,
      asDocument?: boolean
    ) => Promise<string>;
    generateTemplateRequestHash: (opts: { templateId: string; cards: string[]; style?: string; debugTag?: string; format?: 'png' | 'webp' | 'jpeg'; transparent?: boolean }) => string;
    ImageCache: new () => { get: (hash: string) => { fileId?: string } | null };
  };

  try {
    await generateAndSendTemplateImage(templateId, cardsAssets, 'general', debugTag, 'jpeg', false, false);
    const hash = generateTemplateRequestHash({ templateId, cards: cardsAssets, style: 'general', debugTag, format: 'jpeg', transparent: false });
    const cache = new ImageCache();
    const cached = cache.get(hash);
    return { fileId: cached?.fileId, usedTemplate: templateId };
  } catch {
    return { fileId: undefined, usedTemplate: templateId };
  }
}

async function sendOrEditPhotoToUsers(
  gctx: SendPhotoContext,
  roomId: string,
  userIds: number[],
  caption: string,
  keyboard: Btn[][],
  extra: PhotoSendContext
): Promise<void> {
  for (const userId of userIds) {
    const chatId = userId;
    const uuid = extra.telegramIdToUuid[chatId];
    const hole = (uuid && extra.seatInfoByUser[uuid]?.hole) ? (extra.seatInfoByUser[uuid]?.hole as string[]) : [];
    const cardsAssets = toAssetCards(extra.boardCards, hole);
    const debugTag = `room:${roomId}`;
    const { fileId } = await getTemplateFileId(cardsAssets, debugTag);

    const previous = usersMessageHistory[String(chatId)];
    const callbackMessage = (gctx as any)?.callbackQuery?.message as { message_id?: number; chat?: { id?: number | string }; photo?: Array<{ file_id: string }> } | undefined;
    const callbackChatId = callbackMessage?.chat?.id !== undefined ? String(callbackMessage.chat.id) : undefined;
    const callbackMessageId = callbackMessage?.message_id;
    const isInitiator = String((gctx as any)?.from?.id ?? '') === String(chatId);
    const isFromCallbackAndSameChat = Boolean(callbackMessageId && callbackChatId === String(chatId));
    const isEditingCurrentMessage = Boolean(isInitiator && isFromCallbackAndSameChat && previous && previous.messageId === callbackMessageId);

    const inline_keyboard: InlineKeyboardMarkup['inline_keyboard'] = keyboard as InlineKeyboardMarkup['inline_keyboard'];

    try {
      if (isEditingCurrentMessage && previous) {
        // Prefer editing media with fileId if available; else edit caption
        if (fileId) {
          const media: InputMediaPhoto = { type: 'photo', media: fileId, caption, parse_mode: 'HTML' };
          await (gctx as any).api.editMessageMedia(String(chatId), previous.messageId, media, { reply_markup: { inline_keyboard } });
        } else {
          await (gctx as any).api.editMessageCaption(String(chatId), previous.messageId, { caption, parse_mode: 'HTML', reply_markup: { inline_keyboard } });
        }
        // Update history timestamp
        usersMessageHistory[String(chatId)] = {
          chatId: String(chatId),
          messageId: previous.messageId,
          timestamp: Date.now(),
          userId: String(chatId),
          messageType: 'room_info'
        };
        continue;
      }

      // Not editing current: delete previous if exists and send new photo
      if (previous) {
        try {
          await (gctx as any).api.deleteMessage(previous.chatId, previous.messageId);
        } catch {
          // ignore
        }
      }

      if (fileId) {
        const sent = await (gctx as any).api.sendPhoto(String(chatId), fileId, { caption, parse_mode: 'HTML', reply_markup: { inline_keyboard } });
        usersMessageHistory[String(chatId)] = { chatId: String(chatId), messageId: sent.message_id, timestamp: Date.now(), userId: String(chatId), messageType: 'room_info' };
      } else {
        // Fallback to buffer generation
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const cardImageService = require('../../../../../../packages/card-image-service/src');
        const { generateTemplateBufferOnly } = cardImageService as { generateTemplateBufferOnly: (templateId: string, cards: string[], style?: string, debugTag?: string, format?: 'png' | 'webp' | 'jpeg', transparent?: boolean) => Promise<Buffer> };
        const { InputFile } = await import('grammy');
        const buffer = await generateTemplateBufferOnly('poker-table', cardsAssets, 'general', debugTag, 'jpeg', false);
        const sent = await (gctx as any).api.sendPhoto(String(chatId), new InputFile(buffer, 'table.jpg'), { caption, parse_mode: 'HTML', reply_markup: { inline_keyboard } });
        usersMessageHistory[String(chatId)] = { chatId: String(chatId), messageId: sent.message_id, timestamp: Date.now(), userId: String(chatId), messageType: 'room_info' };
      }
    } catch (error) {
      logError('roomService.sendOrEditPhotoToUsers', error as Error, { roomId, chatId: String(chatId) });
    }
  }
}


