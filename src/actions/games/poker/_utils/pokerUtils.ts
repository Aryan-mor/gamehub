// Re-export all the missing functions and types that are causing TypeScript errors

// Import types
export type { 
  RoomId, 
  PlayerId, 
  GameId, 
  PokerRoom, 
  PokerPlayer, 
  Card, 
  HandType, 
  HandEvaluation,
  BettingRound,
  RoomStatus,
  GameRound,
  Suit,
  Rank
} from '../types';

// Import validation functions
export { 
  validateRoomId, 
  validatePlayerId, 
  validateGameId,
  isValidRoomId,
  isValidPlayerId,
  isValidGameId
} from './typeGuards';

// Import error handling functions
export { 
  createUserFriendlyError, 
  validateRoomIdWithError, 
  validatePlayerIdWithError,
  validateAmountWithError,
  createPokerError,
  PokerGameError,
  ERROR_MESSAGES
} from './errorHandler';

// Import card utilities
export { 
  getCardDisplay, 
  getHandDisplay, 
  getHandTypeDisplay,
  createDeck,
  shuffleDeck,
  dealCards,
  evaluateHand,
  findBestHand
} from './cardUtils';

// Import service functions
export { 
  getPokerRoom,
  getActivePokerRooms,
  getPokerRoomsForPlayer,
  updatePokerRoom,
  createPokerRoom,
  joinPokerRoom,
  leavePokerRoom,
  deletePokerRoom,
  updatePlayerReadyStatus,
  kickPlayerFromRoom,
  updatePlayerInfo
} from '../services/pokerService';

// Import game state functions
export { 
  processBettingAction,
  getGameStateDisplay
} from '../services/gameStateService';

// Import game result functions
export { 
  getGameResultDisplay
} from '../services/gameResultService';

// Import room info functions
export { 
  getRoomInfoForUser,
  generateRoomInfoKeyboard
} from './roomInfoHelper';

// Import keyboard generation functions
export { 
  generateGameActionKeyboard
} from './gameActionKeyboardGenerator';

// Import button helper functions
export { 
  generateRoomManagementKeyboard
} from '../buttonHelpers';

// Import message management functions
export { 
  storePlayerMessage,
  getPlayerMessage,
  removePlayerMessage
} from '../services/roomMessageService';

// Import notification functions
export { 
  notifyPlayerLeft
} from '../services/roomMessageService';

// Import logging functions
export { 
  logFunctionStart, 
  logFunctionEnd, 
  logError 
} from '@/modules/core/logger';

// Import message updater
export { 
  getMessageUpdater 
} from '@/modules/core/messageUpdater';

// Import active user handler
export { 
  handlePokerActiveUser 
} from '../_engine/activeUser';

// Import compact router
export { register } from '@/modules/core/compact-router';

// Import POKER_ACTIONS
export { POKER_ACTIONS } from '../compact-codes'; 