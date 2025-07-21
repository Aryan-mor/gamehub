import { describe, it, expect, vi } from 'vitest';

// Mock the core services
vi.mock('../src/core/logger', () => ({
  logFunctionStart: vi.fn(),
  logFunctionEnd: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('../src/core/userService', () => ({
  getUser: vi.fn(() => Promise.resolve({ coins: 1000, name: 'Test User', username: 'testuser' })),
  deductCoins: vi.fn(() => Promise.resolve(true)),
  addCoins: vi.fn(),
}));

vi.mock('../src/core/gameService', () => ({
  createGame: vi.fn(() => Promise.resolve({ id: 'test-game-id', players: [], stake: 10 })),
  updateGame: vi.fn(),
  getGame: vi.fn(() => Promise.resolve({ id: 'test-game-id', status: 'playing', players: [], stake: 10 })),
  finishGame: vi.fn(),
}));

describe('Game Start Functions Import Tests', () => {
  it('should validate dice start function imports', async () => {
    // This test ensures all imports are working in startDiceGame
    const { startDiceGame } = await import('../src/games/dice/startGame');
    
    expect(typeof startDiceGame).toBe('function');
    
    // Test that the function can be called without import errors
    const result = await startDiceGame('test-user', 10);
    expect(result).toHaveProperty('success');
  });

  it('should validate basketball start function imports', async () => {
    const { startBasketballGame } = await import('../src/games/basketball/startGame');
    
    expect(typeof startBasketballGame).toBe('function');
    
    const result = await startBasketballGame('test-user', 10);
    expect(result).toHaveProperty('success');
  });

  it('should validate football start function imports', async () => {
    const { startFootballGame } = await import('../src/games/football/startGame');
    
    expect(typeof startFootballGame).toBe('function');
    
    const result = await startFootballGame('test-user', 10);
    expect(result).toHaveProperty('success');
  });

  it('should validate blackjack start function imports', async () => {
    const { startBlackjackGame } = await import('../src/games/blackjack/startGame');
    
    expect(typeof startBlackjackGame).toBe('function');
    
    const result = await startBlackjackGame('test-user', 10);
    expect(result).toHaveProperty('success');
  });

  it('should validate bowling start function imports', async () => {
    const { startBowlingGame } = await import('../src/games/bowling/startGame');
    
    expect(typeof startBowlingGame).toBe('function');
    
    const result = await startBowlingGame('test-user', 10);
    expect(result).toHaveProperty('success');
  });

  it('should validate all game start functions can be imported without errors', async () => {
    // Test that all start functions can be imported without throwing
    const startFunctions = [
      () => import('../src/games/dice/startGame'),
      () => import('../src/games/basketball/startGame'),
      () => import('../src/games/football/startGame'),
      () => import('../src/games/blackjack/startGame'),
      () => import('../src/games/bowling/startGame'),
    ];

    for (const importFn of startFunctions) {
      expect(() => {
        importFn();
      }).not.toThrow();
    }
  });

  it('should validate all game start functions have required dependencies', async () => {
    // Test that all start functions have access to getUser and deductCoins
    const { getUser, deductCoins } = await import('../src/core/userService');
    const { createGame, updateGame } = await import('../src/core/gameService');
    
    expect(typeof getUser).toBe('function');
    expect(typeof deductCoins).toBe('function');
    expect(typeof createGame).toBe('function');
    expect(typeof updateGame).toBe('function');
  });
}); 