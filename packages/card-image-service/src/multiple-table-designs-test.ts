import { generateAndSendTemplateImage } from './generateTemplateImage';

async function testMultipleTableDesigns() {
  try {
    console.log('🎴 Testing Multiple Table Designs\n');

    const testCards = [
      'ace_of_hearts', 'king_of_spades', 'queen_of_diamonds',
      'jack_of_clubs', '10_of_hearts'
    ];

    // Test 1: Table Wide (مستطیل با ارتفاع کم و کنار هم)
    console.log('1. Generating Table Wide (1400x600) - همه کنار هم...');
    const wideMessageId = await generateAndSendTemplateImage(
      'table-wide',
      testCards,
      'general',
      'Table Wide - All Cards Side by Side',
      'webp',
      true,
      true
    );
    console.log(`✅ Table Wide: messageId ${wideMessageId}`);
    console.log('📄 1400x600, cards 240x336, all side by side\n');

    // Test 2: Table Tall (مستطیل با ارتفاع زیاد 3 تا 2 زیر هم)
    console.log('2. Generating Table Tall (800x1200) - 3 بالا، 2 پایین...');
    const tallMessageId = await generateAndSendTemplateImage(
      'table-tall',
      testCards,
      'general',
      'Table Tall - 3 Top, 2 Bottom',
      'webp',
      true,
      true
    );
    console.log(`✅ Table Tall: messageId ${tallMessageId}`);
    console.log('📄 800x1200, cards 180x252, 3 top, 2 bottom\n');

    // Test 3: Table Square (مربع)
    console.log('3. Generating Table Square (1000x1000) - مربع...');
    const squareMessageId = await generateAndSendTemplateImage(
      'table-square',
      testCards,
      'general',
      'Table Square - Square Layout',
      'webp',
      true,
      true
    );
    console.log(`✅ Table Square: messageId ${squareMessageId}`);
    console.log('📄 1000x1000, cards 200x280, square layout\n');

    // Test 4: Table Circle (شکل دایره‌ای)
    console.log('4. Generating Table Circle (1200x800) - شکل دایره‌ای...');
    const circleMessageId = await generateAndSendTemplateImage(
      'table-circle',
      testCards,
      'general',
      'Table Circle - Circular Layout',
      'webp',
      true,
      true
    );
    console.log(`✅ Table Circle: messageId ${circleMessageId}`);
    console.log('📄 1200x800, cards 200x280, circular layout\n');

    // Test 5: Original Table (مقایسه)
    console.log('5. Generating Original Table (1200x800) - مقایسه...');
    const originalMessageId = await generateAndSendTemplateImage(
      'table-only',
      testCards,
      'general',
      'Original Table - For Comparison',
      'webp',
      true,
      true
    );
    console.log(`✅ Original Table: messageId ${originalMessageId}`);
    console.log('📄 1200x800, cards 280x392, original layout\n');

    console.log('🎉 All table designs generated successfully!');
    console.log('\n📊 Comparison:');
    console.log('1. Table Wide (1400x600) - همه کنار هم');
    console.log('2. Table Tall (800x1200) - 3 بالا، 2 پایین');
    console.log('3. Table Square (1000x1000) - مربع');
    console.log('4. Table Circle (1200x800) - شکل دایره‌ای');
    console.log('5. Original Table (1200x800) - مقایسه');
    
    console.log('\n🎯 Choose the best design for your needs!');

  } catch (error) {
    console.error('❌ Error in multiple table designs test:', error);
  }
}

// Run the test
testMultipleTableDesigns();
