import { Bot } from 'grammy';

async function testPublicChannel(): Promise<void> {
  console.log('🔍 Testing public channel access...');
  
  const botToken = '8236796507:AAGksZbPfgnmgLH8BCSXXNCx8CVCgoJ2qg8';
  const bot = new Bot(botToken);
  
  // Try some public test channels
  const testChannels = [
    '@telegram',
    '@telegram_news',
    '@test',
    '@botfather',
    '@gamehub_test',  // If you have a test channel
    '@card_image_test' // If you have a test channel
  ];
  
  for (const channel of testChannels) {
    try {
      console.log(`🔄 Testing channel: ${channel}`);
      
      const chat = await bot.api.getChat(channel);
      console.log(`✅ Found chat: ${chat.type} - ${chat.title || 'N/A'}`);
      
      // Try to send a test message
      const result = await bot.api.sendMessage(channel, '🧪 Test message from card image service');
      console.log(`✅ Message sent successfully! Message ID: ${result.message_id}`);
      
      console.log(`🎯 Working channel found: ${channel}`);
      
      // Update .env file with working channel
      const fs = await import('fs');
      const envContent = `# Card Image Service Environment Variables
BOT_TOKEN=8236796507:AAGksZbPfgnmgLH8BCSXXNCx8CVCgoJ2qg8
TARGET_CHANNEL_ID=${channel}
LOG_LEVEL=info`;
      
      fs.writeFileSync('.env', envContent);
      console.log(`💾 Updated .env file with working channel: ${channel}`);
      
      break;
      
    } catch (error) {
      console.log(`❌ Failed for ${channel}:`, error.message);
    }
  }
  
  console.log('🏁 Public channel test completed');
  console.log('💡 Tip: You might need to:');
  console.log('   1. Create a public channel');
  console.log('   2. Add the bot as admin to the channel');
  console.log('   3. Use the channel username with @ prefix');
}

testPublicChannel().catch(console.error); 