import type TelegramBot from "node-telegram-bot-api";
import { vi } from "vitest";

export interface MockMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
    language_code?: string;
  };
  chat: {
    id: number;
    first_name: string;
    username?: string;
    type: "private" | "group" | "supergroup" | "channel";
  };
  date: number;
  text?: string;
}

export interface MockCallbackQuery {
  id: string;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  message?: MockMessage;
  chat_instance: string;
  data?: string;
}

export const createMockMessage = (
  overrides: Partial<MockMessage> = {}
): MockMessage => ({
  message_id: 1,
  from: {
    id: 123456789,
    is_bot: false,
    first_name: "Test User",
    username: "testuser",
  },
  chat: {
    id: 123456789,
    first_name: "Test User",
    username: "testuser",
    type: "private",
  },
  date: Math.floor(Date.now() / 1000),
  text: "/start",
  ...overrides,
});

export const createMockCallbackQuery = (
  overrides: Partial<MockCallbackQuery> = {}
): MockCallbackQuery => ({
  id: "test-callback-id",
  from: {
    id: 123456789,
    is_bot: false,
    first_name: "Test User",
    username: "testuser",
  },
  chat_instance: "test-instance",
  data: "test_data",
  ...overrides,
});

export const createMockBot = () => {
  const mockBot = {
    on: vi.fn(),
    onText: vi.fn(),
    sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    answerCallbackQuery: vi.fn().mockResolvedValue(true),
    editMessageText: vi.fn().mockResolvedValue(true),
    getChatMember: vi.fn().mockResolvedValue({ status: "member" }),
    getMe: vi.fn().mockResolvedValue({ id: 123456789, username: "testbot" }),
    setMyCommands: vi.fn().mockResolvedValue(true),
  } as unknown as TelegramBot;

  return mockBot;
};

export const waitForAsync = (ms: number = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mockFirebaseData = {
  users: {
    "123456789": {
      coins: 100,
      joinedSponsors: {
        "sponsor-1": true,
      },
    },
  },
  sponsorChannels: {
    "sponsor-1": {
      id: "sponsor-1",
      name: "Test Sponsor",
      link: "https://t.me/testsponsor",
      previewText: "Join our test channel!",
    },
  },
};
