import { generateAndSendCard } from './generateAndSendCard';
import { logger } from './logger';

async function send2PikCard(): Promise<void> {
  logger.info('🃏 Sending 2 of Spades card to channel...');
  
  try {
    // Generate and send 2 of spades card
    const messageId = await generateAndSendCard(
      ['2_of_spades'],  // 2 of spades
      'general',         // style
      'general',         // area
      '2 of Spades - Test Card'  // debug tag
    );
    
    logger.info('✅ 2 of Spades card sent successfully!', { messageId });
    
    // Also save the image locally for verification
    const { generateImageBufferOnly } = await import('./generateAndSendCard');
    const imageBuffer = await generateImageBufferOnly(
      ['2_of_spades'],
      'general',
      'general',
      '2 of Spades - Local Save'
    );
    
    const fs = await import('fs');
    fs.writeFileSync('2-of-spades-sent.png', imageBuffer);
    
    logger.info('💾 Image also saved locally as: 2-of-spades-sent.png');
    logger.info('📊 Image details:', { 
      messageId, 
      bufferSize: imageBuffer.length,
      cardName: '2_of_spades'
    });
    
  } catch (error) {
    logger.error('❌ Failed to send 2 of spades card', error as Error);
  }
}

// Run the test
send2PikCard().catch((error) => {
  logger.error('❌ Test failed', error);
  process.exit(1);
}); 