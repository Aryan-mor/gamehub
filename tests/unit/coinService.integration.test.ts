import { describe, it, expect, vi } from "vitest";

vi.mock("firebase/database", () => ({
  ref: vi.fn(),
  set: vi.fn(),
  get: vi.fn().mockResolvedValue({
    exists: () => true,
    val: () => ({ coins: 100 }),
  }),
  push: vi.fn(),
}));

describe("Coin Service - Integration Functions", () => {
  it("processGamePayout should pay out to winner and return payout/fee", async () => {
    const adjustCoinsMock = vi.fn().mockResolvedValue(undefined);
    const { processGamePayout } = await import("../../src/lib/coinService");
    const result = await processGamePayout(
      "winner1",
      100,
      "game-1",
      adjustCoinsMock
    );
    expect(adjustCoinsMock).toHaveBeenCalledWith(
      "winner1",
      100,
      "game_win",
      "game-1"
    );
    expect(result).toEqual({ payout: 100, fee: 0 });
  });

  it("processGameRefund should refund both players", async () => {
    const adjustCoinsMock = vi.fn().mockResolvedValue(undefined);
    const { processGameRefund } = await import("../../src/lib/coinService");
    await processGameRefund(
      "player1",
      "player2",
      30,
      "game-2",
      adjustCoinsMock
    );
    expect(adjustCoinsMock).toHaveBeenCalledWith(
      "player1",
      30,
      "game_draw_refund",
      "game-2"
    );
    expect(adjustCoinsMock).toHaveBeenCalledWith(
      "player2",
      30,
      "game_draw_refund",
      "game-2"
    );
  });

  it("deductStake should deduct the correct amount from user", async () => {
    const adjustCoinsMock = vi.fn().mockResolvedValue(undefined);
    const { deductStake } = await import("../../src/lib/coinService");
    await deductStake("user1", 40, "game-3", adjustCoinsMock);
    expect(adjustCoinsMock).toHaveBeenCalledWith(
      "user1",
      -40,
      "game_stake",
      "game-3"
    );
  });
});
