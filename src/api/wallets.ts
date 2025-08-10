import { api } from '@/lib/api';

export async function getByUserId(userId: string) {
  return api.wallets.getByUserId(userId);
}

export async function create(walletData: { user_id: string; balance: number }) {
  return api.wallets.create(walletData);
}

export async function updateBalance(userId: string, balance: number) {
  return api.wallets.updateBalance(userId, balance);
}


