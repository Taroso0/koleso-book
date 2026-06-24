import Image from "next/image";
import type { Illustration } from "@/lib/illustrations";

// Editorial-плашка иллюстрации (§6): «с воздухом», как фигура в тексте, а не фон.
// width/height из манифеста → next/image резервирует место, без layout shift (§10).
// Под reduced-motion ничего не делаем: «Читальня» статична по умолчанию (комфорт глаз).
export function IllustrationPlate({
  illustration,
  priority = false,
}: {
  illustration: Illustration;
  priority?: boolean;
}) {
  const { src, width, height, alt, artist } = illustration;
  return (
    <figure className="mx-auto my-12 w-full max-w-sm sm:my-14">
      <Image
        src={src}
        width={width}
        height={height}
        alt={alt}
        priority={priority}
        sizes="(max-width: 640px) 90vw, 24rem"
        className="h-auto w-full border border-border bg-card"
      />
      {artist && (
        <figcaption className="mt-3 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Илл.: {artist}
        </figcaption>
      )}
    </figure>
  );
}
