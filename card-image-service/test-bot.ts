import { Bot } from 'grammy';

async function testBot(): Promise<void> {
  console.log('🤖 Testing bot functionality...');
  
  const botToken = '8236796507:AAGksZbPfgnmgLH8BCSXXNCx8CVCgoJ2qg8';
  const bot = new Bot(botToken);
  
  try {
    // Test 1: Get bot info
    console.log('🔄 Test 1: Getting bot info...');
    const botInfo = await bot.api.getMe();
    console.log('✅ Bot info:', {
      id: botInfo.id,
      username: botInfo.username,
      firstName: botInfo.first_name,
      canJoinGroups: botInfo.can_join_groups,
      canReadAllGroupMessages: botInfo.can_read_all_group_messages
    });
    
    // Test 2: Get bot updates
    console.log('🔄 Test 2: Getting bot updates...');
    const updates = await bot.api.getUpdates();
    console.log('✅ Updates count:', updates.length);
    
    // Test 3: Test with a known channel format
    console.log('🔄 Test 3: Testing with different channel formats...');
    
    const testChannels = [
      '@qb-Un4TlDxs3ZGY8',
      '+qb-Un4TlDxs3ZGY8',
      'qb-Un4TlDxs3ZGY8',
      '-1001234567890'
    ];
    
    for (const channel of testChannels) {
      try {
        console.log(`  Testing: ${channel}`);
        const chat = await bot.api.getChat(channel);
        console.log(`  ✅ Found chat: ${chat.type} - ${chat.title || 'N/A'}`);
      } catch (error) {
        console.log(`  ❌ Not found: ${channel} - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Bot test failed:', error);
  }
}

testBot().catch(console.error); 