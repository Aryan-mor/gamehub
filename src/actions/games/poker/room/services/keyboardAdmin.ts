import type { Btn } from './views';

interface Params {
  roomId: string;
  isPlaying: boolean;
  isDetailed: boolean | undefined;
  playerCount: number;
  maxPlayers: number;
  actingUuid?: string;
  currentBetGlobal: number;
  t: (k: string, options?: Record<string, unknown>) => string;
  engineState?: any | null;
  adminUuid: string;
  adminInfo?: { inHand?: boolean; stack?: number; bet?: number; hole?: string[] };
  seatPosByUuid: Record<string, number>;
}

export async function buildAdminKeyboard(p: Params): Promise<Btn[][]> {
  const toggleDetailsText = p.isDetailed ? p.t('poker.room.buttons.toggleSummary') : p.t('poker.room.buttons.toggleDetails');
  const waitingRows: Btn[][] = [
    [{ text: p.t('bot.buttons.refresh'), callback_data: `g.pk.r.in?r=${p.roomId}` }],
    [{ text: p.t('poker.room.buttons.leave'), callback_data: `g.pk.r.lv?r=${p.roomId}` }],
    [{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${p.roomId}&d=${!p.isDetailed}` }]
  ];

  if (!p.isPlaying) {
    const hasCapacity = p.playerCount < p.maxPlayers;
    return p.playerCount >= 2
      ? [
          [{ text: p.t('poker.room.buttons.startGame'), callback_data: 'g.pk.r.st' }],
          [{ text: p.t('bot.buttons.refresh'), callback_data: `g.pk.r.in?r=${p.roomId}` }],
          ...(hasCapacity ? [[{ text: p.t('bot.buttons.share'), switch_inline_query: `poker ${p.roomId}` }]] : []),
          [{ text: p.t('poker.room.buttons.leave'), callback_data: `g.pk.r.lv?r=${p.roomId}` }],
          [{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${p.roomId}&d=${!p.isDetailed}` }]
        ]
      : waitingRows;
  }

  if (!p.engineState) return waitingRows;
  if (p.engineState.street === 'showdown') {
    const hasCapacity = p.playerCount < p.maxPlayers;
    return [
      [{ text: p.t('poker.room.buttons.startGame') || '▶️ Start Game', callback_data: 'g.pk.r.st' }],
      ...(hasCapacity ? [[{ text: p.t('bot.buttons.share') || '📤 Share', switch_inline_query: `poker ${p.roomId}` }]] : []),
      [{ text: p.t('poker.room.buttons.leave') || '🚪 Leave Room', callback_data: `g.pk.r.lv?r=${p.roomId}` }],
      [{ text: p.t('bot.buttons.refresh') || '🔄 Refresh', callback_data: `g.pk.r.in?r=${p.roomId}` }],
      [{ text: (p.isDetailed ? p.t('poker.room.buttons.toggleSummary') : p.t('poker.room.buttons.toggleDetails')), callback_data: `g.pk.r.in?r=${p.roomId}&d=${!p.isDetailed}` }]
    ];
  }

  const engine = await import('@gamehub/poker-engine');
  const pos = p.seatPosByUuid[p.adminUuid];
  const allowed = typeof pos === 'number' ? (engine as any).computeAllowedActions(p.engineState as any, pos) : [];
  const canCheck = allowed.includes('CHECK');
  const canRaise = allowed.includes('RAISE');
  const acting = typeof pos === 'number' && pos === Number(p.engineState.actingPos);
  const version = Number((p.engineState as any)?.version ?? 0);
  const toCall = (!canCheck && typeof pos === 'number' && p.engineState)
    ? (engine as any).computeToCall(p.engineState as any, pos)
    : Math.max(0, Number(p.currentBetGlobal || 0) - Number(p.adminInfo?.bet || 0));

  const actionRows: Btn[][] = [
    [
      canCheck
        ? { text: p.t('poker.game.buttons.check'), callback_data: `g.pk.r.ck?r=${p.roomId}&v=${version}` }
        : { text: p.t('poker.actions.callWithAmount', { amount: toCall }), callback_data: `g.pk.r.cl?r=${p.roomId}&v=${version}` }
    ],
    ...(canRaise ? [[{ text: p.t('poker.actions.raise'), callback_data: `g.pk.r.rs?r=${p.roomId}&v=${version}` }]] : []),
    [{ text: p.t('poker.game.buttons.fold'), callback_data: `g.pk.r.fd?r=${p.roomId}&v=${version}` }],
    [{ text: p.t('poker.room.buttons.leave'), callback_data: `g.pk.r.lv?r=${p.roomId}` }],
    [{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${p.roomId}&d=${!p.isDetailed}` }]
  ];

  return acting && (p.adminInfo?.inHand !== false) && allowed.length > 0 ? actionRows : waitingRows;
}


