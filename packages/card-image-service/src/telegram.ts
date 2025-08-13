import { Bot } from 'grammy';
import { CardImageConfig } from './types';
import { logFunctionStart, logFunctionEnd, logError } from './logger';

export class TelegramService {
  private bot: Bot;
  private config: CardImageConfig;

  constructor(config: CardImageConfig) {
    this.config = config;
    this.bot = new Bot(config.botToken);
  }

  public async sendImage(imageBuffer: Buffer, caption?: string, asDocument: boolean = false, format: 'png' | 'webp' | 'jpeg' = 'jpeg'): Promise<{ messageId: string; fileId?: string }> {
    logFunctionStart('sendImage', { 
      imageSize: imageBuffer.length,
      hasCaption: !!caption,
      asDocument,
      format,
      targetChannel: this.config.targetChannelId
    });

    try {
      const { InputFile } = await import('grammy');
      
      // Determine file extension based on format
      const fileExtension = format === 'webp' ? 'webp' : format === 'jpeg' ? 'jpg' : 'png';
      const fileName = `card_${Date.now()}.${fileExtension}`;
      
      if (asDocument) {
        // Send as document (no compression)
        const inputFile = new InputFile(imageBuffer, fileName);
        
        const result = await this.bot.api.sendDocument(this.config.targetChannelId, inputFile, {
          caption,
          parse_mode: 'HTML',
        });

        const response = {
          messageId: result.message_id.toString(),
          fileId: result.document?.file_id,
        };

        logFunctionEnd('sendImage', { ...response, method: 'document', format });
        return response;
      } else {
        // Send as photo (with compression)
        const inputFile = new InputFile(imageBuffer, fileName);
        
        const result = await this.bot.api.sendPhoto(this.config.targetChannelId, inputFile, {
          caption,
          parse_mode: 'HTML',
        });

        const response = {
          messageId: result.message_id.toString(),
          fileId: result.photo?.[0]?.file_id,
        };

        logFunctionEnd('sendImage', { ...response, method: 'photo', format });
        return response;
      }

    } catch (error) {
      logError('sendImage', error as Error, { 
        imageSize: imageBuffer.length,
        asDocument,
        format,
        targetChannel: this.config.targetChannelId
      });
      throw error;
    }
  }

  public async sendDocument(imageBuffer: Buffer, caption?: string, fileName?: string, format: 'png' | 'webp' | 'jpeg' = 'jpeg'): Promise<{ messageId: string; fileId?: string }> {
    logFunctionStart('sendDocument', { 
      imageSize: imageBuffer.length,
      hasCaption: !!caption,
      fileName,
      format,
      targetChannel: this.config.targetChannelId
    });

    try {
      const { InputFile } = await import('grammy');
      const fileExtension = format === 'webp' ? 'webp' : format === 'jpeg' ? 'jpg' : 'png';
      const finalFileName = fileName || `card_${Date.now()}.${fileExtension}`;
      const inputFile = new InputFile(imageBuffer, finalFileName);
      
      const result = await this.bot.api.sendDocument(this.config.targetChannelId, inputFile, {
        caption,
        parse_mode: 'HTML',
      });

      const response = {
        messageId: result.message_id.toString(),
        fileId: result.document?.file_id,
      };

      logFunctionEnd('sendDocument', { ...response, format });
      return response;

    } catch (error) {
      logError('sendDocument', error as Error, { 
        imageSize: imageBuffer.length,
        fileName,
        format,
        targetChannel: this.config.targetChannelId
      });
      throw error;
    }
  }

  public async getMessage(messageId: string): Promise<{ messageId: string; fileId?: string } | null> {
    logFunctionStart('getMessage', { messageId });

    try {
      await this.bot.api.getChat(this.config.targetChannelId);
      
      // Note: Telegram doesn't provide a direct way to get a specific message by ID
      // This is a limitation - we'll need to rely on the cache for this functionality
      logFunctionEnd('getMessage', { messageId, found: false });
      return null;

    } catch (error) {
      logError('getMessage', error as Error, { messageId });
      return null;
    }
  }

  public async deleteMessage(messageId: string): Promise<boolean> {
    logFunctionStart('deleteMessage', { messageId });

    try {
      await this.bot.api.deleteMessage(this.config.targetChannelId, parseInt(messageId, 10));
      logFunctionEnd('deleteMessage', { messageId, success: true });
      return true;

    } catch (error) {
      logError('deleteMessage', error as Error, { messageId });
      return false;
    }
  }

  public getBot(): Bot {
    return this.bot;
  }
}
