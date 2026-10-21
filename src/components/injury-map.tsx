import { Link } from "@tanstack/react-router";
import { ChevronRight, Droplet, ScanLine, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { type AnkleFindings, BLEEDING, type Card, getRegion, type KneeFindings, ottawaAnkle, ottawaKnee, type RegionId, REGIONS } from "@/lib/injuries";
import { haptic, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

const SKIN = "#c68642";
const SKIN_LINE = "#7a4a1e";
const KIT = "#5b2d8e";
const KIT_DARK = "#43206a";

/** Tap targets on the figure: shapes per region (both sides of the body share a region). */
type Spot = { id: RegionId; shapes: React.ReactNode; dot: [number, number] };

const SPOTS: Spot[] = [
  { id: "head", dot: [110, 40], shapes: <ellipse cx={110} cy={42} rx={30} ry={33} /> },
  { id: "neck", dot: [110, 77], shapes: <rect x={96} y={68} width={28} height={18} rx={6} /> },
  { id: "chest", dot: [88, 114], shapes: <path d="M76 90 L144 90 L146 150 L74 150 Z" /> },
  { id: "abdomen", dot: [110, 180], shapes: <path d="M74 150 L146 150 L140 212 L80 212 Z" /> },
  {
    id: "shoulder",
    dot: [60, 98],
    shapes: (
      <>
        <circle cx={62} cy={98} r={17} />
        <circle cx={158} cy={98} r={17} />
      </>
    ),
  },
  {
    id: "arm",
    dot: [58, 196],
    shapes: (
      <>
        <path d="M42 96 L76 92 L72 258 L44 258 Z" />
        <path d="M178 96 L144 92 L148 258 L176 258 Z" />
      </>
    ),
  },
  {
    id: "thigh",
    dot: [92, 270],
    shapes: (
      <>
        <path d="M76 246 L108 246 L106 292 L78 292 Z" />
        <path d="M112 246 L144 246 L142 292 L114 292 Z" />
      </>
    ),
  },
  {
    id: "knee",
    dot: [128, 306],
    shapes: (
      <>
        <circle cx={92} cy={306} r={15} />
        <circle cx={128} cy={306} r={15} />
      </>
    ),
  },
  {
    id: "leg",
    dot: [92, 350],
    shapes: (
      <>
        <path d="M80 320 L104 320 L102 386 L82 386 Z" />
        <path d="M116 320 L140 320 L138 386 L118 386 Z" />
      </>
    ),
  },
  {
    id: "ankle",
    dot: [130, 400],
    shapes: (
      <>
        <ellipse cx={90} cy={402} rx={17} ry={14} />
        <ellipse cx={130} cy={402} rx={17} ry={14} />
      </>
    ),
  },
];

/** Big regions first, so the small ones (neck, shoulders, knees, feet) sit on top and win the tap. */
const DRAW_ORDER: RegionId[] = ["chest", "abdomen", "arm", "thigh", "leg", "head", "neck", "shoulder", "knee", "ankle"];

/** A footballer from the front, in kit. Decorative: the tap targets sit on top. */
function Figure() {
  return (
    <g aria-hidden="true">
      {/* legs and socks */}
      {[92, 128].map((x) => (
        <g key={x}>
          <path d={`M${x - 14} 250 L${x + 14} 250 L${x + 12} 300 L${x - 12} 300 Z`} fill={SKIN} stroke={SKIN_LINE} strokeWidth={1.5} />
          <circle cx={x} cy={306} r={12} fill={SKIN} stroke={SKIN_LINE} strokeWidth={1.5} />
          <path d={`M${x - 11} 318 L${x + 11} 318 L${x + 9} 392 L${x - 9} 392 Z`} fill={KIT} stroke={KIT_DARK} strokeWidth={1.5} />
          <ellipse cx={x + (x < 110 ? -2 : 2)} cy={402} rx={15} ry={11} fill="#16181d" />
        </g>
      ))}
      {/* shorts */}
      <path d="M78 210 L142 210 L148 258 L114 262 L110 246 L106 262 L72 258 Z" fill="#14161c" />
      {/* arms */}
      {[-1, 1].map((s) => {
        const sx = 110 + s * 52;
        return (
          <g key={s}>
            <path d={`M${sx} 108 L${sx + s * 10} 112 L${sx + s * 4} 236 L${sx - s * 8} 236 Z`} fill={SKIN} stroke={SKIN_LINE} strokeWidth={1.5} />
            <circle cx={sx - s * 2} cy={246} r={10} fill={SKIN} stroke={SKIN_LINE} strokeWidth={1.5} />
            <path d={`M${110 + s * 34} 88 L${sx + s * 12} 96 L${sx + s * 14} 140 L${sx - s * 8} 142 Z`} fill={KIT} stroke={KIT_DARK} strokeWidth={1.5} />
          </g>
        );
      })}
      {/* shirt */}
      <path d="M76 88 Q110 80 144 88 L148 150 L142 214 L78 214 L72 150 Z" fill={KIT} stroke={KIT_DARK} strokeWidth={1.5} />
      <rect x={100} y={118} width={20} height={26} rx={3} fill="#e9e4f2" opacity={0.9} />
      {/* neck and head */}
      <rect x={100} y={64} width={20} height={24} rx={6} fill={SKIN} stroke={SKIN_LINE} strokeWidth={1.5} />
      <ellipse cx={110} cy={42} rx={24} ry={28} fill={SKIN} stroke={SKIN_LINE} strokeWidth={1.5} />
      <path d="M86 38 Q88 12 110 12 Q132 12 134 38 Q124 24 110 24 Q96 24 86 38 Z" fill="#1a120d" />
    </g>
  );
}

function CardView({ c }: { c: Card }) {
  return (
    <div className={cn("rounded-lg px-3 py-2.5", c.urgent ? "border-l-4 border-danger bg-danger/8" : "bg-note")}>
      <p className="flex items-center gap-1.5 font-semibold text-heading">
        {c.urgent ? <TriangleAlert className="size-4 shrink-0 text-danger" aria-hidden /> : null}
        {c.title}
      </p>
      <ul className="mt-1 flex flex-col gap-1 text-sm leading-snug">
        {c.lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Tap where it hurts: the region lights up and its pitchside card opens underneath — with the Ottawa rules
 * for the knee, the ankle and the foot.
 */
export function InjuryMap() {
  const [sel, setSel] = useState<RegionId | "bleeding" | null>(null);
  const region = sel && sel !== "bleeding" ? getRegion(sel) : undefined;
  const pick = (id: RegionId | "bleeding") => {
    tap();
    haptic(8);
    setSel((cur) => (cur === id ? null : id));
  };
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => pick("bleeding")}
        aria-pressed={sel === "bleeding"}
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 self-center rounded-full px-5 font-display text-sm font-bold tracking-[0.1em] text-white shadow-card transition-transform active:scale-95",
          sel === "bleeding" ? "bg-[#8f2318] ring-2 ring-gold ring-offset-2 ring-offset-paper" : "bg-danger-fill",
        )}
      >
        <Droplet className="size-4" aria-hidden />
        SEVERE BLEEDING
      </button>

      <svg viewBox="0 0 220 420" className="mx-auto block h-auto w-full max-w-[17rem] select-none" role="group" aria-label="Body map: tap a part of the body">
        <Figure />
        {DRAW_ORDER.map((id) => SPOTS.find((x) => x.id === id) as Spot).map((s) => {
          const on = sel === s.id;
          const r = getRegion(s.id);
          return (
            <g
              key={s.id}
              role="button"
              tabIndex={0}
              aria-label={r?.name}
              aria-pressed={on}
              onClick={() => pick(s.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  pick(s.id);
                }
              }}
              className="group cursor-pointer outline-none"
            >
              <g
                className={cn(
                  "transition-all duration-200",
                  on ? "fill-[#c9a227]/45 stroke-gold" : "fill-transparent stroke-transparent group-hover:fill-[#c9a227]/20 group-focus-visible:stroke-heading",
                )}
                strokeWidth={3}
              >
                {s.shapes}
              </g>
              {!on ? (
                <circle cx={s.dot[0]} cy={s.dot[1]} r={4} className="hotspot-dot fill-gold stroke-paper" strokeWidth={1.5} />
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="-mx-1 flex flex-wrap justify-center gap-1.5">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => pick(r.id)}
            aria-pressed={sel === r.id}
            className={cn(
              "min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors",
              sel === r.id ? "border-navy bg-navy text-gold" : "border-line bg-paper text-heading",
            )}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {sel === "bleeding" ? (
          <div key="bleeding" className="caption-in flex flex-col gap-2">
            <CardView c={BLEEDING} />
          </div>
        ) : region ? (
          <div key={region.id} className="caption-in flex flex-col gap-2">
            <div>
              <p className="font-display text-lg font-bold leading-tight text-heading">{region.name}</p>
              <p className="text-xs text-muted">{region.sub}</p>
            </div>
            {region.cards.map((c) => (
              <CardView key={c.title} c={c} />
            ))}
            {region.ottawa === "ankle" ? <OttawaAnkle /> : null}
            {region.ottawa === "knee" ? <OttawaKnee /> : null}
            {region.link ? (
              <Link
                to={region.link.to}
                className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-gold/60 bg-note px-3 py-2 text-sm font-semibold text-heading"
              >
                {region.link.label}
                <ChevronRight className="size-5 shrink-0 text-gold-ink" aria-hidden />
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="text-center text-sm text-muted">Tap the figure, or a part of the body above.</p>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Ottawa tools
function Point({ x, y, label, on, onToggle, name }: { x: number; y: number; label: string; on: boolean; onToggle: () => void; name: string }) {
  return (
    <g
      role="checkbox"
      tabIndex={0}
      aria-checked={on}
      aria-label={`${name}: ${on ? "tender" : "not tender"}`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className="cursor-pointer outline-none [&:focus-visible>circle:nth-child(2)]:stroke-heading"
    >
      <circle cx={x} cy={y} r={17} fill="transparent" />
      <circle cx={x} cy={y} r={11} className={cn("transition-colors duration-150", on ? "fill-danger stroke-paper" : "fill-paper stroke-navy")} strokeWidth={2.5} />
      <text x={x} y={y + 4} textAnchor="middle" className={cn("pointer-events-none font-display text-[11px] font-bold", on ? "fill-white" : "fill-navy")}>
        {label}
      </text>
    </g>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm leading-snug">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex shrink-0 gap-1 rounded-full bg-note p-0.5">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => {
              tap();
              onChange(v);
            }}
            className={cn("min-h-9 min-w-12 rounded-full px-3 text-xs font-semibold", value === v ? "bg-navy text-gold" : "text-heading")}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

function Verdict({ label, yes, why }: { label: string; yes: boolean; why: string }) {
  return (
    <div className={cn("rounded-xl px-3 py-2.5", yes ? "bg-danger/10" : "bg-[#1A7F45]/12")}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
        <ScanLine className={cn("size-3.5", yes ? "text-danger" : "text-[#1A7F45]")} aria-hidden />
        {label}
      </p>
      <p className="mt-0.5 font-display text-xl font-bold leading-none text-heading">{yes ? "Needed" : "Not needed"}</p>
      <p className="mt-1 text-[11px] leading-snug text-muted">{why}</p>
    </div>
  );
}

/** A foot from the side, toes to the right: the outer side of a right foot. */
const FOOT =
  "M30 8 L64 8 L62 84 C62 98 70 108 86 114 L128 124 C142 128 150 134 150 141 C150 147 145 150 138 150 L42 150 C30 150 22 143 22 132 C22 120 28 110 32 100 Z";

function OttawaAnkle() {
  const [f, setF] = useState<AnkleFindings>({ malleolarPain: true, midfootPain: false, lateralMalleolus: false, medialMalleolus: false, fifthMetatarsal: false, navicular: false, fourSteps: true });
  const r = ottawaAnkle(f);
  const toggle = (k: keyof AnkleFindings) => () => {
    tap();
    setF((v) => ({ ...v, [k]: !v[k] }));
  };
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line px-3 py-3">
      <div>
        <p className="font-display text-sm font-bold tracking-wide text-heading">OTTAWA ANKLE AND FOOT RULES</p>
        <p className="text-xs leading-snug text-muted">For pain around the ankle or the midfoot. Say where it hurts, press each bone point and tap the ones that are tender.</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-full text-sm">Where does it hurt?</span>
        {(
          [
            ["malleolarPain", "Around the ankle bones"],
            ["midfootPain", "Midfoot"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={f[k]}
            onClick={toggle(k)}
            className={cn("min-h-9 rounded-full border px-3 text-xs font-semibold", f[k] ? "border-navy bg-navy text-gold" : "border-line bg-paper text-heading")}
          >
            {label}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 330 178" className="block h-auto w-full" role="group" aria-label="Bone points on the outer and inner side of the foot">
        <text x={86} y={170} textAnchor="middle" className="fill-muted text-[10px] font-semibold tracking-[0.1em]">
          OUTER SIDE
        </text>
        <text x={244} y={170} textAnchor="middle" className="fill-muted text-[10px] font-semibold tracking-[0.1em]">
          INNER SIDE
        </text>
        {/* outer side: toes to the right */}
        <g transform="translate(6 2)">
          <path d={FOOT} fill={SKIN} stroke={SKIN_LINE} strokeWidth={1.5} />
          <path d="M33 58 L38 104" stroke="#c9a227" strokeWidth={6} strokeLinecap="round" opacity={0.55} />
          <ellipse cx={42} cy={100} rx={9} ry={7} fill="#b07535" opacity={0.7} />
        </g>
        {/* inner side: the same foot mirrored, toes to the left */}
        <g transform="translate(324 2) scale(-1 1)">
          <path d={FOOT} fill={SKIN} stroke={SKIN_LINE} strokeWidth={1.5} />
          <path d="M33 58 L38 104" stroke="#c9a227" strokeWidth={6} strokeLinecap="round" opacity={0.55} />
          <ellipse cx={44} cy={96} rx={9} ry={7} fill="#b07535" opacity={0.7} />
        </g>
        <Point x={6 + 40} y={2 + 104} label="A" on={f.lateralMalleolus} onToggle={toggle("lateralMalleolus")} name="A, tip or back edge of the outer ankle bone" />
        <Point x={6 + 104} y={2 + 140} label="C" on={f.fifthMetatarsal} onToggle={toggle("fifthMetatarsal")} name="C, base of the fifth metatarsal" />
        <Point x={324 - 42} y={2 + 100} label="B" on={f.medialMalleolus} onToggle={toggle("medialMalleolus")} name="B, tip or back edge of the inner ankle bone" />
        <Point x={324 - 86} y={2 + 120} label="D" on={f.navicular} onToggle={toggle("navicular")} name="D, navicular" />
      </svg>
      <ul className="grid grid-cols-1 gap-1 text-xs leading-snug text-muted min-[420px]:grid-cols-2">
        <li>
          <span className="font-bold text-heading">A</span> tip or back edge of the outer ankle bone (lowest 6 cm, shaded)
        </li>
        <li>
          <span className="font-bold text-heading">B</span> tip or back edge of the inner ankle bone (lowest 6 cm)
        </li>
        <li>
          <span className="font-bold text-heading">C</span> base of the fifth metatarsal, outer midfoot
        </li>
        <li>
          <span className="font-bold text-heading">D</span> navicular, inner midfoot
        </li>
      </ul>
      <YesNo label="Can take four steps — now and when checked again" value={f.fourSteps} onChange={(v) => setF((x) => ({ ...x, fourSteps: v }))} />
      <div className="grid grid-cols-2 gap-2" aria-live="polite">
        <Verdict
          label="Ankle X-ray"
          yes={r.ankle}
          why={r.ankle ? (f.lateralMalleolus || f.medialMalleolus ? "Tender at A or B." : "Cannot take four steps, with pain around the ankle bones.") : r.ankleZone ? "No tenderness at A or B, and walks." : "No pain around the ankle bones."}
        />
        <Verdict
          label="Foot X-ray"
          yes={r.foot}
          why={r.foot ? (f.fifthMetatarsal || f.navicular ? "Tender at C or D." : "Cannot take four steps, with midfoot pain.") : r.footZone ? "No tenderness at C or D, and walks." : "No midfoot pain."}
        />
      </div>
      <p className="text-[11px] leading-snug text-muted">
        The rules decide who needs an X-ray; they do not clear a player to play on. Validated in adults, including in sports
        medicine clinics.
      </p>
    </div>
  );
}

function OttawaKnee() {
  const [f, setF] = useState<KneeFindings>({ age55: false, patella: false, fibularHead: false, flex90: true, fourSteps: true });
  const r = ottawaKnee(f);
  const toggle = (k: "patella" | "fibularHead") => () => {
    tap();
    setF((v) => ({ ...v, [k]: !v[k] }));
  };
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line px-3 py-3">
      <div>
        <p className="font-display text-sm font-bold tracking-wide text-heading">OTTAWA KNEE RULE</p>
        <p className="text-xs leading-snug text-muted">A right knee from the front. Tap the points that are tender, then answer the three questions.</p>
      </div>
      <svg viewBox="0 0 200 200" className="mx-auto block h-auto w-full max-w-[13rem]" role="group" aria-label="A right knee from the front">
        <path d="M58 6 L142 6 L136 78 C134 92 130 100 124 106 L120 194 L80 194 L76 106 C70 100 66 92 64 78 Z" fill={SKIN} stroke={SKIN_LINE} strokeWidth={1.5} />
        <ellipse cx={100} cy={86} rx={19} ry={23} fill="#d79a5a" stroke={SKIN_LINE} strokeWidth={1.2} />
        <ellipse cx={74} cy={124} rx={9} ry={8} fill="#b07535" opacity={0.7} />
        <text x={36} y={150} textAnchor="middle" className="fill-muted text-[9px] font-semibold">
          OUTER
        </text>
        <text x={164} y={150} textAnchor="middle" className="fill-muted text-[9px] font-semibold">
          INNER
        </text>
        <Point x={100} y={86} label="P" on={f.patella} onToggle={toggle("patella")} name="P, kneecap — tender, with no other bony tenderness" />
        <Point x={70} y={126} label="F" on={f.fibularHead} onToggle={toggle("fibularHead")} name="F, head of the fibula" />
      </svg>
      <ul className="grid grid-cols-1 gap-1 text-xs leading-snug text-muted">
        <li>
          <span className="font-bold text-heading">P</span> kneecap — tender, with no other bony tenderness of the knee
        </li>
        <li>
          <span className="font-bold text-heading">F</span> head of the fibula, just below the outer side of the knee
        </li>
      </ul>
      <YesNo label="Aged 55 or over" value={f.age55} onChange={(v) => setF((x) => ({ ...x, age55: v }))} />
      <YesNo label="Can bend the knee to 90°" value={f.flex90} onChange={(v) => setF((x) => ({ ...x, flex90: v }))} />
      <YesNo label="Can take four steps — now and when checked again" value={f.fourSteps} onChange={(v) => setF((x) => ({ ...x, fourSteps: v }))} />
      <div aria-live="polite">
        <Verdict label="Knee X-ray" yes={r.xray} why={r.xray ? `Because: ${r.reasons.join("; ")}.` : "None of the five criteria."} />
      </div>
    </div>
  );
}
