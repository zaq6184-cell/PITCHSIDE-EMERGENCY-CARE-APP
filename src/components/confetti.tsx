import { useMemo } from "react";

const COLOURS = ["#1C1C1C", "#E36B12", "#C0392B", "#1F6AA5", "#F4F4F1", "#1E8A4C", "#C9A227"];

/** A burst of confetti in the six role colours plus gold. Remount (change `key`) to play again. */
export function Confetti({ count = 26, spread = 1 }: { count?: number; spread?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const d = (90 + Math.random() * 110) * spread;
        return {
          x: `${Math.cos(a) * d}px`,
          y: `${Math.sin(a) * d - 60 * spread}px`,
          r: `${Math.round(Math.random() * 720 - 360)}deg`,
          c: COLOURS[i % COLOURS.length],
          delay: `${Math.random() * 0.12}s`,
        };
      }),
    [count, spread],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              "--x": b.x,
              "--y": b.y,
              "--r": b.r,
              background: b.c,
              animationDelay: b.delay,
              boxShadow: b.c === "#F4F4F1" ? "inset 0 0 0 1px rgba(11,31,58,0.25)" : undefined,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
