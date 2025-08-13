import { Bot } from 'grammy';

async function findChannel(): Promise<void> {
  console.log('🔍 Finding the correct channel ID...');
  
  const botToken = '8236796507:AAGksZbPfgnmgLH8BCSXXNCx8CVCgoJ2qg8';
  const bot = new Bot(botToken);
  
  try {
    // Get bot info
    const botInfo = await bot.api.getMe();
    console.log('🤖 Bot info:', {
      id: botInfo.id,
      username: botInfo.username,
      firstName: botInfo.first_name
    });
    
    // Get updates to see if there are any channel messages
    const updates = await bot.api.getUpdates();
    console.log('📨 Updates count:', updates.length);
    
    if (updates.length > 0) {
      console.log('📋 Recent updates:');
      updates.forEach((update, index) => {
        if (update.message) {
          console.log(`  ${index + 1}. From chat ID: ${update.message.chat.id}, Type: ${update.message.chat.type}`);
        }
      });
    }
    
    // Try different channel ID formats
    const possibleIds = [
      '+qb-Un4TlDxs3ZGY8',
      '@qb-Un4TlDxs3ZGY8',
      'qb-Un4TlDxs3ZGY8',
      '-1001234567890', // Example numeric ID
      '-1002000000000', // Another example
    ];
    
    console.log('🔄 Testing different channel ID formats...');
    
    for (const id of possibleIds) {
      try {
        const chat = await bot.api.getChat(id);
        console.log(`✅ Found channel: ${id} - Type: ${chat.type}, Title: ${chat.title || 'N/A'}`);
        
        // Try to send a test message
        const result = await bot.api.sendMessage(id, '🧪 Test message from card image service');
        console.log(`✅ Successfully sent message to ${id}! Message ID: ${result.message_id}`);
        
        console.log(`🎯 Working channel ID found: ${id}`);
        break;
        
      } catch (error) {
        console.log(`❌ Failed for ${id}: ${error.message}`);
      }
    }
    
    console.log('\n💡 Instructions:');
    console.log('1. Make sure the channel is public or the bot is added as admin');
    console.log('2. Try using the channel username with @ prefix');
    console.log('3. Or use the numeric channel ID (usually starts with -100)');
    console.log('4. Check if the bot has "Send Messages" permission');
    
  } catch (error) {
    console.error('❌ Error finding channel:', error.message);
  }
}

findChannel().catch(console.error); 