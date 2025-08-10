import type { PokerRoom } from './roomStore';
import * as memoryStore from './roomStore';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

function useDb(): boolean {
  return process.env.GAMEHUB_USE_DB === 'true';
}

export function createRoom(params: Omit<PokerRoom, 'players' | 'readyPlayers' | 'playerNames'>): PokerRoom {
  logFunctionStart('roomService.createRoom', { roomId: params.id, createdBy: params.createdBy });
  if (!useDb()) {
    const created = memoryStore.createRoom(params);
    logFunctionEnd('roomService.createRoom', { mode: 'memory', roomId: created.id });
    return created;
  }
  // Try DB, fallback to memory if unavailable
  try {
    const created: PokerRoom = {
      ...params,
      players: [params.createdBy],
      readyPlayers: [],
      turnTimeoutSec: params.turnTimeoutSec ?? 240,
      lastUpdate: Date.now(),
      playerNames: {},
    };
    // Fire-and-forget persist to DB with error logging
    void (async () => {
      try {
        const repo = await import('@/actions/games/poker/services/roomRepo');
        await repo.createRoom(params);
      } catch (err) {
        logError('roomService.createRoom.persist', err as Error, { roomId: params.id });
      }
    })();
    // Also keep memory copy for immediate reads
    memoryStore.createRoom(params);
    logFunctionEnd('roomService.createRoom', { mode: 'db+memory', roomId: created.id });
    return created;
  } catch (err) {
    logError('roomService.createRoom', err as Error, { roomId: params.id });
    const created = memoryStore.createRoom(params);
    logFunctionEnd('roomService.createRoom', { mode: 'fallback-memory', roomId: created.id });
    return created;
  }
}

export function getRoom(roomId: string): PokerRoom | undefined {
  if (!useDb()) {
    return memoryStore.getRoom(roomId);
  }
  // Prefer memory first for speed; fallback to DB
  const mem = memoryStore.getRoom(roomId);
  if (mem) return mem;
  try {
    // Async DB fetch is not suitable for current sync API; return undefined here
    // Handlers that need strict DB can switch to async repo directly later.
    void (async () => {
      try {
        const repo = await import('./roomRepo');
        await repo.getRoom(roomId);
      } catch {}
    })();
  } catch {}
  return undefined;
}

export function addPlayer(roomId: string, userId: string, displayName?: string): void {
  memoryStore.addPlayer(roomId, userId, displayName);
  if (useDb()) {
    void (async () => {
      try {
        const repo = await import('./roomRepo');
        await repo.addPlayer(roomId, userId);
      } catch {}
    })();
  }
}

export function removePlayer(roomId: string, userId: string): void {
  memoryStore.removePlayer(roomId, userId);
  if (useDb()) {
    void (async () => {
      try {
        const repo = await import('./roomRepo');
        await repo.removePlayer(roomId, userId);
      } catch {}
    })();
  }
}

export function markReady(roomId: string, userId: string): void {
  memoryStore.markReady(roomId, userId);
  if (useDb()) {
    void (async () => {
      try {
        const repo = await import('./roomRepo');
        await repo.setReady(roomId, userId, true);
      } catch {}
    })();
  }
}

export function markNotReady(roomId: string, userId: string): void {
  memoryStore.markNotReady(roomId, userId);
  if (useDb()) {
    void (async () => {
      try {
        const repo = await import('./roomRepo');
        await repo.setReady(roomId, userId, false);
      } catch {}
    })();
  }
}


