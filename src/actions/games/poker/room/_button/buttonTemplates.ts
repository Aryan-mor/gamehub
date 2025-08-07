import { } from '@/modules/core/buttonHelpers';
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
    text: ctx.t('bot.poker.buttons.navigation.backToMenu'),
    callback_data: POKER_ACTIONS.BACK_TO_MENU
  },
  back: {
    text: ctx.t('bot.poker.buttons.navigation.back'),
    callback_data: POKER_ACTIONS.BACK
  },
  
  // Room management buttons
  createRoom: {
    text: ctx.t('bot.poker.buttons.room.createRoom'),
    callback_data: POKER_ACTIONS.CREATE_ROOM
  },
  joinRoom: {
    text: ctx.t('bot.poker.buttons.room.joinRoom'),
    callback_data: POKER_ACTIONS.JOIN_ROOM
  },
  listRooms: {
    text: ctx.t('bot.poker.buttons.room.listRooms'),
    callback_data: POKER_ACTIONS.LIST_ROOMS
  },
  roomInfo: {
    text: ctx.t('bot.poker.buttons.room.roomInfo'),
    callback_data: POKER_ACTIONS.ROOM_INFO
  },
  leaveRoom: {
    text: ctx.t('bot.poker.buttons.room.leaveRoom'),
    callback_data: POKER_ACTIONS.LEAVE_ROOM
  },
  kickPlayer: {
    text: ctx.t('bot.poker.buttons.room.kickPlayer'),
    callback_data: POKER_ACTIONS.KICK_PLAYER
  },
  
  // Game control buttons
  startGame: {
    text: ctx.t('bot.poker.buttons.game.startGame'),
    callback_data: POKER_ACTIONS.START_GAME
  },
  // Ready/Not Ready buttons removed - players are automatically ready
  
  // Game action buttons
  fold: {
    text: ctx.t('bot.poker.actions.fold'),
    callback_data: POKER_ACTIONS.FOLD
  },
  check: {
    text: ctx.t('bot.poker.actions.check'),
    callback_data: POKER_ACTIONS.CHECK
  },
  call: {
    text: ctx.t('bot.poker.actions.call'),
    callback_data: POKER_ACTIONS.CALL
  },
  raise: {
    text: ctx.t('bot.poker.actions.raise'),
    callback_data: POKER_ACTIONS.RAISE
  },
  allIn: {
    text: ctx.t('bot.poker.actions.allIn'),
    callback_data: POKER_ACTIONS.ALL_IN
  },
  
  // Game state buttons
  playAgain: {
    text: ctx.t('bot.poker.buttons.game.playAgain'),
    callback_data: POKER_ACTIONS.PLAY_AGAIN
  },
  newGame: {
    text: ctx.t('bot.poker.buttons.game.newGame'),
    callback_data: POKER_ACTIONS.NEW_GAME
  },
  viewStats: {
    text: ctx.t('bot.poker.buttons.game.viewStats'),
    callback_data: POKER_ACTIONS.VIEW_STATS
  },
  gameEnd: {
    text: ctx.t('bot.poker.buttons.game.gameEnd'),
    callback_data: POKER_ACTIONS.GAME_END
  },
  history: {
    text: ctx.t('bot.poker.buttons.game.history'),
    callback_data: POKER_ACTIONS.HISTORY
  },
  
  // Spectator mode
  spectate: {
    text: ctx.t('bot.poker.buttons.game.spectate'),
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
    text: ctx.t('bot.poker.buttons.create.maxPlayers.2'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'maxPlayers', '2')
  },
  maxPlayers4: {
    text: ctx.t('bot.poker.buttons.create.maxPlayers.4'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'maxPlayers', '4')
  },
  maxPlayers6: {
    text: ctx.t('bot.poker.buttons.create.maxPlayers.6'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'maxPlayers', '6')
  },
  maxPlayers8: {
    text: ctx.t('bot.poker.buttons.create.maxPlayers.8'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'maxPlayers', '8')
  },
  smallBlind50: {
    text: ctx.t('bot.poker.buttons.create.smallBlind.50'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'smallBlind', '50')
  },
  smallBlind100: {
    text: ctx.t('bot.poker.buttons.create.smallBlind.100'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'smallBlind', '100')
  },
  smallBlind200: {
    text: ctx.t('bot.poker.buttons.create.smallBlind.200'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'smallBlind', '200')
  },
  smallBlind500: {
    text: ctx.t('bot.poker.buttons.create.smallBlind.500'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'smallBlind', '500')
  },
  timeout60: {
    text: ctx.t('bot.poker.buttons.create.timeout.60'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'timeout', '60')
  },
  timeout120: {
    text: ctx.t('bot.poker.buttons.create.timeout.120'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'timeout', '120')
  },
  timeout300: {
    text: ctx.t('bot.poker.buttons.create.timeout.300'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'timeout', '300')
  },
  timeout600: {
    text: ctx.t('bot.poker.buttons.create.timeout.600'),
    callback_data: generateFormCallbackData(POKER_ACTIONS.FORM_STEP, 'timeout', '600')
  },
  confirmCreate: {
    text: ctx.t('bot.poker.buttons.create.confirm'),
    callback_data: POKER_ACTIONS.CREATE_ROOM_CONFIRM
  },
  editForm: {
    text: ctx.t('bot.poker.buttons.create.edit'),
    callback_data: POKER_ACTIONS.CREATE_ROOM_EDIT
  },
  
  // Stake selection buttons
  stake2: {
    text: ctx.t('bot.poker.buttons.stake.2'),
    callback_data: `${POKER_ACTIONS.STAKE_2}?amount=2`
  },
  stake5: {
    text: ctx.t('bot.poker.buttons.stake.5'),
    callback_data: `${POKER_ACTIONS.STAKE_5}?amount=5`
  },
  stake10: {
    text: ctx.t('bot.poker.buttons.stake.10'),
    callback_data: `${POKER_ACTIONS.STAKE_10}?amount=10`
  },
  stake20: {
    text: ctx.t('bot.poker.buttons.stake.20'),
    callback_data: `${POKER_ACTIONS.STAKE_20}?amount=20`
  },
  stake50: {
    text: ctx.t('bot.poker.buttons.stake.50'),
    callback_data: `${POKER_ACTIONS.STAKE_50}?amount=50`
  },
  
  // Raise amount buttons (will be replaced with roomId parameter)
  raise5: {
    text: ctx.t('bot.poker.buttons.raise.5'),
    callback_data: `${POKER_ACTIONS.RAISE_5}?r={roomId}&amount=5`
  },
  raise10: {
    text: ctx.t('bot.poker.buttons.raise.10'),
    callback_data: `${POKER_ACTIONS.RAISE_10}?r={roomId}&amount=10`
  },
  raise25: {
    text: ctx.t('bot.poker.buttons.raise.25'),
    callback_data: `${POKER_ACTIONS.RAISE_25}?r={roomId}&amount=25`
  },
  raise50: {
    text: ctx.t('bot.poker.buttons.raise.50'),
    callback_data: `${POKER_ACTIONS.RAISE_50}?r={roomId}&amount=50`
  },
  raise100: {
    text: ctx.t('bot.poker.buttons.raise.100'),
    callback_data: `${POKER_ACTIONS.RAISE_100}?r={roomId}&amount=100`
  },
  };
} 