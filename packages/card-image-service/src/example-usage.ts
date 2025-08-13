// Example usage of the Card Image Service from the main project
// This file demonstrates how to integrate the card image service

import { generateAndSendCard, regenerateCardImage, getCacheStats } from './index';
import { generateAndSendTemplateImage } from './generateTemplateImage';

async function exampleUsage() {
  try {
    console.log('🎴 Card Image Service Example Usage\n');

    // Example 1: Generate PNG card image as photo (compressed)
    console.log('1. Generating PNG card image as photo (compressed)...');
    const messageId1 = await generateAndSendCard(
      ['ace_of_hearts', 'king_of_spades', 'queen_of_diamonds'],
      'general',
      'club',
      'Player 1 Hand (Photo)',
      'png',
      false,
      false  // asDocument: false (photo mode)
    );
    console.log(`✅ Generated PNG photo with messageId: ${messageId1}\n`);

    // Example 2: Generate WebP image as document (no compression)
    console.log('2. Generating WebP image as document (no compression)...');
    const messageId2 = await generateAndSendCard(
      ['ace_of_hearts', 'king_of_spades'],
      'general',
      'general',
      'Player Hand (Document)',
      'webp',     // format
      true,       // transparent
      true        // asDocument: true (document mode)
    );
    console.log(`✅ Generated WebP document with messageId: ${messageId2}\n`);

    // Example 3: Generate better template with JPEG (NEW!)
    console.log('3. Generating better poker table template with JPEG...');
    const messageId3 = await generateAndSendTemplateImage(
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
    console.log(`✅ Generated better template with messageId: ${messageId3}\n`);

    // Example 4: Generate template as document (no compression)
    console.log('4. Generating template as document (no compression)...');
    const messageId4 = await generateAndSendTemplateImage(
      'poker-table',
      ['ace_of_hearts', 'king_of_spades', 'queen_of_diamonds', 'jack_of_clubs', '10_of_hearts'],
      'general',
      'Poker Table Document',
      'jpeg',
      false,
      true  // asDocument: true (document mode)
    );
    console.log(`✅ Generated template document with messageId: ${messageId4}\n`);

    // Example 5: Cache statistics
    console.log('5. Cache statistics:');
    const stats = getCacheStats();
    console.log(`   Total entries: ${stats.totalEntries}`);
    console.log(`   Expired entries: ${stats.expiredEntries}\n`);

    // Example 6: Force regenerate if messageId becomes invalid
    console.log('6. Force regenerate example (if messageId becomes invalid):');
    try {
      // Try to use existing messageId (this would fail in real scenario)
      // await bot.api.getChat(messageId1);
    } catch (error) {
      console.log('   MessageId invalid, regenerating...');
      const newMessageId = await regenerateCardImage(
        ['ace_of_hearts', 'king_of_spades'],
        'general',
        'club',
        'Regenerated Hand',
        'png',
        false,
        false
      );
      console.log(`   ✅ Regenerated with new messageId: ${newMessageId}\n`);
    }

    console.log('🎉 All examples completed successfully!');

  } catch (error) {
    console.error('❌ Error in example usage:', error);
  }
}

// Function to generate poker table image (for use in main project)
export async function generatePokerTableImage(
  tableCards: string[],  // 5 cards for table (flop, turn, river)
  playerCards: string[], // 2 cards for player hand
  debugTag?: string
): Promise<string> {
  try {
    const allCards = [...tableCards, ...playerCards];
    
    if (allCards.length !== 7) {
      throw new Error('Poker table requires exactly 7 cards (5 table + 2 player)');
    }

    const messageId = await generateAndSendTemplateImage(
      'poker-table',
      allCards,
      'general',
      debugTag || 'Poker Game State',
      'jpeg',
      false,
      false  // photo mode (compressed)
    );

    return messageId;
  } catch (error) {
    console.error('Error generating poker table image:', error);
    throw error;
  }
}

// Function to generate player hand image only
export async function generatePlayerHandImage(
  playerCards: string[], // 2 cards for player hand
  debugTag?: string
): Promise<string> {
  try {
    if (playerCards.length !== 2) {
      throw new Error('Player hand requires exactly 2 cards');
    }

    const messageId = await generateAndSendCard(
      playerCards,
      'general',
      'general',
      debugTag || 'Player Hand',
      'png',
      false,
      false  // photo mode (compressed)
    );

    return messageId;
  } catch (error) {
    console.error('Error generating player hand image:', error);
    throw error;
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  exampleUsage();
} 