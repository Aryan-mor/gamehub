import { 
  PokerRoom,
  PlayerId,
  RoomId
} from '../types';
import { processBettingAction } from './gameStateService';
import { } from './pokerService';
import { createPlayerTimeoutNotification } from './notificationService';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Timeout configuration
 */
export const TIMEOUT_CONFIG = {
  TURN_TIMEOUT: 60 * 1000, // 60 seconds per turn
  GAME_TIMEOUT: 5 * 60 * 1000, // 5 minutes for entire game
  CHECK_INTERVAL: 10 * 1000, // Check every 10 seconds
} as const;

/**
 * Player timeout tracking
 */
export interface PlayerTimeout {
  playerId: PlayerId;
  roomId: RoomId;
  lastActionTime: number;
  turnStartTime: number;
  isActive: boolean;
}

/**
 * Timeout tracking for rooms
 */
const timeoutTracking = new Map<RoomId, Map<PlayerId, PlayerTimeout>>();

/**
 * Initialize timeout tracking for a room
 */
export function initializeRoomTimeout(room: PokerRoom): void {
  logFunctionStart('initializeRoomTimeout', { roomId: room.id });
  
  const roomTimeouts = new Map<PlayerId, PlayerTimeout>();
  
  room.players.forEach(player => {
    roomTimeouts.set(player.id, {
      playerId: player.id,
      roomId: room.id,
      lastActionTime: Date.now(),
      turnStartTime: Date.now(),
      isActive: true
    });
  });
  
  timeoutTracking.set(room.id, roomTimeouts);
  
  logFunctionEnd('initializeRoomTimeout', {}, { roomId: room.id });
}

/**
 * Update player activity timestamp
 */
export function updatePlayerActivity(roomId: RoomId, playerId: PlayerId): void {
  const roomTimeouts = timeoutTracking.get(roomId);
  if (!roomTimeouts) return;
  
  const playerTimeout = roomTimeouts.get(playerId);
  if (playerTimeout) {
    playerTimeout.lastActionTime = Date.now();
    playerTimeout.isActive = true;
  }
}

/**
 * Update turn start time for current player
 */
export function updateTurnStartTime(room: PokerRoom): void {
  const roomTimeouts = timeoutTracking.get(room.id);
  if (!roomTimeouts) return;
  
  const currentPlayer = room.players[room.currentPlayerIndex];
  const playerTimeout = roomTimeouts.get(currentPlayer.id);
  
  if (playerTimeout) {
    playerTimeout.turnStartTime = Date.now();
    playerTimeout.isActive = true;
  }
}

/**
 * Check for timeouts in a room
 */
export async function checkRoomTimeouts(room: PokerRoom): Promise<{
  timedOutPlayers: PlayerId[];
  notifications: Record<string, unknown>[];
}> {
  logFunctionStart('checkRoomTimeouts', { roomId: room.id });
  
  const roomTimeouts = timeoutTracking.get(room.id);
  if (!roomTimeouts) {
    logFunctionEnd('checkRoomTimeouts', { timedOutPlayers: [], notifications: [] }, { roomId: room.id });
    return { timedOutPlayers: [], notifications: [] };
  }
  
  const now = Date.now();
  const timedOutPlayers: PlayerId[] = [];
  const notifications: Record<string, unknown>[] = [];
  
  // Check each player for timeout
  for (const [playerId, playerTimeout] of roomTimeouts) {
    if (!playerTimeout.isActive) continue;
    
    const timeSinceLastAction = now - playerTimeout.lastActionTime;
    const timeSinceTurnStart = now - playerTimeout.turnStartTime;
    
    // Check if it's the player's turn and they've timed out
    const isCurrentPlayer = room.players[room.currentPlayerIndex]?.id === playerId;
    
    if (isCurrentPlayer && timeSinceTurnStart > TIMEOUT_CONFIG.TURN_TIMEOUT) {
      try {
        // Auto-fold the player
        await processBettingAction(room.id, playerId, 'fold');
        
        timedOutPlayers.push(playerId);
        playerTimeout.isActive = false;
        
        // Create timeout notification
        const player = room.players.find(p => p.id === playerId);
        if (player) {
          const notification = createPlayerTimeoutNotification(room, player);
          notifications.push(notification as unknown as Record<string, unknown>);
          
          logFunctionEnd('checkRoomTimeouts', { 
            timedOutPlayers: [playerId], 
            notifications: [notification as unknown as Record<string, unknown>] 
          }, { roomId: room.id });
        }
        
      } catch (error) {
        logError('checkRoomTimeouts', error as Error, { roomId: room.id, playerId });
      }
    }
    
    // Check for general inactivity timeout
    if (timeSinceLastAction > TIMEOUT_CONFIG.GAME_TIMEOUT) {
      playerTimeout.isActive = false;
      // Could implement auto-leave here if needed
    }
  }
  
  logFunctionEnd('checkRoomTimeouts', { timedOutPlayers, notifications }, { roomId: room.id });
  return { timedOutPlayers, notifications };
}

/**
 * Remove timeout tracking for a room
 */
export function cleanupRoomTimeout(roomId: RoomId): void {
  logFunctionStart('cleanupRoomTimeout', { roomId });
  
  timeoutTracking.delete(roomId);
  
  logFunctionEnd('cleanupRoomTimeout', {}, { roomId });
}

/**
 * Get player timeout status
 */
export function getPlayerTimeoutStatus(roomId: RoomId, playerId: PlayerId): {
  isActive: boolean;
  timeSinceLastAction: number;
  timeSinceTurnStart: number;
  isCurrentPlayer: boolean;
} {
  const roomTimeouts = timeoutTracking.get(roomId);
  if (!roomTimeouts) {
    return {
      isActive: false,
      timeSinceLastAction: 0,
      timeSinceTurnStart: 0,
      isCurrentPlayer: false
    };
  }
  
  const playerTimeout = roomTimeouts.get(playerId);
  if (!playerTimeout) {
    return {
      isActive: false,
      timeSinceLastAction: 0,
      timeSinceTurnStart: 0,
      isCurrentPlayer: false
    };
  }
  
  const now = Date.now();
  // Note: getPokerRoom would need to be async in real implementation
  
  return {
    isActive: playerTimeout.isActive,
    timeSinceLastAction: now - playerTimeout.lastActionTime,
    timeSinceTurnStart: now - playerTimeout.turnStartTime,
    isCurrentPlayer: false // Would need room context to determine this
  };
}

/**
 * Get timeout warning message
 */
export function getTimeoutWarningMessage(secondsLeft: number): string {
  if (secondsLeft <= 10) {
    return `⏰ <b>URGENT:</b> You have ${secondsLeft} seconds to act!`;
  } else if (secondsLeft <= 30) {
    return `⏰ <b>Warning:</b> You have ${secondsLeft} seconds to act`;
  } else {
    return `⏰ You have ${secondsLeft} seconds to act`;
  }
}

/**
 * Check if a player should receive a timeout warning
 */
export function shouldShowTimeoutWarning(
  timeSinceTurnStart: number,
  lastWarningTime: number
): { shouldShow: boolean; secondsLeft: number } {
  const secondsLeft = Math.max(0, Math.ceil((TIMEOUT_CONFIG.TURN_TIMEOUT - timeSinceTurnStart) / 1000));
  const now = Date.now();
  
  // Show warning at 30, 15, 10, 5, and 1 seconds remaining
  const warningThresholds = [30, 15, 10, 5, 1];
  const shouldShow = warningThresholds.includes(secondsLeft) && 
                    (now - lastWarningTime) > 5000; // Don't spam warnings
  
  return { shouldShow, secondsLeft };
} 