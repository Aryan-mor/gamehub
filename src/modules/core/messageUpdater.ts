import { Bot } from 'grammy';

interface MessageUpdateRequest {
  chatId: number;
  messageId?: number;
  text: string;
  options?: {
    parse_mode?: 'HTML' | 'Markdown';
    reply_markup?: { 
      inline_keyboard: Array<Array<{ 
        text: string; 
        callback_data?: string;
        switch_inline_query?: string;
      }>> 
    };
  };
}

interface MessageUpdateResult {
  success: boolean;
  newMessageId?: number;
  error?: string;
}

/**
 * Central message updater that handles both editing and sending new messages
 * If edit fails, sends new message and deletes old one
 */
export class MessageUpdater {
  private bot: Bot;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  /**
   * Update message - try to edit first, fallback to new message + delete old
   */
  async updateMessage(request: MessageUpdateRequest): Promise<MessageUpdateResult> {
    const { chatId, messageId, text, options } = request;

    // If no messageId, just send new message
    if (!messageId) {
      try {
        const result = await this.bot.api.sendMessage(chatId, text, options);
        return {
          success: true,
          newMessageId: result.message_id
        };
      } catch (error) {
        console.error('Failed to send new message:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Try to edit existing message first
    try {
      await this.bot.api.editMessageText(chatId, messageId, text, options);
      console.log(`✅ Successfully edited message ${messageId}`);
      return {
        success: true,
        newMessageId: messageId
      };
    } catch (editError) {
      // Check if it's a "message is not modified" error
      const errorMessage = editError instanceof Error ? editError.message : '';
      if (errorMessage.includes('message is not modified')) {
        console.log(`ℹ️ Message ${messageId} is already up to date, no changes needed`);
        return {
          success: true,
          newMessageId: messageId
        };
      }
      
      console.log(`❌ Failed to edit message ${messageId}, sending new message:`, editError);
      
      // Send new message
      try {
        console.log(`📤 Sending new message to chat ${chatId}...`);
        const newMessage = await this.bot.api.sendMessage(chatId, text, options);
        console.log(`✅ Successfully sent new message ${newMessage.message_id}`);
        
        // Try to delete old message
        try {
          console.log(`🗑️ Attempting to delete old message ${messageId}...`);
          await this.bot.api.deleteMessage(chatId, messageId);
          console.log(`✅ Deleted old message ${messageId}`);
        } catch (deleteError) {
          console.log(`⚠️ Failed to delete old message ${messageId}:`, deleteError);
          // Continue anyway - new message was sent successfully
        }
        
        return {
          success: true,
          newMessageId: newMessage.message_id
        };
      } catch (sendError) {
        console.error('❌ Failed to send new message:', sendError);
        return {
          success: false,
          error: sendError instanceof Error ? sendError.message : 'Unknown error'
        };
      }
    }
  }

  /**
   * Update message with keyboard
   */
  async updateMessageWithKeyboard(
    chatId: number,
    messageId: number | undefined,
    text: string,
    keyboard: { 
      inline_keyboard: Array<Array<{ 
        text: string; 
        callback_data?: string;
        switch_inline_query?: string;
      }>> 
    }
  ): Promise<MessageUpdateResult> {
    return this.updateMessage({
      chatId,
      messageId,
      text,
      options: {
        parse_mode: 'HTML',
        reply_markup: keyboard
      }
    });
  }
}

// Global instance
let globalMessageUpdater: MessageUpdater | null = null;

export function getMessageUpdater(bot?: Bot): MessageUpdater {
  if (!globalMessageUpdater && bot) {
    globalMessageUpdater = new MessageUpdater(bot);
  }
  if (!globalMessageUpdater) {
    throw new Error('MessageUpdater not initialized. Call setMessageUpdater first.');
  }
  return globalMessageUpdater;
}

export function setMessageUpdater(bot: Bot<any>): void {
  globalMessageUpdater = new MessageUpdater(bot);
} 