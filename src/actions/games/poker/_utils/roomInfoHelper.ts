import { PokerRoom, PlayerId, PokerPlayer } from '../types';
import { GameHubContext } from '@/plugins';
// Use smart-router JSON callbacks via keyboard plugin
import { getCardDisplay } from './cardUtils';

/**
 * Get personalized room information for a specific user
 */
export function getRoomInfoForUser(room: PokerRoom, userId: PlayerId, ctx?: GameHubContext): string {
  const isCreator = room.createdBy === userId;
  
  const t: (key: string, params?: Record<string, string>) => string = (key, params) => ctx?.t(key, params) ?? key;
  let message = `${t('poker.room.info.title')}` + '\n\n';
  
  // Room basic info
  message += `${t('poker.room.info.section.details')}\n`;
  message += `${t('poker.room.info.field.name')}: ${room.name}\n`;
  message += `${t('poker.room.info.field.id')}: <code>${room.id}</code>\n`;
  message += `${t('poker.room.info.field.status')}: ${getStatusDisplay(room.status, ctx)}\n`;
  message += `${t('poker.room.info.field.type')}: ${room.isPrivate ? t('poker.room.info.type.private') : t('poker.room.info.type.public')}\n\n`;
  
  // Game settings
  message += `${t('poker.room.info.section.settings')}\n`;
  message += `${t('poker.room.info.field.smallBlind')}: ${room.smallBlind} ${t('coins')}\n`;
  message += `${t('poker.room.info.field.bigBlind')}: ${room.bigBlind} ${t('coins')}\n`;
  message += `${t('poker.room.info.field.maxPlayers')}: ${room.maxPlayers}\n`;
  message += `${t('poker.room.info.field.turnTimeout')}: ${room.turnTimeoutSec} ${t('seconds')}\n\n`;
  
  // Players list
  message += `${t('poker.room.info.section.players', { count: String(room.players.length), max: String(room.maxPlayers) })}\n`;
  
  room.players.forEach((player, index) => {
    const isPlayerCreator = player.id === room.createdBy;
    const isCurrentPlayer = player.id === userId;
    const creatorIcon = isPlayerCreator ? '🧑‍💼' : '';
    const currentPlayerIcon = isCurrentPlayer ? '📍' : '';
    const readyIcon = player.isReady ? '✅' : '⏳';
    
    // Use display name (first_name + last_name) instead of username for privacy
    // The display name should be in player.name, but fallback to username if needed
    const displayName = player.name || player.username || t('poker.room.player.unknown');
    
    message += `${index + 1}. ${creatorIcon}${currentPlayerIcon} ${displayName}`;
    
    message += ` ${readyIcon}`;
    
    if (isPlayerCreator) {
      message += ` <i>(${t('poker.room.player.creator')})</i>`;
    }
    
    if (isCurrentPlayer) {
      message += ` <i>(${t('poker.room.player.you')})</i>`;
    }
    
    message += '\n';
  });
  
  message += '\n';
  
  // Room status specific info
  if (room.status === 'waiting') {
    message += `${t('poker.room.info.section.status')}\n`;
    message += `${t('poker.room.info.field.players')}: ${room.players.length}/${room.maxPlayers}\n`;
    message += `${t('poker.room.info.field.minRequired')}: ${room.minPlayers} ${t('players')}\n\n`;
    
    if (isCreator && room.players.length >= room.minPlayers) {
      message += `${t('poker.room.info.hints.canStart')}\n`;
    } else if (isCreator) {
      message += `${t('poker.room.info.hints.waitingMorePlayers')}\n`;
    } else {
      message += `${t('poker.room.info.hints.waitingCreator')}\n`;
    }
  } else if (room.status === 'active' || room.status === 'playing') {
    message += `${t('poker.room.info.section.activeGame')}\n`;
    message += `${t('poker.room.info.field.pot')}: ${room.pot} ${t('coins')}\n`;
    message += `${t('poker.room.info.field.round')}: ${room.round || room.bettingRound}\n`;
    if (room.currentPlayerIndex < room.players.length) {
      const currentPlayer = room.players[room.currentPlayerIndex];
      const displayName = currentPlayer.name || currentPlayer.username || t('poker.room.player.unknown');
      message += `${t('poker.room.info.field.turn')}: ${displayName}\n`;
    }
  }
  
  // Add timestamp
  const now = new Date();
  const locale = ctx?.from?.language_code && ['en','fa'].includes(ctx.from.language_code) ? ctx.from.language_code : 'en';
  const timestamp = now.toLocaleDateString(locale, { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }) + ' ' + now.toLocaleTimeString(locale, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  message += `\n${t('poker.room.info.field.lastUpdate')}: ${timestamp}`;
  
  return message;
}

/**
 * Generate keyboard for room information based on user role
 */
export function generateRoomInfoKeyboard(room: PokerRoom, userId: PlayerId, ctx?: GameHubContext): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string } | { text: string; switch_inline_query: string }>>
} {
  const t: (key: string) => string = (key) => ctx?.t(key) ?? key;
  const isCreator = String(room.createdBy) === String(userId);
  const canStartGame = isCreator && room.players.length >= room.minPlayers && room.status === 'waiting';
  
  ctx?.log?.debug?.('START GAME BUTTON DEBUG', {
    userId,
    roomCreatedBy: room.createdBy,
    isCreator,
    players: room.players.length,
    minPlayers: room.minPlayers,
    status: room.status,
    canStartGame
  });
  
  const buttons: Array<Array<{ text: string; callback_data: string } | { text: string; switch_inline_query: string }>> = [];
  
  // Start Game button (only for creator when conditions are met)
  if (canStartGame) {
    ctx?.log?.debug?.('Adding Start Game button', { roomId: room.id });
    buttons.push([
      { text: t('poker.room.buttons.startGame'), callback_data: ctx?.keyboard.buildCallbackData('games.poker.room.start', { roomId: room.id }) as string }
    ]);
  } else {
    ctx?.log?.debug?.('NOT adding Start Game button - conditions not met', { roomId: room.id });
  }
  
  // Share button (only when room is not full) - using switch_inline_query to open contacts
  const isRoomFull = room.players.length >= room.maxPlayers;
  ctx?.log?.debug?.('ROOM STATUS CHECK', { roomName: room.name, players: room.players.length, maxPlayers: room.maxPlayers, isRoomFull });
  
  if (!isRoomFull) {
    const shareInlineQuery = `gpj-${room.id}`;
    ctx?.log?.debug?.('SHARE BUTTON INLINE QUERY', { shareInlineQuery });
    buttons.push([
      {
        text: t('poker.room.buttons.share'),
        switch_inline_query: shareInlineQuery
      } as { text: string; switch_inline_query: string }
    ]);
  } else {
    ctx?.log?.debug?.('SHARE BUTTON HIDDEN', { roomName: room.name, players: room.players.length, maxPlayers: room.maxPlayers });
  }
  
  // Refresh and Leave buttons (always available)
  buttons.push([
    { text: t('poker.room.buttons.refresh'), callback_data: ctx?.keyboard.buildCallbackData('games.poker.room.info', { roomId: room.id }) as string },
    { text: t('poker.room.buttons.leave'), callback_data: ctx?.keyboard.buildCallbackData('games.poker.room.leave', { roomId: room.id }) as string }
  ]);
  
  // Back to menu button
  buttons.push([
    { text: t('poker.room.buttons.backToMenu'), callback_data: ctx?.keyboard.buildCallbackData('games.poker.back', {}) as string }
  ]);
  
  return { inline_keyboard: buttons };
}

/**
 * Build i18n-based game state message for a specific player
 */
export function getGameStateForUser(room: PokerRoom, playerId: PlayerId, ctx: GameHubContext): string {
  const t: (key: string, params?: Record<string, string | number>) => string = (key, params) => ctx.t(key, params as Record<string, unknown>);
  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    return t('poker.room.player.unknown');
  }

  let message = t('poker.game.title', { roomName: room.name }) + '\n\n';
  message += `${t('poker.game.field.pot')}: ${room.pot} ${t('coins')}\n`;
  message += `${t('poker.game.field.currentBet')}: ${room.currentBet} ${t('coins')}\n\n`;

  if (room.communityCards.length > 0) {
    message += t('poker.game.section.communityCards') + '\n';
    message += `${room.communityCards.map(card => getCardDisplay(card)).join(' ')}\n\n`;
  }

  if (player.cards && player.cards.length > 0) {
    message += t('poker.game.section.yourCards') + '\n';
    message += `${player.cards.map(card => getCardDisplay(card)).join(' ')}\n\n`;
  }

  const currentPlayer = room.players[room.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;
  if (isMyTurn) {
    message += t('poker.game.turn.yours') + '\n';
  } else if (currentPlayer) {
    const name = currentPlayer.name || currentPlayer.username || t('poker.room.player.unknown');
    message += t('poker.game.turn.waitingFor', { name }) + '\n';
  }

  message += `\n${t('poker.game.yourStatus.title')}\n`;
  message += `• ${t('poker.game.yourStatus.chips')}: ${player.chips}\n`;
  message += `• ${t('poker.game.yourStatus.currentBet')}: ${player.betAmount}\n`;
  const statusText = player.isFolded
    ? t('poker.game.status.folded')
    : player.isAllIn
      ? t('poker.game.status.allIn')
      : t('poker.game.status.active');
  message += `• ${t('poker.game.yourStatus.status')}: ${statusText}`;

  return message;
}

/**
 * Generate keyboard for kick player selection
 */
export function generateKickPlayerKeyboard(
  room: PokerRoom,
  kickablePlayers: PokerPlayer[],
  ctx?: GameHubContext
): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } {
  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
  
  // Add kick buttons for each player (max 2 per row)
  for (let i = 0; i < kickablePlayers.length; i += 2) {
    const row: Array<{ text: string; callback_data: string }> = [];
    
    // First player in row
    const player1 = kickablePlayers[i];
    row.push({
      text: `${ctx?.t('poker.room.buttons.kick')} ${player1.name}`,
      callback_data: ctx?.keyboard.buildCallbackData('games.poker.room.kick', { roomId: room.id, targetPlayerId: player1.id }) as string
    });
    
    // Second player in row (if exists)
    if (i + 1 < kickablePlayers.length) {
      const player2 = kickablePlayers[i + 1];
      row.push({
        text: `${ctx?.t('poker.room.buttons.kick')} ${player2.name}`,
      callback_data: ctx?.keyboard.buildCallbackData('games.poker.room.kick', { roomId: room.id, targetPlayerId: player2.id }) as string
      });
    }
    
    buttons.push(row);
  }
  
  // Navigation buttons
  buttons.push([
    { text: ctx?.t('poker.room.buttons.backToRoomInfo') ?? 'poker.room.buttons.backToRoomInfo', callback_data: ctx?.keyboard.buildCallbackData('games.poker.room.info', { roomId: room.id }) as string }
  ]);
  
  buttons.push([
    { text: ctx?.t('poker.room.buttons.backToMenu') ?? 'poker.room.buttons.backToMenu', callback_data: ctx?.keyboard.buildCallbackData('games.poker.back', {}) as string }
  ]);
  
  return { inline_keyboard: buttons };
}

/**
 * Get display text for room status
 */
function getStatusDisplay(status: string, ctx?: GameHubContext): string {
  const t: (key: string) => string = (key) => ctx?.t(key) ?? key;
  const statusMap: Record<string, string> = {
    'waiting': t('poker.room.status.waiting'),
    'active': t('poker.room.status.active'),
    'playing': t('poker.room.status.playing'),
    'finished': t('poker.room.status.finished'),
    'cancelled': t('poker.room.status.cancelled')
  };
  
  return statusMap[status] || status;
} 