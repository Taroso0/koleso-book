import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { ZachinProvider } from "@/components/haunted/ZachinProvider";

// «Витрина» (Опыт): инерционный скролл (Lenis) и моушн.
// Под reduced-motion SmoothScroll не инициализирует Lenis — нативный скролл.
// ZachinProvider — «первая строка как событие» при входе из «Колеса» (§7, Шаг 4.2).
export default function VitrinaLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <ZachinProvider>{children}</ZachinProvider>
    </SmoothScroll>
  );
}
