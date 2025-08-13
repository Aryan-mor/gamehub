import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { ImageGenerationOptions } from '../types';
import { logFunctionStart, logFunctionEnd, logError } from '../logger';

const CARD_WIDTH = 80;
const CARD_HEIGHT = 112;
const CARD_SPACING = 15;
const TOTAL_WIDTH = 400;
const TOTAL_HEIGHT = 400;

export async function generateImageBuffer(options: ImageGenerationOptions): Promise<Buffer> {
  logFunctionStart('generateImageBuffer', options as unknown as Record<string, unknown>);
  
  try {
    const { cards, style = 'general', area = 'general', format = 'png', transparent = false } = options;
    
    // Validate cards array
    if (!cards || cards.length === 0) {
      throw new Error('No cards provided for image generation');
    }

    // Use fixed 400x400 size
    const totalWidth = TOTAL_WIDTH;
    const totalHeight = TOTAL_HEIGHT;

    // Create background
    let background: sharp.Sharp;
    
    if (transparent) {
      // Create transparent background
      background = sharp({
        create: {
          width: totalWidth,
          height: totalHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        }
      });
    } else {
      // Use area background or fallback
      const backgroundPath = path.join(__dirname, '../../assets/card_area', `${area}.png`);
      
      if (fs.existsSync(backgroundPath)) {
        const backgroundBuffer = fs.readFileSync(backgroundPath);
        background = sharp(backgroundBuffer).resize(totalWidth, totalHeight, { fit: 'cover' });
      } else {
        // Fallback to a simple colored background
        background = sharp({
          create: {
            width: totalWidth,
            height: totalHeight,
            channels: 4,
            background: { r: 34, g: 139, b: 34, alpha: 1 } // Green background
          }
        });
      }
    }

    // Load and compose cards
    const cardImages: sharp.Sharp[] = [];
    
    for (const card of cards) {
      const cardPath = path.join(__dirname, '../../assets/card', style, `${card}.png`);
      
      if (!fs.existsSync(cardPath)) {
        throw new Error(`Card image not found: ${cardPath}`);
      }
      
      // Read file as buffer first, then process with sharp
      const cardBuffer = fs.readFileSync(cardPath);
      const cardImage = sharp(cardBuffer).resize(CARD_WIDTH, CARD_HEIGHT, { fit: 'contain' });
      cardImages.push(cardImage);
    }

    // Compose cards in 3-2 layout (3 top, 2 bottom)
    const cardCompositions: sharp.OverlayOptions[] = [];
    
    // Calculate positions for 5 cards in 3-2 layout - centered vertically
    const totalCardsHeight = (2 * CARD_HEIGHT) + CARD_SPACING;
    const startY = (totalHeight - totalCardsHeight) / 2;
    
    const topRowY = startY;
    const bottomRowY = startY + CARD_HEIGHT + CARD_SPACING;
    
    // Center the cards in each row
    const topRowStartX = (totalWidth - (3 * CARD_WIDTH + 2 * CARD_SPACING)) / 2;
    const bottomRowStartX = (totalWidth - (2 * CARD_WIDTH + 1 * CARD_SPACING)) / 2;
    
    for (let i = 0; i < cardImages.length; i++) {
      let x: number;
      let y: number;
      
      if (i < 3) {
        // Top row (3 cards)
        x = topRowStartX + i * (CARD_WIDTH + CARD_SPACING);
        y = topRowY;
      } else {
        // Bottom row (2 cards)
        x = bottomRowStartX + (i - 3) * (CARD_WIDTH + CARD_SPACING);
        y = bottomRowY;
      }
      
      cardCompositions.push({
        input: await cardImages[i].toBuffer(),
        left: Math.round(x),
        top: Math.round(y),
      });
    }

    // Composite all elements and output in specified format
    let result: Buffer;
    
    if (format === 'webp') {
      result = await background.composite(cardCompositions).webp({ 
        quality: 90,
        lossless: transparent // Use lossless for transparent images
      }).toBuffer();
    } else {
      result = await background.composite(cardCompositions).png().toBuffer();
    }
    
    logFunctionEnd('generateImageBuffer', { 
      cardCount: cards.length, 
      imageSize: result.length,
      format,
      transparent,
      dimensions: { width: totalWidth, height: totalHeight }
    });
    
    return result;
    
  } catch (error) {
    logError('generateImageBuffer', error as Error, options as unknown as Record<string, unknown>);
    throw error;
  }
}

export function generateRequestHash(options: ImageGenerationOptions): string {
  const { cards, style = 'general', area = 'general', debugTag, format = 'png', transparent = false, asDocument = false } = options;
  const hashData = {
    cards: cards.sort(), // Sort to ensure consistent hash
    style,
    area,
    debugTag,
    format,
    transparent,
    asDocument
  };
  
  return Buffer.from(JSON.stringify(hashData)).toString('base64');
} 