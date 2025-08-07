import { generateImageBufferOnly } from './generateAndSendCard';
import { logger } from './logger';

async function testImageGeneration(): Promise<void> {
  logger.info('Starting image generation test...');

  try {
    // Test with sample cards that actually exist in assets
    const testCards = ['2_of_clubs', '3_of_hearts', 'ace_of_spades'];
    
    logger.info('Testing image generation with sample cards', { cards: testCards });
    
    const imageBuffer = await generateImageBufferOnly(
      testCards,
      'general',
      'general',
      'Test Image'
    );
    
    logger.info('Image generation successful', { 
      bufferSize: imageBuffer.length,
      cardCount: testCards.length
    });
    
    // You could save this buffer to a file for inspection
    // const fs = require('fs');
    // fs.writeFileSync('test-output.png', imageBuffer);
    
  } catch (error) {
    logger.error('Image generation test failed', error as Error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testImageGeneration().catch((error) => {
    logger.error('Test failed', error);
    process.exit(1);
  });
} 