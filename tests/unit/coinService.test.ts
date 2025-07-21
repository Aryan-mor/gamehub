import { describe, it, expect, beforeEach, vi } from "vitest";
import { ref, get, set, update, push } from "firebase/database";

// Mock Firebase
vi.mock("firebase/database", () => ({
  ref: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  push: vi.fn(),
}));



describe("Coin Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("adjustCoins", () => {
    it("should add coins to user balance", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(update).mockResolvedValue(undefined);
      vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => ({ coins: 100 }) } as any);

      // Act
      const { adjustCoins } = await import("../../src/core/coinService");
      await adjustCoins("123456789", 50, "test", "test-game");

      // Assert
      expect(update).toHaveBeenCalled();
    });

    it("should handle user with no existing balance", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(update).mockResolvedValue(undefined);
      vi.mocked(get).mockResolvedValue({ exists: () => false, val: () => null } as any);

      // Act
      const { adjustCoins } = await import("../../src/core/coinService");
      await adjustCoins("123456789", 100, "test", "test-game");

      // Assert
      expect(update).toHaveBeenCalled();
    });

    it("should throw error for insufficient balance", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => ({ coins: 50 }) } as any);

      // Act & Assert
      const { adjustCoins } = await import("../../src/core/coinService");
      await expect(
        adjustCoins("123456789", -100, "test", "test-game")
      ).rejects.toThrow("Insufficient balance");
    });
  });

  describe("getUserCoins", () => {
    it("should return user data with default coins for new user", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(get).mockResolvedValue({ exists: () => false, val: () => null } as any);

      // Act
      const { getUserCoins } = await import("../../src/core/coinService");
      const coins = await getUserCoins("123456789");

      // Assert
      expect(coins).toBe(0);
    });

    it("should return existing user data", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => ({ coins: 150 }) } as any);

      // Act
      const { getUserCoins } = await import("../../src/core/coinService");
      const coins = await getUserCoins("123456789");

      // Assert
      expect(coins).toBe(150);
    });
  });

  describe("requireBalance", () => {
    it("should return true when user has sufficient balance", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => ({ coins: 200 }) } as any);

      // Act
      const { requireBalance } = await import("../../src/core/coinService");
      const result = await requireBalance("123456789", 100);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when user has insufficient balance", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => ({ coins: 50 }) } as any);

      // Act
      const { requireBalance } = await import("../../src/core/coinService");
      const result = await requireBalance("123456789", 100);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("Coin Service - Additional Functions", () => {
    it("getBalance should return the user's coin balance", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => ({ coins: 200 }) } as any);

      // Act
      const { getBalance } = await import("../../src/core/coinService");
      const balance = await getBalance("123456789");
      expect(balance).toBe(200);
    });

    it("logTransfer should push a transfer to Firebase", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(push).mockResolvedValue({ key: "transfer-1" } as any);

      // Act
      const { logTransfer } = await import("../../src/core/coinService");
      await logTransfer({
        fromId: "user1",
        toId: "user2",
        amount: 50,
        reason: "test",
        gameId: "game123",
      });

      // Assert
      expect(push).toHaveBeenCalled();
    });

    it("deductStake should deduct the correct amount from user", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(update).mockResolvedValue(undefined);
      vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => ({ coins: 100 }) } as any);

      // Act
      const { deductStake } = await import("../../src/core/coinService");
      const result = await deductStake("123456789", 25, "game123");

      // Assert
      expect(result).toBe(true);
      expect(update).toHaveBeenCalled();
    });
  });
});
