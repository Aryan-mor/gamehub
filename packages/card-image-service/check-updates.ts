import { Bot } from 'grammy';

async function checkUpdates(): Promise<void> {
  console.log('🔍 Checking recent updates to find channel ID...');
  
  const botToken = '8236796507:AAGksZbPfgnmgLH8BCSXXNCx8CVCgoJ2qg8';
  const bot = new Bot(botToken);
  
  try {
    // Get updates
    const updates = await bot.api.getUpdates();
    console.log('📨 Total updates:', updates.length);
    
    if (updates.length > 0) {
      console.log('📋 Recent updates details:');
      
      updates.forEach((update, index) => {
        console.log(`\n--- Update ${index + 1} ---`);
        
        if (update.message) {
          const chat = update.message.chat;
          console.log('Message from:', {
            chatId: chat.id,
            chatType: chat.type,
            chatTitle: chat.title || 'N/A',
            chatUsername: chat.username || 'N/A',
            fromUser: update.message.from?.username || 'N/A'
          });
          
          // This might be the channel we're looking for
          console.log(`🎯 Potential channel ID: ${chat.id}`);
          console.log(`🎯 Channel type: ${chat.type}`);
          console.log(`🎯 Channel title: ${chat.title || 'N/A'}`);
          
        } else if (update.channel_post) {
          const chat = update.channel_post.chat;
          console.log('Channel post from:', {
            chatId: chat.id,
            chatType: chat.type,
            chatTitle: chat.title || 'N/A',
            chatUsername: chat.username || 'N/A'
          });
          
          console.log(`🎯 Channel ID found: ${chat.id}`);
          console.log(`🎯 Channel type: ${chat.type}`);
          console.log(`🎯 Channel title: ${chat.title || 'N/A'}`);
          
        } else {
          console.log('Other update type:', update);
        }
      });
      
      // Try to send a test message to the first chat found
      const firstUpdate = updates[0];
      if (firstUpdate.message || firstUpdate.channel_post) {
        const chatId = firstUpdate.message?.chat.id || firstUpdate.channel_post?.chat.id;
        
        if (chatId) {
          console.log(`\n🔄 Testing to send message to chat ID: ${chatId}`);
          
          try {
            const result = await bot.api.sendMessage(chatId, '🧪 Test message from card image service');
            console.log(`✅ Successfully sent message! Message ID: ${result.message_id}`);
            
            console.log(`\n🎯 Working channel ID found: ${chatId}`);
            console.log('💾 Update your .env file with:');
            console.log(`TARGET_CHANNEL_ID=${chatId}`);
            
          } catch (error) {
            console.log(`❌ Failed to send message: ${error.message}`);
          }
        }
      }
      
    } else {
      console.log('📭 No recent updates found');
    }
    
  } catch (error) {
    console.error('❌ Error checking updates:', error.message);
  }
}

checkUpdates().catch(console.error); 