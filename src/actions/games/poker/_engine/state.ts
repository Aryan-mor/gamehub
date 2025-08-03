import { PokerRoom, PlayerId, RoomId, PokerPlayer, GameRound } from '../types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Game state interface for active poker games
 */
export interface PokerGameState {
  // Room information
  roomId: RoomId;
  roomName: string;
  status: 'active' | 'playing' | 'finished';
  
  // Player positions and roles
  players: PokerPlayer[];
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  currentTurnIndex: number;
  
  // Game state
  round: GameRound;
  pot: number;
  currentBet: number;
  minRaise: number;
  
  // Cards
  deck: string[];
  communityCards: string[];
  
  // Game metadata
  startedAt: number;
  lastActionAt: number;
  updatedAt: number;
  
  // Betting round state
  bettingRound: 'preflop' | 'flop' | 'turn' | 'river';
  bettingHistory: GameAction[];
  
  // Game settings
  smallBlind: number;
  bigBlind: number;
  turnTimeoutSec: number;
}

/**
 * Game action interface
 */
export interface GameAction {
  type: 'fold' | 'check' | 'call' | 'raise' | 'all-in';
  playerId: PlayerId;
  playerName: string;
  amount?: number;
  timestamp: number;
  round: GameRound;
}

/**
 * Manage and export current game state
 * Structure includes: players, pot, deck, turnIndex, communityCards, etc.
 */
export function initializeGameState(room: PokerRoom): PokerGameState {
  logFunctionStart('initializeGameState', { roomId: room.id });
  
  try {
    const gameState: PokerGameState = {
      // Room information
      roomId: room.id,
      roomName: room.name,
      status: room.status === 'waiting' ? 'active' : room.status,
      
      // Player positions and roles
      players: room.players,
      dealerIndex: room.dealerIndex,
      smallBlindIndex: room.smallBlindIndex,
      bigBlindIndex: room.bigBlindIndex,
      currentTurnIndex: room.currentPlayerIndex,
      
      // Game state
      round: room.round || 'pre-flop',
      pot: room.pot,
      currentBet: room.currentBet,
      minRaise: room.minRaise,
      
      // Cards
      deck: room.deck as string[],
      communityCards: room.communityCards || [],
      
      // Game metadata
      startedAt: room.startedAt || Date.now(),
      lastActionAt: room.lastActionAt || Date.now(),
      updatedAt: Date.now(),
      
      // Betting round state
      bettingRound: room.bettingRound || 'preflop',
      bettingHistory: [],
      
      // Game settings
      smallBlind: room.smallBlind,
      bigBlind: room.bigBlind,
      turnTimeoutSec: room.turnTimeoutSec
    };
    
    logFunctionEnd('initializeGameState', gameState, { roomId: room.id });
    return gameState;
  } catch (error) {
    logError('initializeGameState', error as Error, { roomId: room.id });
    throw error;
  }
}

/**
 * Update game state
 */
export function updateGameState(
  currentState: PokerGameState,
  updates: Partial<PokerGameState>
): PokerGameState {
  logFunctionStart('updateGameState', { roomId: currentState.roomId });
  
  try {
    const updatedState: PokerGameState = {
      ...currentState,
      ...updates,
      updatedAt: Date.now()
    };
    
    logFunctionEnd('updateGameState', updatedState, { roomId: currentState.roomId });
    return updatedState;
  } catch (error) {
    logError('updateGameState', error as Error, { roomId: currentState.roomId });
    throw error;
  }
}

/**
 * Get current player
 */
export function getCurrentPlayer(state: PokerGameState): PokerPlayer | null {
  if (state.currentTurnIndex >= 0 && state.currentTurnIndex < state.players.length) {
    return state.players[state.currentTurnIndex];
  }
  return null;
}

/**
 * Get player by ID
 */
export function getPlayerById(state: PokerGameState, playerId: PlayerId): PokerPlayer | null {
  return state.players.find(p => p.id === playerId) || null;
}

/**
 * Check if it's a player's turn
 */
export function isPlayerTurn(state: PokerGameState, playerId: PlayerId): boolean {
  const currentPlayer = getCurrentPlayer(state);
  return currentPlayer?.id === playerId;
}

/**
 * Get next player index
 */
export function getNextPlayerIndex(state: PokerGameState): number {
  const currentIndex = state.currentTurnIndex;
  const playerCount = state.players.length;
  
  // Find next active player
  for (let i = 1; i <= playerCount; i++) {
    const nextIndex = (currentIndex + i) % playerCount;
    const player = state.players[nextIndex];
    
    if (!player.hasFolded && !player.isAllIn) {
      return nextIndex;
    }
  }
  
  // If all players are folded or all-in, return current index
  return currentIndex;
}

/**
 * Move to next player
 */
export function moveToNextPlayer(state: PokerGameState): PokerGameState {
  const nextIndex = getNextPlayerIndex(state);
  return updateGameState(state, {
    currentTurnIndex: nextIndex,
    lastActionAt: Date.now()
  });
}

/**
 * Add game action to history
 */
export function addGameAction(
  state: PokerGameState,
  action: Omit<GameAction, 'timestamp' | 'round'>
): PokerGameState {
  const gameAction: GameAction = {
    ...action,
    timestamp: Date.now(),
    round: state.round
  };
  
  return updateGameState(state, {
    bettingHistory: [...state.bettingHistory, gameAction]
  });
}

/**
 * Get active players (not folded, not all-in)
 */
export function getActivePlayers(state: PokerGameState): PokerPlayer[] {
  return state.players.filter(p => !p.hasFolded && !p.isAllIn);
}

/**
 * Get players who can still act (not folded, not all-in, have chips)
 */
export function getActingPlayers(state: PokerGameState): PokerPlayer[] {
  return state.players.filter(p => !p.hasFolded && !p.isAllIn && p.chips > 0);
}

/**
 * Check if betting round is complete
 */
export function isBettingRoundComplete(state: PokerGameState): boolean {
  const activePlayers = getActivePlayers(state);
  const actingPlayers = getActingPlayers(state);
  
  // If only one active player, round is complete
  if (activePlayers.length <= 1) {
    return true;
  }
  
  // If no acting players, round is complete
  if (actingPlayers.length === 0) {
    return true;
  }
  
  // Check if all acting players have matched the current bet
  const unmatchedPlayers = actingPlayers.filter(p => p.betAmount < state.currentBet);
  
  return unmatchedPlayers.length === 0;
}

/**
 * Get game state summary for display
 */
export function getGameStateSummary(state: PokerGameState): {
  currentPlayer: PokerPlayer | null;
  activePlayers: number;
  pot: number;
  currentBet: number;
  round: string;
  communityCards: string[];
} {
  return {
    currentPlayer: getCurrentPlayer(state),
    activePlayers: getActivePlayers(state).length,
    pot: state.pot,
    currentBet: state.currentBet,
    round: state.round,
    communityCards: state.communityCards
  };
}

/**
 * Validate game state
 */
export function validateGameState(state: PokerGameState): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check if room ID exists
  if (!state.roomId) {
    errors.push('Room ID is missing');
  }
  
  // Check if players exist
  if (!state.players || state.players.length === 0) {
    errors.push('No players in game');
  }
  
  // Check if indices are valid
  if (state.dealerIndex < 0 || state.dealerIndex >= state.players.length) {
    errors.push('Invalid dealer index');
  }
  
  if (state.smallBlindIndex < 0 || state.smallBlindIndex >= state.players.length) {
    errors.push('Invalid small blind index');
  }
  
  if (state.bigBlindIndex < 0 || state.bigBlindIndex >= state.players.length) {
    errors.push('Invalid big blind index');
  }
  
  if (state.currentTurnIndex < 0 || state.currentTurnIndex >= state.players.length) {
    errors.push('Invalid current turn index');
  }
  
  // Check if deck exists
  if (!state.deck || state.deck.length === 0) {
    errors.push('Deck is missing or empty');
  }
  
  // Check if pot is valid
  if (state.pot < 0) {
    errors.push('Pot cannot be negative');
  }
  
  // Check if current bet is valid
  if (state.currentBet < 0) {
    errors.push('Current bet cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get current game state as string for debugging
 */
export function getGameStateString(state: PokerGameState): string {
  return `Game State:
    Room: ${state.roomName} (${state.roomId})
    Status: ${state.status}
    Players: ${state.players.length}
    Current Turn: ${state.currentTurnIndex} (${state.players[state.currentTurnIndex]?.name || 'Unknown'})
    Pot: ${state.pot}
    Current Bet: ${state.currentBet}
    Round: ${state.round}
    Betting Round: ${state.bettingRound}
    Community Cards: ${state.communityCards.length}
    Deck Size: ${state.deck.length}
  `;
} 