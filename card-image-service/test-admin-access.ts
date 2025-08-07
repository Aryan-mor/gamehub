import { Bot } from 'grammy';

async function testAdminAccess(): Promise<void> {
  console.log('🔍 Testing bot admin access...');
  
  const botToken = '8236796507:AAGksZbPfgnmgLH8BCSXXNCx8CVCgoJ2qg8';
  const bot = new Bot(botToken);
  
  const channelId = '+qb-Un4TlDxs3ZGY8';
  
  try {
    console.log(`🔄 Testing channel access: ${channelId}`);
    
    // Test 1: Get chat info
    const chat = await bot.api.getChat(channelId);
    console.log('✅ Chat info:', {
      type: chat.type,
      title: chat.title || 'N/A',
      id: chat.id
    });
    
    // Test 2: Send a simple text message
    console.log('🔄 Sending test text message...');
    const textResult = await bot.api.sendMessage(channelId, '🧪 Test message from card image service bot');
    console.log('✅ Text message sent successfully!', { messageId: textResult.message_id });
    
    // Test 3: Send a photo (simulate card image)
    console.log('🔄 Sending test photo...');
    const photoResult = await bot.api.sendPhoto(channelId, 'https://via.placeholder.com/300x200/FF0000/FFFFFF?text=Test+Card');
    console.log('✅ Photo sent successfully!', { messageId: photoResult.message_id });
    
    console.log('🎯 Bot has admin access and can send messages!');
    
  } catch (error) {
    console.error('❌ Admin access test failed:', error.message);
  }
}

testAdminAccess().catch(console.error); 