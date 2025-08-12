/**
 * Example usage of sendOrUpdateMessage helper function
 * This file demonstrates how to use the new message management system
 */

import { Context } from 'grammy';
import { logError } from '@/modules/core/logger';
import { 
  sendOrUpdateMessage, 
  sendOrUpdateMessageToUsers,
  createGameMessageKey,
  createRoomMessageKey,
  createUserMessageKey,
  type SendPayload,
  type SendOptions
} from './sendOrUpdateMessage';

// Example 1: Game Status Updates
export async function updateGameStatus(ctx: Context, gameId: string, status: string, chatId: number): Promise<ReturnType<typeof sendOrUpdateMessage>> {
  const messageKey = createGameMessageKey(gameId, 'status');
  
  const payload: SendPayload = {
    text: `🎮 Game ${gameId}: ${status}`,
    extra: {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: (ctx as any)?.t ? (ctx as any).t('bot.buttons.viewGame') : 'View Game', callback_data: `game_view_${gameId}` }],
          [{ text: (ctx as any)?.t ? (ctx as any).t('bot.buttons.leaveGame') : 'Leave Game', callback_data: `game_leave_${gameId}` }]
        ]
      }
    }
  };

  const options: SendOptions = {
    messageKey,
    forceNew: false // Edit existing message if available
  };

  const result = await sendOrUpdateMessage(ctx, chatId, payload, options);
  
  if (!result.success) {
    logError('example.updateGameStatus', new Error(result.error || 'unknown'), { gameId, chatId });
  }
  
  return result;
}

// Example 2: Room Management
export async function updateRoomStatus(ctx: Context, roomId: string, playerCount: number, maxPlayers: number, chatId: number): Promise<ReturnType<typeof sendOrUpdateMessage>> {
  const messageKey = createRoomMessageKey(roomId, 'status');
  
  const payload: SendPayload = {
    text: `🏠 Room ${roomId}\n👥 Players: ${playerCount}/${maxPlayers}`,
    extra: {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: (ctx as any)?.t ? (ctx as any).t('bot.buttons.joinRoom') : 'Join Room', callback_data: `room_join_${roomId}` }],
          [{ text: (ctx as any)?.t ? (ctx as any).t('bot.buttons.leaveRoom') : 'Leave Room', callback_data: `room_leave_${roomId}` }]
        ]
      }
    }
  };

  const options: SendOptions = {
    messageKey,
    forceNew: false
  };

  return await sendOrUpdateMessage(ctx, chatId, payload, options);
}

// Example 3: User Notifications (Force New Message)
export async function sendUserNotification(ctx: Context, userId: number, notification: string): Promise<ReturnType<typeof sendOrUpdateMessage>> {
  const messageKey = createUserMessageKey(userId, 'notification');
  
  const payload: SendPayload = {
    text: `🔔 ${notification}`,
    extra: {
      parse_mode: 'HTML',
      disable_notification: false // Ensure notification is shown
    }
  };

  const options: SendOptions = {
    messageKey,
    forceNew: true // Always send new message for notifications
  };

  return await sendOrUpdateMessage(ctx, userId, payload, options);
}

// Example 4: Multi-user Broadcasting
export async function notifyGamePlayers(ctx: Context, playerIds: number[], message: string): Promise<Awaited<ReturnType<typeof sendOrUpdateMessageToUsers>>> {
  const payload: SendPayload = {
    text: `🎯 ${message}`,
    extra: {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: (ctx as any)?.t ? (ctx as any).t('bot.buttons.ready') : 'Ready', callback_data: 'game_ready' }],
          [{ text: (ctx as any)?.t ? (ctx as any).t('bot.buttons.notReady') : 'Not Ready', callback_data: 'game_not_ready' }]
        ]
      }
    }
  };

  const options: SendOptions = {
    messageKey: 'game_notification',
    forceNew: true // Force new message for important notifications
  };

  const results = await sendOrUpdateMessageToUsers(ctx, playerIds, payload, options);
  
  // Check for failures
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    logError('example.notifyGamePlayers', new Error('some notifications failed'), { failures });
  }
  
  return results;
}

// Example 5: Progressive Game Updates
export async function updateGameProgress(ctx: Context, gameId: string, round: number, chatId: number): Promise<ReturnType<typeof sendOrUpdateMessage>> {
  const messageKey = createGameMessageKey(gameId, 'progress');
  
  const payload: SendPayload = {
    text: `🎮 Game ${gameId} - Round ${round}\n⏳ Waiting for players to make their moves...`,
    extra: {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: (ctx as any)?.t ? (ctx as any).t('bot.buttons.viewGame') : 'View Game', callback_data: `game_view_${gameId}` }],
          [{ text: (ctx as any)?.t ? (ctx as any).t('bot.buttons.spectate') : 'Spectate', callback_data: `game_spectate_${gameId}` }]
        ]
      }
    }
  };

  const options: SendOptions = {
    messageKey,
    forceNew: false // Edit existing message to avoid spam
  };

  return await sendOrUpdateMessage(ctx, chatId, payload, options);
}

// Example 6: Error Handling with Fallback
export async function sendMessageWithFallback(ctx: Context, chatId: number, message: string, messageKey: string): Promise<ReturnType<typeof sendOrUpdateMessage>> {
  const payload: SendPayload = {
    text: message,
    extra: {
      parse_mode: 'HTML'
    }
  };

  const options: SendOptions = {
    messageKey,
    forceNew: false
  };

  const result = await sendOrUpdateMessage(ctx, chatId, payload, options);
  
  if (!result.success) {
    // Fallback: try sending as a new message
    logError('example.sendMessageWithFallback', new Error(result.error || 'unknown'), { chatId, messageKey });
    
    const fallbackOptions: SendOptions = {
      messageKey: `${messageKey}_fallback`,
      forceNew: true
    };
    
    return await sendOrUpdateMessage(ctx, chatId, payload, fallbackOptions);
  }
  
  return result;
}

// Example 7: Batch User Notifications
export async function sendBatchNotifications(ctx: Context, notifications: Array<{ userId: number; message: string }>): Promise<Array<{ userId: number; success: boolean; error?: string; messageId?: number }>> {
  const results: Array<{ userId: number; success: boolean; error?: string; messageId?: number }> = [];
  
  for (const notification of notifications) {
    const result = await sendUserNotification(ctx, notification.userId, notification.message);
    results.push({
      userId: notification.userId,
      success: result.success,
      error: result.error
    });
  }
  
  return results;
}

// Example 8: Game Result Announcement
export async function announceGameResult(ctx: Context, gameId: string, winner: string, chatId: number): Promise<ReturnType<typeof sendOrUpdateMessage>> {
  const messageKey = createGameMessageKey(gameId, 'result');
  
  const payload: SendPayload = {
    text: `🏆 Game ${gameId} Finished!\n👑 Winner: ${winner}\n🎉 Congratulations!`,
    extra: {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: (ctx as any)?.t ? (ctx as any).t('bot.buttons.playAgain') : 'Play Again', callback_data: `game_new_${gameId}` }],
          [{ text: (ctx as any)?.t ? (ctx as any).t('bot.buttons.viewStats') : 'View Stats', callback_data: `game_stats_${gameId}` }]
        ]
      }
    }
  };

  const options: SendOptions = {
    messageKey,
    forceNew: true // Force new message for important results
  };

  return await sendOrUpdateMessage(ctx, chatId, payload, options);
}

// Example 9: Room Invitation
export async function sendRoomInvitation(ctx: Context, roomId: string, inviterName: string, inviteeIds: number[]): Promise<Awaited<ReturnType<typeof sendOrUpdateMessageToUsers>>> {
  const payload: SendPayload = {
    text: `🎮 ${inviterName} invited you to join Room ${roomId}!\n\nClick below to join the game.`,
    extra: {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: (ctx as any)?.t ? (ctx as any).t('bot.buttons.joinRoom') : 'Join Room', callback_data: `room_join_${roomId}` }],
          [{ text: (ctx as any)?.t ? (ctx as any).t('bot.buttons.decline') : 'Decline', callback_data: `room_decline_${roomId}` }]
        ]
      }
    }
  };

  const options: SendOptions = {
    messageKey: `room_invitation_${roomId}`,
    forceNew: true // Always send new invitation
  };

  return await sendOrUpdateMessageToUsers(ctx, inviteeIds, payload, options);
}

// Example 10: System Maintenance Notification
export async function sendMaintenanceNotification(ctx: Context, userIds: number[], maintenanceTime: string): Promise<Awaited<ReturnType<typeof sendOrUpdateMessageToUsers>>> {
  const payload: SendPayload = {
    text: `🔧 System Maintenance\n\n⏰ Scheduled: ${maintenanceTime}\n\nWe'll be back shortly!`,
    extra: {
      parse_mode: 'HTML',
      disable_notification: false
    }
  };

  const options: SendOptions = {
    messageKey: 'system_maintenance',
    forceNew: true // Important system notification
  };

  return await sendOrUpdateMessageToUsers(ctx, userIds, payload, options);
}
