import { Mountain } from "lucide-react";
import { useEffect, useState } from "react";
import { acclimatisationDays, bandFor, VENUES } from "@/lib/environment";
import { getLang, type Lang } from "@/lib/i18n";
import { tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

const MAX = 4500;

/** Drag to the venue's altitude, or pick a city: FIFA's band, the risk of altitude illness and the days to allow. */
export function AltitudePlanner() {
  const [metres, setMetres] = useState(2850);
  // numbers in the reader's own format, but only once the page is live: the prerendered page is in English, and
  // a different first render would not hydrate (2,850 in English is 2850, 2 850 and 2.850 in Spanish, French, Portuguese)
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => setLang(getLang()), []);
  const band = bandFor(metres);
  const days = acclimatisationDays(metres);
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(lang === "ms" ? "ms-MY" : lang).format(n);
    } catch {
      return String(n);
    }
  };
  const tone = band.id === "high" || band.id === "extreme" ? "bg-danger-fill text-white" : band.id === "moderate" ? "bg-[#b3541e] text-white" : "bg-navy text-gold";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-note text-gold-ink">
          <Mountain className="size-6" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-3xl font-bold leading-none tabular-nums text-heading" translate="no">
            {`${fmt(metres)} m`}
          </span>
          <span className={cn("mt-1 inline-block rounded-full px-2.5 py-0.5 font-display text-xs font-semibold tracking-wide", tone)}>{band.label}</span>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={MAX}
        step={50}
        value={metres}
        onChange={(e) => setMetres(Number(e.target.value))}
        aria-label="Venue altitude in metres"
        className="w-full accent-[#c9a227]"
      />
      <div className="flex flex-wrap gap-1.5">
        {VENUES.map((v) => (
          <button
            key={v.name}
            type="button"
            onClick={() => {
              tap();
              setMetres(v.metres);
            }}
            aria-pressed={metres === v.metres}
            className={cn(
              "min-h-9 rounded-full border px-3 text-xs font-semibold",
              metres === v.metres ? "border-navy bg-navy text-gold" : "border-line bg-paper text-heading",
            )}
          >
            {v.name}
          </button>
        ))}
      </div>
      <p className="text-sm leading-snug">{band.risk}</p>
      <p className="rounded-lg bg-note px-3 py-2 text-sm font-semibold leading-snug text-heading">
        {days.max === 0
          ? "At 2,000 m or below: no acclimatisation days needed."
          : days.min === days.max
            ? days.max === 1
              ? "Allow about 1 day to acclimatise before playing."
              : `Allow about ${days.max} days to acclimatise before playing.`
            : `Allow about ${days.min}–${days.max} days to acclimatise before playing.`}
      </p>
      <p className="text-xs leading-snug text-muted">
        FIFA: one day for every 300–500 m above 2,000 m, staged on the way up. Altitudes are round figures for each city; check the
        venue itself.
      </p>
    </div>
  );
}
