import type { Metadata } from "next";
import { fontProse, fontSystem, fontMono } from "@/lib/fonts";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Боковым зрением — Евгений Кирилов",
  description:
    "Литературная вселенная Евгения Кирилова: «офисная готика», «Колесо» смыслов и проза, которую видно боковым зрением.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${fontProse.variable} ${fontSystem.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
