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
  debugTag?: string
): Promise<string> {
  logFunctionStart('generateAndSendCard', { cards, style, area, debugTag });

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
    const result = await telegramService.sendImage(imageBuffer, caption);

    // Cache the result
    imageCache.set(requestHash, result.messageId, result.fileId);

    logFunctionEnd('generateAndSendCard', { 
      result: 'generated',
      messageId: result.messageId,
      fileId: result.fileId
    });

    return result.messageId;

  } catch (error) {
    logError('generateAndSendCard', error as Error, { cards, style, area, debugTag });
    throw error;
  }
}

export async function generateImageBufferOnly(
  cards: string[],
  style: string = 'general',
  area: string = 'general',
  debugTag?: string
): Promise<Buffer> {
  logFunctionStart('generateImageBufferOnly', { cards, style, area, debugTag });

  try {
    const options: ImageGenerationOptions = {
      cards,
      style,
      area,
      debugTag,
    };

    const buffer = await generateImageBuffer(options);
    
    logFunctionEnd('generateImageBufferOnly', { 
      imageSize: buffer.length,
      cardCount: cards.length
    });
    
    return buffer;

  } catch (error) {
    logError('generateImageBufferOnly', error as Error, { cards, style, area, debugTag });
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