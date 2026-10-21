import { Check, Globe } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getLang, LANGS, type Lang, setLang } from "@/lib/i18n";
import { tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};

/** The languages, each in its own name; the page reloads in the one chosen. */
export function LanguageList({ tone = "page", onPick }: { tone?: "page" | "panel"; onPick?: () => void }) {
  // the built page knows no saved choice: it shows once the page has hydrated
  const current = useSyncExternalStore(noSubscribe, getLang, (): Lang => "en");
  const panel = tone === "panel";
  return (
    <ul className="flex flex-col gap-1" translate="no">
      {LANGS.map((l) => {
        const on = l.code === current;
        return (
          <li key={l.code}>
            <button
              type="button"
              lang={l.code}
              aria-pressed={on}
              onClick={() => {
                tap();
                onPick?.();
                if (!on) setLang(l.code);
              }}
              className={cn(
                "flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left active:scale-[0.99]",
                panel ? (on ? "bg-white/10 text-gold" : "text-on-navy") : on ? "bg-note text-heading" : "text-ink",
              )}
            >
              <span className="flex flex-col">
                <span className="font-display text-base font-semibold tracking-wide">{l.name}</span>
                {l.name !== l.english ? <span className={cn("text-[11px]", panel ? "text-on-navy/60" : "text-muted")}>{l.english}</span> : null}
              </span>
              {on ? <Check className={cn("size-5 shrink-0", panel ? "text-gold" : "text-[#1A7F45]")} aria-hidden /> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Header button: a globe that opens the language list (only when there is more than English). */
export function LanguageButton() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);
  if (LANGS.length < 2) return null;
  // not positioned itself: the list hangs from the right end of the header's buttons (see AppShell), so it stays
  // on screen on a narrow phone
  return (
    <div ref={box}>
      <button
        type="button"
        onClick={() => {
          tap();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Language"
        className="grid size-11 place-items-center rounded-full text-on-navy transition-transform duration-150 active:scale-95"
      >
        <span className="grid size-8 place-items-center rounded-full bg-white/10">
          <Globe className="size-[18px]" aria-hidden />
        </span>
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Language"
          className="animate-pop absolute right-0 top-12 z-30 w-[min(17rem,calc(100vw-1.75rem))] rounded-xl border border-white/10 bg-navy px-2 py-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)]"
        >
          <LanguageList tone="panel" onPick={() => setOpen(false)} />
          <p className="mt-1 border-t border-white/10 px-1.5 pt-2 text-[11px] leading-snug text-on-navy/60">
            Translated from the English, which is the reference version. The voices stay in English, with captions.
          </p>
        </div>
      ) : null}
    </div>
  );
}
