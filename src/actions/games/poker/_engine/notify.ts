import { 
  PokerRoom, 
  PokerPlayer
} from '../types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Notify all players in a room about game state changes
 */
export async function notifyAllPlayers(
  room: PokerRoom,
  message: string,
  includeCurrentPlayer = true
): Promise<void> {
  logFunctionStart('notifyAllPlayers', { roomId: room.id, messageLength: message.length });
  
  try {
    const playersToNotify = includeCurrentPlayer 
      ? room.players 
      : room.players.filter(p => p.id !== room.players[room.currentPlayerIndex]?.id);
    
    for (const player of playersToNotify) {
      if (player.chatId) {
        try {
          // Send notification to player
          // This would typically use a bot API call
          console.log(`📤 Notifying player ${player.name} (${player.chatId}): ${message}`);
        } catch (error) {
          console.error(`Failed to notify player ${player.name}:`, error);
        }
      }
    }
    
    logFunctionEnd('notifyAllPlayers', {}, { roomId: room.id });
  } catch (error) {
    logError('notifyAllPlayers', error as Error, { roomId: room.id });
  }
}

/**
 * Notify specific player about game state
 */
export async function notifyPlayer(
  player: PokerPlayer,
  message: string
): Promise<void> {
  logFunctionStart('notifyPlayer', { playerId: player.id, messageLength: message.length });
  
  try {
    if (player.chatId) {
      // Send notification to specific player
      console.log(`📤 Notifying player ${player.name} (${player.chatId}): ${message}`);
    }
    
    logFunctionEnd('notifyPlayer', {}, { playerId: player.id });
  } catch (error) {
    logError('notifyPlayer', error as Error, { playerId: player.id });
  }
}

/**
 * Notify about betting action
 */
export async function notifyBettingAction(
  room: PokerRoom,
  player: PokerPlayer,
  action: string,
  amount?: number
): Promise<void> {
  logFunctionStart('notifyBettingAction', { roomId: room.id, playerId: player.id, action });
  
  try {
    const actionText = amount 
      ? `${player.name} ${action} ${amount} coins`
      : `${player.name} ${action}`;
    
    await notifyAllPlayers(room, actionText, false);
    
    logFunctionEnd('notifyBettingAction', {}, { roomId: room.id, playerId: player.id });
  } catch (error) {
    logError('notifyBettingAction', error as Error, { roomId: room.id, playerId: player.id });
  }
}

/**
 * Notify about round advancement
 */
export async function notifyRoundAdvancement(
  room: PokerRoom,
  newRound: string
): Promise<void> {
  logFunctionStart('notifyRoundAdvancement', { roomId: room.id, newRound });
  
  try {
    const message = `🔄 Round advanced to ${newRound}`;
    await notifyAllPlayers(room, message);
    
    logFunctionEnd('notifyRoundAdvancement', {}, { roomId: room.id });
  } catch (error) {
    logError('notifyRoundAdvancement', error as Error, { roomId: room.id });
  }
}

/**
 * Notify about game end
 */
export async function notifyGameEnd(
  room: PokerRoom,
  winners: PokerPlayer[]
): Promise<void> {
  logFunctionStart('notifyGameEnd', { roomId: room.id, winnerCount: winners.length });
  
  try {
    const winnerNames = winners.map(w => w.name).join(', ');
    const message = `🏆 Game ended! Winners: ${winnerNames}`;
    await notifyAllPlayers(room, message);
    
    logFunctionEnd('notifyGameEnd', {}, { roomId: room.id });
  } catch (error) {
    logError('notifyGameEnd', error as Error, { roomId: room.id });
  }
} 