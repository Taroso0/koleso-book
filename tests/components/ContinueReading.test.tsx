import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ContinueReading } from "@/components/reader/ContinueReading";
import { saveProgress } from "@/components/reader/reading";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("ContinueReading", () => {
  it("нет последнего прочитанного → ничего не рендерит", () => {
    const { container } = render(<ContinueReading />);
    expect(container.firstChild).toBeNull();
  });

  it("есть last-read → ссылка на рассказ и progressbar с процентом", async () => {
    saveProgress({
      slug: "s1",
      bookId: "kolizey",
      bookTitle: "Колизей",
      title: "Рассказ",
      pct: 0.42,
    });
    render(<ContinueReading />);
    const link = await screen.findByRole("link");
    expect(link.getAttribute("href")).toBe("/read/kolizey/s1");
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("42");
  });
});
