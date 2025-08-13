import { generateAndSendTemplateImage } from './generateTemplateImage';

async function testHugeCards() {
  try {
    console.log('🎴 Testing Huge Cards with Transparent Background\n');

    // Test 1: Poker table with huge cards (150x210)
    console.log('1. Generating poker table with huge cards (150x210)...');
    const messageId1 = await generateAndSendTemplateImage(
      'poker-table',
      [
        'ace_of_hearts', 'king_of_spades', 'queen_of_diamonds',
        'jack_of_clubs', '10_of_hearts', '2_of_clubs', '3_of_hearts'
      ],
      'general',
      'Huge Cards Poker Table',
      'webp',
      true,  // transparent background
      true   // asDocument
    );
    
    console.log(`✅ Generated poker table with huge cards: messageId ${messageId1}`);
    console.log('📄 1200x800, cards 150x210, transparent background\n');

    // Test 2: Player hand with huge cards (200x280)
    console.log('2. Generating player hand with huge cards (200x280)...');
    const messageId2 = await generateAndSendTemplateImage(
      'player-hand',
      ['ace_of_hearts', 'king_of_spades'],
      'general',
      'Huge Cards Player Hand',
      'webp',
      true,  // transparent background
      true   // asDocument
    );
    
    console.log(`✅ Generated player hand with huge cards: messageId ${messageId2}`);
    console.log('📄 800x500, cards 200x280, transparent background\n');

    // Test 3: Full game with huge cards (180x252)
    console.log('3. Generating full game with huge cards (180x252)...');
    const messageId3 = await generateAndSendTemplateImage(
      'full-game',
      [
        'ace_of_hearts', 'king_of_spades', 'queen_of_diamonds',
        'jack_of_clubs', '10_of_hearts', '2_of_clubs', '3_of_hearts'
      ],
      'general',
      'Huge Cards Full Game',
      'webp',
      true,  // transparent background
      true   // asDocument
    );
    
    console.log(`✅ Generated full game with huge cards: messageId ${messageId3}`);
    console.log('📄 1400x900, cards 180x252, transparent background\n');

    console.log('🎉 All huge cards templates generated successfully!');
    console.log('🎯 Features:');
    console.log('   - Huge cards (150x210 to 200x280)');
    console.log('   - Transparent background');
    console.log('   - Maximum visibility');
    console.log('   - Perfect for overlays');

  } catch (error) {
    console.error('❌ Error in huge cards test:', error);
  }
}

// Run the test
testHugeCards();
