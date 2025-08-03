import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { PokerRoom, PlayerId } from '../types';

/**
 * Simple service to handle room updates
 */
export class RoomUpdateService {
  private static instance: RoomUpdateService;
  private updateQueue: Array<{
    roomId: string;
    action: 'player_joined' | 'player_left' | 'player_ready' | 'room_full';
    playerId: PlayerId;
    playerName: string;
  }> = [];

  static getInstance(): RoomUpdateService {
    if (!RoomUpdateService.instance) {
      RoomUpdateService.instance = new RoomUpdateService();
    }
    return RoomUpdateService.instance;
  }

  /**
   * Add update to queue
   */
  addUpdate(
    roomId: string,
    action: 'player_joined' | 'player_left' | 'player_ready' | 'room_full',
    playerId: PlayerId,
    playerName: string
  ): void {
    try {
      logFunctionStart('addUpdate', { roomId, action, playerId, playerName });
      
      this.updateQueue.push({
        roomId,
        action,
        playerId,
        playerName
      });
      
      logFunctionEnd('addUpdate', {}, { queueSize: this.updateQueue.length });
    } catch (error) {
      logError('addUpdate', error);
    }
  }

  /**
   * Get all updates for a room
   */
  getUpdatesForRoom(roomId: string): Array<{
    action: 'player_joined' | 'player_left' | 'player_ready' | 'room_full';
    playerId: PlayerId;
    playerName: string;
  }> {
    const updates = this.updateQueue.filter(update => update.roomId === roomId);
    return updates.map(update => ({
      action: update.action,
      playerId: update.playerId,
      playerName: update.playerName
    }));
  }

  /**
   * Clear updates for a room
   */
  clearUpdatesForRoom(roomId: string): void {
    this.updateQueue = this.updateQueue.filter(update => update.roomId !== roomId);
  }

  /**
   * Get notification message for updates
   */
  getNotificationMessage(room: PokerRoom): string | null {
    try {
      const updates = this.getUpdatesForRoom(room.id);
      if (updates.length === 0) return null;

      let message = '';
      let hasValidUpdates = false;
      
      for (const update of updates) {
        switch (update.action) {
          case 'player_joined':
            // Check if player is still in the room
            const joinedPlayer = room.players.find(p => p.id === update.playerId);
            if (joinedPlayer) {
              message += `👋 ${update.playerName} به روم پیوست\n`;
              hasValidUpdates = true;
            }
            break;
          case 'player_left':
            // Check if player is no longer in the room
            const leftPlayer = room.players.find(p => p.id === update.playerId);
            if (!leftPlayer) {
              message += `🚪 ${update.playerName} روم را ترک کرد\n`;
              hasValidUpdates = true;
            }
            break;
          case 'room_full':
            // Only show room_full if room is actually full
            if (room.players.length >= room.maxPlayers) {
              message += `🎉 روم پر شد! همه بازیکنان حاضر هستند\n`;
              hasValidUpdates = true;
            }
            break;
        }
      }

      // Clear old updates after processing
      this.clearUpdatesForRoom(room.id);

      return hasValidUpdates ? message.trim() : null;
    } catch (error) {
      logError('getNotificationMessage', error);
      return null;
    }
  }
}

// Export singleton instance
export const roomUpdateService = RoomUpdateService.getInstance(); 