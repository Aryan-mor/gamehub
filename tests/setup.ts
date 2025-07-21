import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock environment variables
process.env.TELEGRAM_BOT_TOKEN = "test-token:test-token";
process.env.FIREBASE_DATABASE_URL = "https://test-project.firebaseio.com";
process.env.FIREBASE_PROJECT_ID = "test-project";
process.env.FIREBASE_PRIVATE_KEY = "test-private-key";
process.env.FIREBASE_CLIENT_EMAIL = "test@test.com";
process.env.TON_WALLET = "test-wallet-address";

// Create mock Firebase functions
const mockRef = vi.fn();
const mockSet = vi.fn();
const mockGet = vi.fn();
const mockPush = vi.fn();
const mockOnValue = vi.fn();
const mockOff = vi.fn();

// Mock Firebase database
vi.mock("firebase/database", () => ({
  ref: mockRef,
  set: mockSet,
  get: mockGet,
  push: mockPush,
  onValue: mockOnValue,
  off: mockOff,
  getDatabase: vi.fn(() => ({
    ref: mockRef,
    set: mockSet,
    get: mockGet,
    push: mockPush,
    onValue: mockOnValue,
    off: mockOff,
  })),
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}));

// Mock the Firebase database instance
vi.mock("../src/core/firebase", () => ({
  database: {
    ref: mockRef,
    set: mockSet,
    get: mockGet,
    push: mockPush,
  },
  default: {},
}));

// Mock Telegram Bot
vi.mock("node-telegram-bot-api", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      onText: vi.fn(),
      sendMessage: vi.fn(),
      answerCallbackQuery: vi.fn(),
      editMessageText: vi.fn(),
      getChatMember: vi.fn(),
      getMe: vi.fn(),
      setMyCommands: vi.fn(),
    })),
  };
});

// Global test utilities
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: vi.fn(),
  // debug: vi.fn(),
  // info: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
};

// Export mocks for use in tests
export { mockRef, mockSet, mockGet, mockPush, mockOnValue, mockOff };
