import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

async function simpleImageTest(): Promise<void> {
  console.log('🎴 Simple Image Test');
  
  try {
    // Test with just one card and background
    const cardPath = path.join(__dirname, '../assets/card/general/2_of_clubs.png');
    const backgroundPath = path.join(__dirname, '../assets/card_area/general.png');
    
    console.log('📁 Loading images...');
    
    // Load background
    const backgroundBuffer = fs.readFileSync(backgroundPath);
    const background = sharp(backgroundBuffer).resize(400, 200, { fit: 'cover' });
    
    // Load card
    const cardBuffer = fs.readFileSync(cardPath);
    const card = sharp(cardBuffer).resize(100, 140, { fit: 'contain' });
    
    console.log('🔄 Processing images...');
    
    // Composite card onto background
    const result = await background.composite([
      {
        input: await card.toBuffer(),
        left: 50,
        top: 30,
      }
    ]).png().toBuffer();
    
    console.log('✅ Success! Result size:', result.length);
    
    // Save result for inspection
    fs.writeFileSync('test-output.png', result);
    console.log('💾 Saved as test-output.png');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

simpleImageTest().catch(console.error); 