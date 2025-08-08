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
  processBettingAction
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

// Keyboard generation moved to PokerKeyboardService

// Import button helper functions - moved to plugin system
// export { 
//   generateRoomManagementKeyboard
// } from '../buttonHelpers';

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

// Message updater removed; use ctx.replySmart from SmartReply plugin

// Import active user handler
export { 
  handlePokerActiveUser 
} from '../_engine/activeUser';

// smart-router is used for registration via auto-discovery

// compact codes removed