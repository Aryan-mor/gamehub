// Simple script to delete the old room
// Run this manually in Firebase Console or use Firebase CLI

const oldRoomId = 'room_1754095606992_4xn';

console.log(`🗑️ To delete old room: ${oldRoomId}`);
console.log('📝 Go to Firebase Console > Realtime Database > pokerRooms');
console.log(`🔍 Find and delete the room with ID: ${oldRoomId}`);
console.log('✅ This will remove the old room with maxPlayers: 8');

// Alternative: Use Firebase CLI
console.log('\n🔧 Or use Firebase CLI:');
console.log(`firebase database:remove /pokerRooms/${oldRoomId}`); 