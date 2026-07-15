import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { WheelIndex } from "@/components/wheel/WheelIndex";
import { buildGraph } from "@/lib/graph";
import type { Story, Theme } from "@/content/schema";

// next/link в App Router тянет контекст роутера — в юнит-тесте подменяем на <a>.
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const themes: Theme[] = [
  { id: "soul", label: "Душа" },
  { id: "death", label: "Смерть" },
];

function story(slug: string, title: string, themeIds: Story["themes"]): Story {
  return { slug, title, book: "koleso", order: 1, firstLine: "x", themes: themeIds, body: "" };
}

describe("WheelIndex (канон навигации)", () => {
  it("рендерит landmark-навигацию с заголовком «Колесо»", () => {
    render(<WheelIndex graph={buildGraph([story("a", "Рассказ А", ["soul"])], themes)} />);
    expect(screen.getByRole("navigation", { name: /Колесо/i })).toBeTruthy();
  });

  it("ссылка рассказа ведёт в /read/{book}/{slug}", () => {
    render(<WheelIndex graph={buildGraph([story("a", "Рассказ А", ["soul"])], themes)} />);
    expect(screen.getByRole("link", { name: "Рассказ А" }).getAttribute("href")).toBe(
      "/read/koleso/a",
    );
  });

  it("тема без рассказов показывает «Пока нет рассказов.»", () => {
    render(<WheelIndex graph={buildGraph([story("a", "Рассказ А", ["soul"])], themes)} />);
    expect(screen.getByText("Пока нет рассказов.")).toBeTruthy();
  });

  it("счётчик у секции темы отражает число рассказов", () => {
    const graph = buildGraph(
      [story("a", "А", ["soul"]), story("b", "Б", ["soul"])],
      themes,
    );
    render(<WheelIndex graph={graph} />);
    const section = screen.getByRole("region", { name: /Душа/ });
    expect(within(section).getByRole("heading").textContent).toContain("2");
  });
});
