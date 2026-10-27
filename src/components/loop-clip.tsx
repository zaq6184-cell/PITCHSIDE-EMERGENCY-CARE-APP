import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A picture's animated loop, laid over it: it loads the first time the picture scrolls into view, plays while it is
 * on screen and fades in once it is moving. The picture underneath keeps the alt text and the layout, and stays on its
 * own for people who ask for less motion or for data saving. Give it `key={src}` where the picture can change in place.
 * `className` adds to the video's classes: `kenburns` keeps the picture's slow drift going under a loop that barely
 * moves (mount the two together, with the same `style` delay, so their drifts stay in step).
 */
export function LoopClip({ src, className, style }: { src: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [moving, setMoving] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!v.getAttribute("src")) v.setAttribute("src", src);
          v.play().catch(() => {
            // autoplay refused (low power, data saver): the picture stays
          });
        } else v.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [src]);
  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setMoving(true)}
      style={style}
      className={cn("absolute inset-0 block h-full w-full object-cover transition-opacity duration-700", moving ? "opacity-100" : "opacity-0", className)}
    />
  );
}
