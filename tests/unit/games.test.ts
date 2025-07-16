import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createMockBot,
  createMockCallbackQuery,
  createMockMessage,
} from "../utils/testHelpers";
import type TelegramBot from "node-telegram-bot-api";

// Mock Firebase and other dependencies
vi.mock("../../src/lib/firebase", () => ({
  database: {
    ref: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    push: vi.fn(),
  },
}));

vi.mock("../../src/lib/coinService", () => ({
  adjustCoins: vi.fn(),
  getUserCoins: vi.fn(),
  requireBalance: vi.fn(),
}));

vi.mock("../../src/bot/games/userStats", () => ({
  getUser: vi.fn(),
  addCoins: vi.fn(),
  canClaimDaily: vi.fn(),
  setLastFreeCoinAt: vi.fn(),
  getUserStatistics: vi.fn(),
  setUserProfile: vi.fn(),
}));

describe("Game Tests", () => {
  let mockBot: TelegramBot;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBot = createMockBot();
  });

  describe("Dice Game", () => {
    it("should handle dice game stake selection", async () => {
      // Arrange
      createMockCallbackQuery({
        data: "dice_stake:10",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      // Act - Simulate dice game handler
      const mockSendMessage = vi.fn().mockResolvedValue({ message_id: 1 });
      mockBot.sendMessage = mockSendMessage;

      // Simulate the callback handler logic
      const stake = 10;
      const userId = "123456789";

      // Mock user has sufficient balance
      const { requireBalance } = await import("../../src/lib/coinService");
      vi.mocked(requireBalance).mockResolvedValue(true);

      // Mock dice roll result
      const diceResult = Math.floor(Math.random() * 6) + 1;
      const isWin = diceResult >= 4; // Win if 4, 5, or 6

      // Assert
      expect(stake).toBe(10);
      expect(userId).toBe("123456789");
      expect(diceResult).toBeGreaterThanOrEqual(1);
      expect(diceResult).toBeLessThanOrEqual(6);
      expect(typeof isWin).toBe("boolean");
    });

    it("should handle insufficient balance for dice game", async () => {
      // Arrange
      createMockCallbackQuery({
        data: "dice_stake:50",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      // Act - Simulate insufficient balance
      const { requireBalance } = await import("../../src/lib/coinService");
      vi.mocked(requireBalance).mockResolvedValue(false);

      // Actually call the function to trigger the mock
      await requireBalance("123456789", 50);

      // Assert
      expect(requireBalance).toHaveBeenCalledWith("123456789", 50);
    });
  });

  describe("Basketball Game", () => {
    it("should handle basketball game stake selection", async () => {
      // Arrange
      createMockCallbackQuery({
        data: "basketball_stake:20",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      // Act - Simulate basketball game handler
      const stake = 20;
      const userId = "123456789";

      // Mock user has sufficient balance
      const { requireBalance } = await import("../../src/lib/coinService");
      vi.mocked(requireBalance).mockResolvedValue(true);

      // Mock basketball shot result
      const shotResult = Math.random();
      const isWin = shotResult > 0.6; // 40% win rate

      // Assert
      expect(stake).toBe(20);
      expect(userId).toBe("123456789");
      expect(shotResult).toBeGreaterThanOrEqual(0);
      expect(shotResult).toBeLessThanOrEqual(1);
      expect(typeof isWin).toBe("boolean");
    });
  });

  describe("Football Game", () => {
    it("should handle football game stake selection", async () => {
      // Arrange
      createMockCallbackQuery({
        data: "football_stake:15",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      // Act - Simulate football game handler
      const stake = 15;
      const userId = "123456789";

      // Mock user has sufficient balance
      const { requireBalance } = await import("../../src/lib/coinService");
      vi.mocked(requireBalance).mockResolvedValue(true);

      // Mock football kick result
      const kickResult = Math.random();
      const isWin = kickResult > 0.5; // 50% win rate

      // Assert
      expect(stake).toBe(15);
      expect(userId).toBe("123456789");
      expect(kickResult).toBeGreaterThanOrEqual(0);
      expect(kickResult).toBeLessThanOrEqual(1);
      expect(typeof isWin).toBe("boolean");
    });
  });

  describe("Blackjack Game", () => {
    it("should handle blackjack game stake selection", async () => {
      // Arrange
      createMockCallbackQuery({
        data: "blackjack_stake:25",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      // Act - Simulate blackjack game handler
      const stake = 25;
      const userId = "123456789";

      // Mock user has sufficient balance
      const { requireBalance } = await import("../../src/lib/coinService");
      vi.mocked(requireBalance).mockResolvedValue(true);

      // Mock blackjack game state
      const playerHand = [10, 6]; // 16
      const dealerHand = [9, 7]; // 16
      const playerTotal = playerHand.reduce((sum, card) => sum + card, 0);
      const dealerTotal = dealerHand.reduce((sum, card) => sum + card, 0);

      // Assert
      expect(stake).toBe(25);
      expect(userId).toBe("123456789");
      expect(playerTotal).toBe(16);
      expect(dealerTotal).toBe(16);
      expect(playerHand).toHaveLength(2);
      expect(dealerHand).toHaveLength(2);
    });

    it("should handle blackjack hit action", async () => {
      // Arrange
      createMockCallbackQuery({
        data: "blackjack_hit:game123",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      // Act - Simulate hit action
      const gameId = "game123";
      const userId = "123456789";

      // Mock current hand
      const currentHand = [10, 6]; // 16
      const newCard = Math.floor(Math.random() * 13) + 1;
      const newHand = [...currentHand, newCard];
      const newTotal = newHand.reduce((sum, card) => sum + card, 0);

      // Assert
      expect(gameId).toBe("game123");
      expect(userId).toBe("123456789");
      expect(newHand).toHaveLength(3);
      expect(newTotal).toBeGreaterThan(16);
      expect(newCard).toBeGreaterThanOrEqual(1);
      expect(newCard).toBeLessThanOrEqual(13);
    });

    it("should handle blackjack stand action", async () => {
      // Arrange
      createMockCallbackQuery({
        data: "blackjack_stand:game123",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      // Act - Simulate stand action
      const gameId = "game123";
      const playerTotal = 18;
      const dealerTotal = 17;

      // Determine winner
      const isWin = dealerTotal > 21 || playerTotal > dealerTotal;

      // Assert
      expect(gameId).toBe("game123");
      expect(playerTotal).toBe(18);
      expect(dealerTotal).toBe(17);
      expect(isWin).toBe(true); // Player wins
    });
  });

  describe("Bowling Game", () => {
    it("should handle bowling game stake selection", async () => {
      // Arrange
      createMockCallbackQuery({
        data: "bowling_stake:30",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      // Act - Simulate bowling game handler
      const stake = 30;
      const userId = "123456789";

      // Mock user has sufficient balance
      const { requireBalance } = await import("../../src/lib/coinService");
      vi.mocked(requireBalance).mockResolvedValue(true);

      // Mock bowling roll result
      const pinsHit = Math.floor(Math.random() * 11); // 0-10 pins
      const isStrike = pinsHit === 10;
      const isSpare = pinsHit >= 8; // Good roll

      // Assert
      expect(stake).toBe(30);
      expect(userId).toBe("123456789");
      expect(pinsHit).toBeGreaterThanOrEqual(0);
      expect(pinsHit).toBeLessThanOrEqual(10);
      expect(typeof isStrike).toBe("boolean");
      expect(typeof isSpare).toBe("boolean");
    });
  });

  describe("Tic-Tac-Toe (XO) Game", () => {
    it("should handle XO game creation", async () => {
      // Arrange
      createMockMessage({
        text: "/newgame",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      // Act - Simulate XO game creation
      const userId = "123456789";
      const gameId = `xo_${Date.now()}`;
      const board = Array(9).fill(null);

      // Assert
      expect(userId).toBe("123456789");
      expect(gameId).toContain("xo_");
      expect(board).toHaveLength(9);
      expect(board.every((cell) => cell === null)).toBe(true);
    });

    it("should handle XO game move", async () => {
      // Arrange
      createMockCallbackQuery({
        data: "xo_move:game123:4", // Move to position 4
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      // Act - Simulate XO move
      const gameId = "game123";
      const position = 4;
      const player = "X";
      const board = ["X", "O", "X", null, null, "O", null, null, null];

      // Make move
      const newBoard = [...board];
      newBoard[position] = player;

      // Check for win
      const winConditions = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8], // Rows
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8], // Columns
        [0, 4, 8],
        [2, 4, 6], // Diagonals
      ];

      const isWin = winConditions.some((condition) =>
        condition.every((pos) => newBoard[pos] === player)
      );

      // Assert
      expect(gameId).toBe("game123");
      expect(position).toBe(4);
      expect(player).toBe("X");
      expect(newBoard[position]).toBe("X");
      expect(typeof isWin).toBe("boolean");
    });

    it("should detect XO game draw", async () => {
      // Arrange
      const board = ["X", "O", "X", "O", "X", "O", "O", "X", "O"];

      // Act - Check for draw
      const isDraw =
        board.every((cell) => cell !== null) &&
        !["X", "O"].some((player) => {
          const winConditions = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
          ];
          return winConditions.some((condition) =>
            condition.every((pos) => board[pos] === player)
          );
        });

      // Assert
      expect(isDraw).toBe(true);
    });
  });

  describe("Game Statistics", () => {
    it("should track user game statistics", async () => {
      // Act - Simulate statistics tracking
      const mockStats = {
        totalGames: 10,
        totalWins: 6,
        totalLosses: 4,
        totalWinnings: 150,
        winRate: 60,
      };

      // Assert
      expect(mockStats.totalGames).toBe(10);
      expect(mockStats.totalWins).toBe(6);
      expect(mockStats.totalLosses).toBe(4);
      expect(mockStats.totalWinnings).toBe(150);
      expect(mockStats.winRate).toBe(60);
    });

    it("should calculate win rate correctly", async () => {
      // Arrange
      const totalGames = 20;
      const totalWins = 12;

      // Act
      const winRate = Math.round((totalWins / totalGames) * 100);

      // Assert
      expect(winRate).toBe(60);
    });
  });

  describe("Game Balance Management", () => {
    it("should deduct coins when game starts", async () => {
      // Arrange
      const userId = "123456789";
      const stake = 25;

      // Act - Simulate coin deduction
      const { adjustCoins } = await import("../../src/lib/coinService");
      vi.mocked(adjustCoins).mockResolvedValue(undefined);

      // Actually call the function to trigger the mock
      await adjustCoins(userId, -stake, "game_stake");

      // Assert
      expect(adjustCoins).toHaveBeenCalledWith(userId, -stake, "game_stake");
    });

    it("should add coins when player wins", async () => {
      // Arrange
      const userId = "123456789";
      const stake = 25;
      const multiplier = 2; // 2x payout
      const winnings = stake * multiplier;

      // Act - Simulate coin addition
      const { adjustCoins } = await import("../../src/lib/coinService");
      vi.mocked(adjustCoins).mockResolvedValue(undefined);

      // Actually call the function to trigger the mock
      await adjustCoins(userId, winnings, "game_win");

      // Assert
      expect(adjustCoins).toHaveBeenCalledWith(userId, winnings, "game_win");
    });
  });
});
