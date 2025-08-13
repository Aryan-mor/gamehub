import { ImageGenerationOptions } from './types';
import { generateImageBuffer, generateRequestHash } from './image/composer';
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

export async function generateAndSendCard(
  cards: string[],
  style: string = 'general',
  area: string = 'general',
  debugTag?: string,
  format: 'png' | 'webp' = 'png',
  transparent: boolean = false,
  asDocument: boolean = false
): Promise<string> {
  logFunctionStart('generateAndSendCard', { cards, style, area, debugTag, format, transparent, asDocument });

  try {
    initializeServices();

    if (!telegramService || !imageCache) {
      throw new Error('Failed to initialize services');
    }

    const options: ImageGenerationOptions = {
      cards,
      style,
      area,
      debugTag,
      format,
      transparent,
      asDocument,
    };

    // Generate hash for caching
    const requestHash = generateRequestHash(options);

    // Check cache first
    const cached = imageCache.get(requestHash);
    if (cached) {
      logFunctionEnd('generateAndSendCard', { 
        result: 'cached',
        messageId: cached.messageId 
      });
      return cached.messageId;
    }

    // Generate image
    const imageBuffer = await generateImageBuffer(options);

    // Send to Telegram
    const caption = debugTag ? `🎴 ${debugTag}` : '🎴 Card Image';
    const result = await telegramService.sendImage(imageBuffer, caption, asDocument, format);

    // Cache the result
    imageCache.set(requestHash, result.messageId, result.fileId);

    logFunctionEnd('generateAndSendCard', { 
      result: 'generated',
      messageId: result.messageId,
      fileId: result.fileId,
      format,
      transparent,
      asDocument
    });

    return result.messageId;

  } catch (error) {
    logError('generateAndSendCard', error as Error, { cards, style, area, debugTag, format, transparent, asDocument });
    throw error;
  }
}

export async function regenerateCardImage(
  cards: string[],
  style: string = 'general',
  area: string = 'general',
  debugTag?: string,
  format: 'png' | 'webp' = 'png',
  transparent: boolean = false,
  asDocument: boolean = false
): Promise<string> {
  logFunctionStart('regenerateCardImage', { cards, style, area, debugTag, format, transparent, asDocument });

  try {
    initializeServices();

    if (!telegramService || !imageCache) {
      throw new Error('Failed to initialize services');
    }

    const options: ImageGenerationOptions = {
      cards,
      style,
      area,
      debugTag,
      format,
      transparent,
      asDocument,
    };

    // Generate hash for caching
    const requestHash = generateRequestHash(options);

    // Remove from cache if exists (force regeneration)
    imageCache.remove(requestHash);

    // Generate image
    const imageBuffer = await generateImageBuffer(options);

    // Send to Telegram
    const caption = debugTag ? `🎴 ${debugTag}` : '🎴 Card Image';
    const result = await telegramService.sendImage(imageBuffer, caption, asDocument, format);

    // Cache the new result
    imageCache.set(requestHash, result.messageId, result.fileId);

    logFunctionEnd('regenerateCardImage', { 
      result: 'regenerated',
      messageId: result.messageId,
      fileId: result.fileId,
      format,
      transparent,
      asDocument
    });

    return result.messageId;

  } catch (error) {
    logError('regenerateCardImage', error as Error, { cards, style, area, debugTag, format, transparent, asDocument });
    throw error;
  }
}

export async function generateImageBufferOnly(
  cards: string[],
  style: string = 'general',
  area: string = 'general',
  debugTag?: string,
  format: 'png' | 'webp' = 'png',
  transparent: boolean = false
): Promise<Buffer> {
  logFunctionStart('generateImageBufferOnly', { cards, style, area, debugTag, format, transparent });

  try {
    const options: ImageGenerationOptions = {
      cards,
      style,
      area,
      debugTag,
      format,
      transparent,
    };

    const buffer = await generateImageBuffer(options);
    
    logFunctionEnd('generateImageBufferOnly', { 
      imageSize: buffer.length,
      cardCount: cards.length,
      format,
      transparent
    });
    
    return buffer;

  } catch (error) {
    logError('generateImageBufferOnly', error as Error, { cards, style, area, debugTag, format, transparent });
    throw error;
  }
}

export function getCacheStats(): { totalEntries: number; expiredEntries: number } {
  if (!imageCache) {
    initializeServices();
  }
  
  return imageCache?.getStats() || { totalEntries: 0, expiredEntries: 0 };
}

export function clearCache(): void {
  if (!imageCache) {
    initializeServices();
  }
  
  imageCache?.clear();
} 