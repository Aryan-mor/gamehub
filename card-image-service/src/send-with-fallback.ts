import { generateAndSendCard, generateImageBufferOnly } from './generateAndSendCard';
import { logger } from './logger';
import fs from 'fs';

async function sendCardWithFallback(
  cards: string[],
  style: string = 'general',
  area: string = 'general',
  debugTag?: string
): Promise<string> {
  logger.info('🃏 Attempting to send card image...', { cards, style, area, debugTag });
  
  try {
    // First try to send to channel
    const messageId = await generateAndSendCard(cards, style, area, debugTag);
    logger.info('✅ Card sent to channel successfully!', { messageId });
    return messageId;
    
  } catch (error) {
    logger.warn('⚠️ Failed to send to channel, saving locally...', { error: (error as Error).message });
    
    try {
      // Generate image buffer
      const imageBuffer = await generateImageBufferOnly(cards, style, area, debugTag);
      
      // Create filename with timestamp
      const timestamp = Date.now();
      const cardNames = cards.join('_');
      const filename = `card-${cardNames}-${timestamp}.png`;
      
      // Save locally
      fs.writeFileSync(filename, imageBuffer);
      
      // Return fake message ID
      const fakeMessageId = `local_${timestamp}`;
      
      logger.info('✅ Card image saved locally!', { 
        messageId: fakeMessageId,
        filename,
        bufferSize: imageBuffer.length,
        cards,
        dimensions: `${imageBuffer.length > 30000 ? '250x180' : '140x180'}`
      });
      
      return fakeMessageId;
      
    } catch (fallbackError) {
      logger.error('❌ Failed to save locally as well', fallbackError as Error);
      throw fallbackError;
    }
  }
}

// Test function
async function testSend2PikWithFallback(): Promise<void> {
  logger.info('🃏 Testing 2 of Spades with fallback...');
  
  try {
    const messageId = await sendCardWithFallback(
      ['2_of_spades'],
      'general',
      'general',
      '2 of Spades - Fallback Test'
    );
    
    logger.info('✅ Test completed!', { messageId });
    
    // Also test with multiple cards
    const messageId2 = await sendCardWithFallback(
      ['2_of_spades', '3_of_hearts', 'ace_of_clubs'],
      'general',
      'general',
      'Multiple Cards - Fallback Test'
    );
    
    logger.info('✅ Multiple cards test completed!', { messageId: messageId2 });
    
  } catch (error) {
    logger.error('❌ Test failed', error as Error);
  }
}

// Export the function
export { sendCardWithFallback, testSend2PikWithFallback };

// Run test if this file is executed directly
if (require.main === module) {
  testSend2PikWithFallback().catch(console.error);
} 