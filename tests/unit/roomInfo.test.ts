import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getRoomInfoForUser,
  generateRoomInfoKeyboard,
  generateKickPlayerKeyboard
} from '../../src/actions/games/poker/utils/roomInfoHelper';
import { PokerRoom, PlayerId } from '../../src/actions/games/poker/types';

describe('Room Info Helper', () => {
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
          isReady: false,
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

  describe('getRoomInfoForUser', () => {
    it('should generate room info for creator', () => {
      const result = getRoomInfoForUser(mockRoom, mockPlayerId);
      
      expect(result).toContain('🏠 <b>اطلاعات روم پوکر</b>');
      expect(result).toContain('Test Room');
      expect(result).toContain('room_test123');
      expect(result).toContain('🌐 عمومی');
      expect(result).toContain('🧑‍💼');
      expect(result).toContain('(سازنده)');
      expect(result).toContain('📍');
      expect(result).toContain('(شما)');
      expect(result).toContain('شما می‌توانید بازی را شروع کنید');
    });

    it('should generate room info for regular player', () => {
      const regularPlayerId = '456' as PlayerId;
      const result = getRoomInfoForUser(mockRoom, regularPlayerId);
      
      expect(result).toContain('🏠 <b>اطلاعات روم پوکر</b>');
      expect(result).toContain('Test Room');
      expect(result).toContain('(سازنده)'); // Player 1 is the creator
      expect(result).toContain('📍');
      expect(result).toContain('(شما)');
      expect(result).toContain('منتظر شروع بازی توسط سازنده');
    });

    it('should handle private rooms', () => {
      mockRoom.isPrivate = true;
      const result = getRoomInfoForUser(mockRoom, mockPlayerId);
      
      expect(result).toContain('🔒 خصوصی');
    });

    it('should handle active game status', () => {
      mockRoom.status = 'active';
      mockRoom.pot = 100;
      mockRoom.round = 'pre-flop';
      const result = getRoomInfoForUser(mockRoom, mockPlayerId);
      
      expect(result).toContain('🎮 <b>بازی در حال اجرا</b>');
      expect(result).toContain('پات: 100 سکه');
      expect(result).toContain('دور: pre-flop');
    });

    it('should show ready status for players', () => {
      const result = getRoomInfoForUser(mockRoom, mockPlayerId);
      
      expect(result).toContain('✅'); // Ready player
      expect(result).toContain('⏳'); // Not ready player
    });
  });

  describe('generateRoomInfoKeyboard', () => {
    it('should generate keyboard for creator with start game button', () => {
      const result = generateRoomInfoKeyboard(mockRoom, mockPlayerId);
      
      // Should have start game button for creator
      const startGameButton = result.inline_keyboard.flat().find(btn => 
        btn.text === '🎮 شروع بازی'
      );
      expect(startGameButton).toBeDefined();
      
      // Should have kick player button
      const kickButton = result.inline_keyboard.flat().find(btn => 
        btn.text === '👢 اخراج بازیکن'
      );
      expect(kickButton).toBeDefined();
      
      // Should have refresh and leave buttons
      const refreshButton = result.inline_keyboard.flat().find(btn => 
        btn.text === '🔁 بروزرسانی'
      );
      expect(refreshButton).toBeDefined();
      
      const leaveButton = result.inline_keyboard.flat().find(btn => 
        btn.text === '🚪 خروج از روم'
      );
      expect(leaveButton).toBeDefined();
    });

    it('should not show start game button for non-creator', () => {
      const regularPlayerId = '456' as PlayerId;
      const result = generateRoomInfoKeyboard(mockRoom, regularPlayerId);
      
      const startGameButton = result.inline_keyboard.flat().find(btn => 
        btn.text === '🎮 شروع بازی'
      );
      expect(startGameButton).toBeUndefined();
      
      const kickButton = result.inline_keyboard.flat().find(btn => 
        btn.text === '👢 اخراج بازیکن'
      );
      expect(kickButton).toBeUndefined();
    });

    it('should not show start game button when not enough players', () => {
      mockRoom.players = [mockRoom.players[0]]; // Only one player
      const result = generateRoomInfoKeyboard(mockRoom, mockPlayerId);
      
      const startGameButton = result.inline_keyboard.flat().find(btn => 
        btn.text === '🎮 شروع بازی'
      );
      expect(startGameButton).toBeUndefined();
    });

    it('should not show start game button when game already started', () => {
      mockRoom.status = 'active';
      const result = generateRoomInfoKeyboard(mockRoom, mockPlayerId);
      
      const startGameButton = result.inline_keyboard.flat().find(btn => 
        btn.text === '🎮 شروع بازی'
      );
      expect(startGameButton).toBeUndefined();
    });

    it('should not show kick button when only one player', () => {
      mockRoom.players = [mockRoom.players[0]]; // Only one player
      const result = generateRoomInfoKeyboard(mockRoom, mockPlayerId);
      
      const kickButton = result.inline_keyboard.flat().find(btn => 
        btn.text === '👢 اخراج بازیکن'
      );
      expect(kickButton).toBeUndefined();
    });
  });

  describe('generateKickPlayerKeyboard', () => {
    it('should generate kick keyboard with player buttons', () => {
      const kickablePlayers = mockRoom.players.filter(p => p.id !== mockPlayerId);
      const result = generateKickPlayerKeyboard(mockRoom, kickablePlayers);
      
      // Should have kick buttons for each player
      const kickButtons = result.inline_keyboard.flat().filter(btn => 
        btn.text.startsWith('👢')
      );
      expect(kickButtons).toHaveLength(1); // Only one kickable player
      
      // Should have navigation buttons
      const backButton = result.inline_keyboard.flat().find(btn => 
        btn.text === '🔙 بازگشت به اطلاعات روم'
      );
      expect(backButton).toBeDefined();
      
      const menuButton = result.inline_keyboard.flat().find(btn => 
        btn.text === '🔙 بازگشت به منو'
      );
      expect(menuButton).toBeDefined();
    });

    it('should handle multiple kickable players', () => {
      // Add more players
      mockRoom.players.push({
        id: '789' as PlayerId,
        name: 'Player 3',
        username: 'player3',
        chips: 1000,
        betAmount: 0,
        totalBet: 0,
        isReady: true,
        isFolded: false,
        isAllIn: false,
        isDealer: false,
        cards: [],
        joinedAt: Date.now()
      });
      
      const kickablePlayers = mockRoom.players.filter(p => p.id !== mockPlayerId);
      const result = generateKickPlayerKeyboard(mockRoom, kickablePlayers);
      
      const kickButtons = result.inline_keyboard.flat().filter(btn => 
        btn.text.startsWith('👢')
      );
      expect(kickButtons).toHaveLength(2); // Two kickable players
    });
  });
}); 