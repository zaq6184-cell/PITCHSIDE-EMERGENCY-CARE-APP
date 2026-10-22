import { Music, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { say, setSoundPrefs, useSoundPrefs, useSoundRunning } from "@/lib/sound";

/** Small on/off switch, the same look as the dark-mode switch. */
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="grid min-h-11 min-w-11 shrink-0 place-items-center"
    >
      <span
        className={cn(
          "relative block h-7 w-12 rounded-full ring-1 ring-inset transition-colors duration-200",
          on ? "bg-gold ring-gold" : "bg-black/25 ring-white/35",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform duration-200 ease-out",
            on ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}

/** The two settings, used in the top-bar panel and on the About page. */
export function SoundSettings({ tone = "card" }: { tone?: "card" | "panel" }) {
  const p = useSoundPrefs();
  const sub = tone === "panel" ? "text-on-navy/70" : "text-muted";
  const head = tone === "panel" ? "text-on-navy" : "text-heading";
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 py-1">
        <Volume2 className={cn("size-5 shrink-0", tone === "panel" ? "text-gold" : "text-gold-ink")} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={cn("font-display text-sm font-semibold tracking-wide", head)}>Sound effects & voices</p>
          <p className={cn("text-xs leading-snug", sub)}>Team call-outs, CPR rhythm, whistle, quiz sounds</p>
        </div>
        <Switch
          on={p.sfx}
          label="Sound effects and voices"
          onChange={(v) => {
            setSoundPrefs({ sfx: v });
            if (v) void say("red-1");
          }}
        />
      </div>
      <div className="flex items-center gap-3 py-1">
        <Music className={cn("size-5 shrink-0", tone === "panel" ? "text-gold" : "text-gold-ink")} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={cn("font-display text-sm font-semibold tracking-wide", head)}>Background music</p>
          <p className={cn("text-xs leading-snug", sub)}>Suits each page: calm, drill tempo or quiz. Silent on Tools</p>
        </div>
        <Switch on={p.music} label="Background music" onChange={(v) => setSoundPrefs({ music: v })} />
      </div>
    </div>
  );
}

/** Speaker button in the top bar; opens a small panel with the two switches. */
export function SoundButton() {
  const p = useSoundPrefs();
  const running = useSoundRunning();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const on = p.sfx || p.music;
  // browsers hold sound back until the first tap: until then the speaker breathes, so people know one tap starts it
  const waiting = on && !running;

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

  // not positioned itself: the panel hangs from the right end of the header's buttons, so it stays on screen
  return (
    <div ref={box}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={waiting ? "Sound is on and starts with your first tap — sound settings" : on ? "Sound is on — sound settings" : "Sound is off — sound settings"}
        className="relative grid size-11 place-items-center rounded-full text-on-navy transition-transform duration-150 active:scale-95"
      >
        <span className={cn("grid size-8 place-items-center rounded-full", on ? "bg-gold text-on-gold" : "bg-white/10", waiting && "animate-pulse")}>
          {on ? <Volume2 className="size-[18px]" aria-hidden /> : <VolumeX className="size-[18px]" aria-hidden />}
        </span>
        {!on ? <span className="absolute right-1.5 top-1.5 size-2 animate-ping rounded-full bg-gold" aria-hidden /> : null}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Sound"
          className="animate-pop absolute right-0 top-12 z-30 w-[min(20rem,calc(100vw-1.75rem))] rounded-xl border border-white/10 bg-navy px-3.5 py-2.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)]"
        >
          <SoundSettings tone="panel" />
          <p className="mt-1 border-t border-white/10 pt-2 text-[11px] leading-snug text-on-navy/60">
            On by default; it starts with your first tap. Switch either one off here — saved on this device only.
          </p>
        </div>
      ) : null}
    </div>
  );
}
