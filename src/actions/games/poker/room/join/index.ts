import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { getMessageUpdater } from '@/modules/core/messageUpdater';
import { joinPokerRoom, getPokerRoom } from '../../services/pokerService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';
import { validateRoomJoinRequest, getRoomCapacityInfo } from '../../_utils/roomJoinValidation';
import { generateJoinSuccessKeyboard, generateErrorKeyboard, generateRoomFullKeyboard } from '../../_utils/joinRoomKeyboardGenerator';
import { getRoomInfoForUser } from '../../_utils/roomInfoHelper';
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';
import { storePlayerMessage, notifyPlayerJoined, checkRoomFullAndNotify, getAllRoomMessages, getPlayerMessage } from '../../services/roomMessageService';
import { handlePokerActiveUser } from '../../_engine/activeUser';
import { updateAllPlayersInRoom, notifyRoomFull } from '../../services/playerNotificationService';
import { roomUpdateService } from '../../services/roomUpdateService';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.join';

/**
 * Handle joining a poker room
 */
async function handleJoin(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId, r } = query;
  const roomIdParam = roomId || r;
  
  // Check if this is a direct link (from Telegram start payload)
  const isDirectLink = query.isDirectLink === 'true';
  
  console.log(`Processing room join request for user ${user.id}, roomId: ${roomIdParam}, isDirectLink: ${isDirectLink}`);
  
  if (!roomIdParam) {
      const message = `❌ <b>خطا در ورود به روم</b>\n\n` +
        `شناسه روم مورد نیاز است.`;
      
      if (isDirectLink) {
        await ctx.reply(message, {
          parse_mode: 'HTML',
          reply_markup: generateErrorKeyboard()
        });
      } else {
        await tryEditMessageText(ctx, message, {
          parse_mode: 'HTML',
          reply_markup: generateErrorKeyboard()
        });
      }
      return;
    }
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomId(roomIdParam);
    const validatedPlayerId = validatePlayerId(user.id.toString());
    
    // Get room information
    const room = await getPokerRoom(validatedRoomId);
    if (!room) {
      const message = `❌ <b>خطا در ورود به روم</b>\n\n` +
        `روم مورد نظر یافت نشد.`;
      
      if (isDirectLink) {
        await ctx.reply(message, {
          parse_mode: 'HTML',
          reply_markup: generateErrorKeyboard()
        });
      } else {
        await tryEditMessageText(ctx, message, {
          parse_mode: 'HTML',
          reply_markup: generateErrorKeyboard()
        });
      }
      return;
    }
    
    // Validate join request
    console.log(`🔍 VALIDATING JOIN REQUEST:`, {
      roomId: validatedRoomId,
      playerId: validatedPlayerId,
      isDirectLink,
      roomExists: !!room,
      roomDetails: room ? {
        id: room.id,
        name: room.name,
        maxPlayers: room.maxPlayers,
        playerCount: room.players.length,
        status: room.status
      } : null
    });
    
    const validation = await validateRoomJoinRequest(room, validatedPlayerId, isDirectLink);
    console.log(`✅ VALIDATION RESULT:`, {
      isValid: validation.isValid,
      error: validation.error,
      activeRoom: validation.activeRoom ? validation.activeRoom.id : null
    });
    if (!validation.isValid) {
      // If user is in an active room, update their info and show the active room
      if (validation.activeRoom) {
      console.log(`🎮 USER IN ACTIVE ROOM: Updating info and redirecting to active room ${validation.activeRoom.id}`);
      
      // Update player information in the active room
      const telegramUser = ctx.from;
      const playerName = telegramUser?.username || telegramUser?.first_name || telegramUser?.last_name || user.username || 'Unknown Player';
      
      // Create display name from first_name + last_name for privacy
      let displayName = 'Unknown';
      if (telegramUser?.first_name) {
        displayName = telegramUser.first_name;
        if (telegramUser.last_name) {
          displayName += ` ${telegramUser.last_name}`;
        }
      } else if (telegramUser?.username) {
        displayName = telegramUser.username;
      } else if (user.username) {
        displayName = user.username;
      }
      
      try {
        const { updatePlayerInfo } = await import('../../services/pokerService');
        await updatePlayerInfo(validation.activeRoom.id, validatedPlayerId, {
          name: playerName,
          username: displayName,
          chatId: ctx.chat?.id
        });
        console.log(`✅ Updated player info in active room: ${playerName} (@${displayName})`);
      } catch (error) {
        console.error(`❌ Failed to update player info:`, error);
      }
      
      // Send a new message to the user who is already in active room
      const message = `🔄 <b>شما در حال حاضر در روم فعال هستید</b>\n\n` +
        `🏠 <b>روم:</b> ${validation.activeRoom.name}\n` +
        `📊 <b>وضعیت:</b> ${validation.activeRoom.status === 'waiting' ? '⏳ منتظر بازیکنان' : '🎮 در حال بازی'}\n` +
        `👥 <b>بازیکنان:</b> ${validation.activeRoom.players.length}/${validation.activeRoom.maxPlayers}\n\n` +
        `✅ اطلاعات شما به‌روزرسانی شد.`;
      
      const keyboard = generateJoinSuccessKeyboard(validation.activeRoom, validatedPlayerId, validation.activeRoom.createdBy === validatedPlayerId);
      
      // Always send new message for user who is already in active room
      const sentMessage = await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      
      // Store the new message ID
      if (sentMessage && sentMessage.message_id) {
        await storePlayerMessage(validation.activeRoom.id, validatedPlayerId, sentMessage.message_id, ctx.chat?.id || 0);
      }
      
      // Now update messages for OTHER players in the room
      console.log(`📢 Updating messages for other players in room ${validation.activeRoom.id}`);
      
      for (const player of validation.activeRoom.players) {
        // Skip the current user - they just got a new message
        if (player.id === validatedPlayerId) {
          console.log(`⏭️ Skipping update for current user ${player.name}`);
          continue;
        }
        
        if (player.chatId) {
          try {
            console.log(`📢 Updating message for other player ${player.name} (chatId: ${player.chatId})`);
            
            // Get stored message ID for this player
            const playerMessage = await getPlayerMessage(validation.activeRoom.id, player.id);
            
            if (playerMessage && playerMessage.messageId) {
              console.log(`📢 Updating message ${playerMessage.messageId} for player ${player.name}`);
              
              // Use MessageUpdater to update the message
              const messageUpdater = getMessageUpdater();
              const result = await messageUpdater.updateMessageWithKeyboard(
                player.chatId,
                playerMessage.messageId,
                getRoomInfoForUser(validation.activeRoom, player.id),
                generateJoinSuccessKeyboard(validation.activeRoom, player.id, validation.activeRoom.createdBy === player.id)
              );
              
              if (result.success) {
                console.log(`✅ Message updated successfully for player ${player.name}, new message ID: ${result.newMessageId}`);
                
                // Store new message ID if it's different from the original
                if (result.newMessageId && result.newMessageId !== playerMessage.messageId) {
                  await storePlayerMessage(validation.activeRoom.id, player.id, result.newMessageId, player.chatId);
                  console.log(`💾 New message ID ${result.newMessageId} stored for player ${player.name}`);
                }
              } else {
                console.log(`❌ Failed to update message for player ${player.name}:`, result.error);
              }
            } else {
              console.log(`⚠️ No stored message found for player ${player.name} - sending new message`);
              
              // Send new message if no stored message found
              const newMessage = await ctx.api.sendMessage(
                player.chatId,
                getRoomInfoForUser(validation.activeRoom, player.id),
                {
                  parse_mode: 'HTML',
                  reply_markup: generateJoinSuccessKeyboard(validation.activeRoom, player.id, validation.activeRoom.createdBy === player.id)
                }
              );
              
              // Store the new message ID
              await storePlayerMessage(validation.activeRoom.id, player.id, newMessage.message_id, player.chatId);
              console.log(`✅ New message sent to player ${player.name}, message ID: ${newMessage.message_id}`);
            }
          } catch (error) {
            console.error(`❌ Failed to update message for player ${player.name}:`, error);
          }
        } else {
          console.log(`⚠️ No chatId found for player ${player.name}`);
        }
      }
      
      return;
    }
      
      // Regular error handling for other cases
      const message = `❌ <b>خطا در ورود به روم</b>\n\n${validation.error}`;
      
      let keyboard;
      if (validation.error?.includes('پر شده')) {
        keyboard = generateRoomFullKeyboard();
      } else {
        keyboard = generateErrorKeyboard();
      }
      
      if (isDirectLink) {
        await ctx.reply(message, {
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
      } else {
        await tryEditMessageText(ctx, message, {
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
      }
      return;
    }
    
    // Join the room
    // Get user info - use first_name + last_name instead of username for privacy
    const telegramUser = ctx.from;
    const playerName = telegramUser?.username || telegramUser?.first_name || telegramUser?.last_name || user.username || 'Unknown Player';
    
    // Create display name from first_name + last_name for privacy
    let displayName = 'Unknown';
    if (telegramUser?.first_name) {
      displayName = telegramUser.first_name;
      if (telegramUser.last_name) {
        displayName += ` ${telegramUser.last_name}`;
      }
    } else if (telegramUser?.username) {
      displayName = telegramUser.username;
    } else if (user.username) {
      displayName = user.username;
    }
    
    console.log(`🎯 USER OBJECT:`, {
      id: user.id,
      username: user.username,
      telegramUsername: telegramUser?.username,
      telegramFirstName: telegramUser?.first_name,
      telegramLastName: telegramUser?.last_name,
      isBot: telegramUser?.is_bot,
      languageCode: telegramUser?.language_code
    });
    console.log(`🎯 JOINING ROOM: ${validatedRoomId}`);
    console.log(`👤 PLAYER INFO:`, { 
      id: validatedPlayerId, 
      name: playerName, 
      displayName: displayName,
      firstName: telegramUser?.first_name,
      lastName: telegramUser?.last_name
    });
    
    const updatedRoom = await joinPokerRoom({
      roomId: validatedRoomId,
      playerId: validatedPlayerId,
      playerName: playerName,
      username: displayName,
      chips: 1000,
      chatId: ctx.chat?.id // Store chatId for message updates
    });
    
    // Get the complete room data after join
    const completeRoom = await getPokerRoom(validatedRoomId);
    if (!completeRoom) {
      throw new Error('Failed to get room data after join');
    }
    
    console.log(`🏠 ROOM AFTER JOIN:`, {
      id: completeRoom.id,
      name: completeRoom.name,
      maxPlayers: completeRoom.maxPlayers,
      playerCount: completeRoom.players.length,
      players: completeRoom.players.map(p => ({ id: p.id, name: p.name, username: p.username }))
    });
    
    // Get capacity information
    const capacity = getRoomCapacityInfo(completeRoom);
    const player = completeRoom.players.find(p => p.id === validatedPlayerId);
    const isCreator = completeRoom.createdBy === validatedPlayerId;
    
    // Generate welcome message
    const message = `🚪 <b>با موفقیت وارد روم شدید!</b>\n\n` +
      `✅ شما اکنون عضو روم پوکر هستید.\n\n` +
      `🎯 <b>مشخصات روم:</b>\n` +
      `• نام: ${completeRoom.name}\n` +
      `• نوع: ${completeRoom.isPrivate ? '🔒 خصوصی' : '🌐 عمومی'}\n` +
      `• بازیکنان: ${capacity.current}/${capacity.max}\n` +
      `• وضعیت: ${completeRoom.status === 'waiting' ? '⏳ منتظر بازیکنان' : completeRoom.status}\n` +
      `• Small Blind: ${completeRoom.smallBlind} سکه\n` +
      `• تایم‌اوت: ${completeRoom.turnTimeoutSec || 60} ثانیه\n\n` +
      `📊 <b>وضعیت شما:</b>\n` +
      `• سکه‌ها: ${player?.chips || 1000}\n` +
      `• آماده: ✅ بله (اتوماتیک)\n\n` +
      `🎮 <b>مراحل بعدی:</b>\n` +
      `• منتظر سایر بازیکنان باشید\n` +
      `• بازی را شروع کنید`;
    
    // Generate appropriate keyboard
    const keyboard = generateJoinSuccessKeyboard(completeRoom, validatedPlayerId, isCreator);
    
    let sentMessage;
    if (isDirectLink) {
      // For direct links, use reply instead of edit
      sentMessage = await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } else {
      // For callback queries, use edit
      sentMessage = await tryEditMessageText(ctx, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    }
    
    // Store message ID for this player
    if (sentMessage && sentMessage.message_id) {
      try {
        await storePlayerMessage(validatedRoomId, validatedPlayerId, sentMessage.message_id, ctx.chat?.id || 0);
      } catch (error) {
        console.error('Failed to store player message:', error);
        // Don't throw error - this is not critical for room joining
      }
    }
    
    // Notify that player joined
    await notifyPlayerJoined(validatedRoomId, validatedPlayerId, playerName);
    
    // Check if room is full and notify creator
    const isRoomFull = await checkRoomFullAndNotify(completeRoom);
    
    // Add update to room update service
    roomUpdateService.addUpdate(completeRoom.id, 'player_joined', validatedPlayerId, playerName);
    
    // If room is full, add room full update
    if (isRoomFull) {
      roomUpdateService.addUpdate(completeRoom.id, 'room_full', validatedPlayerId, playerName);
    }
    
    console.log(`🎮 Player ${playerName} joined room ${completeRoom.id}`);
    console.log(`📊 Room now has ${completeRoom.players.length}/${completeRoom.maxPlayers} players`);
    
    // If room is full, log it
    if (isRoomFull) {
      console.log(`🎉 Room ${completeRoom.id} is now full!`);
    }
    
    // Update messages for all OTHER players in the room (not the joining player)
    console.log(`📢 Updating messages for other players in room ${completeRoom.id}`);
    
    for (const player of completeRoom.players) {
      // Skip the player who just joined - they already have their message
      if (player.id === validatedPlayerId) {
        console.log(`⏭️ Skipping update for joining player ${player.name}`);
        continue;
      }
      
      if (player.chatId) {
        try {
          console.log(`📢 Updating message for existing player ${player.name} (chatId: ${player.chatId})`);
          
          // Get stored message ID for this player
          const playerMessage = await getPlayerMessage(completeRoom.id, player.id);
          
          if (playerMessage && playerMessage.messageId) {
            console.log(`📢 Attempting to edit message ${playerMessage.messageId} for player ${player.name}`);
            
            try {
              // Try to edit existing message first
              const { handlePokerActiveUser } = await import('../../_engine/activeUser');
              const playerState = {
                gameType: 'poker' as const,
                roomId: completeRoom.id,
                isActive: true,
                lastActivity: Date.now()
              };
              
              // Create a context for editing
              const editContext = {
                ...ctx,
                chat: { id: player.chatId },
                from: { 
                  id: parseInt(player.id),
                  username: player.username,
                  first_name: player.name,
                  is_bot: false
                },
                message: {
                  ...ctx.message,
                  chat: { id: player.chatId },
                  message_id: playerMessage.messageId
                },
                editMessageText: async (text: string, options?: any) => {
                  return await ctx.api.editMessageText(player.chatId, playerMessage.messageId, text, options);
                }
              };
              
              await handlePokerActiveUser(editContext, playerState, completeRoom);
              console.log(`✅ Message edited successfully for player ${player.name}`);
              
            } catch (editError) {
              console.log(`⚠️ Failed to edit message for ${player.name}, trying to send new message:`, editError);
              
              // If edit fails, try to delete old message and send new one
              try {
                await ctx.api.deleteMessage(player.chatId, playerMessage.messageId);
                console.log(`🗑️ Deleted old message ${playerMessage.messageId} for player ${player.name}`);
              } catch (deleteError) {
                console.log(`⚠️ Could not delete old message for ${player.name}:`, deleteError);
              }
              
              // Send new message
              await sendNewRoomMessage(ctx, player, completeRoom);
            }
          } else {
            console.log(`⚠️ No stored message found for player ${player.name}, sending new message`);
            await sendNewRoomMessage(ctx, player, completeRoom);
          }
        } catch (error) {
          console.error(`❌ Failed to update message for player ${player.name}:`, error);
          // Try to send new message as fallback
          try {
            await sendNewRoomMessage(ctx, player, completeRoom);
          } catch (fallbackError) {
            console.error(`❌ Failed to send fallback message for player ${player.name}:`, fallbackError);
          }
        }
      } else {
        console.log(`⚠️ No chatId found for player ${player.name}`);
      }
    }
    
  } catch (error) {
    console.error('Join room error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص رخ داده است';
    const message = `❌ <b>خطا در ورود به روم</b>\n\n${errorMessage}`;
    
    if (isDirectLink) {
      // For direct links, use reply instead of edit
      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: generateErrorKeyboard()
      });
    } else {
      // For callback queries, use edit
      await tryEditMessageText(ctx, message, {
        parse_mode: 'HTML',
        reply_markup: generateErrorKeyboard()
      });
    }
  }
}

/**
 * Send a new room message to a player
 */
async function sendNewRoomMessage(ctx: any, player: any, room: any): Promise<void> {
  try {
    console.log(`📤 Sending new room message to player ${player.name} (chatId: ${player.chatId})`);
    
    // Generate room info message
    const message = getRoomInfoForUser(room, player.id);
    
    // Generate appropriate keyboard
    const keyboard = generateJoinSuccessKeyboard(room, player.id, room.createdBy === player.id);
    
    // Send new message
    const sentMessage = await ctx.api.sendMessage(player.chatId, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    // Store the new message ID
    if (sentMessage && sentMessage.message_id) {
      await storePlayerMessage(room.id, player.id, sentMessage.message_id, player.chatId);
      console.log(`💾 Stored new message ID ${sentMessage.message_id} for player ${player.name}`);
    }
    
    console.log(`✅ New message sent successfully to player ${player.name}`);
    
  } catch (error) {
    console.error(`❌ Failed to send new message to player ${player.name}:`, error);
    throw error;
  }
}

// Self-register with compact router
register(POKER_ACTIONS.JOIN_ROOM, handleJoin, 'Join Poker Room');

export default handleJoin; 