import { generateAndSendCard } from './src/generateAndSendCard';

async function testNewLayout(): Promise<void> {
  console.log('🃏 Testing new centered layout (no debug tag)...');
  
  const testCards = [
    '3_of_hearts',
    '7_of_diamonds', 
    'ace_of_spades',
    'king_of_clubs',
    'queen_of_hearts'
  ];
  
  try {
    const messageId = await generateAndSendCard(
      testCards,
      'general',
      'general',
      'New Centered Layout Test'
    );
    
    console.log('✅ New layout test sent successfully!');
    console.log('📨 Message ID:', messageId);
    
  } catch (error) {
    console.error('❌ Failed to send new layout test:', error);
  }
}

testNewLayout().catch(console.error); 