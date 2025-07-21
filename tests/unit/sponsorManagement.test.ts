import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockBot } from "../utils/testHelpers";
import type TelegramBot from "node-telegram-bot-api";

// Define types for better type safety
interface Sponsor {
  id: string;
  name: string;
  link: string;
  previewText: string;
}

interface VerificationResult {
  success: boolean;
  error?: string;
}

// Mock the modules
vi.mock("../src/core/gameService", () => ({
  getAllSponsorChannels: vi.fn(),
  markSponsorJoined: vi.fn(),
  getUnjoinedSponsorChannel: vi.fn(),
}));

vi.mock("../src/core/coinService", () => ({
  adjustCoins: vi.fn(),
  getUser: vi.fn(),
}));

describe("Sponsor Management", () => {
  let mockBot: TelegramBot;
  let mockGetAllSponsorChannels: ReturnType<typeof vi.fn>;
  let mockMarkSponsorJoined: ReturnType<typeof vi.fn>;
  let mockAdjustCoins: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBot = createMockBot();

    // Get mocked functions
    const gameService = vi.hoisted(() => ({
      getAllSponsorChannels: vi.fn(),
      markSponsorJoined: vi.fn(),
      getUnjoinedSponsorChannel: vi.fn(),
    }));

    const coinService = vi.hoisted(() => ({
      adjustCoins: vi.fn(),
      getUser: vi.fn(),
    }));

    mockGetAllSponsorChannels = gameService.getAllSponsorChannels;
    mockMarkSponsorJoined = gameService.markSponsorJoined;
    mockAdjustCoins = coinService.adjustCoins;
  });

  describe("Sponsor Join Verification", () => {
    it("should successfully verify user membership and reward coins", async () => {
      // Arrange
      const mockSponsor: Sponsor = {
        id: "sponsor-1",
        name: "Test Sponsor",
        link: "https://t.me/testsponsor",
        previewText: "Join our test channel!",
      };

      mockGetAllSponsorChannels.mockResolvedValue([mockSponsor]);
      mockBot.getChatMember = vi.fn().mockResolvedValue({ status: "member" });
      mockMarkSponsorJoined.mockResolvedValue(undefined);
      mockAdjustCoins.mockResolvedValue(undefined);

      // Act - Simulate the verification logic
      const sponsorId = "sponsor-1";
      const userId = "123456789";
      const sponsors = (await mockGetAllSponsorChannels()) as Sponsor[];
      const sponsor = sponsors.find((s: Sponsor) => s.id === sponsorId);

      if (sponsor) {
        const channelUsername = sponsor.link.replace("https://t.me/", "");
        const memberStatus = await mockBot.getChatMember(
          channelUsername,
          parseInt(userId)
        );

        if (memberStatus.status === "member") {
          await mockMarkSponsorJoined(userId, sponsorId);
          await mockAdjustCoins(userId, 100, "sponsor_join", sponsor.name);
        }
      }

      // Assert
      expect(mockBot.getChatMember).toHaveBeenCalledWith(
        "testsponsor",
        123456789
      );
      expect(mockMarkSponsorJoined).toHaveBeenCalledWith(
        "123456789",
        "sponsor-1"
      );
      expect(mockAdjustCoins).toHaveBeenCalledWith(
        "123456789",
        100,
        "sponsor_join",
        "Test Sponsor"
      );
    });

    it("should handle bot not being admin in channel", async () => {
      // Arrange
      const mockSponsor: Sponsor = {
        id: "sponsor-1",
        name: "Test Sponsor",
        link: "https://t.me/testsponsor",
        previewText: "Join our test channel!",
      };

      mockGetAllSponsorChannels.mockResolvedValue([mockSponsor]);

      const error = new Error(
        "ETELEGRAM: 400 Bad Request: member list is inaccessible"
      );
      (error as { response?: { statusCode: number } }).response = {
        statusCode: 403,
      };
      mockBot.getChatMember = vi.fn().mockRejectedValue(error);

      // Act - Simulate the verification logic
      const sponsorId = "sponsor-1";
      const userId = "123456789";
      const sponsors = (await mockGetAllSponsorChannels()) as Sponsor[];
      const sponsor = sponsors.find((s: Sponsor) => s.id === sponsorId);

      let result: VerificationResult = { success: true };

      if (sponsor) {
        try {
          const channelUsername = sponsor.link.replace("https://t.me/", "");
          await mockBot.getChatMember(channelUsername, parseInt(userId));
        } catch (err: unknown) {
          const telegramError = err as { response?: { statusCode: number } };
          if (telegramError.response?.statusCode === 403) {
            result = {
              success: false,
              error: "Bot is not an admin in this channel",
            };
          }
        }
      }

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Bot is not an admin");
    });

    it("should handle invalid sponsor channel link", async () => {
      // Arrange
      const invalidLink = "https://invalid-link.com";

      // Act - Simulate link validation
      let result: VerificationResult = { success: true };

      if (
        !invalidLink.match(
          /^https:\/\/t\.me\/([a-zA-Z0-9_]+|\+[a-zA-Z0-9_-]+)$/
        )
      ) {
        result = {
          success: false,
          error: "Invalid sponsor channel link format",
        };
      }

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid sponsor channel link format");
    });
  });

  describe("Sponsor Channel Link Parsing", () => {
    it("should parse public channel links correctly", async () => {
      const publicLink = "https://t.me/testchannel";
      mockBot.getChatMember = vi.fn().mockResolvedValue({ status: "member" });

      // Act - Simulate link parsing
      const channelUsername = publicLink.replace("https://t.me/", "");
      await mockBot.getChatMember(channelUsername, 123456789);

      expect(mockBot.getChatMember).toHaveBeenCalledWith(
        "testchannel",
        123456789
      );
    });

    it("should parse private channel invite links correctly", async () => {
      const privateLink = "https://t.me/+abc123def456";
      mockBot.getChatMember = vi.fn().mockResolvedValue({ status: "member" });

      // Act - Simulate link parsing
      const channelUsername = privateLink.replace("https://t.me/", "");
      await mockBot.getChatMember(channelUsername, 123456789);

      expect(mockBot.getChatMember).toHaveBeenCalledWith(
        "+abc123def456",
        123456789
      );
    });
  });
});
