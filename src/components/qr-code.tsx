import { useMemo } from "react";
import { encode } from "uqr";

/** A QR code drawn as one SVG path: dark modules on white, crisp at any size. */
export function QrCode({ text, className }: { text: string; className?: string }) {
  const qr = useMemo(() => encode(text, { border: 2 }), [text]);
  const d = useMemo(() => {
    let out = "";
    qr.data.forEach((row, y) => row.forEach((on, x) => (on ? (out += `M${x} ${y}h1v1h-1z`) : null)));
    return out;
  }, [qr]);
  return (
    <svg viewBox={`0 0 ${qr.size} ${qr.size}`} className={className} role="img" aria-label={`QR code for ${text}`} shapeRendering="crispEdges">
      <rect width={qr.size} height={qr.size} fill="#ffffff" />
      <path d={d} fill="#0b1f3a" />
    </svg>
  );
}
