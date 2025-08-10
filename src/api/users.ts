import { api } from '@/lib/api';

export async function getById(id: string) {
  return api.users.getById(id);
}

export async function getByIds(ids: string[]) {
  return api.users.getByIds(ids);
}

export async function getByTelegramId(telegramId: string) {
  return api.users.getByTelegramId(telegramId);
}

export async function upsert(userData: { telegram_id: number; username?: string; first_name?: string; last_name?: string; }) {
  return api.users.upsert(userData);
}

// export async function updateLastMessageId(userId: string, messageId: number) {
//   return api.users.updateLastMessageId(userId, messageId);
// }




