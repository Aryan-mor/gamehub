import { ref, remove, get } from 'firebase/database';
import { database } from '../modules/core/firebase';

// Check if Firebase is initialized
if (!database) {
  console.error('❌ Firebase not initialized');
  process.exit(1);
}

/**
 * Clear all poker games from the database
 */
async function clearPokerGames(): Promise<void> {
  try {
    console.log('🗑️ Starting to clear all poker games...');
    
    // Reference to the poker rooms
    const pokerRoomsRef = ref(database, 'pokerRooms');
    
    // Get all poker rooms
    const snapshot = await get(pokerRoomsRef);
    
    if (!snapshot.exists()) {
      console.log('✅ No poker rooms found in database');
      return;
    }
    
    const rooms = snapshot.val();
    const roomIds = Object.keys(rooms);
    
    console.log(`📊 Found ${roomIds.length} poker room(s) to clear:`);
    
    // List all rooms before clearing
    roomIds.forEach((roomId, index) => {
      const room = rooms[roomId];
      console.log(`${index + 1}. ${room.name} (${room.id}) - Status: ${room.status} - Players: ${room.players?.length || 0}`);
    });
    
    // Remove all poker rooms
    await remove(pokerRoomsRef);
    
    console.log(`✅ Successfully cleared ${roomIds.length} poker room(s) from database`);
    
  } catch (error) {
    console.error('❌ Error clearing poker games:', error);
    throw error;
  }
}

/**
 * Clear all user data from the database
 */
async function clearAllUserData(): Promise<void> {
  try {
    console.log('🗑️ Starting to clear all user data...');
    
    // Reference to users
    const usersRef = ref(database, 'users');
    
    // Get all users
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      console.log('✅ No users found in database');
      return;
    }
    
    const users = snapshot.val();
    const userIds = Object.keys(users);
    
    console.log(`📊 Found ${userIds.length} user(s) to clear:`);
    
    // List all users before clearing
    userIds.forEach((userId, index) => {
      const user = users[userId];
      console.log(`${index + 1}. ${user.username || 'Unknown'} (${userId}) - Chips: ${user.chips || 0}`);
    });
    
    // Remove all users
    await remove(usersRef);
    
    console.log(`✅ Successfully cleared ${userIds.length} user(s) from database`);
    
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
    throw error;
  }
}

/**
 * Clear everything (poker games + user data)
 */
async function clearEverything(): Promise<void> {
  try {
    console.log('🧹 Starting complete database cleanup...\n');
    
    await clearPokerGames();
    console.log('');
    await clearAllUserData();
    
    console.log('\n🎉 Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'games':
        await clearPokerGames();
        break;
      case 'users':
        await clearAllUserData();
        break;
      case 'all':
        await clearEverything();
        break;
      default:
        console.log('Usage:');
        console.log('  npm run clear:games  - Clear only poker games');
        console.log('  npm run clear:users  - Clear only user data');
        console.log('  npm run clear:all    - Clear everything');
        console.log('');
        console.log('Or run directly:');
        console.log('  npx tsx src/scripts/clearPokerGames.ts games');
        console.log('  npx tsx src/scripts/clearPokerGames.ts users');
        console.log('  npx tsx src/scripts/clearPokerGames.ts all');
        break;
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main(); 