import { api } from '@/lib/api';

export async function upsert(messageData: { room_id: string; user_id: string; message_id: number; chat_id: number; timestamp: string; }) {
  return api.roomMessages.upsert(messageData);
}

export async function getByRoomAndUser(roomId: string, userId: string) {
  return api.roomMessages.getByRoomAndUser(roomId, userId);
}

export async function getAllByRoom(roomId: string) {
  return api.roomMessages.getAllByRoom(roomId);
}

export async function deleteByRoomAndUser(roomId: string, userId: string) {
  return api.roomMessages.deleteByRoomAndUser(roomId, userId);
}


