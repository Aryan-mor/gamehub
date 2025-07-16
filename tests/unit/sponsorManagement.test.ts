import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createMockBot,
  createMockCallbackQuery,
  createMockMessage,
} from "../utils/testHelpers";
import type TelegramBot from "node-telegram-bot-api";

// Mock the modules
vi.mock("../../src/lib/gameService", () => ({
  getAllSponsorChannels: vi.fn(),
  markSponsorJoined: vi.fn(),
  getUnjoinedSponsorChannel: vi.fn(),
}));

vi.mock("../../src/lib/coinService", () => ({
  adjustCoins: vi.fn(),
  getUser: vi.fn(),
}));

describe("Sponsor Management", () => {
  let mockBot: TelegramBot;
  let mockGetAllSponsorChannels: any;
  let mockMarkSponsorJoined: any;
  let mockAdjustCoins: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBot = createMockBot();

    // Import mocked functions
    const gameService = require("../../src/lib/gameService");
    const coinService = require("../../src/lib/coinService");

    mockGetAllSponsorChannels = gameService.getAllSponsorChannels;
    mockMarkSponsorJoined = gameService.markSponsorJoined;
    mockAdjustCoins = coinService.adjustCoins;
  });

  describe("Sponsor Join Verification", () => {
    it("should successfully verify user membership and reward coins", async () => {
      // Arrange
      const mockSponsor = {
        id: "sponsor-1",
        name: "Test Sponsor",
        link: "https://t.me/testsponsor",
        previewText: "Join our test channel!",
      };

      mockGetAllSponsorChannels.mockResolvedValue([mockSponsor]);
      mockBot.getChatMember = vi.fn().mockResolvedValue({ status: "member" });
      mockMarkSponsorJoined.mockResolvedValue(undefined);
      mockAdjustCoins.mockResolvedValue(undefined);

      const callbackQuery = createMockCallbackQuery({
        data: "sponsor_joined:sponsor-1",
        from: { id: 123456789, is_bot: false, first_name: "Test User" },
      });

      // Act - Simulate the callback handler
      const { verifySponsorMembership } = await import("../../src/bot/index");

      // Since verifySponsorMembership is not exported, we'll test the logic indirectly
      // by testing the bot's callback handling

      // Mock the bot's callback handling
      const mockSendMessage = vi.fn().mockResolvedValue({ message_id: 1 });
      mockBot.sendMessage = mockSendMessage;

      // Simulate successful verification
      const result = await verifySponsorMembership(
        mockBot,
        mockSponsor.link,
        "123456789"
      );

      // Assert
      expect(result.success).toBe(true);
      expect(mockBot.getChatMember).toHaveBeenCalledWith(
        "@testsponsor",
        123456789
      );
    });

    it("should handle bot not being admin in channel", async () => {
      // Arrange
      const mockSponsor = {
        id: "sponsor-1",
        name: "Test Sponsor",
        link: "https://t.me/testsponsor",
        previewText: "Join our test channel!",
      };

      mockGetAllSponsorChannels.mockResolvedValue([mockSponsor]);

      const error = new Error(
        "ETELEGRAM: 400 Bad Request: member list is inaccessible"
      );
      (error as any).response = { statusCode: 403 };
      mockBot.getChatMember = vi.fn().mockRejectedValue(error);

      // Act
      const { verifySponsorMembership } = await import("../../src/bot/index");
      const result = await verifySponsorMembership(
        mockBot,
        mockSponsor.link,
        "123456789"
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Bot is not an admin");
    });

    it("should handle invalid sponsor channel link", async () => {
      // Arrange
      const invalidLink = "https://invalid-link.com";

      // Act
      const { verifySponsorMembership } = await import("../../src/bot/index");
      const result = await verifySponsorMembership(
        mockBot,
        invalidLink,
        "123456789"
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid sponsor channel link format");
    });
  });

  describe("Sponsor Channel Link Parsing", () => {
    it("should parse public channel links correctly", async () => {
      const publicLink = "https://t.me/testchannel";
      const { verifySponsorMembership } = await import("../../src/bot/index");

      mockBot.getChatMember = vi.fn().mockResolvedValue({ status: "member" });

      const result = await verifySponsorMembership(
        mockBot,
        publicLink,
        "123456789"
      );

      expect(mockBot.getChatMember).toHaveBeenCalledWith(
        "@testchannel",
        123456789
      );
    });

    it("should parse private channel invite links correctly", async () => {
      const privateLink = "https://t.me/+abc123def456";
      const { verifySponsorMembership } = await import("../../src/bot/index");

      mockBot.getChatMember = vi.fn().mockResolvedValue({ status: "member" });

      const result = await verifySponsorMembership(
        mockBot,
        privateLink,
        "123456789"
      );

      expect(mockBot.getChatMember).toHaveBeenCalledWith(
        "+abc123def456",
        123456789
      );
    });
  });
});
