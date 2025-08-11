// API client for database operations
// This replaces direct Supabase calls throughout the application

import { supabase } from './supabase';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

// User operations
export const api = {
  // User operations
  users: {
    // Normalize arbitrary telegram identifier to a numeric form suitable for BIGINT columns
    normalizeTelegramIdForDb(telegramId: string): number {
      if (/^\d+$/.test(telegramId)) return Number(telegramId);
      let hash = 0;
      for (let i = 0; i < telegramId.length; i += 1) {
        hash = ((hash << 5) - hash) + telegramId.charCodeAt(i);
        hash |= 0; // 32-bit signed
      }
      return Math.abs(hash);
    },

    async getById(id: string): Promise<{
      id: string;
      telegram_id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      last_message_id?: number;
      last_chat_id?: number;
    } | null> {
      const { data, error } = await supabase
        .from('users')
        .select('id, telegram_id, first_name, last_name, username, last_message_id, last_chat_id')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async getByIds(userIds: string[]): Promise<Array<{
      id: string;
      telegram_id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    }>> {
      if (!userIds || userIds.length === 0) return [];
      const { data, error } = await supabase
        .from('users')
        .select('id, telegram_id, first_name, last_name, username')
        .in('id', userIds);
      if (error) throw error;
      return data as Array<{ id: string; telegram_id: number; first_name?: string; last_name?: string; username?: string }>;
    },
    async getByTelegramId(telegramId: string): Promise<{
      id: string;
      telegram_id: string;
      username?: string;
      first_name?: string;
      last_name?: string;
      last_message_id?: number;
      last_chat_id?: number;
      created_at: string;
      updated_at: string;
      last_free_coin_at?: string;
    } | null> {
      const normalized = this.normalizeTelegramIdForDb(telegramId);
      logFunctionStart('api.users.getByTelegramId', { telegramId, normalized });
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', normalized)
          .maybeSingle();
        if (error) {
          if ((error as unknown as { code?: string }).code === 'PGRST116') {
            logFunctionEnd('api.users.getByTelegramId', { found: false, normalized });
            return null;
          }
          throw error;
        }
        logFunctionEnd('api.users.getByTelegramId', { found: !!data, normalized });
        return data;
      } catch (err) {
        logError('api.users.getByTelegramId', err as Error, { telegramId, normalized });
        throw err as Error;
      }
    },

    async create(userData: {
      telegram_id: string | number;
      created_at?: string;
      updated_at?: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    }): Promise<{
      id: string;
      telegram_id: string;
      username?: string;
      first_name?: string;
      last_name?: string;
      created_at: string;
      updated_at: string;
      last_free_coin_at?: string;
    }> {
      const normalized = typeof userData.telegram_id === 'number' ? userData.telegram_id : this.normalizeTelegramIdForDb(String(userData.telegram_id));
      const payload = { ...userData, telegram_id: normalized } as any;
      const { data, error } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'telegram_id' })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
      // Fallback select in case returning is disabled
      const reselect = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', normalized)
        .maybeSingle();
      if (reselect.error) throw reselect.error;
      if (!reselect.data) throw new Error('User insert succeeded but could not reselect');
      return reselect.data as any;
    },

    async upsert(userData: { telegram_id: number; username?: string; first_name?: string; last_name?: string; }): Promise<{
      id: string;
      telegram_id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    }> {
      logFunctionStart('api.users.upsert', { telegram_id: userData.telegram_id });
      try {
        const { data, error } = await supabase
          .from('users')
          .upsert(userData, { onConflict: 'telegram_id' })
          .select('id, telegram_id, username, first_name, last_name')
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('User upsert failed');
        logFunctionEnd('api.users.upsert', { id: data.id });
        return data;
      } catch (err) {
        logError('api.users.upsert', err as Error, { telegram_id: userData.telegram_id });
        throw err as Error;
      }
    },



    async updateByTelegramId(telegramId: string, updates: Record<string, unknown>): Promise<void> {
      const normalized = this.normalizeTelegramIdForDb(telegramId);
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('telegram_id', normalized);
      
      if (error) throw error;
    },

    async getLastFreeCoinAt(telegramId: string): Promise<Record<string, unknown> | null> {
      const normalized = this.normalizeTelegramIdForDb(telegramId);
      const { data, error } = await supabase
        .from('users')
        .select('last_free_coin_at')
        .eq('telegram_id', normalized)
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Wallet operations
  wallets: {
    async getByUserId(userId: string): Promise<{
      balance: number;
    } | null> {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(walletData: { user_id: string; balance: number }): Promise<void> {
      const { error } = await supabase
        .from('wallets')
        .insert(walletData);
      
      if (error) throw error;
    },

    async updateBalance(userId: string, balance: number): Promise<void> {
      const { error } = await supabase
        .from('wallets')
        .update({ balance })
        .eq('user_id', userId);
      
      if (error) throw error;
    }
  },

  // Transaction operations
  transactions: {
    async create(transactionData: {
      user_id: string;
      transaction_type: 'credit' | 'debit';
      amount: number;
      balance_before: number;
      balance_after: number;
      description: string;
    }): Promise<void> {
      const { error } = await supabase
        .from('transactions')
        .insert(transactionData);
      
      if (error) throw error;
    }
  },

  // Room operations
  rooms: {
    async getById(roomUuid: string): Promise<Record<string, unknown> | null> {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomUuid)
        .maybeSingle();
      
      if (error) {
        if ((error as any).code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },

    async create(roomData: {
      id?: string;
      name: string;
      game_type: string;
      status: string;
      created_by: string;
      max_players: number;
      stake_amount: number;
      settings: Record<string, unknown>;
      is_private: boolean;
    }): Promise<Record<string, unknown>> {
      logFunctionStart('api.rooms.create', { created_by: roomData.created_by, max_players: roomData.max_players, stake_amount: roomData.stake_amount, is_private: roomData.is_private });
      try {
        const { data, error } = await supabase
          .from('rooms')
          .insert(roomData as any)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) {
          logFunctionEnd('api.rooms.create', { id: (data as { id?: string }).id });
          return data;
        }
        // Fallback: reselect by name + created_by (best effort)
        const reselect = await supabase
          .from('rooms')
          .select('*')
          .eq('name', roomData.name)
          .maybeSingle();
        if (reselect.error) throw reselect.error;
        if (!reselect.data) throw new Error('Room insert succeeded but could not reselect');
        logFunctionEnd('api.rooms.create', { id: (reselect.data as { id?: string }).id, via: 'reselect' });
        return reselect.data as any;
      } catch (err) {
        const e = err as Error & { code?: string; details?: unknown; hint?: unknown; message?: string };
        logError('api.rooms.create', e, { code: e.code, details: e.details, hint: e.hint, message: e.message });
        throw err as Error;
      }
    },

    async update(roomId: string, updates: Record<string, unknown>): Promise<Record<string, unknown>> {
      const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', roomId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(roomId: string): Promise<void> {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);
      
      if (error) throw error;
    },

    async getActiveRooms(): Promise<Record<string, unknown>[]> {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .in('status', ['waiting', 'playing'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getRoomsForPlayer(createdBy: string): Promise<Record<string, unknown>[]> {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('created_by', createdBy)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getByGameType(gameType: string): Promise<Record<string, unknown>[]> {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('game_type', gameType);
      
      if (error) throw error;
      return data;
    },

    async getByGameTypeAndMaxPlayers(gameType: string, maxPlayers: number): Promise<Record<string, unknown>[]> {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('game_type', gameType)
        .eq('max_players', maxPlayers);
      
      if (error) throw error;
      return data;
    }
  },

  // Game operations
  games: {
    async getByRoomId(roomId: string): Promise<Record<string, unknown>[]> {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async create(gameData: Record<string, unknown>): Promise<Record<string, unknown>> {
      const { data, error } = await supabase
        .from('games')
        .insert(gameData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(gameId: string, updates: Record<string, unknown>): Promise<Record<string, unknown>> {
      const { data, error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async getActiveForUser(): Promise<Record<string, unknown>[]> {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  },

  // Message operations
  messages: {
    async getByRoomId(roomId: string, limit = 50): Promise<Record<string, unknown>[]> {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },

    async create(messageData: {
      room_id: string;
      user_id: string;
      message: string;
      message_type: string;
    }): Promise<Record<string, unknown>> {
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Room message operations
  roomMessages: {
    async upsert(messageData: {
      room_id: string;
      user_id: string;
      message_id: number;
      chat_id: number;
      timestamp: string;
    }): Promise<void> {
      const { error } = await supabase
        .from('room_messages')
        .upsert(messageData);
      
      if (error) throw error;
    },

    async getByRoomAndUser(roomId: string, userId: string): Promise<Record<string, unknown> | null> {
      const { data, error } = await supabase
        .from('room_messages')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },

    async getAllByRoom(roomId: string): Promise<{
      room_id: string;
      user_id: string;
      message_id: number;
      chat_id: number;
      timestamp: string;
    }[]> {
      const { data, error } = await supabase
        .from('room_messages')
        .select('*')
        .eq('room_id', roomId);
      
      if (error) throw error;
      return data;
    },

    async deleteByRoomAndUser(roomId: string, userId: string): Promise<void> {
      const { error } = await supabase
        .from('room_messages')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);
      
      if (error) throw error;
    }
  },

  // Message tracking operations
  messageTracking: {
    async getByChatAndKey(chatId: number, messageKey: string): Promise<{
      id: string;
      chat_id: number;
      message_key: string;
      message_id: number;
      created_at: string;
      updated_at: string;
    } | null> {
      const { data, error } = await supabase
        .from('message_tracking')
        .select('*')
        .eq('chat_id', chatId)
        .eq('message_key', messageKey)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },

    async upsert(trackingData: {
      chat_id: number;
      message_key: string;
      message_id: number;
    }): Promise<void> {
      const { error } = await supabase
        .from('message_tracking')
        .upsert(trackingData, { onConflict: 'chat_id,message_key' });
      
      if (error) throw error;
    },

    async deleteByChatAndKey(chatId: number, messageKey: string): Promise<void> {
      const { error } = await supabase
        .from('message_tracking')
        .delete()
        .eq('chat_id', chatId)
        .eq('message_key', messageKey);
      
      if (error) throw error;
    },

    async deleteByChat(chatId: number): Promise<void> {
      const { error } = await supabase
        .from('message_tracking')
        .delete()
        .eq('chat_id', chatId);
      
      if (error) throw error;
    }
  }
}; 