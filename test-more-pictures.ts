// Test generating more card pictures with different combinations
import { generateCardImageBuffer } from './src/utils/cardImageService';
import fs from 'fs';

async function generateMorePictures(): Promise<void> {
  console.log('🎴 Generating More Test Card Pictures');
  
  try {
    // Picture 1: Flush (all hearts)
    console.log('🔄 Generating Picture 1: Flush (All Hearts)...');
    
    const flush = await generateCardImageBuffer(
      ['ace_of_hearts', 'king_of_hearts', 'queen_of_hearts', 'jack_of_hearts', '10_of_hearts'],
      'general',
      'general',
      'Flush - All Hearts'
    );
    
    fs.writeFileSync('flush-hearts.png', flush);
    console.log('✅ Flush saved: flush-hearts.png', { size: flush.length });
    
    // Picture 2: Straight (consecutive cards)
    console.log('🔄 Generating Picture 2: Straight...');
    
    const straight = await generateCardImageBuffer(
      ['5_of_hearts', '6_of_spades', '7_of_diamonds', '8_of_clubs', '9_of_hearts'],
      'general',
      'general',
      'Straight - 5 to 9'
    );
    
    fs.writeFileSync('straight-5-9.png', straight);
    console.log('✅ Straight saved: straight-5-9.png', { size: straight.length });
    
    // Picture 3: Pair
    console.log('🔄 Generating Picture 3: Pair...');
    
    const pair = await generateCardImageBuffer(
      ['ace_of_spades', 'ace_of_hearts', 'king_of_diamonds', 'queen_of_clubs', 'jack_of_spades'],
      'general',
      'general',
      'Pair - Two Aces'
    );
    
    fs.writeFileSync('pair-aces.png', pair);
    console.log('✅ Pair saved: pair-aces.png', { size: pair.length });
    
    // Picture 4: Three of a kind
    console.log('🔄 Generating Picture 4: Three of a Kind...');
    
    const threeOfKind = await generateCardImageBuffer(
      ['king_of_hearts', 'king_of_diamonds', 'king_of_clubs', 'ace_of_spades', '2_of_hearts'],
      'general',
      'general',
      'Three of a Kind - Three Kings'
    );
    
    fs.writeFileSync('three-kings.png', threeOfKind);
    console.log('✅ Three of a Kind saved: three-kings.png', { size: threeOfKind.length });
    
    // Picture 5: Two pair
    console.log('🔄 Generating Picture 5: Two Pair...');
    
    const twoPair = await generateCardImageBuffer(
      ['queen_of_hearts', 'queen_of_diamonds', 'jack_of_clubs', 'jack_of_spades', 'ace_of_hearts'],
      'general',
      'general',
      'Two Pair - Queens and Jacks'
    );
    
    fs.writeFileSync('two-pair.png', twoPair);
    console.log('✅ Two Pair saved: two-pair.png', { size: twoPair.length });
    
    console.log('🎉 All 5 poker hand pictures generated successfully!');
    console.log('📁 Files created:');
    console.log('   - flush-hearts.png (Flush - All Hearts)');
    console.log('   - straight-5-9.png (Straight - 5 to 9)');
    console.log('   - pair-aces.png (Pair - Two Aces)');
    console.log('   - three-kings.png (Three of a Kind - Three Kings)');
    console.log('   - two-pair.png (Two Pair - Queens and Jacks)');
    
  } catch (error) {
    console.error('❌ Error generating pictures:', error);
  }
}

// Run the test
generateMorePictures().catch(console.error); 