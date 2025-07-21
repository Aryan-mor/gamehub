import { describe, it, expect, beforeEach, vi } from "vitest";
import { ref, get, set, update, remove } from "firebase/database";
import { GameType, GameStatus, GameResult } from "../../src/core/types";

// Mock Firebase
vi.mock("firebase/database", () => ({
  ref: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));



describe("Game Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Game Management", () => {
    it("should create a new game", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(set).mockResolvedValue(undefined);

      // Act
      const { createGame } = await import("../../src/core/gameService");
      await createGame(GameType.DICE, { id: "123", name: "Test User", username: "testuser", coins: 100 }, 10);

      // Assert
      expect(set).toHaveBeenCalled();
    });

    it("should get a game by ID", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(get).mockResolvedValue({
        exists: () => true,
        val: () => ({
          id: "game123",
          type: GameType.DICE,
          status: GameStatus.PLAYING,
          players: [],
          currentPlayerIndex: 0,
          stake: 10,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          data: {},
        }),
      } as any);

      // Act
      const { getGame } = await import("../../src/core/gameService");
      const result = await getGame("game123");

      // Assert
      expect(result).toBeDefined();
      expect(get).toHaveBeenCalled();
    });

    it("should update a game", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(update).mockResolvedValue(undefined);

      // Act
      const { updateGame } = await import("../../src/core/gameService");
      await updateGame("game123", { status: GameStatus.PLAYING });

      // Assert
      expect(update).toHaveBeenCalled();
    });

    it("should finish a game", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(update).mockResolvedValue(undefined);

      // Act
      const { finishGame } = await import("../../src/core/gameService");
      await finishGame("game123", {
        winner: "player1",
        loser: "player2",
        isDraw: false,
        coinsWon: 10,
        coinsLost: 10,
      });

      // Assert
      expect(update).toHaveBeenCalled();
    });

    it("should delete a game", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(remove).mockResolvedValue(undefined);

      // Act
      const { deleteGame } = await import("../../src/core/gameService");
      await deleteGame("game123");

      // Assert
      expect(remove).toHaveBeenCalled();
    });
  });
});
