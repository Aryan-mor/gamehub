import { Bot } from 'grammy';

async function testChannelAccess(): Promise<void> {
  console.log('🔍 Testing channel access...');
  
  const botToken = '8236796507:AAGksZbPfgnmgLH8BCSXXNCx8CVCgoJ2qg8';
  const bot = new Bot(botToken);
  
  const channelIds = [
    '+qb-Un4TlDxs3ZGY8',
    '@qb-Un4TlDxs3ZGY8',
    'qb-Un4TlDxs3ZGY8',
    '-1001234567890' // Example numeric ID
  ];
  
  for (const channelId of channelIds) {
    try {
      console.log(`🔄 Testing channel ID: ${channelId}`);
      
      const chat = await bot.api.getChat(channelId);
      console.log(`✅ Success! Chat type: ${chat.type}, Title: ${chat.title || 'N/A'}`);
      
      // Try to send a test message
      const result = await bot.api.sendMessage(channelId, '🧪 Test message from card image service');
      console.log(`✅ Message sent successfully! Message ID: ${result.message_id}`);
      
      // If we get here, this channel ID works
      console.log(`🎯 Working channel ID found: ${channelId}`);
      break;
      
    } catch (error) {
      console.log(`❌ Failed for ${channelId}:`, error.message);
    }
  }
  
  console.log('🏁 Channel test completed');
}

testChannelAccess().catch(console.error); 