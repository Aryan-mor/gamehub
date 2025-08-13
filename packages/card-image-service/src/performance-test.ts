import { generateAndSendTemplateImage, generateTemplateBufferOnly } from './generateTemplateImage';
import { performance } from 'perf_hooks';

async function performanceTest() {
  try {
    console.log('🚀 Performance Test - SVG Template System\n');

    // Test 1: Buffer generation only (no Telegram)
    console.log('1. Testing buffer generation performance...');
    const start1 = performance.now();
    
    const buffer = await generateTemplateBufferOnly(
      'poker-table',
      [
        'ace_of_hearts', 'king_of_spades', 'queen_of_diamonds',
        'jack_of_clubs', '10_of_hearts', '2_of_clubs', '3_of_hearts'
      ],
      'general',
      'Performance Test',
      'webp',
      false
    );
    
    const end1 = performance.now();
    const bufferTime = end1 - start1;
    
    console.log(`✅ Buffer generated: ${buffer.length} bytes`);
    console.log(`⏱️  Buffer generation time: ${bufferTime.toFixed(2)}ms\n`);

    // Test 2: Full generation + Telegram (new image)
    console.log('2. Testing full generation + Telegram (new image)...');
    const start2 = performance.now();
    
    const messageId = await generateAndSendTemplateImage(
      'poker-table',
      [
        'ace_of_hearts', 'king_of_spades', 'queen_of_diamonds',
        'jack_of_clubs', '10_of_hearts', '2_of_clubs', '3_of_hearts'
      ],
      'general',
      'Performance Test - New',
      'webp',
      false,
      true
    );
    
    const end2 = performance.now();
    const fullTime = end2 - start2;
    
    console.log(`✅ Full generation completed: messageId ${messageId}`);
    console.log(`⏱️  Full generation time: ${fullTime.toFixed(2)}ms\n`);

    // Test 3: Cached retrieval (same request)
    console.log('3. Testing cached retrieval (same request)...');
    const start3 = performance.now();
    
    const cachedMessageId = await generateAndSendTemplateImage(
      'poker-table',
      [
        'ace_of_hearts', 'king_of_spades', 'queen_of_diamonds',
        'jack_of_clubs', '10_of_hearts', '2_of_clubs', '3_of_hearts'
      ],
      'general',
      'Performance Test - Cached',
      'webp',
      false,
      true
    );
    
    const end3 = performance.now();
    const cacheTime = end3 - start3;
    
    console.log(`✅ Cached retrieval completed: messageId ${cachedMessageId}`);
    console.log(`⏱️  Cache retrieval time: ${cacheTime.toFixed(2)}ms\n`);

    // Performance Summary
    console.log('📊 Performance Summary:');
    console.log(`   Buffer Generation: ${bufferTime.toFixed(2)}ms`);
    console.log(`   Full Generation:   ${fullTime.toFixed(2)}ms`);
    console.log(`   Cache Retrieval:   ${cacheTime.toFixed(2)}ms`);
    console.log(`   Telegram Upload:   ${(fullTime - bufferTime).toFixed(2)}ms`);
    console.log(`   Cache Speedup:     ${(fullTime / cacheTime).toFixed(1)}x faster`);
    console.log(`   File Size:         ${(buffer.length / 1024).toFixed(1)}KB`);

  } catch (error) {
    console.error('❌ Error in performance test:', error);
  }
}

// Run the test
performanceTest();
