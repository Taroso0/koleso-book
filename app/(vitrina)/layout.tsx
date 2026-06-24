import { SmoothScroll } from "@/components/motion/SmoothScroll";

// «Витрина» (Опыт): инерционный скролл (Lenis) и моушн.
// Под reduced-motion SmoothScroll не инициализирует Lenis — нативный скролл.
export default function VitrinaLayout({ children }: { children: React.ReactNode }) {
  return <SmoothScroll>{children}</SmoothScroll>;
}
