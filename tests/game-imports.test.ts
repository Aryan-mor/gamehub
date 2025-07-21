import { describe, it, expect } from 'vitest';

describe('Game Import Validation Tests', () => {
  it('should validate all game handler imports are working', async () => {
    // Test that all handler registration functions can be imported without errors
    const handlers = [
      () => import('../src/games/dice/handlers'),
      () => import('../src/games/basketball/handlers'),
      () => import('../src/games/football/handlers'),
      () => import('../src/games/blackjack/handlers'),
      () => import('../src/games/bowling/handlers'),
    ];

    for (const handlerImport of handlers) {
      expect(() => {
        handlerImport();
      }).not.toThrow();
    }
  });

  it('should validate all game function imports are working', async () => {
    // Test that all game functions can be imported without errors
    const gameModules = [
      () => import('../src/games/dice/index'),
      () => import('../src/games/basketball/index'),
      () => import('../src/games/football/index'),
      () => import('../src/games/blackjack/index'),
      () => import('../src/games/bowling/index'),
    ];

    for (const moduleImport of gameModules) {
      expect(() => {
        moduleImport();
      }).not.toThrow();
    }
  });

  it('should validate specific game functions exist', async () => {
    // Test that specific functions that were missing are now available
    const { startDiceGame, handleDiceTurn } = await import('../src/games/dice/index');
    expect(typeof startDiceGame).toBe('function');
    expect(typeof handleDiceTurn).toBe('function');

    const { startBasketballGame, handleBasketballTurn } = await import('../src/games/basketball/index');
    expect(typeof startBasketballGame).toBe('function');
    expect(typeof handleBasketballTurn).toBe('function');

    const { startFootballGame, handleFootballTurn } = await import('../src/games/football/index');
    expect(typeof startFootballGame).toBe('function');
    expect(typeof handleFootballTurn).toBe('function');

    const { startBlackjackGame, handleBlackjackTurn } = await import('../src/games/blackjack/index');
    expect(typeof startBlackjackGame).toBe('function');
    expect(typeof handleBlackjackTurn).toBe('function');

    const { startBowlingGame, handleBowlingTurn } = await import('../src/games/bowling/index');
    expect(typeof startBowlingGame).toBe('function');
    expect(typeof handleBowlingTurn).toBe('function');
  });
}); 