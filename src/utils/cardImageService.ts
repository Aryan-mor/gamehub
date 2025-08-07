// Card Image Service Integration
// This file provides a clean interface to the card image service from the main project

import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

// Import the card image service functions
// Note: This requires the card-image-service to be built and available
let cardImageService: any = null;

async function loadCardImageService(): Promise<any> {
  if (!cardImageService) {
    try {
      // Dynamic import to avoid build-time dependencies
      cardImageService = await import('../../card-image-service/src');
      logFunctionEnd('loadCardImageService', { success: true });
    } catch (error) {
      logError('loadCardImageService', error as Error);
      throw new Error('Card image service not available. Please ensure card-image-service is built.');
    }
  }
  return cardImageService;
}

/**
 * Generate and send a card image to the configured Telegram channel
 * @param cards Array of card filenames (without extension)
 * @param style Card style (default: 'general')
 * @param area Background area (default: 'general')
 * @param debugTag Optional debug tag for the image
 * @returns Promise<string> The message ID of the sent image
 */
export async function generateAndSendCardImage(
  cards: string[],
  style: string = 'general',
  area: string = 'general',
  debugTag?: string
): Promise<string> {
  logFunctionStart('generateAndSendCardImage', { cards, style, area, debugTag });

  try {
    const service = await loadCardImageService();
    const messageId = await service.generateAndSendCard(cards, style, area, debugTag);
    
    logFunctionEnd('generateAndSendCardImage', { messageId });
    return messageId;
  } catch (error) {
    logError('generateAndSendCardImage', error as Error, { cards, style, area, debugTag });
    throw error;
  }
}

/**
 * Generate a card image buffer without sending to Telegram (for testing)
 * @param cards Array of card filenames (without extension)
 * @param style Card style (default: 'general')
 * @param area Background area (default: 'general')
 * @param debugTag Optional debug tag for the image
 * @returns Promise<Buffer> The generated image buffer
 */
export async function generateCardImageBuffer(
  cards: string[],
  style: string = 'general',
  area: string = 'general',
  debugTag?: string
): Promise<Buffer> {
  logFunctionStart('generateCardImageBuffer', { cards, style, area, debugTag });

  try {
    const service = await loadCardImageService();
    const buffer = await service.generateImageBufferOnly(cards, style, area, debugTag);
    
    logFunctionEnd('generateCardImageBuffer', { bufferSize: buffer.length });
    return buffer;
  } catch (error) {
    logError('generateCardImageBuffer', error as Error, { cards, style, area, debugTag });
    throw error;
  }
}

/**
 * Get cache statistics from the card image service
 * @returns Promise<{ totalEntries: number; expiredEntries: number }>
 */
export async function getCardImageCacheStats(): Promise<{ totalEntries: number; expiredEntries: number }> {
  logFunctionStart('getCardImageCacheStats');

  try {
    const service = await loadCardImageService();
    const stats = service.getCacheStats();
    
    logFunctionEnd('getCardImageCacheStats', stats);
    return stats;
  } catch (error) {
    logError('getCardImageCacheStats', error as Error);
    return { totalEntries: 0, expiredEntries: 0 };
  }
}

/**
 * Clear the card image service cache
 */
export async function clearCardImageCache(): Promise<void> {
  logFunctionStart('clearCardImageCache');

  try {
    const service = await loadCardImageService();
    service.clearCache();
    
    logFunctionEnd('clearCardImageCache', { success: true });
  } catch (error) {
    logError('clearCardImageCache', error as Error);
    throw error;
  }
} 