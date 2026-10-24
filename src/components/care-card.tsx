import { type LucideIcon, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Note, Panel } from "@/components/workshop";
import type { CareCard } from "@/lib/medical";
import type { ScenePic } from "@/lib/scene-images";
import { cn } from "@/lib/utils";

/**
 * The card's animated loop, laid over its picture: it loads the first time the card scrolls into view, plays while the
 * card is on screen and fades in once it is moving. The picture underneath keeps the alt text and the layout, and stays
 * on its own for people who ask for less motion or for data saving.
 */
function CardClip({ src }: { src: string }) {
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
      className={cn("absolute inset-0 block h-full w-full object-cover transition-opacity duration-700", moving ? "opacity-100" : "opacity-0")}
    />
  );
}

/** A card's own small heading, styled like the section labels. */
export function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-xs font-semibold tracking-[0.14em] text-heading">
      {children}
      <span className="mt-1 block h-[3px] w-8 rounded-full bg-gold" aria-hidden="true" />
    </h3>
  );
}

/**
 * One emergency, as a pitchside card: recognise, what to do, if trained, when to call the ambulance, the football
 * angle and the source. Used by the medical emergencies and the cold and altitude pages; `anchor` is its id for the
 * jump chips, and the picture (960 × 540) is optional.
 */
export function CareCardView({ c, anchor, icon: Icon, pic, eager = false }: { c: CareCard; anchor: string; icon: LucideIcon; pic?: ScenePic; eager?: boolean }) {
  return (
    <section id={anchor} className="scroll-mt-24">
      <Panel>
        <div className="flex items-center gap-3 border-b border-line px-3.5 py-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-note text-gold-ink">
            <Icon className="size-6" aria-hidden />
          </span>
          <span className="min-w-0">
            <h2 className="font-display text-lg font-bold leading-tight tracking-wide text-heading">{c.title}</h2>
            <span className="block text-xs leading-snug text-muted">{c.sub}</span>
          </span>
        </div>
        {pic ? (
          // the card's key action, as a picture
          <div className="relative bg-navy">
            <img
              src={pic.src}
              alt={pic.alt}
              width={960}
              height={540}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              className="img-in block aspect-video w-full object-cover outline-none"
            />
            {pic.video ? <CardClip src={pic.video} /> : null}
            <p className="absolute right-2 top-2 z-[1] rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">AI-generated illustration</p>
          </div>
        ) : null}
        <div className="flex flex-col gap-3.5 px-3.5 py-3.5">
          <div>
            <CardLabel>RECOGNISE</CardLabel>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm leading-snug marker:text-gold">
              {c.recognise.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <CardLabel>WHAT TO DO</CardLabel>
            <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-sm leading-snug marker:font-semibold marker:text-gold-ink">
              {c.steps.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
          <div className="rounded-lg bg-note px-3 py-2.5">
            <CardLabel>IF TRAINED</CardLabel>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm leading-snug marker:text-gold">
              {c.trained.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <p className="flex items-start gap-2.5 rounded-lg border border-danger/30 px-3 py-2 text-sm leading-snug">
            <Phone className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            <span>
              <b>Call the ambulance:</b> {c.call}
            </span>
          </p>
          <Note>
            <b className="text-heading">In football:</b> {c.football}
          </Note>
          <p className="text-[11px] leading-snug text-muted">
            <span className="font-semibold">Source:</span> {c.source}
          </p>
        </div>
      </Panel>
    </section>
  );
}
