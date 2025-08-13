export type Btn = { text: string } & ({ callback_data: string } | { switch_inline_query: string });

export interface ViewPayload {
  message: string;
  keyboardForAdmin: Btn[][];
  keyboardForPlayer: Btn[][];
  // For accordion functionality
  isDetailed?: boolean;
}

export interface BuildContext {
  roomId: string;
  playerNames: string;
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
  playerCount: number;
  timeoutMinutes: number;
  lastUpdateIso: string;
  hasAtLeastTwoPlayers: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  // Per-user dynamic context for playing view
  youAreActing?: boolean;
  yourStack?: number;
  yourBet?: number;
  potTotal?: number;
}

function buildDetailedMessage(ctx: BuildContext, statusText: string): string {
  const title = ctx.t('poker.room.info.title');
  const sectionDetails = ctx.t('poker.room.info.section.details');
  const fieldId = ctx.t('poker.room.info.field.id');
  const fieldStatus = ctx.t('poker.room.info.field.status');
  const fieldType = ctx.t('poker.room.info.field.type');
  const sectionSettings = ctx.t('poker.room.info.section.settings');
  const fieldSmallBlind = ctx.t('poker.room.info.field.smallBlind');
  const fieldMaxPlayers = ctx.t('poker.room.info.field.maxPlayers');
  const fieldTurnTimeout = ctx.t('poker.room.info.field.turnTimeout');
  // Avoid i18n pluralization on 'count' to prevent key resolution issues; manually inject values
  const sectionPlayersRaw = ctx.t('poker.room.info.section.players');
  const sectionPlayers = sectionPlayersRaw
    .replace('{{count}}', String(ctx.playerCount))
    .replace('{{max}}', String(ctx.maxPlayers));
  const fieldLastUpdate = ctx.t('poker.room.info.field.lastUpdate');

  return `${title}\n\n${sectionDetails}\n${fieldId}: ${ctx.roomId}\n${fieldStatus}: ${statusText}\n${fieldType}: 🌐 Public\n\n${sectionSettings}\n${fieldSmallBlind}: ${ctx.smallBlind}\n• Big Blind: ${ctx.bigBlind}\n${fieldMaxPlayers}: ${ctx.maxPlayers}\n${fieldTurnTimeout}: ${ctx.timeoutMinutes} min\n\n${sectionPlayers}\n${ctx.playerNames}\n\n${fieldLastUpdate}: ${ctx.lastUpdateIso}`;
}

function buildCompactMessage(ctx: BuildContext, statusText: string): string {
  const title = ctx.t('poker.room.info.title');
  // Avoid i18n pluralization on 'count' to prevent key resolution issues; manually inject values
  const sectionPlayersRaw = ctx.t('poker.room.info.section.players');
  const sectionPlayers = sectionPlayersRaw
    .replace('{{count}}', String(ctx.playerCount))
    .replace('{{max}}', String(ctx.maxPlayers));
  const fieldLastUpdate = ctx.t('poker.room.info.field.lastUpdate');

  return `${title}\n\n• Status: ${statusText}\n\n${sectionPlayers}\n${ctx.playerNames}\n\n${fieldLastUpdate}: ${ctx.lastUpdateIso}`;
}

export function buildWaitingView(ctx: BuildContext, isDetailed = false): ViewPayload {
  const refreshText = ctx.t('bot.buttons.refresh');
  const shareText = ctx.t('bot.buttons.share');
  const leaveText = ctx.t('poker.room.buttons.leave');
  const startText = ctx.t('poker.room.buttons.startGame');
  const showDetailsText = ctx.t('poker.room.buttons.showDetails') || '📋 Show Details';
  const showSummaryText = ctx.t('poker.room.buttons.showSummary') || '📝 Show Summary';

  const baseRows: Btn[][] = [];
  baseRows.push([{ text: refreshText, callback_data: 'g.pk.r.in' }]);
  baseRows.push([{ text: shareText, switch_inline_query: `poker ${ctx.roomId}` }]);
  baseRows.push([{ text: leaveText, callback_data: `g.pk.r.lv?roomId=${ctx.roomId}` }]);
  baseRows.push([{ text: isDetailed ? showSummaryText : showDetailsText, callback_data: `g.pk.r.in?detailed=${!isDetailed}` }]);

  const adminRows: Btn[][] = ctx.hasAtLeastTwoPlayers
    ? [
        [{ text: startText, callback_data: 'g.pk.r.st' }],
        [{ text: refreshText, callback_data: 'g.pk.r.in' }],
        [{ text: shareText, switch_inline_query: `poker ${ctx.roomId}` }],
        [{ text: leaveText, callback_data: `g.pk.r.lv?roomId=${ctx.roomId}` }],
        [{ text: isDetailed ? showSummaryText : showDetailsText, callback_data: `g.pk.r.in?detailed=${!isDetailed}` }],
      ]
    : baseRows;

  const message = isDetailed 
    ? buildDetailedMessage(ctx, ctx.t('poker.room.status.waiting'))
    : buildCompactMessage(ctx, ctx.t('poker.room.status.waiting'));
  return { message, keyboardForAdmin: adminRows, keyboardForPlayer: baseRows, isDetailed };
}

export function buildPlayingView(ctx: BuildContext, isDetailed = false): ViewPayload {
  // Default layout is minimal; actual acting player's layout is computed in roomService based on current bet
  const inGameRows: Btn[][] = [
    [{ text: ctx.t('bot.buttons.refresh'), callback_data: 'g.pk.r.in' }],
  ];
  const header = isDetailed 
    ? buildDetailedMessage(ctx, ctx.t('poker.room.status.playing'))
    : buildCompactMessage(ctx, ctx.t('poker.room.status.playing'));
  // Append minimal per-user status line (placeholder until engine integration)
  const extras: string[] = [];
  if (typeof ctx.yourStack === 'number') extras.push(`Your stack: ${ctx.yourStack}`);
  if (typeof ctx.yourBet === 'number') extras.push(`Your bet: ${ctx.yourBet}`);
  if (typeof ctx.potTotal === 'number') extras.push(`Pot: ${ctx.potTotal}`);
  if (typeof ctx.youAreActing === 'boolean') extras.push(ctx.youAreActing ? 'Your turn' : 'Waiting for others');
  const message = extras.length > 0 ? `${header}\n\n${extras.join(' | ')}` : header;
  return { message, keyboardForAdmin: inGameRows, keyboardForPlayer: inGameRows, isDetailed };
}


