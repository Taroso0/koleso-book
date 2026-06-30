import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { ZachinProvider } from "@/components/haunted/ZachinProvider";
import { GrainOverlay } from "@/components/haunted/GrainOverlay";
import { CustomCursor } from "@/components/haunted/CustomCursor";

// «Витрина» (Опыт): инерционный скролл (Lenis), моушн и слой «офисной готики».
// ZachinProvider — зачин (Шаг 4.2); GrainOverlay/CustomCursor — атмосфера (Шаг 4.3,
// только «Витрина»; Читальня остаётся комфортной, §6). Всё gated: под reduced-motion
// и на слабых/тач-устройствах деградирует (нативный скролл/курсор, статичное зерно).
export default function VitrinaLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      {/* .vitrina-surface — бетон под страницей (§4 «материя вместо A4»). Оборачивает
          ТОЛЬКО {children}, а не оверлей зачина: его `> *{position:relative}` иначе
          сломал бы fixed-оверлей события. Зерно/курсор — сиблинги, лежат поверх. */}
      <ZachinProvider>
        <div className="vitrina-surface">{children}</div>
      </ZachinProvider>
      <GrainOverlay />
      <CustomCursor />
    </SmoothScroll>
  );
}
