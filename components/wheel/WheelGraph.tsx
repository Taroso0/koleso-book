"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { WheelGraph as Graph } from "@/lib/graph";
import type { WheelLayout } from "@/lib/wheelLayout";

// Остров графа (§10): ssr:false — d3-force/SVG не тянутся в общий бандл и SSR.
// На мобильном (§11-B3) граф не монтируется — каноном остаётся WheelIndex.
const WheelCanvas = dynamic(
  () => import("./WheelCanvas").then((m) => m.WheelCanvas),
  { ssr: false },
);

export function WheelGraph({
  graph,
  layout,
}: {
  graph: Graph;
  layout: WheelLayout;
}) {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!desktop) return null;
  return <WheelCanvas graph={graph} layout={layout} />;
}
