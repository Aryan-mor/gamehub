import { Bot } from 'grammy';

async function testUsernames(): Promise<void> {
  console.log('🔍 Testing different username formats...');
  
  const botToken = '8236796507:AAGksZbPfgnmgLH8BCSXXNCx8CVCgoJ2qg8';
  const bot = new Bot(botToken);
  
  // Common username formats to test
  const usernames = [
    '@qb-Un4TlDxs3ZGY8',
    'qb-Un4TlDxs3ZGY8',
    '@qb_Un4TlDxs3ZGY8',
    'qb_Un4TlDxs3ZGY8',
    '@qbUn4TlDxs3ZGY8',
    'qbUn4TlDxs3ZGY8',
    '@qb_un4tldxs3zgy8',
    'qb_un4tldxs3zgy8'
  ];
  
  for (const username of usernames) {
    try {
      console.log(`🔄 Testing username: ${username}`);
      
      const chat = await bot.api.getChat(username);
      console.log(`✅ Found chat: ${chat.type} - ${chat.title || 'N/A'}`);
      
      // Try to send a test message
      const result = await bot.api.sendMessage(username, '🧪 Test message from card image service');
      console.log(`✅ Message sent successfully! Message ID: ${result.message_id}`);
      
      console.log(`🎯 Working username found: ${username}`);
      
      // Update .env file with working username
      const fs = await import('fs');
      const envContent = `# Card Image Service Environment Variables
BOT_TOKEN=8236796507:AAGksZbPfgnmgLH8BCSXXNCx8CVCgoJ2qg8
TARGET_CHANNEL_ID=${username}
LOG_LEVEL=info`;
      
      fs.writeFileSync('.env', envContent);
      console.log(`💾 Updated .env file with working username: ${username}`);
      
      break;
      
    } catch (error) {
      console.log(`❌ Failed for ${username}:`, error.message);
    }
  }
  
  console.log('🏁 Username test completed');
}

testUsernames().catch(console.error); 