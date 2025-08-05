import { PokerRoom, PlayerId, PokerPlayer } from '../types';
import { getCardDisplay } from '../_utils/cardUtils';

/**
 * Notification types for different game events
 */
export type NotificationType = 
  | 'player_joined'
  | 'player_left'
  | 'player_ready'
  | 'player_not_ready'
  | 'game_started'
  | 'round_advanced'
  | 'player_action'
  | 'game_ended'
  | 'player_timeout';

/**
 * Notification data structure
 */
export interface GameNotification {
  type: NotificationType;
  roomId: string;
  playerId?: PlayerId;
  playerName?: string;
  action?: string;
  amount?: number;
  round?: string;
  message: string;
  timestamp: number;
}

/**
 * Create notification for player joining room
 */
export function createPlayerJoinedNotification(
  room: PokerRoom,
  player: PokerPlayer
): GameNotification {
  return {
    type: 'player_joined',
    roomId: room.id,
    playerId: player.id,
    playerName: player.name,
    message: `👋 ${player.name} joined the room`,
    timestamp: Date.now()
  };
}

/**
 * Create notification for player leaving room
 */
export function createPlayerLeftNotification(
  room: PokerRoom,
  player: PokerPlayer
): GameNotification {
  return {
    type: 'player_left',
    roomId: room.id,
    playerId: player.id,
    playerName: player.name,
    message: `🚪 ${player.name} left the room`,
    timestamp: Date.now()
  };
}

/**
 * Create notification for player ready status
 */
export function createPlayerReadyNotification(
  room: PokerRoom,
  player: PokerPlayer,
  isReady: boolean
): GameNotification {
  return {
    type: isReady ? 'player_ready' : 'player_not_ready',
    roomId: room.id,
    playerId: player.id,
    playerName: player.name,
    message: isReady 
      ? `✅ ${player.name} is ready`
      : `⏸️ ${player.name} is not ready`,
    timestamp: Date.now()
  };
}

/**
 * Create notification for game start
 */
export function createGameStartedNotification(room: PokerRoom): GameNotification {
  const readyPlayers = room.players.filter(p => p.isReady).length;
  
  return {
    type: 'game_started',
    roomId: room.id,
    message: `🎮 Game started with ${readyPlayers} players!\n` +
      `💰 Blinds: ${room.smallBlind}/${room.bigBlind} coins\n` +
      `🎯 Current player: ${room.players[room.currentPlayerIndex].name}`,
    timestamp: Date.now()
  };
}

/**
 * Create notification for round advancement
 */
export function createRoundAdvancedNotification(
  room: PokerRoom,
  _previousRound: string, // BettingRound type was removed, so using 'string' for now
  newRound: string // BettingRound type was removed, so using 'string' for now
): GameNotification {
  const roundNames: Record<string, string> = { // Changed to string for now
    'preflop': 'Pre-flop',
    'flop': 'Flop',
    'turn': 'Turn',
    'river': 'River'
  };
  
  let message = `🔄 Round advanced to ${roundNames[newRound]}`;
  
  if (newRound === 'flop') {
    const flopCards = room.communityCards.slice(0, 3);
    message += `\n🃏 Flop: ${flopCards.map(card => getCardDisplay(card)).join(' ')}`;
  } else if (newRound === 'turn') {
    const turnCard = room.communityCards[3];
    message += `\n🃏 Turn: ${getCardDisplay(turnCard)}`;
  } else if (newRound === 'river') {
    const riverCard = room.communityCards[4];
    message += `\n🃏 River: ${getCardDisplay(riverCard)}`;
  }
  
  message += `\n🎯 Current player: ${room.players[room.currentPlayerIndex].name}`;
  
  return {
    type: 'round_advanced',
    roomId: room.id,
    round: newRound,
    message,
    timestamp: Date.now()
  };
}

/**
 * Create notification for player action
 */
export function createPlayerActionNotification(
  room: PokerRoom,
  player: PokerPlayer,
  action: string,
  amount?: number
): GameNotification {
  let message = `🎯 ${player.name}: `;
  
  switch (action) {
    case 'fold':
      message += '❌ Folded';
      break;
    case 'check':
      message += '👁️ Checked';
      break;
    case 'call':
      message += `🃏 Called ${amount} coins`;
      break;
    case 'raise':
      message += `💰 Raised to ${amount} coins`;
      break;
    case 'all-in':
      message += `🔥 All-in (${amount} coins)`;
      break;
    default:
      message += action;
  }
  
  return {
    type: 'player_action',
    roomId: room.id,
    playerId: player.id,
    playerName: player.name,
    action,
    amount,
    message,
    timestamp: Date.now()
  };
}

/**
 * Create notification for game end
 */
export function createGameEndedNotification(room: PokerRoom): GameNotification {
  const activePlayers = room.players.filter(p => !p.isFolded);
  
  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    return {
      type: 'game_ended',
      roomId: room.id,
      playerId: winner.id,
      playerName: winner.name,
      message: `🏆 Game ended! ${winner.name} wins ${room.pot} coins!`,
      timestamp: Date.now()
    };
  }
  
  // Multiple players - show showdown
  const message = `🏆 Game ended! Showdown time!\n` +
    `💰 Final pot: ${room.pot} coins\n` +
    `👥 Active players: ${activePlayers.length}`;
  
  return {
    type: 'game_ended',
    roomId: room.id,
    message,
    timestamp: Date.now()
  };
}

/**
 * Create notification for player timeout
 */
export function createPlayerTimeoutNotification(
  room: PokerRoom,
  player: PokerPlayer
): GameNotification {
  return {
    type: 'player_timeout',
    roomId: room.id,
    playerId: player.id,
    playerName: player.name,
    message: `⏰ ${player.name} timed out and was auto-folded`,
    timestamp: Date.now()
  };
}

/**
 * Get notification display for a specific player
 */
export function getNotificationDisplay(
  notification: GameNotification,
  currentPlayerId: PlayerId
): string {
  // Add personal context for the current player
  let display = notification.message;
  
  if (notification.type === 'player_action' && notification.playerId === currentPlayerId) {
    display += ' (You)';
  }
  
  if (notification.type === 'game_started') {
    display += '\n\n🎯 It\'s time to play!';
  }
  
  if (notification.type === 'round_advanced') {
    display += '\n\n🔄 New betting round begins';
  }
  
  if (notification.type === 'game_ended') {
    display += '\n\n🏆 Check the results!';
  }
  
  return display;
}

/**
 * Format notification for display
 */
export function formatNotification(notification: GameNotification): string {
  const timestamp = new Date(notification.timestamp).toLocaleTimeString();
  
  return `[${timestamp}] ${notification.message}`;
}

/**
 * Get compact notification for game state updates
 */
export function getCompactNotification(notification: GameNotification): string {
  switch (notification.type) {
    case 'player_joined':
      return `👋 ${notification.playerName} joined`;
    case 'player_left':
      return `🚪 ${notification.playerName} left`;
    case 'player_ready':
      return `✅ ${notification.playerName} ready`;
    case 'player_not_ready':
      return `⏸️ ${notification.playerName} not ready`;
    case 'player_action':
      return `🎯 ${notification.playerName}: ${notification.action}`;
    case 'round_advanced':
      return `🔄 ${notification.round}`;
    case 'game_ended':
      return `🏆 Game ended`;
    default:
      return notification.message;
  }
} 