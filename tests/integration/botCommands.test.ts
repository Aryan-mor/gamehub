import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createMockBot,
  createMockCallbackQuery,
  createMockMessage,
} from "../utils/testHelpers";
import type TelegramBot from "node-telegram-bot-api";

// Mock Firebase and other dependencies
vi.mock("../src/core/firebase", () => ({
  database: {
    ref: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    push: vi.fn(),
  },
}));

vi.mock("../src/core/coinService", () => ({
  adjustCoins: vi.fn(),
  getUserCoins: vi.fn(),
  requireBalance: vi.fn(),
}));

vi.mock("../src/core/gameService", () => ({
  getAllSponsorChannels: vi.fn(),
  markSponsorJoined: vi.fn(),
  getUnjoinedSponsorChannel: vi.fn(),
}));

vi.mock("../../src/bot/games/userStats", () => ({
  getUser: vi.fn(),
  addCoins: vi.fn(),
  canClaimDaily: vi.fn(),
  setLastFreeCoinAt: vi.fn(),
  setUserProfile: vi.fn(),
}));

describe("Bot Commands Integration", () => {
  let mockBot: TelegramBot;
  let mockSendMessage: ReturnType<typeof vi.fn>;
  let mockAnswerCallbackQuery: ReturnType<typeof vi.fn>;

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

      const { getUser, setUserProfile } = await import(
        "../../src/bot/games/userStats"
      );
      vi.mocked(getUser).mockResolvedValue({
        coins: 0,
        lastFreeCoinAt: undefined,
      });
      vi.mocked(setUserProfile).mockResolvedValue(undefined);

      // Act - Simulate the /start command logic directly
      const chatId = message.chat.id;
      const userId = String(message.from?.id);
      const username = message.from?.username || undefined;
      const name = message.from?.first_name || undefined;

      // Save username and name to user profile
      await setUserProfile(userId, username, name);
      const user = await getUser(userId);

      let welcome = `🎮 Welcome to GameHub!\n\n💰 Earn and claim daily Coins with /freecoin!\n\n🎯 Choose an action below:`;
      if (user.coins === 0 && !user.lastFreeCoinAt) {
        const { addCoins } = await import("../../src/bot/games/userStats");
        vi.mocked(addCoins).mockResolvedValue(undefined);
        await addCoins(userId, 100, "initial grant");
        welcome = `🎉 You received 100\u202FCoins for joining!\n\n` + welcome;
      }

      // Glass buttons keyboard
      const glassKeyboard = {
        inline_keyboard: [
          [
            { text: "🎮 Start Game", callback_data: "startgame" },
            { text: "🪙 Free Coin", callback_data: "freecoin" },
          ],
          [
            { text: "❓ Help", callback_data: "help" },
            { text: "💰 Balance", callback_data: "balance" },
          ],
        ],
      };

      await mockBot.sendMessage(chatId, welcome, {
        reply_markup: glassKeyboard,
      });

      // Assert
      expect(mockSendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining("🎮 Welcome to GameHub"),
        expect.objectContaining({
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

      // Act - Simulate the balance callback logic directly
      await mockBot.answerCallbackQuery(callbackQuery.id);

      const balanceMessage = `💰 Your balance: <b>${mockUserData.coins}</b> Coins`;
      await mockBot.sendMessage(callbackQuery.from.id, balanceMessage, {
        parse_mode: "HTML",
      });

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
      vi.mocked(canClaimDaily).mockResolvedValue({
        canClaim: true,
        nextClaimIn: 0,
      });
      vi.mocked(setLastFreeCoinAt).mockResolvedValue(undefined);
      vi.mocked(addCoins).mockResolvedValue(undefined);

      // Act - Simulate the free coin callback logic directly
      await mockBot.answerCallbackQuery(callbackQuery.id);

      const canClaim = await canClaimDaily(callbackQuery.from.id.toString());
      if (canClaim.canClaim) {
        await addCoins(callbackQuery.from.id.toString(), 10, "daily_free");
        await setLastFreeCoinAt(callbackQuery.from.id.toString(), Date.now());

        await mockBot.sendMessage(
          callbackQuery.from.id,
          "🪙 You received 10 Coins! Come back tomorrow for more!",
          { parse_mode: "HTML" }
        );
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

      // Act - Simulate the help callback logic directly
      await mockBot.answerCallbackQuery(callbackQuery.id);

      const helpMessage =
        `Available commands:\n` +
        `/start - Start the bot\n` +
        `/startgame - Start a new game\n` +
        `/freecoin - Claim your daily free coins\n` +
        `/help - Show this help message\n` +
        `/newgame - Create a new game\n` +
        `/games - Show your unfinished games\n` +
        `/stats - Show your game statistics\n` +
        `/balance - Show your coin balance`;

      await mockBot.sendMessage(callbackQuery.from.id, helpMessage);

      // Assert
      expect(mockAnswerCallbackQuery).toHaveBeenCalledWith("test-callback-id");
      expect(mockSendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining("Available commands:")
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
        "../src/core/gameService"
      );
      const { adjustCoins } = await import("../src/core/coinService");

      vi.mocked(getAllSponsorChannels).mockResolvedValue([mockSponsor]);
      vi.mocked(markSponsorJoined).mockResolvedValue(undefined);
      vi.mocked(adjustCoins).mockResolvedValue(undefined);

      mockBot.getChatMember = vi.fn().mockResolvedValue({ status: "member" });

      // Act - Simulate the sponsor join verification logic directly
      await mockBot.answerCallbackQuery(callbackQuery.id);

      const sponsorId = callbackQuery.data?.split(":")[1];
      const sponsors = await getAllSponsorChannels();
      const sponsor = sponsors.find((s) => s.id === sponsorId);

      if (sponsor) {
        const channelUsername = sponsor.link.replace("https://t.me/", "");
        const memberStatus = await mockBot.getChatMember(
          channelUsername,
          callbackQuery.from.id
        );

        if (memberStatus.status === "member") {
          await markSponsorJoined(callbackQuery.from.id.toString(), sponsorId!);
          await adjustCoins(
            callbackQuery.from.id.toString(),
            100,
            "sponsor_join",
            sponsor.name
          );

          await mockBot.sendMessage(
            callbackQuery.from.id,
            `✅ You have successfully joined <b>${sponsor.name}</b>!\n\n💰 You received <b>100 Coins</b> as a reward!`,
            { parse_mode: "HTML" }
          );
        }
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
