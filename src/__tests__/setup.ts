import { vi } from 'vitest';

// Simple in-memory stores
const users = new Map<string, { id: string; telegram_id: number; username?: string; first_name?: string; last_name?: string; last_message_id?: number; last_chat_id?: number }>();
const rooms = new Map<string, { id: string; name: string; game_type: string; status: string; created_by: string; max_players: number; stake_amount: number; settings: Record<string, unknown>; is_private: boolean; created_at: string }>();
const roomPlayers = new Map<string, Map<string, { is_ready: boolean; joined_at: string }>>(); // room_id -> user_id -> data
const messageTracking = new Map<string, { id: string; chat_id: number; message_key: string; message_id: number; created_at: string; updated_at: string }>(); // key: chat_id|message_key

function uuid(): string {
  // lightweight pseudo-uuid for tests
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Default to mock DB in tests unless explicitly disabled via TEST_USE_MOCK_DB=false
const USE_MOCK_DB = process.env.TEST_USE_MOCK_DB !== 'false';

// Mock high-level API used across app (delegates to real module when disabled)
vi.mock('@/lib/api', async () => {
  if (!USE_MOCK_DB) {
    const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
    return actual;
  }
  const api = {
    users: {
      normalizeTelegramIdForDb(telegramId: string): number {
        if (/^\d+$/.test(telegramId)) return Number(telegramId);
        let hash = 0;
        for (let i = 0; i < telegramId.length; i += 1) {
          hash = ((hash << 5) - hash) + telegramId.charCodeAt(i);
          hash |= 0;
        }
        return Math.abs(hash);
      },
      async getById(id: string) {
        for (const u of users.values()) if (u.id === id) return u;
        return null;
      },
      async getByIds(ids: string[]) {
        const idSet = new Set(ids);
        return Array.from(users.values()).filter((u) => idSet.has(u.id));
      },
      async getByTelegramId(telegramId: string) {
        const norm = api.users.normalizeTelegramIdForDb(telegramId);
        for (const u of users.values()) if (u.telegram_id === norm) return { ...u, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any;
        return null;
      },
      async upsert(userData: { telegram_id: number; username?: string; first_name?: string; last_name?: string; }) {
        const norm = Number(userData.telegram_id);
        let found: any;
        for (const u of users.values()) if (u.telegram_id === norm) { found = u; break; }
        if (found) {
          Object.assign(found, userData);
          return { id: found.id, telegram_id: found.telegram_id, username: found.username, first_name: found.first_name, last_name: found.last_name };
        }
        const id = uuid();
        const created = { id, telegram_id: norm, username: userData.username, first_name: userData.first_name, last_name: userData.last_name };
        users.set(id, created);
        return { id, telegram_id: norm, username: created.username, first_name: created.first_name, last_name: created.last_name };
      },
      async updateByTelegramId(telegramId: string, updates: Record<string, unknown>) {
        const norm = api.users.normalizeTelegramIdForDb(telegramId);
        for (const u of users.values()) if (u.telegram_id === norm) Object.assign(u, updates);
      },
      async getLastFreeCoinAt(_telegramId: string) {
        return null;
      },
    },
    wallets: {
      async getByUserId(_userId: string) { return { balance: 0 }; },
      async create(_walletData: { user_id: string; balance: number }) { return; },
      async updateBalance(_userId: string, _balance: number) { return; },
    },
    transactions: {
      async create(_t: any) { return; },
    },
    rooms: {
      async getById(roomUuid: string) { return rooms.get(roomUuid) ?? null; },
      async create(roomData: { id?: string; name: string; game_type: string; status: string; created_by: string; max_players: number; stake_amount: number; settings: Record<string, unknown>; is_private: boolean; }) {
        const id = roomData.id && /^[0-9a-fA-F-]{36}$/.test(roomData.id) ? roomData.id : uuid();
        if (rooms.has(id)) throw Object.assign(new Error('duplicate key value'), { code: '23505' });
        const created = { ...roomData, id, created_at: new Date().toISOString() };
        rooms.set(id, created);
        return created as any;
      },
      async update(roomId: string, updates: Record<string, unknown>) {
        const r = rooms.get(roomId);
        if (!r) throw new Error('Room not found');
        Object.assign(r, updates);
        return r as any;
      },
      async delete(roomId: string) { rooms.delete(roomId); },
      async getActiveRooms() { return Array.from(rooms.values()).filter((r) => ['waiting', 'playing'].includes(r.status)); },
      async getRoomsForPlayer(createdBy: string) { return Array.from(rooms.values()).filter((r) => r.created_by === createdBy); },
      async getByGameType(gameType: string) { return Array.from(rooms.values()).filter((r) => r.game_type === gameType); },
      async getByGameTypeAndMaxPlayers(gameType: string, maxPlayers: number) { return Array.from(rooms.values()).filter((r) => r.game_type === gameType && r.max_players === maxPlayers); },
    },
    games: {
      async getByRoomId(_roomId: string) { return []; },
      async create(gameData: Record<string, unknown>) { return { id: uuid(), ...gameData } as any; },
      async update(_gameId: string, updates: Record<string, unknown>) { return { ...updates } as any; },
      async getActiveForUser() { return []; },
    },
    messages: {
      async getByRoomId(_roomId: string, _limit = 50) { return []; },
      async create(messageData: { room_id: string; user_id: string; message: string; message_type: string; }) { return { id: uuid(), ...messageData } as any; },
    },
    roomMessages: {
      async upsert(_messageData: { room_id: string; user_id: string; message_id: number; chat_id: number; timestamp: string; }) { return; },
      async getByRoomAndUser(_roomId: string, _userId: string) { return null; },
      async getAllByRoom(_roomId: string) { return []; },
      async deleteByRoomAndUser(_roomId: string, _userId: string) { return; },
    },
    messageTracking: {
      async getByChatAndKey(chatId: number, messageKey: string) {
        const k = `${chatId}|${messageKey}`;
        return messageTracking.get(k) ?? null;
      },
      async upsert(trackingData: { chat_id: number; message_key: string; message_id: number; }) {
        const k = `${trackingData.chat_id}|${trackingData.message_key}`;
        const now = new Date().toISOString();
        messageTracking.set(k, { id: uuid(), chat_id: trackingData.chat_id, message_key: trackingData.message_key, message_id: trackingData.message_id, created_at: now, updated_at: now });
      },
      async deleteByChatAndKey(chatId: number, messageKey: string) {
        const k = `${chatId}|${messageKey}`;
        messageTracking.delete(k);
      },
      async deleteByChat(chatId: number) {
        for (const [k] of messageTracking) if (k.startsWith(`${chatId}|`)) messageTracking.delete(k);
      },
    },
  };
  return { api };
});

// Mock roomPlayers low-level module that hits supabase directly in real code
vi.mock('@/api/roomPlayers', async () => {
  if (!USE_MOCK_DB) {
    const actual = await vi.importActual<typeof import('@/api/roomPlayers')>('@/api/roomPlayers');
    return actual;
  }
  return {
    add: async (room_id: string, user_id: string, ready = false) => {
      if (!roomPlayers.has(room_id)) roomPlayers.set(room_id, new Map());
      roomPlayers.get(room_id)!.set(user_id, { is_ready: ready, joined_at: new Date().toISOString() });
    },
    remove: async (room_id: string, user_id: string) => {
      roomPlayers.get(room_id)?.delete(user_id);
    },
    setReady: async (room_id: string, user_id: string, ready: boolean) => {
      const rp = roomPlayers.get(room_id);
      if (!rp || !rp.has(user_id)) throw new Error('not found');
      rp.get(user_id)!.is_ready = ready;
    },
    listByRoom: async (room_id: string) => {
      return Array.from(roomPlayers.get(room_id)?.entries() ?? []).map(([uid, v]) => ({ user_id: uid, ready: v.is_ready }));
    },
    listActiveRoomsByUser: async (user_id: string) => {
      const res: Array<{ room_id: string }> = [];
      for (const [rid, rp] of roomPlayers.entries()) {
        if (rp.has(user_id)) res.push({ room_id: rid });
      }
      return res;
    },
    listOpenRoomsByUser: async (user_id: string) => {
      // Filter memberships where the corresponding room status is waiting/playing
      const result: Array<{ room_id: string; status: string; joined_at: string }> = [];
      for (const [rid, rp] of roomPlayers.entries()) {
        if (!rp.has(user_id)) continue;
        const room = rooms.get(rid);
        if (!room) continue;
        if (room.status === 'waiting' || room.status === 'playing') {
          const joined_at = rp.get(user_id)!.joined_at;
          result.push({ room_id: rid, status: room.status, joined_at });
        }
      }
      // Sort by joined_at descending
      result.sort((a, b) => (a.joined_at < b.joined_at ? 1 : -1));
      return result;
    },
  };
});

// Also mock DB healthcheck to always pass in tests
vi.mock('@/lib/supabase', async () => {
  if (!USE_MOCK_DB) {
    const actual = await vi.importActual<typeof import('@/lib/supabase')>('@/lib/supabase');
    return actual as unknown as Record<string, unknown>;
  }
  return {
    checkSupabaseConnectivity: async () => {},
    supabase: {} as unknown,
    default: {} as unknown,
  } as Record<string, unknown>;
});


