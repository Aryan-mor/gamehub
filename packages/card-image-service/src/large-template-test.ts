import { generateAndSendTemplateImage } from './generateTemplateImage';

async function testLargeTemplates() {
  try {
    console.log('🎴 Testing Large SVG Templates\n');

    // Test 1: Large poker table with 7 cards (much bigger)
    console.log('1. Generating large poker table with 7 cards (1200x800)...');
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
      'general',
      'Large Poker Table',
      'webp',
      false,
      true
    );
    
    console.log(`✅ Generated large poker table: messageId ${messageId1}`);
    console.log('📄 1200x800 resolution, cards 100x140\n');

    // Test 2: Large player hand with 2 cards
    console.log('2. Generating large player hand with 2 cards (800x500)...');
    const messageId2 = await generateAndSendTemplateImage(
      'player-hand',
      [
        'ace_of_hearts',
        'king_of_spades'
      ],
      'general',
      'Large Player Hand',
      'webp',
      false,
      true
    );
    
    console.log(`✅ Generated large player hand: messageId ${messageId2}`);
    console.log('📄 800x500 resolution, cards 130x182\n');

    // Test 3: Full game template (largest)
    console.log('3. Generating full game template (1400x900)...');
    const messageId3 = await generateAndSendTemplateImage(
      'full-game',
      [
        'ace_of_hearts',    // Flop 1
        'king_of_spades',   // Flop 2  
        'queen_of_diamonds', // Flop 3
        'jack_of_clubs',    // Turn
        '10_of_hearts',     // River
        '2_of_clubs',       // Player 1
        '3_of_hearts'       // Player 2
      ],
      'general',
      'Full Game Template',
      'webp',
      false,
      true
    );
    
    console.log(`✅ Generated full game template: messageId ${messageId3}`);
    console.log('📄 1400x900 resolution, cards 120x168\n');

    console.log('🎉 All large templates generated successfully!');
    console.log('🎯 Features:');
    console.log('   - Much larger images');
    console.log('   - Bigger, more visible cards');
    console.log('   - Better use of space');
    console.log('   - Professional appearance');

  } catch (error) {
    console.error('❌ Error in large template test:', error);
  }
}

// Run the test
testLargeTemplates();
