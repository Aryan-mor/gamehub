import { generateImageBufferOnly } from './generateAndSendCard';
import { logger } from './logger';
import fs from 'fs';

async function simulateSend2Pik(): Promise<void> {
  logger.info('🃏 Simulating sending 2 of Spades card...');
  
  try {
    // Generate 2 of spades image
    const imageBuffer = await generateImageBufferOnly(
      ['2_of_spades'],
      'general',
      'general',
      '2 of Spades - Simulated Send'
    );
    
    // Save the image locally
    const filename = `2-of-spades-${Date.now()}.png`;
    fs.writeFileSync(filename, imageBuffer);
    
    // Simulate message ID (since we can't send to channel)
    const fakeMessageId = `msg_${Date.now()}`;
    
    logger.info('✅ 2 of Spades card image generated successfully!', { 
      messageId: fakeMessageId,
      filename,
      bufferSize: imageBuffer.length,
      cardName: '2_of_spades',
      dimensions: '140x180'
    });
    
    logger.info('💾 Image saved locally as:', { filename });
    logger.info('📊 Image details:', { 
      size: imageBuffer.length,
      format: 'PNG',
      card: '2_of_spades',
      style: 'general',
      area: 'general'
    });
    
    // Also create a test with 2 cards
    logger.info('🃏 Creating 2 cards test...');
    
    const twoCardsBuffer = await generateImageBufferOnly(
      ['2_of_spades', '3_of_hearts'],
      'general',
      'general',
      '2 Cards - 2♠ + 3♥'
    );
    
    const twoCardsFilename = `2-cards-${Date.now()}.png`;
    fs.writeFileSync(twoCardsFilename, twoCardsBuffer);
    
    const fakeMessageId2 = `msg_${Date.now()}_2`;
    
    logger.info('✅ 2 cards image generated successfully!', { 
      messageId: fakeMessageId2,
      filename: twoCardsFilename,
      bufferSize: twoCardsBuffer.length,
      cards: ['2_of_spades', '3_of_hearts']
    });
    
    logger.info('🎉 Simulation completed successfully!');
    logger.info('📁 Generated files:', { 
      singleCard: filename,
      twoCards: twoCardsFilename
    });
    
  } catch (error) {
    logger.error('❌ Failed to simulate sending 2 of spades card', error as Error);
  }
}

// Run the test
simulateSend2Pik().catch((error) => {
  logger.error('❌ Test failed', error);
  process.exit(1);
}); 