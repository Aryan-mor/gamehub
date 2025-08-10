import { api } from '@/lib/api';

export async function getByTelegramId(telegramId: string) {
  return api.users.getByTelegramId(telegramId);
}

export async function create(userData: {
  telegram_id: string;
  created_at?: string;
  updated_at?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}) {
  return api.users.create(userData);
}

export async function updateByTelegramId(telegramId: string, updates: Record<string, unknown>): Promise<void> {
  return api.users.updateByTelegramId(telegramId, updates);
}

export async function getLastFreeCoinAt(telegramId: string) {
  return api.users.getLastFreeCoinAt(telegramId);
}


