import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

async function debugImageLoading(): Promise<void> {
  console.log('🔍 Debug: Testing image loading...');
  
  try {
    // Test 1: Check if files exist
    const cardPath = path.join(__dirname, '../assets/card/general/2_of_clubs.png');
    const backgroundPath = path.join(__dirname, '../assets/card_area/general.png');
    
    console.log('📁 Card path:', cardPath);
    console.log('📁 Background path:', backgroundPath);
    console.log('✅ Card exists:', fs.existsSync(cardPath));
    console.log('✅ Background exists:', fs.existsSync(backgroundPath));
    
    // Test 2: Try to load card image
    if (fs.existsSync(cardPath)) {
      console.log('🃏 Testing card image loading...');
      const cardBuffer = fs.readFileSync(cardPath);
      console.log('📊 Card buffer size:', cardBuffer.length);
      
      const cardImage = sharp(cardBuffer);
      const cardMetadata = await cardImage.metadata();
      console.log('📐 Card metadata:', cardMetadata);
      
      const resizedCard = cardImage.resize(100, 140, { fit: 'contain' });
      const cardResult = await resizedCard.png().toBuffer();
      console.log('✅ Card processing successful, result size:', cardResult.length);
    }
    
    // Test 3: Try to load background image
    if (fs.existsSync(backgroundPath)) {
      console.log('🖼️ Testing background image loading...');
      const backgroundBuffer = fs.readFileSync(backgroundPath);
      console.log('📊 Background buffer size:', backgroundBuffer.length);
      
      const backgroundImage = sharp(backgroundBuffer);
      const backgroundMetadata = await backgroundImage.metadata();
      console.log('📐 Background metadata:', backgroundMetadata);
      
      const resizedBackground = backgroundImage.resize(400, 200, { fit: 'cover' });
      const backgroundResult = await resizedBackground.png().toBuffer();
      console.log('✅ Background processing successful, result size:', backgroundResult.length);
    }
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in debug test:', error);
  }
}

// Run debug test
debugImageLoading().catch(console.error); 