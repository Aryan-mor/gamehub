import { generateAndSendCard } from './src/generateAndSendCard';
import { logger } from './src/logger';

async function test5Cards(): Promise<void> {
  console.log('🃏 Testing 5 cards layout (3 top, 2 bottom)...');
  
  const testCards = [
    '2_of_spades',
    'ace_of_hearts', 
    'king_of_diamonds',
    'queen_of_clubs',
    'jack_of_spades'
  ];
  
  try {
    const messageId = await generateAndSendCard(
      testCards,
      'general',
      'general',
      '5 Cards Test - 3-2 Layout'
    );
    
    console.log('✅ 5 cards sent successfully!');
    console.log('📨 Message ID:', messageId);
    
  } catch (error) {
    console.error('❌ Failed to send 5 cards:', error);
  }
}

test5Cards().catch(console.error); 