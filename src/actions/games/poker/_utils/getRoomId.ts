/**
 * Extract and validate roomId from query parameters
 */
export function getRoomId(query: Record<string, string>): string {
  const roomId = query.roomId;
  
  if (!roomId) {
    throw new Error('Room ID is required. Please provide a valid room ID.');
  }
  
  if (typeof roomId !== 'string' || roomId.trim() === '') {
    throw new Error('Invalid room ID format. Please provide a valid room ID.');
  }
  
  return roomId.trim();
} 