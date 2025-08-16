import type { GameHubContext } from '@/plugins';
import type { Btn, ViewPayload } from './views';

interface CommonParams {
  hub: GameHubContext;
  roomId: string;
  isPlaying: boolean;
  isDetailed?: boolean;
  playerCount: number;
  maxPlayers: number;
  timeoutMinutes: number;
  lastUpdateIso: string;
  playerNames: string;
  smallBlind: number;
  bigBlind: number;
  boardCards: string[];
  currentBetGlobal: number;
  actingUuid?: string;
  engineState?: any | null;
  seatPosByUuid: Record<string, number>;
  seatInfoByUser: Record<string, { stack: number; bet: number; hole?: string[] | null; inHand: boolean }>;
  showdownWinners: Array<{ uuid: string; display: string; amount: number; hand: string; combo?: string[] }>;
  telegramIdToUuid: Record<number, string>;
}

export async function sendToAdminRecipients(
  recipients: number[],
  tAdmin: (k: string, options?: Record<string, unknown>) => string,
  adminUuid: string,
  params: CommonParams,
): Promise<void> {
  if (recipients.length === 0) return;
  const { hub, roomId, isPlaying, isDetailed, playerCount, maxPlayers, timeoutMinutes, lastUpdateIso, playerNames, smallBlind, bigBlind, boardCards, currentBetGlobal, actingUuid, engineState, seatPosByUuid, seatInfoByUser, showdownWinners, telegramIdToUuid } = params;
  const { buildPlayingView, buildWaitingView } = await import('./views');
  const adminBaseView: ViewPayload = (isPlaying ? buildPlayingView : buildWaitingView)({
    roomId,
    playerNames,
    smallBlind,
    bigBlind,
    maxPlayers,
    playerCount,
    timeoutMinutes,
    lastUpdateIso,
    hasAtLeastTwoPlayers: playerCount >= 2,
    t: tAdmin,
  }, isDetailed);

  const { buildKeyboardForRecipient } = await import('./keyboardForRecipient');
  const keyboard: Btn[][] = await buildKeyboardForRecipient({
    isAdmin: true,
    roomId,
    isPlaying,
    isDetailed,
    playerCount,
    maxPlayers,
    actingUuid,
    engineState,
    currentBetGlobal,
    t: tAdmin,
    seatPosByUuid,
    userUuid: adminUuid,
    userInfo: seatInfoByUser[adminUuid] ? { ...seatInfoByUser[adminUuid], hole: Array.isArray(seatInfoByUser[adminUuid].hole) ? seatInfoByUser[adminUuid].hole as string[] : undefined } : undefined,
    adminUuid,
  });

  const extraParts: string[] = [];
  const adminInfo = seatInfoByUser[adminUuid];
  const yourStackLabel = tAdmin('poker.game.field.yourStack') || 'Your stack';
  const yourBetLabel = tAdmin('poker.game.field.yourBet') || 'Your bet';
  const potLabel = tAdmin('poker.game.field.potLabel') || 'Pot';
  if (typeof adminInfo?.stack === 'number') extraParts.push(`${yourStackLabel}: ${adminInfo.stack}`);
  if (typeof adminInfo?.bet === 'number') extraParts.push(`${yourBetLabel}: ${adminInfo.bet}`);
  if (typeof (params as any).potTotal === 'number') extraParts.push(`${potLabel}: ${(params as any).potTotal}`);

  const { buildCaption } = await import('./captionBuilder');
  const adminCaption = buildCaption({
    base: adminBaseView.message,
    t: tAdmin,
    boardCards,
    holeCards: Array.isArray(adminInfo?.hole) ? adminInfo?.hole : undefined,
    extraParts,
    winners: engineState?.street === 'showdown' ? showdownWinners : undefined,
  });

  const { sendPhoto, sendText } = await import('./broadcaster');
  const usePhotoFlow = Boolean((hub as any)?.api?.sendPhoto) && process.env.POKER_SINGLE_PHOTO_FLOW !== 'false' && isPlaying === true;
  if (usePhotoFlow) {
    await sendPhoto(hub, roomId, recipients, adminCaption, keyboard, {
      isPlaying,
      boardCards,
      seatInfoByUser,
      actingUuid,
      currentBetGlobal,
      isDetailed,
      telegramIdToUuid,
    });
  } else {
    await sendText(hub, recipients, adminCaption, keyboard);
  }
}

export async function sendToNonAdminRecipients(
  recipients: number[],
  resolveUserLanguage: (chatId: number) => Promise<'en' | 'fa'>,
  createTranslatorFor: (lang: 'en' | 'fa') => (key: string, options?: Record<string, unknown>) => string,
  params: CommonParams,
): Promise<void> {
  const { hub, roomId, isPlaying, isDetailed, playerCount, maxPlayers, timeoutMinutes, lastUpdateIso, playerNames, smallBlind, bigBlind, boardCards, currentBetGlobal, actingUuid, engineState, seatPosByUuid, seatInfoByUser, showdownWinners, telegramIdToUuid } = params;
  const { buildPlayingView, buildWaitingView } = await import('./views');
  const { buildCaption } = await import('./captionBuilder');
  const { sendPhoto, sendText } = await import('./broadcaster');

  for (const chatId of recipients) {
    const lang = await resolveUserLanguage(Number(chatId));
    const tUser = createTranslatorFor(lang);
    const perUserView: ViewPayload = (isPlaying ? buildPlayingView : buildWaitingView)({
      roomId,
      playerNames,
      smallBlind,
      bigBlind,
      maxPlayers,
      playerCount,
      timeoutMinutes,
      lastUpdateIso,
      hasAtLeastTwoPlayers: playerCount >= 2,
      t: tUser,
    }, isDetailed);

    const uuid = telegramIdToUuid[chatId];
    const info = uuid ? seatInfoByUser[uuid] : undefined;

    const extraParts: string[] = [];
    const yourStackLabel = tUser('poker.game.field.yourStack') || 'Your stack';
    const yourBetLabel = tUser('poker.game.field.yourBet') || 'Your bet';
    const potLabel = tUser('poker.game.field.potLabel') || 'Pot';
    if (info && typeof info.stack === 'number') extraParts.push(`${yourStackLabel}: ${info.stack}`);
    if (info && typeof info.bet === 'number') extraParts.push(`${yourBetLabel}: ${info.bet}`);
    if (typeof (params as any).potTotal === 'number') extraParts.push(`${potLabel}: ${(params as any).potTotal}`);

    const message = buildCaption({
      base: perUserView.message,
      t: tUser,
      boardCards,
      holeCards: info?.inHand !== false && Array.isArray(info?.hole) ? info?.hole : undefined,
      extraParts,
      winners: engineState?.street === 'showdown' ? showdownWinners : undefined,
    });

    const { buildKeyboardForRecipient } = await import('./keyboardForRecipient');
    const keyboard = await buildKeyboardForRecipient({
      isAdmin: uuid === (params as any).adminUuid,
      roomId,
      isPlaying,
      isDetailed,
      playerCount,
      maxPlayers,
      actingUuid,
      engineState,
      currentBetGlobal,
      t: tUser,
      seatPosByUuid,
      userUuid: uuid,
      userInfo: info ? { ...info, hole: Array.isArray(info.hole) ? info.hole as string[] : undefined } : undefined,
      adminUuid: (params as any).adminUuid,
    });

    const usePhotoFlow = Boolean((hub as any)?.api?.sendPhoto) && process.env.POKER_SINGLE_PHOTO_FLOW !== 'false' && isPlaying === true;
    if (usePhotoFlow) {
      await sendPhoto(hub, roomId, [chatId], message, keyboard, {
        isPlaying,
        boardCards,
        seatInfoByUser,
        actingUuid,
        currentBetGlobal,
        isDetailed,
        telegramIdToUuid,
      });
    } else {
      await sendText(hub, [chatId], message, keyboard);
    }
  }
}


