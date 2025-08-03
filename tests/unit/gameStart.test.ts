import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  validateGameStart,
  generateDeck,
  dealCardsToPlayers,
  determineGamePositions,
  determineNextTurn
} from '../../src/actions/games/poker/engine/gameStart';
import { PokerRoom, PlayerId } from '../../src/actions/games/poker/types';

// Mock the poker service
vi.mock('../../src/actions/games/poker/services/pokerService', () => ({
  getPokerRoom: vi.fn(),
  updatePokerRoom: vi.fn()
}));

describe('Game Start Engine', () => {
  let mockRoom: PokerRoom;
  let mockPlayerId: PlayerId;
  
  beforeEach(() => {
    mockPlayerId = '123' as PlayerId;
    
    mockRoom = {
      id: 'room_test123' as any,
      name: 'Test Room',
      status: 'waiting',
      players: [
        {
          id: '123' as PlayerId,
          name: 'Player 1',
          username: 'player1',
          chips: 1000,
          betAmount: 0,
          totalBet: 0,
          isReady: true,
          isFolded: false,
          isAllIn: false,
          isDealer: true,
          cards: [],
          joinedAt: Date.now()
        },
        {
          id: '456' as PlayerId,
          name: 'Player 2',
          username: 'player2',
          chips: 1000,
          betAmount: 0,
          totalBet: 0,
          isReady: true,
          isFolded: false,
          isAllIn: false,
          isDealer: false,
          cards: [],
          joinedAt: Date.now()
        }
      ],
      currentPlayerIndex: 0,
      dealerIndex: 0,
      smallBlindIndex: 0,
      bigBlindIndex: 0,
      pot: 0,
      currentBet: 0,
      minRaise: 10,
      deck: [],
      communityCards: [],
      bettingRound: 'preflop',
      smallBlind: 5,
      bigBlind: 10,
      minPlayers: 2,
      maxPlayers: 4,
      isPrivate: false,
      turnTimeoutSec: 60,
      createdBy: '123' as PlayerId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  });

  describe('validateGameStart', () => {
    it('should return valid for valid start conditions', () => {
      const result = validateGameStart(mockRoom, mockPlayerId);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid when player is not room creator', () => {
      const nonCreatorId = '789' as PlayerId;
      const result = validateGameStart(mockRoom, nonCreatorId);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('فقط سازنده روم می‌تواند بازی را شروع کند');
    });

    it('should return invalid when game is already started', () => {
      mockRoom.status = 'active';
      const result = validateGameStart(mockRoom, mockPlayerId);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('بازی قبلاً شروع شده است');
    });

    it('should return invalid when not enough players', () => {
      mockRoom.players = [mockRoom.players[0]]; // Only one player
      const result = validateGameStart(mockRoom, mockPlayerId);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('حداقل ۲ بازیکن برای شروع بازی نیاز است');
    });

    it('should return invalid when player has insufficient chips', () => {
      mockRoom.players[1].chips = 5; // Less than big blind (10)
      const result = validateGameStart(mockRoom, mockPlayerId);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('سکه کافی برای شروع بازی ندارد');
    });
  });

  describe('generateDeck', () => {
    it('should generate a deck of 52 cards', () => {
      const deck = generateDeck();
      
      expect(deck).toHaveLength(52);
    });

    it('should generate cards in correct format', () => {
      const deck = generateDeck();
      
      // Check that all cards are in the correct format (e.g., 'Ah', '7d', '10h')
      for (const card of deck) {
        expect(card).toMatch(/^(10|[2-9TJQKA])[hdcs]$/);
      }
    });

    it('should generate unique cards', () => {
      const deck = generateDeck();
      const uniqueCards = new Set(deck);
      
      expect(uniqueCards.size).toBe(52);
    });
  });

  describe('dealCardsToPlayers', () => {
    it('should deal 2 cards to each player', () => {
      const deck = generateDeck();
      const playerCount = 3;
      
      const { playerHands, remainingDeck } = dealCardsToPlayers(deck, playerCount);
      
      expect(playerHands).toHaveLength(playerCount);
      for (const hand of playerHands) {
        expect(hand).toHaveLength(2);
      }
      expect(remainingDeck).toHaveLength(52 - (playerCount * 2));
    });

    it('should throw error when not enough cards', () => {
      const smallDeck = ['Ah', '7d']; // Only 2 cards
      const playerCount = 3; // Need 6 cards
      
      expect(() => dealCardsToPlayers(smallDeck, playerCount)).toThrow('Not enough cards in deck');
    });
  });

  describe('determineGamePositions', () => {
    it('should determine correct positions for 2 players', () => {
      const positions = determineGamePositions(2);
      
      expect(positions.dealerIndex).toBe(0);
      expect(positions.smallBlindIndex).toBe(1);
      expect(positions.bigBlindIndex).toBe(0); // Wraps around
      expect(positions.currentTurnIndex).toBe(1);
    });

    it('should determine correct positions for 4 players', () => {
      const positions = determineGamePositions(4);
      
      expect(positions.dealerIndex).toBe(0);
      expect(positions.smallBlindIndex).toBe(1);
      expect(positions.bigBlindIndex).toBe(2);
      expect(positions.currentTurnIndex).toBe(3);
    });

    it('should handle edge case with 1 player', () => {
      const positions = determineGamePositions(1);
      
      expect(positions.dealerIndex).toBe(0);
      expect(positions.smallBlindIndex).toBe(0);
      expect(positions.bigBlindIndex).toBe(0);
      expect(positions.currentTurnIndex).toBe(0);
    });
  });

  describe('determineNextTurn', () => {
    it('should find next active player', () => {
      const room = {
        ...mockRoom,
        status: 'active',
        currentPlayerIndex: 0,
        players: [
          { ...mockRoom.players[0], hasFolded: false, isAllIn: false },
          { ...mockRoom.players[1], hasFolded: false, isAllIn: false }
        ]
      };
      
      const nextTurn = determineNextTurn(room);
      expect(nextTurn).toBe(1);
    });

    it('should skip folded players', () => {
      const room = {
        ...mockRoom,
        status: 'active',
        currentPlayerIndex: 0,
        players: [
          { ...mockRoom.players[0], hasFolded: false, isAllIn: false },
          { ...mockRoom.players[1], hasFolded: true, isAllIn: false }
        ]
      };
      
      const nextTurn = determineNextTurn(room);
      expect(nextTurn).toBe(0); // Should stay on current player since next is folded
    });

    it('should skip all-in players', () => {
      const room = {
        ...mockRoom,
        status: 'active',
        currentPlayerIndex: 0,
        players: [
          { ...mockRoom.players[0], hasFolded: false, isAllIn: false },
          { ...mockRoom.players[1], hasFolded: false, isAllIn: true }
        ]
      };
      
      const nextTurn = determineNextTurn(room);
      expect(nextTurn).toBe(0); // Should stay on current player since next is all-in
    });
  });
}); 