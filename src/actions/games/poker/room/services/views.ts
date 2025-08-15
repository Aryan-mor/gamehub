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
  yourCards?: string; // Private cards for the current user
}

function buildDetailedMessage(ctx: BuildContext, statusText: string, skipLastUpdate = false): string {
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

  // Build message without "Last update" when skipLastUpdate is true
  const baseMessage = `${title}\n\n${sectionDetails}\n${fieldId}: ${ctx.roomId}\n${fieldStatus}: ${statusText}\n${fieldType}: 🌐 Public\n\n${sectionSettings}\n${fieldSmallBlind}: ${ctx.smallBlind}\n• Big Blind: ${ctx.bigBlind}\n${fieldMaxPlayers}: ${ctx.maxPlayers}\n${fieldTurnTimeout}: ${ctx.timeoutMinutes} min\n\n${sectionPlayers}\n${ctx.playerNames}`;
  
  // Add last update only if not skipped
  if (!skipLastUpdate) {
    return `${baseMessage}\n\n${fieldLastUpdate}: ${ctx.lastUpdateIso}`;
  }
  
  return baseMessage;
}

function buildCompactMessage(ctx: BuildContext, statusText: string, skipLastUpdate = false): string {
  const title = ctx.t('poker.room.info.title');
  // Avoid i18n pluralization on 'count' to prevent key resolution issues; manually inject values
  const sectionPlayersRaw = ctx.t('poker.room.info.section.players');
  const sectionPlayers = sectionPlayersRaw
    .replace('{{count}}', String(ctx.playerCount))
    .replace('{{max}}', String(ctx.maxPlayers));
  const fieldLastUpdate = ctx.t('poker.room.info.field.lastUpdate');

  let message = `${title}\n\n`;
  
  // Add status and players
  message += `• Status: ${statusText}\n\n${sectionPlayers}\n${ctx.playerNames}`;
  
  // Add private cards if available (only in playing state)
  if (ctx.yourCards && statusText.includes('Playing')) {
    const yourCardsLabel = ctx.t('poker.game.section.yourCards');
    message += `\n\n${yourCardsLabel}: ${ctx.yourCards}`;
  }
  
  // Add last update only if not skipped
  if (!skipLastUpdate) {
    message += `\n\n${fieldLastUpdate}: ${ctx.lastUpdateIso}`;
  }
  
  return message;
}

export function buildWaitingView(ctx: BuildContext, isDetailed = false): ViewPayload {
  const refreshText = ctx.t('bot.buttons.refresh');
  const shareText = ctx.t('bot.buttons.share');
  const leaveText = ctx.t('poker.room.buttons.leave');
  const startText = ctx.t('poker.room.buttons.startGame');
  const toggleDetailsText = isDetailed 
    ? ctx.t('poker.room.buttons.toggleSummary')
    : ctx.t('poker.room.buttons.toggleDetails');

  const baseRows: Btn[][] = [];
  baseRows.push([{ text: refreshText, callback_data: `g.pk.r.in?r=${ctx.roomId}` }]);
  baseRows.push([{ text: shareText, switch_inline_query: `poker ${ctx.roomId}` }]);
  baseRows.push([{ text: leaveText, callback_data: `g.pk.r.lv?r=${ctx.roomId}` }]);
  baseRows.push([{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${ctx.roomId}&d=${!isDetailed}` }]);

  const adminRows: Btn[][] = ctx.hasAtLeastTwoPlayers
    ? [
        [{ text: startText, callback_data: 'g.pk.r.st' }],
        [{ text: refreshText, callback_data: `g.pk.r.in?r=${ctx.roomId}` }],
        [{ text: shareText, switch_inline_query: `poker ${ctx.roomId}` }],
        [{ text: leaveText, callback_data: `g.pk.r.lv?r=${ctx.roomId}` }],
        [{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${ctx.roomId}&d=${!isDetailed}` }],
      ]
    : baseRows;

  const message = isDetailed 
    ? buildDetailedMessage(ctx, ctx.t('poker.room.status.waiting'))
    : buildCompactMessage(ctx, ctx.t('poker.room.status.waiting'));
  return { message, keyboardForAdmin: adminRows, keyboardForPlayer: baseRows, isDetailed };
}

export function buildPlayingView(ctx: BuildContext, isDetailed = false): ViewPayload {
  // Default layout is minimal; actual acting player's layout is computed in roomService based on current bet
  const toggleDetailsText = isDetailed 
    ? ctx.t('poker.room.buttons.toggleSummary')
    : ctx.t('poker.room.buttons.toggleDetails');
  
  const inGameRows: Btn[][] = [
    [{ text: ctx.t('bot.buttons.refresh'), callback_data: `g.pk.r.in?r=${ctx.roomId}` }],
    [{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${ctx.roomId}&d=${!isDetailed}` }],
  ];
  
  // Build the base message without "Last update"
  const baseMessage = isDetailed 
    ? buildDetailedMessage(ctx, ctx.t('poker.room.status.playing'), true) // Skip last update
    : buildCompactMessage(ctx, ctx.t('poker.room.status.playing'), true); // Skip last update
  
  // Append minimal per-user status line
  const extras: string[] = [];
  const yourBetLabel = ctx.t('poker.game.field.yourBet') || 'Your bet';
  const potLabel = ctx.t('poker.game.field.potLabel') || 'Pot';
  if (typeof ctx.yourBet === 'number') extras.push(`${yourBetLabel}: ${ctx.yourBet}`);
  if (typeof ctx.potTotal === 'number') extras.push(`${potLabel}: ${ctx.potTotal}`);
  
  // Build final message with extras and "Last update" at the end
  const fieldLastUpdate = ctx.t('poker.room.info.field.lastUpdate');
  let finalMessage = baseMessage;
  
  if (extras.length > 0) {
    finalMessage += `\n\n${extras.join(' | ')}`;
  }
  
  finalMessage += `\n\n${fieldLastUpdate}: ${ctx.lastUpdateIso}`;
  
  return { message: finalMessage, keyboardForAdmin: inGameRows, keyboardForPlayer: inGameRows, isDetailed };
}
