/**
 * Route alias encoder/decoder
 * 
 * Encodes hierarchical routes like `games.poker.room.create` into a compact,
 * dot-separated alias like `g.pk.r.cr`, and decodes back. Unknown segments are
 * left as-is to preserve forward compatibility.
 */

interface SegmentMaps {
  segmentToCode: Record<string, string>;
  codeToSegment: Record<string, string>;
}

function buildMaps(): SegmentMaps {
  // Keep mappings short and readable; extend as needed.
  const segmentToCode: Record<string, string> = {
    // Top-level
    games: 'g',
    financial: 'fin',
    start: 'st',
    help: 'h',

    // Games
    poker: 'pk',

    // Common modules
    room: 'r',
    stake: 'sk',
    stats: 'ss',
    game: 'gm',
    gameEnd: 'ge',
    back: 'bk',
    management: 'mg',
    findRoom: 'find',
    join: 'jn',
    leave: 'lv',

    // Room actions
    create: 'cr',
    list: 'ls',
    info: 'in',
    init: 'it',
    share: 'sh',
    kick: 'kk',
    startgame: 'sg', // optional synonym if used
    startGame: 'sg',
    ready: 'ry',
    notready: 'nry',
    refresh: 'rf',

    // Gameplay actions
    call: 'cl',
    check: 'ck',
    raise: 'rs',
    fold: 'fd',
    allin: 'ai',
  };

  const codeToSegment: Record<string, string> = {};
  for (const [segment, code] of Object.entries(segmentToCode)) {
    // Last write wins if duplicates; ensure unique codes when adding
    codeToSegment[code] = segment;
  }

  return { segmentToCode, codeToSegment };
}

const maps = buildMaps();

/**
 * Encode a full route (e.g., `games.poker.room.create`) into a compact alias (e.g., `g.pk.r.cr`).
 * Unknown segments are left unchanged.
 */
export function encodeAction(route: string): string {
  if (!route) return route;
  const parts = route.split('.');
  const encoded = parts.map((p) => maps.segmentToCode[p] ?? p);
  return encoded.join('.');
}

/**
 * Decode a compact alias back to the full route. If tokens are not recognized
 * codes, they are left as-is, so passing a full route is a no-op.
 */
export function decodeAction(aliasOrRoute: string): string {
  if (!aliasOrRoute) return aliasOrRoute;
  const parts = aliasOrRoute.split('.');
  const decoded = parts.map((p) => maps.codeToSegment[p] ?? p);
  return decoded.join('.');
}

/**
 * Utility: determine if a route looks encoded (heuristic). Not required for core
 * flow, but can be useful for debugging or conditional logic.
 */
export function isProbablyEncoded(value: string): boolean {
  const parts = value.split('.');
  // If all parts are known codes, we consider it encoded.
  return parts.length > 0 && parts.every((p) => maps.codeToSegment[p] !== undefined);
}


