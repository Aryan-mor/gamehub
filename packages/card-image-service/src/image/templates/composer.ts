import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { logFunctionStart, logFunctionEnd, logError } from '../../logger';

interface CardPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
}

interface TemplateConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  cardPositions: CardPosition[];
}

interface TemplateImageOptions {
  templateId: string;
  cards: string[];
  style?: string;
  debugTag?: string;
  format?: 'png' | 'webp' | 'jpeg';
  transparent?: boolean;
}

export async function generateTemplateImageBuffer(options: TemplateImageOptions): Promise<Buffer> {
  logFunctionStart('generateTemplateImageBuffer', options as unknown as Record<string, unknown>);
  
  try {
    const { templateId, cards, style = 'general', format = 'jpeg', transparent = false } = options;
    
    // Load template config
    const configPath = path.join(__dirname, '../../../assets/template-configs', `${templateId}.json`);
    if (!fs.existsSync(configPath)) {
      throw new Error(`Template config not found: ${configPath}`);
    }
    
    const config: TemplateConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Load SVG template
    const svgPath = path.join(__dirname, '../../../assets/templates', `${templateId}.svg`);
    if (!fs.existsSync(svgPath)) {
      throw new Error(`SVG template not found: ${svgPath}`);
    }
    
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Create background from SVG
    let background: sharp.Sharp;
    
    if (transparent && format !== 'jpeg') {
      // Create transparent background with SVG size
      background = sharp({
        create: {
          width: config.width,
          height: config.height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      });
    } else {
      // Use SVG as background
      background = sharp(svgBuffer).resize(config.width, config.height);
    }
    
    // Load and compose cards
    const cardCompositions: sharp.OverlayOptions[] = [];
    
    for (let i = 0; i < Math.min(cards.length, config.cardPositions.length); i++) {
      const card = cards[i];
      const position = config.cardPositions[i];
      
      // Support placeholder tokens to keep indices aligned (e.g., preflop without board cards)
      if (typeof card === 'string' && card.toLowerCase() === 'blank') {
        // Skip overlay for this slot
        continue;
      }

      const cardPath = path.join(__dirname, '../../../assets/card', style, `${card}.png`);
      
      if (!fs.existsSync(cardPath)) {
        throw new Error(`Card image not found: ${cardPath}`);
      }
      
      // Read card image
      const cardBuffer = fs.readFileSync(cardPath);
      let cardImage = sharp(cardBuffer).resize(position.width, position.height, { fit: 'contain' });
      
      // Apply rotation if specified
      if (position.rotation && position.rotation !== 0) {
        cardImage = cardImage.rotate(position.rotation);
      }
      
      cardCompositions.push({
        input: await cardImage.toBuffer(),
        left: position.x,
        top: position.y,
      });
    }
    
    // Composite all elements and output in specified format
    let result: Buffer;
    
    if (format === 'webp') {
      result = await background.composite(cardCompositions).webp({ 
        quality: 90,
        lossless: transparent
      }).toBuffer();
    } else if (format === 'jpeg') {
      result = await background.composite(cardCompositions).jpeg({ 
        quality: 85,
        progressive: true
      }).toBuffer();
    } else {
      result = await background.composite(cardCompositions).png().toBuffer();
    }
    
    logFunctionEnd('generateTemplateImageBuffer', { 
      templateId,
      cardCount: cards.length,
      imageSize: result.length,
      format,
      transparent,
      dimensions: { width: config.width, height: config.height }
    });
    
    return result;
    
  } catch (error) {
    logError('generateTemplateImageBuffer', error as Error, options as unknown as Record<string, unknown>);
    throw error;
  }
}

export function generateTemplateRequestHash(options: TemplateImageOptions): string {
  const { templateId, cards, style = 'general', debugTag, format = 'jpeg', transparent = false } = options;
  const hashData = {
    templateId,
    cards: cards.sort(),
    style,
    debugTag,
    format,
    transparent
  };
  
  return Buffer.from(JSON.stringify(hashData)).toString('base64');
}
