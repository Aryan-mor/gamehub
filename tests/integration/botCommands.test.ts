import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createMockBot,
  createMockMessage,
  createMockCallbackQuery,
} from "../utils/testHelpers";
import type TelegramBot from "node-telegram-bot-api";

// Mock all external dependencies
vi.mock("../../src/lib/coinService", () => ({
  getUserCoins: vi.fn(),
  adjustCoins: vi.fn(),
  requireBalance: vi.fn(),
}));

vi.mock("../../src/lib/gameService", () => ({
  getAllSponsorChannels: vi.fn(),
  markSponsorJoined: vi.fn(),
  getUnjoinedSponsorChannel: vi.fn(),
}));

vi.mock("../../src/bot/games/userStats", () => ({
  getUser: vi.fn(),
  addCoins: vi.fn(),
  canClaimDaily: vi.fn(),
  setLastFreeCoinAt: vi.fn(),
}));

describe("Bot Commands Integration", () => {
  let mockBot: TelegramBot;
  let mockSendMessage: any;
  let mockAnswerCallbackQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBot = createMockBot();
    mockSendMessage = vi.fn().mockResolvedValue({ message_id: 1 });
    mockAnswerCallbackQuery = vi.fn().mockResolvedValue(true);

    mockBot.sendMessage = mockSendMessage;
    mockBot.answerCallbackQuery = mockAnswerCallbackQuery;
  });

  describe("/start command", () => {
    it("should send welcome message with glass keyboard", async () => {
      // Arrange
      const message = createMockMessage({
        text: "/start",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
        chat: { id: 123456789, first_name: "Test User", type: "private" },
      });

      // Act - Simulate bot message handler
      const onTextHandler = mockBot.onText.mock.calls.find(
        (call: any) => call[0] === /\/start/
      )?.[1];

      if (onTextHandler) {
        await onTextHandler(message, null);
      }

      // Assert
      expect(mockSendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining("🎮 Welcome to GameHub"),
        expect.objectContaining({
          parse_mode: "HTML",
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({ text: "🎮 Start Game" }),
                expect.objectContaining({ text: "🪙 Free Coin" }),
              ]),
            ]),
          }),
        })
      );
    });
  });

  describe("Callback Query Handling", () => {
    it("should handle balance callback query", async () => {
      // Arrange
      const callbackQuery = createMockCallbackQuery({
        data: "balance",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      const mockUserData = { coins: 100 };
      const { getUser } = await import("../../src/bot/games/userStats");
      vi.mocked(getUser).mockResolvedValue(mockUserData);

      // Act - Simulate callback query handler
      const onCallbackQueryHandler = mockBot.on.mock.calls.find(
        (call: any) => call[0] === "callback_query"
      )?.[1];

      if (onCallbackQueryHandler) {
        await onCallbackQueryHandler(callbackQuery);
      }

      // Assert
      expect(mockAnswerCallbackQuery).toHaveBeenCalledWith("test-callback-id");
      expect(mockSendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining("💰 Your balance: <b>100</b> Coins"),
        expect.objectContaining({ parse_mode: "HTML" })
      );
    });

    it("should handle free coin callback query", async () => {
      // Arrange
      const callbackQuery = createMockCallbackQuery({
        data: "freecoin",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      const { canClaimDaily, setLastFreeCoinAt, addCoins } = await import(
        "../../src/bot/games/userStats"
      );
      vi.mocked(canClaimDaily).mockResolvedValue(true);
      vi.mocked(setLastFreeCoinAt).mockResolvedValue(undefined);
      vi.mocked(addCoins).mockResolvedValue(undefined);

      // Act - Simulate callback query handler
      const onCallbackQueryHandler = mockBot.on.mock.calls.find(
        (call: any) => call[0] === "callback_query"
      )?.[1];

      if (onCallbackQueryHandler) {
        await onCallbackQueryHandler(callbackQuery);
      }

      // Assert
      expect(mockAnswerCallbackQuery).toHaveBeenCalledWith("test-callback-id");
      expect(addCoins).toHaveBeenCalledWith("123456789", 10, "daily_free");
    });

    it("should handle help callback query", async () => {
      // Arrange
      const callbackQuery = createMockCallbackQuery({
        data: "help",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      // Act - Simulate callback query handler
      const onCallbackQueryHandler = mockBot.on.mock.calls.find(
        (call: any) => call[0] === "callback_query"
      )?.[1];

      if (onCallbackQueryHandler) {
        await onCallbackQueryHandler(callbackQuery);
      }

      // Assert
      expect(mockAnswerCallbackQuery).toHaveBeenCalledWith("test-callback-id");
      expect(mockSendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining("Available commands:"),
        expect.any(Object)
      );
    });
  });

  describe("Sponsor Join Flow", () => {
    it("should handle sponsor join verification successfully", async () => {
      // Arrange
      const callbackQuery = createMockCallbackQuery({
        data: "sponsor_joined:sponsor-1",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      const mockSponsor = {
        id: "sponsor-1",
        name: "Test Sponsor",
        link: "https://t.me/testsponsor",
        previewText: "Join our test channel!",
      };

      const { getAllSponsorChannels, markSponsorJoined } = await import(
        "../../src/lib/gameService"
      );
      const { adjustCoins } = await import("../../src/lib/coinService");

      vi.mocked(getAllSponsorChannels).mockResolvedValue([mockSponsor]);
      vi.mocked(markSponsorJoined).mockResolvedValue(undefined);
      vi.mocked(adjustCoins).mockResolvedValue(undefined);

      mockBot.getChatMember = vi.fn().mockResolvedValue({ status: "member" });

      // Act - Simulate callback query handler
      const onCallbackQueryHandler = mockBot.on.mock.calls.find(
        (call: any) => call[0] === "callback_query"
      )?.[1];

      if (onCallbackQueryHandler) {
        await onCallbackQueryHandler(callbackQuery);
      }

      // Assert
      expect(mockAnswerCallbackQuery).toHaveBeenCalledWith("test-callback-id");
      expect(markSponsorJoined).toHaveBeenCalledWith("123456789", "sponsor-1");
      expect(adjustCoins).toHaveBeenCalledWith(
        "123456789",
        100,
        "sponsor_join",
        "Test Sponsor"
      );
      expect(mockSendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining(
          "✅ You have successfully joined <b>Test Sponsor</b>!"
        ),
        expect.objectContaining({ parse_mode: "HTML" })
      );
    });
  });
});
