import { generateAndSendTemplateImage } from './generateTemplateImage';

async function testMegaCards() {
  try {
    console.log('🎴 Testing Mega Cards with Square Layout\n');

    // Test 1: Poker table with mega cards (200x280) - Square layout
    console.log('1. Generating poker table with mega cards (200x280) - Square layout...');
    const messageId1 = await generateAndSendTemplateImage(
      'poker-table',
      [
        'ace_of_hearts', 'king_of_spades', 'queen_of_diamonds',
        'jack_of_clubs', '10_of_hearts', '2_of_clubs', '3_of_hearts'
      ],
      'general',
      'Mega Cards Poker Table',
      'webp',
      true,  // transparent background
      true   // asDocument
    );
    
    console.log(`✅ Generated poker table with mega cards: messageId ${messageId1}`);
    console.log('📄 1200x1200 (square), cards 200x280, transparent background\n');

    // Test 2: Player hand with mega cards (250x350) - Square layout
    console.log('2. Generating player hand with mega cards (250x350) - Square layout...');
    const messageId2 = await generateAndSendTemplateImage(
      'player-hand',
      ['ace_of_hearts', 'king_of_spades'],
      'general',
      'Mega Cards Player Hand',
      'webp',
      true,  // transparent background
      true   // asDocument
    );
    
    console.log(`✅ Generated player hand with mega cards: messageId ${messageId2}`);
    console.log('📄 800x800 (square), cards 250x350, transparent background\n');

    // Test 3: Full game with mega cards (220x308) - Square layout
    console.log('3. Generating full game with mega cards (220x308) - Square layout...');
    const messageId3 = await generateAndSendTemplateImage(
      'full-game',
      [
        'ace_of_hearts', 'king_of_spades', 'queen_of_diamonds',
        'jack_of_clubs', '10_of_hearts', '2_of_clubs', '3_of_hearts'
      ],
      'general',
      'Mega Cards Full Game',
      'webp',
      true,  // transparent background
      true   // asDocument
    );
    
    console.log(`✅ Generated full game with mega cards: messageId ${messageId3}`);
    console.log('📄 1400x1400 (square), cards 220x308, transparent background\n');

    console.log('🎉 All mega cards templates generated successfully!');
    console.log('🎯 Features:');
    console.log('   - Mega cards (200x280 to 250x350)');
    console.log('   - Square layout (1200x1200, 800x800, 1400x1400)');
    console.log('   - Transparent background');
    console.log('   - Maximum visibility');
    console.log('   - Perfect for overlays');

  } catch (error) {
    console.error('❌ Error in mega cards test:', error);
  }
}

// Run the test
testMegaCards();
