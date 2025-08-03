/**
 * Compact action codes for poker game
 * These short codes help reduce callback_data length to stay within Telegram's 64-byte limit
 * All codes start with 'gp' (game poker) to avoid conflicts with other games
 */

// Room management actions
export const POKER_ACTIONS = {
  // Room creation and management
  CREATE_ROOM: 'gpc',           // Create Poker Game
  CREATE_ROOM_FORM: 'gpcf',     // Create Room Form
  CREATE_ROOM_CONFIRM: 'gpcc',  // Create Room Confirm
  CREATE_ROOM_EDIT: 'gpce',     // Create Room Edit
  JOIN_ROOM: 'gpj',             // Join Poker Game
  LEAVE_ROOM: 'gpl',            // Leave Poker Game
  LIST_ROOMS: 'gpls',           // List Rooms
  ROOM_INFO_OLD: 'gpri',        // Room Information (legacy)
  KICK_PLAYER: 'gpk',           // Kick Player
  
  // Game control
  START_GAME: 'gpsg',           // Start Game
  READY: 'gprd',                // Ready
  NOT_READY: 'gpnr',            // Not Ready
  
  // Game actions
  FOLD: 'gpfld',                // Fold
  CHECK: 'gpchk',               // Check
  CALL: 'gpcall',               // Call
  RAISE: 'gprse',               // Raise
  ALL_IN: 'gpall',              // All In
  
  // Game state
  PLAY_AGAIN: 'gppa',           // Play Again
  NEW_GAME: 'gpng',             // New Game
  VIEW_STATS: 'gpvs',           // View Stats
  GAME_END: 'gpge',             // Game End
  HISTORY: 'gph',               // History
  READY_TOGGLE: 'gprdy',        // Ready Toggle
  REFRESH_GAME: 'gpref',        // Refresh Game
  ROOM_INFO: 'gpinf',           // Room Info
  
  // Spectator mode
  SPECTATE: 'gpsp',             // Spectate
  REFRESH: 'gprf',              // Refresh
  
  // Share functionality
  SHARE: 'gpsh',                // Share Room
  
  // Navigation
  START: 'gpst',                // Start Poker Game
  BACK: 'gpbk',                 // Back
  BACK_TO_MENU: 'gpbt',         // Back to Menu
  HELP: 'gphlp',                // Help
  
  // Stake selection
  STAKE_2: 'gps2',              // Stake 2
  STAKE_5: 'gps5',              // Stake 5
  STAKE_10: 'gps10',            // Stake 10
  STAKE_20: 'gps20',            // Stake 20
  STAKE_50: 'gps50',            // Stake 50
  
  // Raise amounts
  RAISE_5: 'gpr5',              // Raise +5
  RAISE_10: 'gpr10',            // Raise +10
  RAISE_25: 'gpr25',            // Raise +25
  RAISE_50: 'gpr50',            // Raise +50
  RAISE_100: 'gpr100',          // Raise +100
  
  // Form actions (ultra-short codes for long parameters)
  FORM_STEP: 'gpfst',           // Form Step
  FORM_NAME: 'gpfnm',           // Form Name
  FORM_PRIVACY: 'gpfpr',        // Form Privacy
  FORM_PLAYERS: 'gpfpl',        // Form Players
  FORM_BLIND: 'gpfbl',          // Form Blind
  FORM_TIMEOUT: 'gpftm',        // Form Timeout
} as const;

export type PokerActionCode = typeof POKER_ACTIONS[keyof typeof POKER_ACTIONS];

/**
 * Action code descriptions for debugging
 */
export const POKER_ACTION_DESCRIPTIONS: Record<PokerActionCode, string> = {
  [POKER_ACTIONS.CREATE_ROOM]: 'Create Poker Room',
  [POKER_ACTIONS.CREATE_ROOM_FORM]: 'Create Room Form',
  [POKER_ACTIONS.CREATE_ROOM_CONFIRM]: 'Create Room Confirm',
  [POKER_ACTIONS.CREATE_ROOM_EDIT]: 'Create Room Edit',
  [POKER_ACTIONS.JOIN_ROOM]: 'Join Poker Room',
  [POKER_ACTIONS.LEAVE_ROOM]: 'Leave Poker Room',
  [POKER_ACTIONS.LIST_ROOMS]: 'List Poker Rooms',
  [POKER_ACTIONS.ROOM_INFO_OLD]: 'Room Information (Legacy)',
  [POKER_ACTIONS.ROOM_INFO]: 'Room Information',
  [POKER_ACTIONS.READY_TOGGLE]: 'Ready Toggle',
  [POKER_ACTIONS.REFRESH_GAME]: 'Refresh Game',
  [POKER_ACTIONS.KICK_PLAYER]: 'Kick Player',
  [POKER_ACTIONS.START_GAME]: 'Start Poker Game',
  [POKER_ACTIONS.READY]: 'Set Player Ready',
  [POKER_ACTIONS.NOT_READY]: 'Set Player Not Ready',
  [POKER_ACTIONS.FOLD]: 'Fold Hand',
  [POKER_ACTIONS.CHECK]: 'Check',
  [POKER_ACTIONS.CALL]: 'Call Bet',
  [POKER_ACTIONS.RAISE]: 'Raise Bet',
  [POKER_ACTIONS.ALL_IN]: 'All In',
  [POKER_ACTIONS.PLAY_AGAIN]: 'Play Again',
  [POKER_ACTIONS.NEW_GAME]: 'New Game',
  [POKER_ACTIONS.VIEW_STATS]: 'View Statistics',
  [POKER_ACTIONS.GAME_END]: 'Game End',
  [POKER_ACTIONS.HISTORY]: 'Game History',
  [POKER_ACTIONS.SPECTATE]: 'Spectate Game',
  [POKER_ACTIONS.REFRESH]: 'Refresh View',
  [POKER_ACTIONS.SHARE]: 'Share Room',
  [POKER_ACTIONS.START]: 'Start Poker Game',
  [POKER_ACTIONS.BACK]: 'Go Back',
  [POKER_ACTIONS.BACK_TO_MENU]: 'Back to Menu',
  [POKER_ACTIONS.HELP]: 'Poker Help',
  [POKER_ACTIONS.STAKE_2]: 'Stake 2 Coins',
  [POKER_ACTIONS.STAKE_5]: 'Stake 5 Coins',
  [POKER_ACTIONS.STAKE_10]: 'Stake 10 Coins',
  [POKER_ACTIONS.STAKE_20]: 'Stake 20 Coins',
  [POKER_ACTIONS.STAKE_50]: 'Stake 50 Coins',
  [POKER_ACTIONS.RAISE_5]: 'Raise +5',
  [POKER_ACTIONS.RAISE_10]: 'Raise +10',
  [POKER_ACTIONS.RAISE_25]: 'Raise +25',
  [POKER_ACTIONS.RAISE_50]: 'Raise +50',
  [POKER_ACTIONS.RAISE_100]: 'Raise +100',
  [POKER_ACTIONS.FORM_STEP]: 'Form Step',
  [POKER_ACTIONS.FORM_NAME]: 'Form Name',
  [POKER_ACTIONS.FORM_PRIVACY]: 'Form Privacy',
  [POKER_ACTIONS.FORM_PLAYERS]: 'Form Players',
  [POKER_ACTIONS.FORM_BLIND]: 'Form Blind',
  [POKER_ACTIONS.FORM_TIMEOUT]: 'Form Timeout',
};

/**
 * Calculate callback data length for a given action and parameters
 */
export function calculateCallbackDataLength(action: PokerActionCode, params: Record<string, string> = {}): number {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const callbackData = queryString ? `${action}?${queryString}` : action;
  return callbackData.length;
}

/**
 * Check if callback data would exceed Telegram's 64-byte limit
 */
export function isCallbackDataTooLong(action: PokerActionCode, params: Record<string, string> = {}): boolean {
  return calculateCallbackDataLength(action, params) > 64;
}

/**
 * Get the maximum room ID length that can be used with a given action
 */
export function getMaxRoomIdLength(action: PokerActionCode): number {
  // Calculate: 64 - action.length - "?r=".length - 1 (for safety)
  return 64 - action.length - 3 - 1;
}

/**
 * Generate compact callback data for form actions
 * Uses ultra-short parameter names to stay within 64-byte limit
 */
export function generateFormCallbackData(
  action: PokerActionCode,
  step: string,
  value: string,
  additionalParams: Record<string, string> = {}
): string {
  const params = {
    s: step,        // step
    v: value,       // value
    ...additionalParams
  };
  
  const queryString = Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join('&');
  
  return `${action}?${queryString}`;
}

/**
 * Parse compact callback data for form actions
 */
export function parseFormCallbackData(callbackData: string): {
  action: string;
  step?: string;
  value?: string;
  params: Record<string, string>;
} {
  const [action, queryString] = callbackData.split('?');
  const params: Record<string, string> = {};
  
  if (queryString) {
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });
  }
  
  return {
    action,
    step: params.s,
    value: params.v,
    params
  };
} 