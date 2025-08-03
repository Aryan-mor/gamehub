import { ButtonTemplate } from '@/modules/core/buttonHelpers';
import { POKER_ACTIONS, generateFormCallbackData } from '../../compact-codes';

/**
 * Button templates for poker room management
 * Uses compact action codes to stay within Telegram's 64-byte limit
 */

export const pokerButtonTemplates = {
  // Navigation buttons
  backToMenu: {
    text: '🔙 بازگشت به منو',
    callback_data: POKER_ACTIONS.BACK_TO_MENU
  },
  back: {
    text: '🔙 بازگشت',
    callback_data: POKER_ACTIONS.BACK
  },
  
  // Room management buttons
  createRoom: {
    text: '🏠 ساخت روم',
    callback_data: POKER_ACTIONS.CREATE_ROOM
  },
  joinRoom: {
    text: '🚪 ورود به روم',
    callback_data: POKER_ACTIONS.JOIN_ROOM
  },
  listRooms: {
    text: '📋 لیست روم‌ها',
    callback_data: POKER_ACTIONS.LIST_ROOMS
  },
  roomInfo: {
    text: '📊 اطلاعات روم',
    callback_data: POKER_ACTIONS.ROOM_INFO
  },
  leaveRoom: {
    text: '🚪 خروج از روم',
    callback_data: POKER_ACTIONS.LEAVE_ROOM
  },
  kickPlayer: {
    text: '👢 اخراج بازیکن',
    callback_data: POKER_ACTIONS.KICK_PLAYER
  },
  
  // Game control buttons
  startGame: {
    text: '🎮 شروع بازی',
    callback_data: POKER_ACTIONS.START_GAME
  },
  ready: {
    text: '✅ آماده',
    callback_data: POKER_ACTIONS.READY
  },
  notReady: {
    text: '❌ آماده نیستم',
    callback_data: POKER_ACTIONS.NOT_READY
  },
  
  // Game action buttons
  fold: {
    text: '❌ تخلیه',
    callback_data: POKER_ACTIONS.FOLD
  },
  check: {
    text: '👁️ بررسی',
    callback_data: POKER_ACTIONS.CHECK
  },
  call: {
    text: '🃏 برابری',
    callback_data: POKER_ACTIONS.CALL
  },
  raise: {
    text: '💰 افزایش',
    callback_data: POKER_ACTIONS.RAISE
  },
  allIn: {
    text: '🔥 همه چیز',
    callback_data: POKER_ACTIONS.ALL_IN
  },
  
  // Game state buttons
  playAgain: {
    text: '🔄 بازی دوباره',
    callback_data: POKER_ACTIONS.PLAY_AGAIN
  },
  newGame: {
    text: '🆕 بازی جدید',
    callback_data: POKER_ACTIONS.NEW_GAME
  },
  viewStats: {
    text: '📊 آمار',
    callback_data: POKER_ACTIONS.VIEW_STATS
  },
  gameEnd: {
    text: '🏁 پایان بازی',
    callback_data: POKER_ACTIONS.GAME_END
  },
  history: {
    text: '📜 تاریخچه',
    callback_data: POKER_ACTIONS.HISTORY
  },
  
  // Spectator mode
  spectate: {
    text: '👁️ تماشا',
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
    text: '👥 ۲ نفر',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'maxPlayers', '2')
  },
  maxPlayers4: {
    text: '👥 ۴ نفر',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'maxPlayers', '4')
  },
  maxPlayers6: {
    text: '👥 ۶ نفر',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'maxPlayers', '6')
  },
  maxPlayers8: {
    text: '👥 ۸ نفر',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'maxPlayers', '8')
  },
  smallBlind50: {
    text: '💰 ۵۰',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'smallBlind', '50')
  },
  smallBlind100: {
    text: '💰 ۱۰۰',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'smallBlind', '100')
  },
  smallBlind200: {
    text: '💰 ۲۰۰',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'smallBlind', '200')
  },
  smallBlind500: {
    text: '💰 ۵۰۰',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'smallBlind', '500')
  },
  timeout60: {
    text: '⏱️ ۶۰ ثانیه',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'timeout', '60')
  },
  timeout120: {
    text: '⏱️ ۲ دقیقه',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'timeout', '120')
  },
  timeout300: {
    text: '⏱️ ۵ دقیقه',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'timeout', '300')
  },
  timeout600: {
    text: '⏱️ ۱۰ دقیقه',
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'timeout', '600')
  },
  confirmCreate: {
    text: '✅ ساخت روم',
    callback_data: POKER_ACTIONS.CREATE_ROOM_CONFIRM
  },
  editForm: {
    text: '✏️ ویرایش',
    callback_data: POKER_ACTIONS.CREATE_ROOM_EDIT
  },
  
  // Stake selection buttons
  stake2: {
    text: '2 Coins',
    callback_data: `${POKER_ACTIONS.STAKE_2}?amount=2`
  },
  stake5: {
    text: '5 Coins',
    callback_data: `${POKER_ACTIONS.STAKE_5}?amount=5`
  },
  stake10: {
    text: '10 Coins',
    callback_data: `${POKER_ACTIONS.STAKE_10}?amount=10`
  },
  stake20: {
    text: '20 Coins',
    callback_data: `${POKER_ACTIONS.STAKE_20}?amount=20`
  },
  stake50: {
    text: '50 Coins',
    callback_data: `${POKER_ACTIONS.STAKE_50}?amount=50`
  },
  
  // Raise amount buttons (will be replaced with roomId parameter)
  raise5: {
    text: '+5',
    callback_data: `${POKER_ACTIONS.RAISE_5}?r={roomId}&amount=5`
  },
  raise10: {
    text: '+10',
    callback_data: `${POKER_ACTIONS.RAISE_10}?r={roomId}&amount=10`
  },
  raise25: {
    text: '+25',
    callback_data: `${POKER_ACTIONS.RAISE_25}?r={roomId}&amount=25`
  },
  raise50: {
    text: '+50',
    callback_data: `${POKER_ACTIONS.RAISE_50}?r={roomId}&amount=50`
  },
  raise100: {
    text: '+100',
    callback_data: `${POKER_ACTIONS.RAISE_100}?r={roomId}&amount=100`
  },
} as const; 