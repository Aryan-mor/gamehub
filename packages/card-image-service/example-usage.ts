// Example usage of the Card Image Service from the main project
// This file demonstrates how to integrate the card image service

import { generateAndSendCard, generateImageBufferOnly } from './src';

async function exampleUsage(): Promise<void> {
  console.log('🎴 Card Image Service Example Usage');
  
  try {
    // Example 1: Generate and send card image
    const messageId = await generateAndSendCard(
      ['ace_of_hearts', 'king_of_spades', 'queen_of_diamonds'],
      'general',  // style
      'club',     // area
      'Player Hand' // debug tag
    );
    
    console.log('✅ Card image sent successfully:', messageId);
    
    // Example 2: Generate image buffer only (for testing)
    const imageBuffer = await generateImageBufferOnly(
      ['2_of_clubs', '3_of_hearts', '4_of_diamonds'],
      'general',
      'general'
    );
    
    console.log('✅ Image buffer generated:', imageBuffer.length, 'bytes');
    
    // Example 3: Get cache statistics
    const { getCacheStats } = await import('./src');
    const stats = getCacheStats();
    console.log('📊 Cache stats:', stats);
    
  } catch (error) {
    console.error('❌ Error in example usage:', error);
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

export { exampleUsage }; 