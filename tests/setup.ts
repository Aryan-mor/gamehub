import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock environment variables
process.env.TELEGRAM_BOT_TOKEN = "test-token:test-token";
process.env.FIREBASE_DATABASE_URL = "https://test-project.firebaseio.com";
process.env.FIREBASE_PROJECT_ID = "test-project";
process.env.FIREBASE_PRIVATE_KEY = "test-private-key";
process.env.FIREBASE_CLIENT_EMAIL = "test@test.com";
process.env.TON_WALLET = "test-wallet-address";

// Mock Firebase
vi.mock("firebase/database", () => ({
  ref: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  push: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

// Mock the Firebase database instance
vi.mock("./src/lib/firebase", () => ({
  database: {
    ref: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    push: vi.fn(),
  },
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
