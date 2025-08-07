// Test generating 2 different card pictures
import { generateCardImageBuffer } from './src/utils/cardImageService';
import fs from 'fs';

async function generateTestPictures(): Promise<void> {
  console.log('🎴 Generating 2 Test Card Pictures');
  
  try {
    // Picture 1: Simple hand
    console.log('🔄 Generating Picture 1: Simple Hand...');
    
    const picture1 = await generateCardImageBuffer(
      ['2_of_clubs', '3_of_hearts', 'ace_of_spades'],
      'general',
      'general',
      'Simple Hand - Test 1'
    );
    
    fs.writeFileSync('test-picture-1.png', picture1);
    console.log('✅ Picture 1 saved: test-picture-1.png', { size: picture1.length });
    
    // Picture 2: Royal hand
    console.log('🔄 Generating Picture 2: Royal Hand...');
    
    const picture2 = await generateCardImageBuffer(
      ['king_of_hearts', 'queen_of_diamonds', 'jack_of_clubs', 'ace_of_spades'],
      'general',
      'general',
      'Royal Hand - Test 2'
    );
    
    fs.writeFileSync('test-picture-2.png', picture2);
    console.log('✅ Picture 2 saved: test-picture-2.png', { size: picture2.length });
    
    // Picture 3: Different style test
    console.log('🔄 Generating Picture 3: Different Cards...');
    
    const picture3 = await generateCardImageBuffer(
      ['10_of_hearts', '9_of_spades', '8_of_diamonds', '7_of_clubs', '6_of_hearts'],
      'general',
      'general',
      'Mixed Cards - Test 3'
    );
    
    fs.writeFileSync('test-picture-3.png', picture3);
    console.log('✅ Picture 3 saved: test-picture-3.png', { size: picture3.length });
    
    // Picture 4: Single card
    console.log('🔄 Generating Picture 4: Single Card...');
    
    const picture4 = await generateCardImageBuffer(
      ['ace_of_hearts'],
      'general',
      'general',
      'Single Card - Test 4'
    );
    
    fs.writeFileSync('test-picture-4.png', picture4);
    console.log('✅ Picture 4 saved: test-picture-4.png', { size: picture4.length });
    
    console.log('🎉 All 4 test pictures generated successfully!');
    console.log('📁 Files created:');
    console.log('   - test-picture-1.png (Simple Hand)');
    console.log('   - test-picture-2.png (Royal Hand)');
    console.log('   - test-picture-3.png (Mixed Cards)');
    console.log('   - test-picture-4.png (Single Card)');
    
  } catch (error) {
    console.error('❌ Error generating pictures:', error);
  }
}

// Run the test
generateTestPictures().catch(console.error); 