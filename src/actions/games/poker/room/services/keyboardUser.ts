import type { Btn } from './views';

interface Params {
  roomId: string;
  isDetailed: boolean | undefined;
  isPlaying: boolean;
  playerCount: number;
  maxPlayers: number;
  actingUuid?: string;
  engineState?: any | null;
  seatPosByUuid: Record<string, number>;
  userUuid: string;
  userInfo?: { inHand?: boolean; stack?: number; bet?: number; hole?: string[] };
  currentBetGlobal: number;
  t: (k: string, options?: Record<string, unknown>) => string;
}

export async function buildUserKeyboard(p: Params): Promise<Btn[][]> {
  const toggleDetailsText = p.isDetailed ? p.t('poker.room.buttons.toggleSummary') : p.t('poker.room.buttons.toggleDetails');
  const hasCapacity = p.playerCount < p.maxPlayers;
  const waitingRows: Btn[][] = [
    [{ text: p.t('bot.buttons.refresh'), callback_data: `g.pk.r.in?r=${p.roomId}` }],
    ...(hasCapacity ? [[{ text: p.t('bot.buttons.share'), switch_inline_query: `poker ${p.roomId}` }]] : []),
    [{ text: p.t('poker.room.buttons.leave'), callback_data: `g.pk.r.lv?r=${p.roomId}` }],
    [{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${p.roomId}&d=${!p.isDetailed}` }]
  ];

  if (!p.isPlaying) return waitingRows;
  if (!p.engineState) return waitingRows;
  if (p.engineState.street === 'showdown') {
    const hasCapacity = p.playerCount < p.maxPlayers;
    return [
      [{ text: p.t('bot.buttons.refresh'), callback_data: `g.pk.r.in?r=${p.roomId}` }],
      ...(hasCapacity ? [[{ text: p.t('bot.buttons.share'), switch_inline_query: `poker ${p.roomId}` }]] : []),
      [{ text: p.t('poker.room.buttons.leave'), callback_data: `g.pk.r.lv?r=${p.roomId}` }],
      [{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${p.roomId}&d=${!p.isDetailed}` }]
    ];
  }

  const engine = await import('@gamehub/poker-engine');
  let canCheck = false;
  let canRaise = false;
  if (typeof p.seatPosByUuid[p.userUuid] === 'number') {
    const allowed = (engine as any).computeAllowedActions(p.engineState as any, p.seatPosByUuid[p.userUuid]);
    canCheck = allowed.includes('CHECK') || (typeof p.userInfo?.bet === 'number' && p.userInfo.bet >= p.currentBetGlobal);
    canRaise = allowed.includes('RAISE');
  } else {
    canCheck = typeof p.userInfo?.stack === 'number' && typeof p.userInfo?.bet === 'number' ? p.userInfo.bet >= p.currentBetGlobal : false;
  }
  const isActing = p.actingUuid && p.userUuid === p.actingUuid;
  const version = Number((p.engineState as any)?.version ?? 0);
  const toCall = (!canCheck && p.engineState && typeof p.seatPosByUuid[p.userUuid] === 'number')
    ? (await import('@gamehub/poker-engine') as any).computeToCall(p.engineState as any, p.seatPosByUuid[p.userUuid])
    : Math.max(0, Number(p.currentBetGlobal || 0) - Number(p.userInfo?.bet || 0));

  const actingRows: Btn[][] = [
    [canCheck ? { text: p.t('poker.game.buttons.check'), callback_data: `g.pk.r.ck?r=${p.roomId}&v=${version}` } : { text: p.t('poker.actions.callWithAmount', { amount: toCall }), callback_data: `g.pk.r.cl?r=${p.roomId}&v=${version}` }],
    ...(canRaise ? [[{ text: p.t('poker.actions.raise'), callback_data: `g.pk.r.rs?r=${p.roomId}&v=${version}` }]] : []),
    [{ text: p.t('poker.game.buttons.fold'), callback_data: `g.pk.r.fd?r=${p.roomId}&v=${version}` }],
    [{ text: p.t('poker.room.buttons.leave'), callback_data: `g.pk.r.lv?r=${p.roomId}` }],
    [{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${p.roomId}&d=${!p.isDetailed}` }]
  ];

  if (isActing && p.userInfo?.inHand !== false) {
    return actingRows;
  }
  return waitingRows;
}


