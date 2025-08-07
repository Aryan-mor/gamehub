import { generateImageBufferOnly } from './generateAndSendCard';
import { logger } from './logger';
import fs from 'fs';

async function create2PikImage(): Promise<void> {
  logger.info('🃏 Creating 2 of Spades card image...');
  
  try {
    // Generate 2 of spades image
    const imageBuffer = await generateImageBufferOnly(
      ['2_of_spades'],
      'general',
      'general',
      '2 of Spades - Local Test'
    );
    
    // Save the image
    fs.writeFileSync('2-of-spades.png', imageBuffer);
    
    logger.info('✅ 2 of Spades image created successfully!', { 
      bufferSize: imageBuffer.length,
      cardName: '2_of_spades'
    });
    
    logger.info('💾 Image saved as: 2-of-spades.png');
    
    // Also create a test with multiple cards
    logger.info('🃏 Creating multiple cards test...');
    
    const multiCardBuffer = await generateImageBufferOnly(
      ['2_of_spades', '3_of_hearts', 'ace_of_clubs'],
      'general',
      'general',
      'Multiple Cards Test'
    );
    
    fs.writeFileSync('multiple-cards.png', multiCardBuffer);
    
    logger.info('✅ Multiple cards image created successfully!', { 
      bufferSize: multiCardBuffer.length,
      cards: ['2_of_spades', '3_of_hearts', 'ace_of_clubs']
    });
    
    logger.info('💾 Multiple cards image saved as: multiple-cards.png');
    
  } catch (error) {
    logger.error('❌ Failed to create 2 of spades image', error as Error);
  }
}

// Run the test
create2PikImage().catch((error) => {
  logger.error('❌ Test failed', error);
  process.exit(1);
}); 