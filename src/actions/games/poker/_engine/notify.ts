import { PokerRoom, PokerPlayer } from '../types';

/**
 * Notify all players in a room about game state changes
 */
export async function notifyAllPlayers(
  ctx: { log: { debug: (m: string, c?: Record<string, unknown>) => void; error: (m: string, c?: Record<string, unknown>) => void } },
  room: PokerRoom,
  message: string,
  includeCurrentPlayer = true
): Promise<void> {
  ctx.log.debug('notifyAllPlayers:start', { roomId: room.id, messageLength: message.length });
  
  try {
    const playersToNotify = includeCurrentPlayer 
      ? room.players 
      : room.players.filter(p => p.id !== room.players[room.currentPlayerIndex]?.id);
    
    for (const player of playersToNotify) {
      if (player.chatId) {
        try {
          // Placeholder: integrate actual send via ctx.api when available
          ctx.log.debug('notifyAllPlayers:notify', { player: player.name, chatId: player.chatId, length: message.length });
        } catch (error) {
          ctx.log.error('notifyAllPlayers.send', { error: error instanceof Error ? error.message : String(error), playerId: player.id });
        }
      }
    }
    
    ctx.log.debug('notifyAllPlayers:end', { roomId: room.id });
  } catch (error) {
    ctx.log.error('notifyAllPlayers', { error: error instanceof Error ? error.message : String(error), roomId: room.id });
  }
}

/**
 * Notify specific player about game state
 */
export async function notifyPlayer(
  ctx: { log: { debug: (m: string, c?: Record<string, unknown>) => void; error: (m: string, c?: Record<string, unknown>) => void } },
  player: PokerPlayer,
  message: string
): Promise<void> {
  ctx.log.debug('notifyPlayer:start', { playerId: player.id, messageLength: message.length });
  
  try {
    if (player.chatId) {
      ctx.log.debug('notifyPlayer:notify', { player: player.name, chatId: player.chatId, length: message.length });
    }
    
    ctx.log.debug('notifyPlayer:end', { playerId: player.id });
  } catch (error) {
    ctx.log.error('notifyPlayer', { error: error instanceof Error ? error.message : String(error), playerId: player.id });
  }
}

/**
 * Notify about betting action
 */
export async function notifyBettingAction(
  ctx: { log: { debug: (m: string, c?: Record<string, unknown>) => void; error: (m: string, c?: Record<string, unknown>) => void } },
  room: PokerRoom,
  player: PokerPlayer,
  action: string,
  amount?: number
): Promise<void> {
  ctx.log.debug('notifyBettingAction:start', { roomId: room.id, playerId: player.id, action });
  
  try {
    const actionText = amount 
      ? `${player.name} ${action} ${amount} coins`
      : `${player.name} ${action}`;
    
    await notifyAllPlayers(ctx, room, actionText, false);
    
    ctx.log.debug('notifyBettingAction:end', { roomId: room.id, playerId: player.id });
  } catch (error) {
    ctx.log.error('notifyBettingAction', { error: error instanceof Error ? error.message : String(error), roomId: room.id, playerId: player.id });
  }
}

/**
 * Notify about round advancement
 */
export async function notifyRoundAdvancement(
  ctx: { log: { debug: (m: string, c?: Record<string, unknown>) => void; error: (m: string, c?: Record<string, unknown>) => void } },
  room: PokerRoom,
  newRound: string
): Promise<void> {
  ctx.log.debug('notifyRoundAdvancement:start', { roomId: room.id, newRound });
  
  try {
    const message = `🔄 Round advanced to ${newRound}`;
    await notifyAllPlayers(ctx, room, message);
    
    ctx.log.debug('notifyRoundAdvancement:end', { roomId: room.id });
  } catch (error) {
    ctx.log.error('notifyRoundAdvancement', { error: error instanceof Error ? error.message : String(error), roomId: room.id });
  }
}

/**
 * Notify about game end
 */
export async function notifyGameEnd(
  ctx: { log: { debug: (m: string, c?: Record<string, unknown>) => void; error: (m: string, c?: Record<string, unknown>) => void } },
  room: PokerRoom,
  winners: PokerPlayer[]
): Promise<void> {
  ctx.log.debug('notifyGameEnd:start', { roomId: room.id, winnerCount: winners.length });
  
  try {
    const winnerNames = winners.map(w => w.name).join(', ');
    const message = `🏆 Game ended! Winners: ${winnerNames}`;
    await notifyAllPlayers(ctx, room, message);
    
    ctx.log.debug('notifyGameEnd:end', { roomId: room.id });
  } catch (error) {
    ctx.log.error('notifyGameEnd', { error: error instanceof Error ? error.message : String(error), roomId: room.id });
  }
} 