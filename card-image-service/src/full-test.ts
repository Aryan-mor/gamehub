import { generateAndSendCard } from './generateAndSendCard';
import { logger } from './logger';

async function fullTest(): Promise<void> {
  logger.info('🚀 Starting full card image service test...');
  
  try {
    // Test with sample cards
    const testCards = ['2_of_clubs', '3_of_hearts', 'ace_of_spades'];
    
    logger.info('📤 Sending card image to Telegram...', { cards: testCards });
    
    const messageId = await generateAndSendCard(
      testCards,
      'general',
      'general',
      'Full Test - Card Image Service'
    );
    
    logger.info('✅ Card image sent successfully!', { messageId });
    
    // Test cache stats
    const { getCacheStats } = await import('./generateAndSendCard');
    const stats = getCacheStats();
    logger.info('📊 Cache statistics:', stats);
    
  } catch (error) {
    logger.error('❌ Full test failed', error as Error);
  }
}

// Run full test
fullTest().catch((error) => {
  logger.error('❌ Test failed', error);
  process.exit(1);
}); 