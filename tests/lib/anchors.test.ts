import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.doUnmock("@/content/anchors");
  vi.resetModules();
});

describe("resolvedWheelAnchors", () => {
  it("резолвит якоря из реальных данных против манифеста", async () => {
    const { resolvedWheelAnchors } = await import("@/lib/anchors");
    expect(resolvedWheelAnchors.length).toBeGreaterThan(0);
    for (const a of resolvedWheelAnchors) {
      expect(typeof a.theme).toBe("string");
      expect(a.src).toMatch(/^\/illustrations\/koleso\/.+\.webp$/);
      expect(a.width).toBeGreaterThan(0);
      expect(a.height).toBeGreaterThan(0);
    }
  });

  it("якорь со slug, которого нет в манифесте, молча отбрасывается", async () => {
    vi.resetModules();
    vi.doMock("@/content/anchors", () => ({
      wheelAnchors: [
        { theme: "human", slug: "___точно-нет-в-манифесте___", story: "Фейк" },
      ],
    }));
    const { resolvedWheelAnchors } = await import("@/lib/anchors");
    expect(resolvedWheelAnchors).toEqual([]);
  });
});
