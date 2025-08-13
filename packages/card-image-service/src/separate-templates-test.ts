import { generateAndSendTemplateImage } from './generateTemplateImage';

async function testSeparateTemplates() {
  try {
    console.log('🎴 Testing Separate Templates (Table + Hand)\n');

    // Test 1: Table only with 5 cards (280x392)
    console.log('1. Generating table only with 5 cards (280x392)...');
    const tableMessageId = await generateAndSendTemplateImage(
      'table-only',
      [
        'ace_of_hearts', 'king_of_spades', 'queen_of_diamonds',
        'jack_of_clubs', '10_of_hearts'
      ],
      'general',
      'Table Only - Community Cards',
      'webp',
      true,  // transparent background
      true   // asDocument
    );
    
    console.log(`✅ Generated table only: messageId ${tableMessageId}`);
    console.log('📄 1200x800, cards 280x392, transparent background\n');

    // Test 2: Hand only with 2 cards (280x392)
    console.log('2. Generating hand only with 2 cards (280x392)...');
    const handMessageId = await generateAndSendTemplateImage(
      'hand-only',
      ['2_of_clubs', '3_of_hearts'],
      'general',
      'Hand Only - Player Cards',
      'webp',
      true,  // transparent background
      true   // asDocument
    );
    
    console.log(`✅ Generated hand only: messageId ${handMessageId}`);
    console.log('📄 800x600, cards 280x392, transparent background\n');

    console.log('🎉 Both separate templates generated successfully!');
    console.log('🎯 Features:');
    console.log('   - Table only: 5 community cards (280x392)');
    console.log('   - Hand only: 2 player cards (280x392)');
    console.log('   - Separate images for better clarity');
    console.log('   - Transparent background');
    console.log('   - Maximum visibility');
    console.log('   - Perfect for sequential display');

    console.log('\n📋 Usage in GameHub:');
    console.log('1. Send table image first');
    console.log('2. Send hand image second');
    console.log('3. Both images are large and clear');

  } catch (error) {
    console.error('❌ Error in separate templates test:', error);
  }
}

// Run the test
testSeparateTemplates();
