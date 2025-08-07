import { generateImageBufferOnly } from './generateAndSendCard';
import { logger } from './logger';
import fs from 'fs';

async function saveTest(): Promise<void> {
  logger.info('💾 Starting save test...');
  
  try {
    // Test with sample cards
    const testCards = ['2_of_clubs', '3_of_hearts', 'ace_of_spades'];
    
    logger.info('🔄 Generating image...', { cards: testCards });
    
    const imageBuffer = await generateImageBufferOnly(
      testCards,
      'general',
      'general',
      'Save Test - Card Image Service'
    );
    
    logger.info('✅ Image generated successfully!', { bufferSize: imageBuffer.length });
    
    // Save to file
    const filename = `test-card-image-${Date.now()}.png`;
    fs.writeFileSync(filename, imageBuffer);
    
    logger.info('💾 Image saved to file:', { filename });
    
    // Test with different cards
    const testCards2 = ['king_of_hearts', 'queen_of_diamonds', 'jack_of_clubs'];
    
    logger.info('🔄 Generating second image...', { cards: testCards2 });
    
    const imageBuffer2 = await generateImageBufferOnly(
      testCards2,
      'general',
      'general',
      'Save Test 2 - Card Image Service'
    );
    
    logger.info('✅ Second image generated successfully!', { bufferSize: imageBuffer2.length });
    
    // Save to file
    const filename2 = `test-card-image-2-${Date.now()}.png`;
    fs.writeFileSync(filename2, imageBuffer2);
    
    logger.info('💾 Second image saved to file:', { filename2 });
    
  } catch (error) {
    logger.error('❌ Save test failed', error as Error);
  }
}

// Run save test
saveTest().catch((error) => {
  logger.error('❌ Test failed', error);
  process.exit(1);
}); 