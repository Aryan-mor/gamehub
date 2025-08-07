// No imports needed - using plugin system
import { POKER_ACTIONS, generateFormCallbackData } from '../../compact-codes';
import { GameHubContext } from '@/plugins';

/**
 * Button templates for poker room management
 * Uses compact action codes to stay within Telegram's 64-byte limit
 */

export function createPokerButtonTemplates(ctx: GameHubContext): Record<string, { text: string; callback_data: string }> {
  return {
  // Navigation buttons
  backToMenu: {
    text: ctx.t('🔙 Back to Menu'),
    callback_data: POKER_ACTIONS.BACK_TO_MENU
  },
  back: {
    text: ctx.t('🔙 Back'),
    callback_data: POKER_ACTIONS.BACK
  },
  
  // Room management buttons
  createRoom: {
    text: ctx.t('🏠 Create Room'),
    callback_data: POKER_ACTIONS.CREATE_ROOM
  },
  joinRoom: {
    text: ctx.t('🚪 Join Room'),
    callback_data: POKER_ACTIONS.JOIN_ROOM
  },
  listRooms: {
    text: ctx.t('📋 List Rooms'),
    callback_data: POKER_ACTIONS.LIST_ROOMS
  },
  roomInfo: {
    text: ctx.t('📊 Room Info'),
    callback_data: POKER_ACTIONS.ROOM_INFO
  },
  leaveRoom: {
    text: ctx.t('🚪 Leave Room'),
    callback_data: POKER_ACTIONS.LEAVE_ROOM
  },
  kickPlayer: {
    text: ctx.t('👢 Kick Player'),
    callback_data: POKER_ACTIONS.KICK_PLAYER
  },
  
  // Game control buttons
  startGame: {
    text: ctx.t('▶️ Start Game'),
    callback_data: POKER_ACTIONS.START_GAME
  },
  // Ready/Not Ready buttons removed - players are automatically ready
  
  // Game action buttons
  fold: {
    text: ctx.t('⬇️ Fold'),
    callback_data: POKER_ACTIONS.FOLD
  },
  check: {
    text: ctx.t('✅ Check'),
    callback_data: POKER_ACTIONS.CHECK
  },
  call: {
    text: ctx.t('📞 Call'),
    callback_data: POKER_ACTIONS.CALL
  },
  raise: {
    text: ctx.t('⬆️ Raise'),
    callback_data: POKER_ACTIONS.RAISE
  },
  allIn: {
    text: ctx.t('💥 All In'),
    callback_data: POKER_ACTIONS.ALL_IN
  },
  
  // Game state buttons
  playAgain: {
    text: ctx.t('🔄 Play Again'),
    callback_data: POKER_ACTIONS.PLAY_AGAIN
  },
  newGame: {
    text: ctx.t('🆕 New Game'),
    callback_data: POKER_ACTIONS.NEW_GAME
  },
  viewStats: {
    text: ctx.t('📊 View Stats'),
    callback_data: POKER_ACTIONS.VIEW_STATS
  },
  gameEnd: {
    text: ctx.t('🏁 Game End'),
    callback_data: POKER_ACTIONS.GAME_END
  },
  history: {
    text: ctx.t('📜 History'),
    callback_data: POKER_ACTIONS.HISTORY
  },
  
  // Spectator mode
  spectate: {
    text: ctx.t('👁️ Spectate'),
    callback_data: POKER_ACTIONS.SPECTATE
  },
  refresh: {
    text: '🔄 بروزرسانی',
    callback_data: POKER_ACTIONS.REFRESH
  },
  
  // Share functionality
  share: {
    text: '📤 اشتراک‌گذاری',
    callback_data: POKER_ACTIONS.SHARE
  },
  
  // Help
  help: {
    text: '❓ راهنما',
    callback_data: POKER_ACTIONS.HELP
  },
  
  // Form buttons using compact codes
  private: {
    text: '🔒 خصوصی',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'privacy', 'true')
  },
  public: {
    text: '🌐 عمومی',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'privacy', 'false')
  },
  maxPlayers2: {
    text: ctx.t('👥 2 Players'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'maxPlayers', '2')
  },
  maxPlayers4: {
    text: ctx.t('👥 4 Players'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'maxPlayers', '4')
  },
  maxPlayers6: {
    text: ctx.t('👥 6 Players'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'maxPlayers', '6')
  },
  maxPlayers8: {
    text: ctx.t('👥 8 Players'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'maxPlayers', '8')
  },
  smallBlind50: {
    text: ctx.t('💰 50'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'smallBlind', '50')
  },
  smallBlind100: {
    text: ctx.t('💰 100'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'smallBlind', '100')
  },
  smallBlind200: {
    text: ctx.t('💰 200'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'smallBlind', '200')
  },
  smallBlind500: {
    text: ctx.t('💰 500'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'smallBlind', '500')
  },
  timeout60: {
    text: ctx.t('⏱️ 60 seconds'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'timeout', '60')
  },
  timeout120: {
    text: ctx.t('⏱️ 2 minutes'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'timeout', '120')
  },
  timeout300: {
    text: ctx.t('⏱️ 5 minutes'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'timeout', '300')
  },
  timeout600: {
    text: ctx.t('⏱️ 10 minutes'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'timeout', '600')
  },
  confirmCreate: {
    text: ctx.t('✅ Confirm'),
    callback_data: POKER_ACTIONS.CREATE_ROOM_CONFIRM
  },
  editForm: {
    text: ctx.t('✏️ Edit'),
    callback_data: POKER_ACTIONS.CREATE_ROOM_EDIT
  },
  
  // Stake selection buttons
  stake2: {
    text: ctx.t('2'),
    callback_data: `${POKER_ACTIONS.STAKE_2}?amount=2`
  },
  stake5: {
    text: ctx.t('5'),
    callback_data: `${POKER_ACTIONS.STAKE_5}?amount=5`
  },
  stake10: {
    text: ctx.t('10'),
    callback_data: `${POKER_ACTIONS.STAKE_10}?amount=10`
  },
  stake20: {
    text: ctx.t('20'),
    callback_data: `${POKER_ACTIONS.STAKE_20}?amount=20`
  },
  stake50: {
    text: ctx.t('50'),
    callback_data: `${POKER_ACTIONS.STAKE_50}?amount=50`
  },
  
  // Raise amount buttons (will be replaced with roomId parameter)
  raise5: {
    text: ctx.t('💰 +5'),
    callback_data: `${POKER_ACTIONS.RAISE_5}?r={roomId}&amount=5`
  },
  raise10: {
    text: ctx.t('💰 +10'),
    callback_data: `${POKER_ACTIONS.RAISE_10}?r={roomId}&amount=10`
  },
  raise25: {
    text: ctx.t('💰 +25'),
    callback_data: `${POKER_ACTIONS.RAISE_25}?r={roomId}&amount=25`
  },
  raise50: {
    text: ctx.t('💰 +50'),
    callback_data: `${POKER_ACTIONS.RAISE_50}?r={roomId}&amount=50`
  },
  raise100: {
    text: ctx.t('💰 +100'),
    callback_data: `${POKER_ACTIONS.RAISE_100}?r={roomId}&amount=100`
  },
  };
} 