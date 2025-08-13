import { generateAndSendTemplateImage } from './generateTemplateImage';

async function testTemplate() {
  try {
    console.log('🎴 Testing SVG Template System\n');

    // Test poker table with 7 cards
    console.log('1. Generating poker table with 7 cards...');
    const messageId = await generateAndSendTemplateImage(
      'poker-table',  // template ID
      [
        'ace_of_hearts',    // Flop 1
        'king_of_spades',   // Flop 2  
        'queen_of_diamonds', // Flop 3
        'jack_of_clubs',    // Turn
        '10_of_hearts',     // River
        '2_of_clubs',       // Player 1
        '3_of_hearts'       // Player 2
      ],
      'general',           // style
      'Poker Game State',  // debug tag
      'webp',             // format
      false,              // transparent
      true                // asDocument (no compression)
    );
    
    console.log(`✅ Generated template image with messageId: ${messageId}`);
    console.log('📄 Sent as WebP document (no compression)');
    console.log('🎯 Template: Poker Table with 7 card positions');

  } catch (error) {
    console.error('❌ Error in template test:', error);
  }
}

// Run the test
testTemplate();
