import { generateAndSendTemplateImage } from './generateTemplateImage';

async function testBetterTemplate() {
  try {
    console.log('🎴 Testing Better Template with JPEG\n');

    // Test poker table with 7 cards (5 on table + 2 in hand)
    console.log('1. Generating better poker table with 7 cards...');
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
      'Better Poker Table - JPEG',  // debug tag
      'jpeg',             // format (JPEG)
      false,              // transparent (false for JPEG)
      false               // asDocument (false = photo mode = compressed)
    );
    
    console.log(`✅ Generated better template: messageId ${messageId}`);
    console.log('📄 1200x800, cards 120x168, JPEG compressed');
    console.log('🎯 Features:');
    console.log('   - Bigger cards (120x168 vs 60x84)');
    console.log('   - JPEG format (faster, smaller)');
    console.log('   - Photo mode (compressed)');
    console.log('   - Better poker table design');

  } catch (error) {
    console.error('❌ Error in better template test:', error);
  }
}

// Run the test
testBetterTemplate();
