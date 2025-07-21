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

describe("Coin Service - Integration Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processGamePayout should pay out to winner and return payout/fee", async () => {
    // Arrange
    const mockRef = vi.fn();
    const mockSet = vi.fn().mockResolvedValue(undefined);
    const mockGet = vi.fn().mockResolvedValue({
      exists: () => true,
      val: () => ({ coins: 100 }),
    });
    const mockPush = vi.fn().mockResolvedValue({ key: "transfer-1" });

    vi.mocked(ref).mockReturnValue(
      mockRef as unknown as ReturnType<typeof ref>
    );
    vi.mocked(set).mockImplementation(mockSet);
    vi.mocked(get).mockImplementation(mockGet);
    vi.mocked(push).mockImplementation(mockPush);

    // Act
    const { processGamePayout } = await import("../../src/core/coinService");
    const result = await processGamePayout("winner1", 100, "game123");

    // Assert
    expect(result).toEqual({ payout: 90, fee: 10 });
    expect(update).toHaveBeenCalled();
    expect(push).toHaveBeenCalled();
  });

  it("processGameRefund should refund both players", async () => {
    // Arrange
    const mockRef = vi.fn();
    const mockSet = vi.fn().mockResolvedValue(undefined);
    const mockGet = vi.fn().mockResolvedValue({
      exists: () => true,
      val: () => ({ coins: 100 }),
    });
    const mockPush = vi.fn().mockResolvedValue({ key: "transfer-1" });

    vi.mocked(ref).mockReturnValue(
      mockRef as unknown as ReturnType<typeof ref>
    );
    vi.mocked(set).mockImplementation(mockSet);
    vi.mocked(get).mockImplementation(mockGet);
    vi.mocked(push).mockImplementation(mockPush);

    // Act
    const { processGameRefund } = await import("../../src/core/coinService");
    await processGameRefund("player1", "player2", 50, "game123");

    // Assert
    // Should call adjustCoins twice (once for each player)
    expect(update).toHaveBeenCalledTimes(2);
    expect(push).toHaveBeenCalledTimes(2);
  });

      it("deductStake should deduct the correct amount from user", async () => {
      // Arrange
      vi.mocked(ref).mockReturnValue({} as any);
      vi.mocked(update).mockResolvedValue(undefined);
      vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => ({ coins: 100 }) } as any);

      // Act
      const { deductStake } = await import("../../src/core/coinService");
      const result = await deductStake("user123", 25, "game123");

      // Assert
      expect(result).toBe(true);
      expect(update).toHaveBeenCalled();
    });
});
