import { generateAndSendTemplateImage } from './generateTemplateImage';

async function testSimpleJPEG() {
  try {
    console.log('🎴 Testing Simple JPEG Templates (Fast & Compressed)\n');

    // Test 1: Simple table with JPEG (fast & compressed)
    console.log('1. Generating simple table with JPEG (fast & compressed)...');
    const tableMessageId = await generateAndSendTemplateImage(
      'simple-table',
      ['ace_of_hearts', 'king_of_spades', 'queen_of_diamonds', 'jack_of_clubs', '10_of_hearts'],
      'general',
      'Simple Table - JPEG',
      'jpeg',
      false,  // not transparent (JPEG doesn't support transparency)
      false   // as photo (compressed)
    );
    
    console.log(`✅ Simple Table: messageId ${tableMessageId}`);
    console.log('📄 800x600, JPEG, compressed, fast\n');

    // Test 2: Simple hand with JPEG (fast & compressed)
    console.log('2. Generating simple hand with JPEG (fast & compressed)...');
    const handMessageId = await generateAndSendTemplateImage(
      'simple-hand',
      ['2_of_clubs', '3_of_hearts'],
      'general',
      'Simple Hand - JPEG',
      'jpeg',
      false,  // not transparent
      false   // as photo (compressed)
    );
    
    console.log(`✅ Simple Hand: messageId ${handMessageId}`);
    console.log('📄 600x400, JPEG, compressed, fast\n');

    console.log('🎉 Simple JPEG templates generated successfully!');
    console.log('🎯 Features:');
    console.log('   - JPEG format (fast generation)');
    console.log('   - Compressed (small file size)');
    console.log('   - Simple backgrounds');
    console.log('   - Fast upload');
    console.log('   - Perfect for real-time games');

  } catch (error) {
    console.error('❌ Error in simple JPEG test:', error);
  }
}

// Run the test
testSimpleJPEG();
