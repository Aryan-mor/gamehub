import { Context } from 'grammy';
import { InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove, ForceReply } from 'grammy/types';
import { GameHubContext, GameHubPlugin, ContextBuilder } from '@/plugins/context';
import { SmartReplyOptions, BroadcastResult } from '@/types';
import { logError } from '@/modules/core/logger';

// Memory store for user message history with enhanced information
export const usersMessageHistory: Record<string, { 
  chatId: string; 
  messageId: number;
  timestamp: number;
  messageType?: string;
  roomId?: string;
  userId: string;
}> = {};

export class SmartReplyPlugin implements GameHubPlugin {
  name = 'smart-reply';
  version = '1.0.0';

  buildContext: ContextBuilder = (ctx: Context): Partial<GameHubContext> => {
    return {
      replySmart: async (text: string, options: SmartReplyOptions = {}) => {
        const chatId = options.chatId || ctx.chat?.id || ctx.from?.id;
        if (!chatId) {
          throw new Error("chatId is required");
        }
        const chatIdString = String(chatId);

        const fromId = (ctx as any).from?.id;
        const userId = options?.userId ?? String(fromId);
        const forceNewMessage = options.forceNewMessage ?? false;

        // Enhanced logging for debugging
        (ctx as any)?.log?.debug?.('smart-reply.replySmart: called', {
          targetChatId: chatIdString,
          ctxChatId: ctx.chat?.id,
          ctxFromId: fromId,
          userId,
          forceNewMessage,
          hasOptions: !!options.chatId,
          textLength: text.length
        });

        // Check if we have a previous message for this user in the same chat
        const previousMessage = usersMessageHistory[userId];
        
        // Enhanced logging for usersMessageHistory
        (ctx as any)?.log?.debug?.('smart-reply.usersMessageHistory: checking', {
          userId,
          hasPreviousMessage: !!previousMessage,
          previousMessage,
          currentChatId: chatIdString,
          ctxChatId: String(ctx.chat?.id),
          allUsersMessageHistory: Object.keys(usersMessageHistory)
        });
        
        // Determine if current update references the same (latest) bot message
        const callbackMessage = (ctx as any)?.callbackQuery?.message as { message_id?: number; chat?: { id?: number | string } } | undefined;
        const callbackChatId = callbackMessage?.chat?.id !== undefined ? String(callbackMessage.chat.id) : undefined;
        const callbackMessageId = callbackMessage?.message_id;

        const isFromCallbackAndSameChat = Boolean(callbackMessageId && callbackChatId === chatIdString);
        const isEditingCurrentMessage = Boolean(
          isFromCallbackAndSameChat && previousMessage && previousMessage.messageId === callbackMessageId
        );

        // Only edit when user interacted with the same message via callback (so it's the last visible message)
        const canEdit = !forceNewMessage && isEditingCurrentMessage;

        // Enhanced logging for edit decision
        (ctx as any)?.log?.debug?.('smart-reply.replySmart: edit decision', {
          canEdit,
          hasPreviousMessage: !!previousMessage,
          previousMessageChatId: previousMessage?.chatId,
          currentChatId: chatIdString,
          ctxChatId: String(ctx.chat?.id),
          forceNewMessage,
          editConditions: {
            notForceNew: !forceNewMessage,
            hasPrevious: !!previousMessage,
            chatIdMatches: previousMessage?.chatId === chatIdString
          }
        });

        if (canEdit) {
          try {
            (ctx as any)?.log?.debug?.('smart-reply.replySmart: attempting to edit message', {
              chatId: chatIdString,
              messageId: previousMessage.messageId,
              userId
            });
            
            // Try to edit the previous message
            await ctx.api.editMessageText(chatIdString, previousMessage.messageId, text, {
              reply_markup: options.reply_markup as InlineKeyboardMarkup,
              parse_mode: options.parse_mode,
            });
            
            (ctx as any)?.log?.debug?.('smart-reply.replySmart: edit successful', {
              chatId: chatIdString,
              messageId: previousMessage.messageId,
              userId
            });
            
            // Update the stored message ID
            usersMessageHistory[userId] = { 
              chatId: chatIdString, 
              messageId: previousMessage.messageId,
              timestamp: Date.now(),
              userId,
              messageType: 'room_info'
            };
            return;
          } catch (err) {
            (ctx as any)?.log?.warn?.('smart-reply.replySmart: edit failed, will send new message', {
              chatId: chatIdString,
              messageId: previousMessage.messageId,
              userId,
              error: err instanceof Error ? err.message : 'Unknown error'
            });
            
            // Edit failed, continue to send new message
            logError('smart-reply.editMessage', err as Error, { chatId: chatIdString, messageId: previousMessage.messageId });
            
            // If edit failed and we have a previous message, try to delete it
            if (previousMessage) {
              try {
                await ctx.api.deleteMessage(chatIdString, previousMessage.messageId);
              } catch (deleteErr) {
                // Ignore delete errors, message might already be deleted
                logError('smart-reply.deleteMessage', deleteErr as Error, { chatId: chatIdString, messageId: previousMessage.messageId });
              }
            }
          }
        } else if ((forceNewMessage || (previousMessage && !isEditingCurrentMessage)) && previousMessage) {
          // If forcing new message and we have a previous message, try to delete it
          try {
            await ctx.api.deleteMessage(previousMessage.chatId, previousMessage.messageId);
          } catch (deleteErr) {
            // Ignore delete errors, message might already be deleted
            logError('smart-reply.deleteMessage', deleteErr as Error, { chatId: previousMessage.chatId, messageId: previousMessage.messageId });
          }
        }

        // Send new message
        (ctx as any)?.log?.debug?.('smart-reply.replySmart: sending new message', {
          chatId: chatIdString,
          userId,
          forceNewMessage
        });
        
        try {
          const sent = await ctx.api.sendMessage(chatIdString, text, {
            reply_markup: options.reply_markup as InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply,
            parse_mode: options.parse_mode,
          });

          (ctx as any)?.log?.debug?.('smart-reply.replySmart: new message sent successfully', {
            chatId: chatIdString,
            messageId: sent.message_id,
            userId
          });

          // Store the new message info in memory
          if (fromId) {
            usersMessageHistory[userId] = { 
              chatId: chatIdString, 
              messageId: sent.message_id,
              timestamp: Date.now(),
              userId,
              messageType: 'room_info'
            };
            (ctx as any)?.log?.debug?.('smart-reply.replySmart: stored message in history', {
              userId,
              chatId: chatIdString,
              messageId: sent.message_id,
              timestamp: Date.now(),
              messageType: 'room_info'
            });
          }
        } catch (sendErr) {
          const errMsg = sendErr instanceof Error ? sendErr.message : String(sendErr);
          (ctx as any)?.log?.error?.('smart-reply.replySmart: failed to send new message', {
            chatId: chatIdString,
            userId,
            error: errMsg
          });

          // Fallback: If Telegram rejects buttons (BUTTON_DATA_INVALID), provide recovery UI
          if (errMsg.includes('BUTTON_DATA_INVALID')) {
            try {
              const { ROUTES } = await import('@/modules/core/routes.generated');
              const { getActiveRoomId } = await import('@/modules/core/userRoomState');
              const safeT = (key: string, fallback: string): string => {
                const v = (ctx as any)?.t?.(key);
                return !v || v === key ? fallback : String(v);
              };

              const activeRoomId: string | undefined = getActiveRoomId(String((ctx as any)?.from?.id ?? '')) || undefined;

              // Try to extract target roomId from /start payload or callback params
              let targetRoomId: string | undefined;
              const messageText: string | undefined = (ctx as any)?.message?.text;
              if (messageText && messageText.startsWith('/start ')) {
                const payload = messageText.split(' ')[1] || '';
                const m = payload.match(/^gprj(.+)$/i);
                if (m) targetRoomId = m[1];
              }
              if (!targetRoomId && (ctx as any)?.callbackQuery?.data && (ctx as any)?.keyboard?.parseCallbackData) {
                try {
                  const parsed = (ctx as any).keyboard.parseCallbackData((ctx as any).callbackQuery.data) as Record<string, unknown>;
                  const r = String((parsed.r ?? parsed.roomId) || '');
                  if (r) targetRoomId = r;
                } catch {
                  // ignore parse failures
                }
              }

              if (activeRoomId && targetRoomId && activeRoomId !== targetRoomId) {
                const title = safeT('poker.join.conflictTitle', '⚠️ You already have an active room.');
                const subtitle = safeT('poker.join.conflictSubtitle', 'Please choose one of the options below:');
                const continueText = safeT('poker.join.continueActive', '▶️ Continue in current room');
                const leaveAndJoinText = safeT('poker.join.leaveAndJoinNew', '↪️ Leave current and join new room');
                const leaveOnlyText = safeT('poker.join.leaveActive', '🚪 Leave current room');

                const { encodeAction } = await import('@/modules/core/route-alias');
                const btnContinue = {
                  text: continueText,
                  callback_data: `${encodeAction(ROUTES.games.findStep)}?r=${activeRoomId}`
                };
                // eslint-disable-next-line routes/no-hardcoded-route-strings -- sub-action is not present in ROUTES map
                const btnLeaveAndJoin = {
                  text: leaveAndJoinText,
                  callback_data: `${encodeAction('games.join.switch')}?r=${targetRoomId}`
                };
                const btnLeaveOnly = {
                  text: leaveOnlyText,
                  callback_data: `${encodeAction(ROUTES.games.start)}?s=lv&r=${activeRoomId}`
                };

                const replyMarkup = (ctx as any).keyboard.createInlineKeyboard([btnContinue, btnLeaveAndJoin, btnLeaveOnly]);
                const text = `${title}\n\n${subtitle}`;
                const sent = await ctx.api.sendMessage(chatIdString, text, { reply_markup: replyMarkup });
                // Update latest message history so stale-guard does not block the next callback
                usersMessageHistory[userId] = {
                  chatId: chatIdString,
                  messageId: sent.message_id,
                  timestamp: Date.now(),
                  userId,
                  messageType: 'room_info'
                };
              } else {
                // Simple resume to /start when no room context is available
                const resumeText = safeT('bot.buttons.resume', '▶️ Resume');
                const promptText = safeT('errors.buttonDataInvalid.resumePrompt', 'There was a temporary issue with the buttons. Tap Resume to continue.');
                const { encodeAction } = await import('@/modules/core/route-alias');
                const button = { text: resumeText, callback_data: encodeAction(ROUTES.start) };
                const replyMarkup = { inline_keyboard: [[button]] };
                const sent = await ctx.api.sendMessage(chatIdString, promptText, { reply_markup: replyMarkup });
                // Update latest message history so stale-guard does not block the next callback
                usersMessageHistory[userId] = {
                  chatId: chatIdString,
                  messageId: sent.message_id,
                  timestamp: Date.now(),
                  userId,
                  messageType: 'room_info'
                };
              }
              return;
            } catch (fallbackErr) {
              (ctx as any)?.log?.error?.('smart-reply.replySmart: fallback resume failed', {
                chatId: chatIdString,
                userId,
                error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
              });
            }
          }

          throw sendErr;
        }
      },

      // Enhanced function to broadcast message to multiple users with individual tracking
            sendOrEditMessageToUsers: async (userIds: number[], text: string, messageOptions: SmartReplyOptions = {}, broadcastOptions: Omit<SmartReplyOptions, 'chatId' | 'userId'> = {}): Promise<BroadcastResult[]> => {
        (ctx as any)?.log?.debug?.('smart-reply.sendOrEditMessageToUsers: starting broadcast', {
          userIds,
          textLength: text.length,
          messageOptions,
          broadcastOptions
        });
        
        const results: BroadcastResult[] = [];
        
        for (const userId of userIds) {
          (ctx as any)?.log?.debug?.('smart-reply.sendOrEditMessageToUsers: processing user', {
            userId,
            currentIndex: results.length + 1,
            totalUsers: userIds.length
          });
          
          try {
            const userChatId = String(userId);
            const previousMessage = usersMessageHistory[userChatId];

            // Determine if it's safe to edit: only when the initiator interacted with the same message via callback
            const callbackMessage = (ctx as any)?.callbackQuery?.message as { message_id?: number; chat?: { id?: number | string } } | undefined;
            const callbackChatId = callbackMessage?.chat?.id !== undefined ? String(callbackMessage.chat.id) : undefined;
            const callbackMessageId = callbackMessage?.message_id;
            const isInitiator = String((ctx as any)?.from?.id ?? '') === String(userId);
            const isFromCallbackAndSameChat = Boolean(callbackMessageId && callbackChatId === userChatId);
            const isEditingCurrentMessage = Boolean(
              isInitiator && isFromCallbackAndSameChat && previousMessage && previousMessage.messageId === callbackMessageId
            );
            const forceNew = Boolean((broadcastOptions as any)?.forceNewMessage);

            if (!forceNew && isEditingCurrentMessage) {
              try {
                await ctx.api.editMessageText(
                  userId,
                  previousMessage!.messageId,
                  text,
                  {
                    reply_markup: messageOptions.reply_markup as InlineKeyboardMarkup,
                    parse_mode: messageOptions.parse_mode,
                  }
                );
                (ctx as any)?.log?.debug?.('smart-reply.sendOrEditMessageToUsers: edited message for user', {
                  userId,
                  messageId: previousMessage!.messageId
                });
                results.push({ userId, success: true });
                continue;
              } catch (editError) {
                (ctx as any)?.log?.warn?.('smart-reply.sendOrEditMessageToUsers: edit failed, will replace with new', {
                  userId,
                  messageId: previousMessage!.messageId,
                  error: editError instanceof Error ? editError.message : 'Unknown error'
                });
                // if edit fails, fall through to delete -> send new
              }
            }

            // Not safe to edit, or edit failed: delete previous (if any), then send new
            if (previousMessage) {
              try {
                await ctx.api.deleteMessage(previousMessage.chatId, previousMessage.messageId);
              } catch (deleteErr) {
                logError('smart-reply.sendOrEditMessageToUsers.deleteMessage', deleteErr as Error, { chatId: previousMessage.chatId, messageId: previousMessage.messageId });
              }
            }

            const newMessage = await ctx.api.sendMessage(
              userId,
              text,
              {
                reply_markup: messageOptions.reply_markup as InlineKeyboardMarkup,
                parse_mode: messageOptions.parse_mode,
              }
            );
            usersMessageHistory[userChatId] = {
              chatId: userChatId,
              messageId: newMessage.message_id,
              timestamp: Date.now(),
              userId: userChatId,
              messageType: 'room_info'
            };
            (ctx as any)?.log?.debug?.('smart-reply.sendOrEditMessageToUsers: sent new message to user', {
              userId,
              newMessageId: newMessage.message_id
            });
            results.push({ userId, success: true });
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            (ctx as any)?.log?.error?.('smart-reply.sendOrEditMessageToUsers: failed for user', {
              userId,
              error: errorMessage
            });
            
            logError('smart-reply.sendOrEditMessageToUsers', err as Error, { userId: String(userId), text });
            results.push({ userId, success: false, error: errorMessage });
          }
        }

        (ctx as any)?.log?.debug?.('smart-reply.sendOrEditMessageToUsers: broadcast completed', {
          totalUsers: userIds.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results
        });

        return results;
      },



      // Legacy function to broadcast message to multiple users (kept for backward compatibility)
      broadcastToUsers: async (userIds: string[], text: string, options: {
        reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
        parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      } = {}) => {
        (ctx as any)?.log?.debug?.('smart-reply.broadcastToUsers: starting legacy broadcast', {
          userIds,
          textLength: text.length,
          options
        });
        
        let successCount = 0;
        let failureCount = 0;
        
        for (const userId of userIds) {
          (ctx as any)?.log?.debug?.('smart-reply.broadcastToUsers: processing user', {
            userId,
            currentIndex: successCount + failureCount + 1,
            totalUsers: userIds.length
          });
          
          try {
            await (ctx as any).replySmart(text, { ...options, userId: userId });
            successCount++;
            (ctx as any)?.log?.debug?.('smart-reply.broadcastToUsers: success for user', { userId });
          } catch (err) {
            failureCount++;
            (ctx as any)?.log?.error?.('smart-reply.broadcastToUsers: failed for user', {
              userId,
              error: err instanceof Error ? err.message : 'Unknown error'
            });
            logError('smart-reply.broadcastToUsers', err as Error, { userId, text });
          }
        }
        
        (ctx as any)?.log?.debug?.('smart-reply.broadcastToUsers: legacy broadcast completed', {
          totalUsers: userIds.length,
          successful: successCount,
          failed: failureCount
        });
      }
    };
  };

  middleware = async (_ctx: GameHubContext, next: () => Promise<void>): Promise<void> => {
    // Smart reply functionality is already added via buildContext
    await next();
  };
}

// Export plugin instance for easy access
export const smartReplyPluginInstance = new SmartReplyPlugin();

// Legacy middleware function
export function smartReplyPlugin(): (ctx: GameHubContext, next: () => Promise<void>) => Promise<void> {
  return smartReplyPluginInstance.middleware;
} 