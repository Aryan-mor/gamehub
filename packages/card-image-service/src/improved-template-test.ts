import { generateAndSendTemplateImage } from './generateTemplateImage';

async function testImprovedTemplates() {
  try {
    console.log('🎴 Testing Improved SVG Templates\n');

    // Test 1: Improved poker table with 7 cards (bigger cards)
    console.log('1. Generating improved poker table with 7 cards (bigger cards)...');
    const messageId1 = await generateAndSendTemplateImage(
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
      'Improved Poker Table',  // debug tag
      'webp',             // format
      false,              // transparent
      true                // asDocument (no compression)
    );
    
    console.log(`✅ Generated improved poker table: messageId ${messageId1}`);
    console.log('📄 1000x700 resolution, bigger cards (80x112)\n');

    // Test 2: Player hand with 2 cards (bigger cards)
    console.log('2. Generating player hand with 2 cards (bigger cards)...');
    const messageId2 = await generateAndSendTemplateImage(
      'player-hand',  // template ID
      [
        'ace_of_hearts',    // Player 1
        'king_of_spades'    // Player 2
      ],
      'general',           // style
      'Player Hand',       // debug tag
      'webp',             // format
      false,              // transparent
      true                // asDocument (no compression)
    );
    
    console.log(`✅ Generated player hand: messageId ${messageId2}`);
    console.log('📄 600x400 resolution, bigger cards (100x140)\n');

    console.log('🎉 Both improved templates generated successfully!');
    console.log('🎯 Features:');
    console.log('   - Bigger, more visible cards');
    console.log('   - Better visual design');
    console.log('   - Higher resolution');
    console.log('   - Professional look');

  } catch (error) {
    console.error('❌ Error in improved template test:', error);
  }
}

// Run the test
testImprovedTemplates();
