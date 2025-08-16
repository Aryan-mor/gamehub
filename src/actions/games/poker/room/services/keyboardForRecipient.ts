import type { Btn } from './views';

interface Params {
  isAdmin: boolean;
  roomId: string;
  isPlaying: boolean;
  isDetailed: boolean | undefined;
  playerCount: number;
  maxPlayers: number;
  actingUuid?: string;
  engineState?: any | null;
  currentBetGlobal: number;
  t: (k: string, options?: Record<string, unknown>) => string;
  seatPosByUuid: Record<string, number>;
  userUuid: string;
  userInfo?: { inHand?: boolean; stack?: number; bet?: number; hole?: string[] };
  adminUuid: string;
}

export async function buildKeyboardForRecipient(p: Params): Promise<Btn[][]> {
  if (p.isAdmin) {
    const { buildAdminKeyboard } = await import('./keyboardAdmin');
    return buildAdminKeyboard({
      roomId: p.roomId,
      isPlaying: p.isPlaying,
      isDetailed: p.isDetailed,
      playerCount: p.playerCount,
      maxPlayers: p.maxPlayers,
      actingUuid: p.actingUuid,
      currentBetGlobal: p.currentBetGlobal,
      t: p.t,
      engineState: p.engineState,
      adminUuid: p.adminUuid,
      adminInfo: p.userInfo,
      seatPosByUuid: p.seatPosByUuid,
    });
  }
  const { buildUserKeyboard } = await import('./keyboardUser');
  return buildUserKeyboard({
    roomId: p.roomId,
    isDetailed: p.isDetailed,
    isPlaying: p.isPlaying,
    playerCount: p.playerCount,
    maxPlayers: p.maxPlayers,
    actingUuid: p.actingUuid,
    engineState: p.engineState,
    seatPosByUuid: p.seatPosByUuid,
    userUuid: p.userUuid,
    userInfo: p.userInfo,
    currentBetGlobal: p.currentBetGlobal,
    t: p.t,
  });
}


