import { describe, it, expect, beforeEach, vi } from "vitest";
import { ref, set, get, push } from "firebase/database";

// Mock Firebase
vi.mock("firebase/database", () => ({
  ref: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  push: vi.fn(),
}));

describe("Game Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Sponsor Channel Management", () => {
    it("should add sponsor channel", async () => {
      // Arrange
      const mockRef = vi.fn();
      const mockPush = vi.fn().mockReturnValue({ key: "sponsor-1" });
      const mockSet = vi.fn().mockResolvedValue(undefined);

      vi.mocked(ref).mockReturnValue(
        mockRef as unknown as ReturnType<typeof ref>
      );
      vi.mocked(push).mockReturnValue(
        mockPush as unknown as ReturnType<typeof push>
      );
      vi.mocked(set).mockImplementation(mockSet);

      // Act
      const { addSponsorChannel } = await import("../../src/lib/gameService");
      const result = await addSponsorChannel(
        "Test Sponsor",
        "https://t.me/test",
        "Join us!"
      );

      // Assert
      expect(result.id).toBe("sponsor-1");
      expect(result.name).toBe("Test Sponsor");
      expect(result.link).toBe("https://t.me/test");
      expect(result.previewText).toBe("Join us!");
      expect(set).toHaveBeenCalled();
    });

    it("should get all sponsor channels", async () => {
      // Arrange
      const mockRef = vi.fn();
      const mockGet = vi.fn().mockResolvedValue({
        exists: () => true,
        val: () => ({
          "sponsor-1": {
            id: "sponsor-1",
            name: "Test Sponsor",
            link: "https://t.me/test",
            previewText: "Join us!",
          },
        }),
      });

      vi.mocked(ref).mockReturnValue(
        mockRef as unknown as ReturnType<typeof ref>
      );
      vi.mocked(get).mockImplementation(mockGet);

      // Act
      const { getAllSponsorChannels } = await import(
        "../../src/lib/gameService"
      );
      const result = await getAllSponsorChannels();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("sponsor-1");
      expect(result[0].name).toBe("Test Sponsor");
    });

    it("should return empty array when no sponsor channels exist", async () => {
      // Arrange
      const mockRef = vi.fn();
      const mockGet = vi.fn().mockResolvedValue({
        exists: () => false,
        val: () => null,
      });

      vi.mocked(ref).mockReturnValue(
        mockRef as unknown as ReturnType<typeof ref>
      );
      vi.mocked(get).mockImplementation(mockGet);

      // Act
      const { getAllSponsorChannels } = await import(
        "../../src/lib/gameService"
      );
      const result = await getAllSponsorChannels();

      // Assert
      expect(result).toHaveLength(0);
    });

    it("should mark sponsor as joined", async () => {
      // Arrange
      const mockRef = vi.fn();
      const mockSet = vi.fn().mockResolvedValue(undefined);

      vi.mocked(ref).mockReturnValue(
        mockRef as unknown as ReturnType<typeof ref>
      );
      vi.mocked(set).mockImplementation(mockSet);

      // Act
      const { markSponsorJoined } = await import("../../src/lib/gameService");
      await markSponsorJoined("123456789", "sponsor-1");

      // Assert
      expect(set).toHaveBeenCalledWith(expect.anything(), true);
    });

    it("should get unjoined sponsor channel", async () => {
      // Arrange
      const mockRef = vi.fn();
      const mockGet = vi
        .fn()
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            "sponsor-1": {
              id: "sponsor-1",
              name: "Test Sponsor",
              link: "https://t.me/test",
              previewText: "Join us!",
            },
            "sponsor-2": {
              id: "sponsor-2",
              name: "Test Sponsor 2",
              link: "https://t.me/test2",
              previewText: "Join us too!",
            },
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            "sponsor-1": true,
          }),
        });

      vi.mocked(ref).mockReturnValue(
        mockRef as unknown as ReturnType<typeof ref>
      );
      vi.mocked(get).mockImplementation(mockGet);

      // Act
      const { getUnjoinedSponsorChannel } = await import(
        "../../src/lib/gameService"
      );
      const result = await getUnjoinedSponsorChannel("123456789");

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe("sponsor-2");
      expect(result?.name).toBe("Test Sponsor 2");
    });

    it("should return null when all sponsors are joined", async () => {
      // Arrange
      const mockRef = vi.fn();
      const mockGet = vi
        .fn()
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            "sponsor-1": {
              id: "sponsor-1",
              name: "Test Sponsor",
              link: "https://t.me/test",
              previewText: "Join us!",
            },
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({
            "sponsor-1": true,
          }),
        });

      vi.mocked(ref).mockReturnValue(
        mockRef as unknown as ReturnType<typeof ref>
      );
      vi.mocked(get).mockImplementation(mockGet);

      // Act
      const { getUnjoinedSponsorChannel } = await import(
        "../../src/lib/gameService"
      );
      const result = await getUnjoinedSponsorChannel("123456789");

      // Assert
      expect(result).toBeNull();
    });
  });
});
