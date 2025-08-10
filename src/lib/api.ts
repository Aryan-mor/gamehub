// API client for database operations
// This replaces direct Supabase calls throughout the application

import { supabase } from './supabase';

// User operations
export const api = {
  // User operations
  users: {
    async getByTelegramId(telegramId: string): Promise<{
      id: string;
      telegram_id: string;
      username?: string;
      first_name?: string;
      last_name?: string;
      created_at: string;
      updated_at: string;
      last_free_coin_at?: string;
    } | null> {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(userData: {
      telegram_id: string;
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
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async updateByTelegramId(telegramId: string, updates: Record<string, unknown>): Promise<void> {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('telegram_id', telegramId);
      
      if (error) throw error;
    },

    async getLastFreeCoinAt(telegramId: string): Promise<Record<string, unknown> | null> {
      const { data, error } = await supabase
        .from('users')
        .select('last_free_coin_at')
        .eq('telegram_id', telegramId)
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
    async getById(roomId: string): Promise<Record<string, unknown> | null> {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_id', roomId)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(roomData: {
      room_id: string;
      name: string;
      game_type: string;
      status: string;
      created_by: string;
      max_players: number;
      stake_amount: number;
      settings: Record<string, unknown>;
      is_private: boolean;
    }): Promise<Record<string, unknown>> {
      const { data, error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(roomId: string, updates: Record<string, unknown>): Promise<Record<string, unknown>> {
      const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('room_id', roomId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(roomId: string): Promise<void> {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('room_id', roomId);
      
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
  }
}; 