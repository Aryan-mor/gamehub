// Test the card image service from the main project
import { generateAndSendCardImage, generateCardImageBuffer } from './src/utils/cardImageService';

async function testCardService(): Promise<void> {
  console.log('🎴 Testing Card Image Service from Main Project');
  
  try {
    // Test 1: Generate image buffer only
    console.log('🔄 Test 1: Generating image buffer...');
    
    const imageBuffer = await generateCardImageBuffer(
      ['2_of_clubs', '3_of_hearts', 'ace_of_spades'],
      'general',
      'general',
      'Main Project Test'
    );
    
    console.log('✅ Image buffer generated successfully!', { size: imageBuffer.length });
    
    // Test 2: Try to send to Telegram (this might fail due to channel config)
    console.log('🔄 Test 2: Attempting to send to Telegram...');
    
    try {
      const messageId = await generateAndSendCardImage(
        ['king_of_hearts', 'queen_of_diamonds', 'jack_of_clubs'],
        'general',
        'general',
        'Main Project Test - Full Service'
      );
      
      console.log('✅ Image sent to Telegram successfully!', { messageId });
    } catch (error) {
      console.log('⚠️ Telegram send failed (expected if channel not configured):', error);
    }
    
    // Test 3: Cache stats
    console.log('🔄 Test 3: Getting cache stats...');
    
    const { getCardImageCacheStats } = await import('./src/utils/cardImageService');
    const stats = await getCardImageCacheStats();
    
    console.log('📊 Cache statistics:', stats);
    
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testCardService().catch(console.error); 