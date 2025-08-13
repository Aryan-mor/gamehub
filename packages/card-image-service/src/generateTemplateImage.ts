import { generateTemplateImageBuffer, generateTemplateRequestHash } from './image/templates/composer';
import { ImageCache } from './cache';
import { TelegramService } from './telegram';
import { loadConfig } from './config';
import { logFunctionStart, logFunctionEnd, logError } from './logger';

let telegramService: TelegramService | null = null;
let imageCache: ImageCache | null = null;

function initializeServices(): void {
  if (!telegramService || !imageCache) {
    const config = loadConfig();
    telegramService = new TelegramService(config);
    imageCache = new ImageCache();
  }
}

interface TemplateImageOptions {
  templateId: string;
  cards: string[];
  style?: string;
  debugTag?: string;
  format?: 'png' | 'webp' | 'jpeg';
  transparent?: boolean;
  asDocument?: boolean;
}

export async function generateAndSendTemplateImage(
  templateId: string,
  cards: string[],
  style: string = 'general',
  debugTag?: string,
  format: 'png' | 'webp' | 'jpeg' = 'jpeg',
  transparent: boolean = false,
  asDocument: boolean = false
): Promise<string> {
  logFunctionStart('generateAndSendTemplateImage', { templateId, cards, style, debugTag, format, transparent, asDocument });

  try {
    initializeServices();

    if (!telegramService || !imageCache) {
      throw new Error('Failed to initialize services');
    }

    const options: TemplateImageOptions = {
      templateId,
      cards,
      style,
      debugTag,
      format,
      transparent,
      asDocument,
    };

    // Generate hash for caching
    const requestHash = generateTemplateRequestHash(options);

    // Check cache first
    const cached = imageCache.get(requestHash);
    if (cached) {
      logFunctionEnd('generateAndSendTemplateImage', { 
        result: 'cached',
        messageId: cached.messageId 
      });
      return cached.messageId;
    }

    // Generate image
    const imageBuffer = await generateTemplateImageBuffer(options);

    // Send to Telegram
    const caption = debugTag ? `🎴 ${debugTag}` : '🎴 Template Card Image';
    const result = await telegramService.sendImage(imageBuffer, caption, asDocument, format);

    // Cache the result
    imageCache.set(requestHash, result.messageId, result.fileId);

    logFunctionEnd('generateAndSendTemplateImage', { 
      result: 'generated',
      messageId: result.messageId,
      fileId: result.fileId,
      format,
      transparent,
      asDocument
    });

    return result.messageId;

  } catch (error) {
    logError('generateAndSendTemplateImage', error as Error, { templateId, cards, style, debugTag, format, transparent, asDocument });
    throw error;
  }
}

export async function regenerateTemplateImage(
  templateId: string,
  cards: string[],
  style: string = 'general',
  debugTag?: string,
  format: 'png' | 'webp' | 'jpeg' = 'jpeg',
  transparent: boolean = false,
  asDocument: boolean = false
): Promise<string> {
  logFunctionStart('regenerateTemplateImage', { templateId, cards, style, debugTag, format, transparent, asDocument });

  try {
    initializeServices();

    if (!telegramService || !imageCache) {
      throw new Error('Failed to initialize services');
    }

    const options: TemplateImageOptions = {
      templateId,
      cards,
      style,
      debugTag,
      format,
      transparent,
      asDocument,
    };

    // Generate hash for caching
    const requestHash = generateTemplateRequestHash(options);

    // Remove from cache if exists (force regeneration)
    imageCache.remove(requestHash);

    // Generate image
    const imageBuffer = await generateTemplateImageBuffer(options);

    // Send to Telegram
    const caption = debugTag ? `🎴 ${debugTag}` : '🎴 Template Card Image';
    const result = await telegramService.sendImage(imageBuffer, caption, asDocument, format);

    // Cache the new result
    imageCache.set(requestHash, result.messageId, result.fileId);

    logFunctionEnd('regenerateTemplateImage', { 
      result: 'regenerated',
      messageId: result.messageId,
      fileId: result.fileId,
      format,
      transparent,
      asDocument
    });

    return result.messageId;

  } catch (error) {
    logError('regenerateTemplateImage', error as Error, { templateId, cards, style, debugTag, format, transparent, asDocument });
    throw error;
  }
}

export async function generateTemplateBufferOnly(
  templateId: string,
  cards: string[],
  style: string = 'general',
  debugTag?: string,
  format: 'png' | 'webp' | 'jpeg' = 'jpeg',
  transparent: boolean = false
): Promise<Buffer> {
  logFunctionStart('generateTemplateBufferOnly', { templateId, cards, style, debugTag, format, transparent });

  try {
    const options: TemplateImageOptions = {
      templateId,
      cards,
      style,
      debugTag,
      format,
      transparent,
    };

    const buffer = await generateTemplateImageBuffer(options);
    
    logFunctionEnd('generateTemplateBufferOnly', { 
      imageSize: buffer.length,
      cardCount: cards.length,
      format,
      transparent
    });
    
    return buffer;

  } catch (error) {
    logError('generateTemplateBufferOnly', error as Error, { templateId, cards, style, debugTag, format, transparent });
    throw error;
  }
}
