import { ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

/**
 * A picture that opens full screen inside the app when tapped. Back — the button, the Escape key or
 * the phone's own back gesture — closes it and leaves you where you were, instead of a new tab or a
 * bare image file with no way back (which is what an installed app shows).
 */
export function ZoomImage({ src, alt, className, children }: { src: string; alt: string; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          tap();
          setOpen(true);
        }}
        aria-label={`Open full size: ${alt}`}
        className={cn("block w-full cursor-zoom-in text-left", className)}
      >
        {children}
      </button>
      {open ? <Viewer src={src} alt={alt} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function Viewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [big, setBig] = useState(false);
  const back = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  // One tagged history entry for the viewer, so the phone's back gesture closes it rather than leaving
  // the page. The tag keeps it to one entry even when the effect runs twice, and only a real Back
  // (leaving the tagged entry) closes the viewer.
  useEffect(() => {
    const ours = () => (window.history.state as { pecViewer?: string } | null)?.pecViewer === id;
    if (!ours()) window.history.pushState({ ...window.history.state, pecViewer: id }, "", window.location.href);
    const onPop = () => {
      if (!ours()) close.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.history.back();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    back.current?.focus();
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      html.style.overflow = overflow;
    };
  }, [id]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-50 flex flex-col bg-[#05101f]/95 text-white">
      <div className="flex items-center gap-2 px-3 pb-2 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <button
          ref={back}
          type="button"
          onClick={() => {
            tap();
            window.history.back();
          }}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/10 px-4 font-display text-sm font-semibold tracking-wide text-white active:scale-95"
        >
          <ArrowLeft className="size-4" strokeWidth={2.4} aria-hidden />
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            tap();
            setBig((b) => !b);
          }}
          aria-pressed={big}
          className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/10 px-4 font-display text-sm font-semibold tracking-wide text-white active:scale-95"
        >
          {big ? <ZoomOut className="size-4" aria-hidden /> : <ZoomIn className="size-4" aria-hidden />}
          {big ? "Fit" : "Zoom"}
        </button>
      </div>
      <div className={cn("min-h-0 flex-1 overscroll-contain", big ? "overflow-auto" : "grid place-items-center overflow-hidden p-2")}>
        <img
          src={src}
          alt={alt}
          onClick={() => setBig((b) => !b)}
          className={cn(big ? "max-w-none" : "max-h-full max-w-full object-contain", "select-none bg-white")}
          style={big ? { width: "200%" } : undefined}
        />
      </div>
      <p className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 text-center text-xs leading-snug text-white/70">{alt}</p>
    </div>,
    document.body,
  );
}
