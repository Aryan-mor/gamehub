import { describe, it, expect } from "vitest";

// Test utility functions that can be extracted from the bot
describe("Bot Logic Functions", () => {
  describe("Sponsor Link Parsing", () => {
    const parseSponsorLink = (
      link: string
    ): { type: "public" | "private"; identifier: string } | null => {
      if (link.includes("t.me/+")) {
        // Private channel invite link
        const match = link.match(/t\.me\/(\+.+)$/);
        return match ? { type: "private", identifier: match[1] } : null;
      } else {
        // Public channel username
        const match = link.match(/t\.me\/([A-Za-z0-9_]+)/);
        return match ? { type: "public", identifier: match[1] } : null;
      }
    };

    it("should parse public channel links correctly", () => {
      const result = parseSponsorLink("https://t.me/testchannel");
      expect(result).toEqual({
        type: "public",
        identifier: "testchannel",
      });
    });

    it("should parse private channel invite links correctly", () => {
      const result = parseSponsorLink("https://t.me/+abc123def456");
      expect(result).toEqual({
        type: "private",
        identifier: "+abc123def456",
      });
    });

    it("should return null for invalid links", () => {
      const result = parseSponsorLink("https://invalid-link.com");
      expect(result).toBeNull();
    });

    it("should handle various link formats", () => {
      expect(parseSponsorLink("https://t.me/username123")).toEqual({
        type: "public",
        identifier: "username123",
      });

      expect(parseSponsorLink("https://t.me/+invite123")).toEqual({
        type: "private",
        identifier: "+invite123",
      });
    });
  });

  describe("Message Validation", () => {
    const isValidMessage = (message: any): boolean => {
      return !!(
        message &&
        message.from &&
        message.from.id &&
        message.chat &&
        message.chat.id &&
        message.text
      );
    };

    it("should validate complete messages", () => {
      const validMessage = {
        from: { id: 123456789 },
        chat: { id: 123456789 },
        text: "/start",
      };
      expect(isValidMessage(validMessage)).toBe(true);
    });

    it("should reject incomplete messages", () => {
      const invalidMessages = [
        null,
        {},
        { from: { id: 123 } },
        { from: { id: 123 }, chat: { id: 123 } },
        { from: { id: 123 }, chat: { id: 123 }, text: "" },
      ];

      invalidMessages.forEach((message) => {
        expect(isValidMessage(message)).toBe(false);
      });
    });
  });

  describe("Callback Query Validation", () => {
    const isValidCallbackQuery = (query: any): boolean => {
      return !!(query && query.id && query.from && query.from.id && query.data);
    };

    it("should validate complete callback queries", () => {
      const validQuery = {
        id: "callback-123",
        from: { id: 123456789 },
        data: "test_data",
      };
      expect(isValidCallbackQuery(validQuery)).toBe(true);
    });

    it("should reject incomplete callback queries", () => {
      const invalidQueries = [
        null,
        {},
        { id: "test" },
        { id: "test", from: { id: 123 } },
      ];

      invalidQueries.forEach((query) => {
        expect(isValidCallbackQuery(query)).toBe(false);
      });
    });
  });

  describe("Error Message Generation", () => {
    const generateErrorMessage = (error: any): string => {
      if (error && typeof error === "object" && "response" in error) {
        const response = (error as any).response;
        if (response && response.statusCode === 403) {
          return "Bot is not an admin in the channel. Please contact an admin to add the bot as an administrator.";
        }
      }
      return "Unable to verify membership. Please try again.";
    };

    it("should handle permission errors", () => {
      const permissionError = {
        response: { statusCode: 403 },
      };
      expect(generateErrorMessage(permissionError)).toContain(
        "Bot is not an admin"
      );
    });

    it("should handle other errors", () => {
      const otherError = { message: "Some other error" };
      expect(generateErrorMessage(otherError)).toBe(
        "Unable to verify membership. Please try again."
      );
    });

    it("should handle null/undefined errors", () => {
      expect(generateErrorMessage(null)).toBe(
        "Unable to verify membership. Please try again."
      );
      expect(generateErrorMessage(undefined)).toBe(
        "Unable to verify membership. Please try again."
      );
    });
  });

  describe("Keyboard Generation", () => {
    const createGameKeyboard = (games: string[]): any => {
      const keyboard = {
        inline_keyboard: games.map((game) => [
          {
            text: game,
            callback_data: `newgame:${game}`,
          },
        ]),
      };
      return keyboard;
    };

    it("should create keyboard with games", () => {
      const games = ["dice", "football", "basketball"];
      const keyboard = createGameKeyboard(games);

      expect(keyboard.inline_keyboard).toHaveLength(3);
      expect(keyboard.inline_keyboard[0]).toEqual([
        {
          text: "dice",
          callback_data: "newgame:dice",
        },
      ]);
    });

    it("should handle empty games array", () => {
      const keyboard = createGameKeyboard([]);
      expect(keyboard.inline_keyboard).toHaveLength(0);
    });
  });
});
