import { describe, it, expect, vi } from "vitest";

describe("Simple Test Suite", () => {
  it("should pass basic arithmetic", () => {
    expect(2 + 2).toBe(4);
  });

  it("should handle async operations", async () => {
    const result = await Promise.resolve("test");
    expect(result).toBe("test");
  });

  it("should mock functions correctly", () => {
    const mockFn = vi.fn().mockReturnValue("mocked");
    expect(mockFn()).toBe("mocked");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe("String Operations", () => {
  it("should concatenate strings", () => {
    expect("Hello" + " " + "World").toBe("Hello World");
  });

  it("should check string length", () => {
    const str = "test";
    expect(str.length).toBe(4);
  });
});

describe("Array Operations", () => {
  it("should filter arrays", () => {
    const numbers = [1, 2, 3, 4, 5];
    const evenNumbers = numbers.filter((n) => n % 2 === 0);
    expect(evenNumbers).toEqual([2, 4]);
  });

  it("should map arrays", () => {
    const numbers = [1, 2, 3];
    const doubled = numbers.map((n) => n * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });
});
