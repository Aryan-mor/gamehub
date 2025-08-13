import { generateAndSendTemplateImage } from './generateTemplateImage';

async function testUltraCards() {
  try {
    console.log('🎴 Testing Ultra Cards with Rectangle Layout\n');

    // Test 1: Poker table with ultra cards (250x350) - Rectangle layout
    console.log('1. Generating poker table with ultra cards (250x350) - Rectangle layout...');
    const messageId1 = await generateAndSendTemplateImage(
      'poker-table',
      [
        'ace_of_hearts', 'king_of_spades', 'queen_of_diamonds',
        'jack_of_clubs', '10_of_hearts', '2_of_clubs', '3_of_hearts'
      ],
      'general',
      'Ultra Cards Poker Table',
      'webp',
      true,  // transparent background
      true   // asDocument
    );
    
    console.log(`✅ Generated poker table with ultra cards: messageId ${messageId1}`);
    console.log('📄 1200x1600 (rectangle), cards 250x350, transparent background\n');

    // Test 2: Player hand with ultra cards (300x420) - Rectangle layout
    console.log('2. Generating player hand with ultra cards (300x420) - Rectangle layout...');
    const messageId2 = await generateAndSendTemplateImage(
      'player-hand',
      ['ace_of_hearts', 'king_of_spades'],
      'general',
      'Ultra Cards Player Hand',
      'webp',
      true,  // transparent background
      true   // asDocument
    );
    
    console.log(`✅ Generated player hand with ultra cards: messageId ${messageId2}`);
    console.log('📄 800x1000 (rectangle), cards 300x420, transparent background\n');

    // Test 3: Full game with ultra cards (300x420) - Rectangle layout
    console.log('3. Generating full game with ultra cards (300x420) - Rectangle layout...');
    const messageId3 = await generateAndSendTemplateImage(
      'full-game',
      [
        'ace_of_hearts', 'king_of_spades', 'queen_of_diamonds',
        'jack_of_clubs', '10_of_hearts', '2_of_clubs', '3_of_hearts'
      ],
      'general',
      'Ultra Cards Full Game',
      'webp',
      true,  // transparent background
      true   // asDocument
    );
    
    console.log(`✅ Generated full game with ultra cards: messageId ${messageId3}`);
    console.log('📄 1400x1800 (rectangle), cards 300x420, transparent background\n');

    console.log('🎉 All ultra cards templates generated successfully!');
    console.log('🎯 Features:');
    console.log('   - Ultra cards (250x350 to 300x420)');
    console.log('   - Rectangle layout (1200x1600, 800x1000, 1400x1800)');
    console.log('   - Two rows for table cards');
    console.log('   - Player cards at bottom');
    console.log('   - Transparent background');
    console.log('   - Maximum visibility');

  } catch (error) {
    console.error('❌ Error in ultra cards test:', error);
  }
}

// Run the test
testUltraCards();
