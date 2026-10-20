import { Briefcase, ChevronRight, Package, RotateCcw, Timer, Trash2, TriangleAlert, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/confetti";
import { record, step as did } from "@/lib/progress";
import { BINS, type BinId, makeRound, type PackItem, type Placement, scoreRound } from "@/lib/pack-bag";
import { haptic, sfx, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

const binTitle = (id: BinId) => BINS.find((b) => b.id === id)?.title ?? id;

function binAt(x: number, y: number): BinId | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const b = (el as HTMLElement).closest?.("[data-bin]");
    if (b) return b.getAttribute("data-bin") as BinId;
  }
  return null;
}

/**
 * Pack the bag: each item from FIFA's packing list goes into its tray or pouch — drag it there, or tap the
 * place. Faulty kit goes in the replace bin: packing it is a critical fail. Against the clock.
 */
export function PackTheBag() {
  const [round, setRound] = useState<PackItem[] | null>(null);
  const [i, setI] = useState(0);
  const [placed, setPlaced] = useState<Placement[]>([]);
  const [flash, setFlash] = useState<{ bin: BinId; ok: boolean; right: BinId } | null>(null);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [over, setOver] = useState<BinId | null>(null);
  const [t0, setT0] = useState(0);
  const [now, setNow] = useState(0);
  const [burst, setBurst] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const done = round != null && i >= round.length;
  const item = round?.[i];

  useEffect(() => {
    if (!round || done) return;
    const iv = window.setInterval(() => setNow(performance.now()), 250);
    return () => window.clearInterval(iv);
  }, [round, done]);

  const result = done ? scoreRound(placed) : null;
  const seconds = Math.max(0, ((done ? now : now || t0) - t0) / 1000);

  useEffect(() => {
    if (!result) return;
    if (result.clean) {
      sfx("cheer", 0.45);
      setBurst((b) => b + 1);
      record(did.bag);
    }
    // only once per finished round
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const begin = () => {
    tap();
    sfx("whistle", 0.4);
    setRound(makeRound());
    setI(0);
    setPlaced([]);
    setFlash(null);
    const t = performance.now();
    setT0(t);
    setNow(t);
  };

  const put = (bin: BinId) => {
    if (!item || flash) return;
    const ok = bin === item.bin;
    setPlaced((p) => [...p, { item, bin }]);
    setFlash({ bin, ok, right: item.bin });
    if (ok) {
      sfx("correct", 0.45);
      haptic(12);
    } else {
      sfx("wrong", 0.4);
      haptic([30, 40, 30]);
    }
    window.setTimeout(
      () => {
        setFlash(null);
        setI((v) => v + 1);
        setNow(performance.now());
      },
      ok ? 450 : 1300,
    );
  };

  if (!round) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-5 text-center">
        <span className="float-y grid size-16 place-items-center rounded-2xl bg-[#1A7F45] text-white shadow-card">
          <Briefcase className="size-8" aria-hidden />
        </span>
        <h3 className="font-display text-xl font-bold tracking-wide text-heading">Pack the bag</h3>
        <p className="max-w-xs text-sm leading-snug text-muted">
          Eleven items from FIFA's packing list. Drag each one into its tray or pouch — or tap the place. Read the labels: faulty kit
          goes in the replace bin, because packing it is a critical fail.
        </p>
        <button
          type="button"
          onClick={begin}
          className="mt-1 inline-flex min-h-12 items-center gap-2 rounded-xl bg-navy px-6 font-display text-base font-semibold tracking-wide text-gold active:scale-95"
        >
          Start
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
    );
  }

  if (done && result) {
    return (
      <div className="relative flex flex-col items-center gap-3 px-4 py-6 text-center">
        {result.clean ? <Confetti key={burst} count={40} spread={1.4} /> : null}
        <span className="grid size-16 place-items-center rounded-2xl bg-gold text-on-gold shadow-card">
          <Trophy className="size-8" aria-hidden />
        </span>
        <p className="font-display text-4xl font-bold text-heading">
          {result.right}
          <span className="text-xl text-muted"> / {result.total}</span>
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Timer className="size-4" aria-hidden />
          {seconds.toFixed(0)} seconds
        </p>
        {result.criticalFails.length ? (
          <div className="w-full rounded-xl border-l-4 border-danger bg-danger/10 px-3 py-2.5 text-left text-sm leading-snug">
            <p className="flex items-center gap-1.5 font-semibold text-danger">
              <TriangleAlert className="size-4" aria-hidden />
              Critical fail
            </p>
            <ul className="mt-1 flex flex-col gap-1">
              {result.criticalFails.map((f) => (
                <li key={f.name}>
                  {f.name} — {f.detail}. {f.fault}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {result.wrongBin.length ? (
          <div className="w-full rounded-xl bg-note px-3 py-2.5 text-left text-sm leading-snug">
            <p className="font-semibold text-heading">Where these go</p>
            <ul className="mt-1 flex flex-col gap-1">
              {result.wrongBin.map((p) => (
                <li key={p.item.name + p.item.detail}>
                  {p.item.name}: <span className="font-semibold">{binTitle(p.item.bin)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="max-w-xs text-sm leading-snug text-muted">
          {result.clean ? "Every item in its place, and nothing faulty packed — Green is ready." : "Check the bag page for the trays, then go again."}
        </p>
        <button
          type="button"
          onClick={begin}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-navy px-4 font-display text-sm font-semibold tracking-wide text-gold active:scale-95"
        >
          <RotateCcw className="size-4" aria-hidden />
          Pack again
        </button>
      </div>
    );
  }

  const cur = item as PackItem;
  const binClass = (id: BinId) =>
    cn(
      "relative flex flex-col justify-center rounded-lg border-2 px-2 py-2 text-left transition-all duration-200 active:scale-[0.98]",
      flash?.bin === id && flash.ok && "border-[#1A7F45] bg-[#1A7F45]/20",
      flash?.bin === id && !flash.ok && "shake border-danger bg-danger/15",
      flash && !flash.ok && flash.right === id && "border-gold bg-gold/25",
      !flash && over === id && "border-gold bg-gold/20",
      !(flash && (flash.bin === id || (!flash.ok && flash.right === id))) && !(over === id && !flash) && (id === "replace" ? "border-danger/50 bg-danger/5" : "border-white/15 bg-white/8"),
    );
  const count = (id: BinId) => placed.filter((p) => p.bin === id).length;
  const bin = (id: BinId, className?: string) => {
    const b = BINS.find((x) => x.id === id);
    if (!b) return null;
    return (
      <button key={id} type="button" data-bin={id} onClick={() => put(id)} className={cn(binClass(id), className)} aria-label={`${b.title}, ${b.where}`}>
        <span className={cn("font-display text-[13px] font-bold leading-tight tracking-wide", id === "replace" ? "text-danger" : "text-on-navy")}>{b.title}</span>
        <span className={cn("text-[10.5px] leading-tight", id === "replace" ? "text-muted" : "text-gold-soft")}>{b.where}</span>
        {count(id) ? (
          <span className={cn("absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full text-[10px] font-bold", id === "replace" ? "bg-danger-fill text-white" : "bg-gold text-on-gold")}>
            {count(id)}
          </span>
        ) : null}
        {id === "replace" ? <Trash2 className="absolute bottom-2 right-2 size-4 text-danger" aria-hidden /> : null}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3 px-3.5 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xs font-semibold tracking-[0.14em] text-muted">
          ITEM {i + 1} OF {round.length}
        </p>
        <p className="flex items-center gap-1 font-display text-xs font-semibold tracking-[0.14em] text-gold-ink">
          <Timer className="size-3.5" aria-hidden />
          {seconds.toFixed(0)} s
        </p>
      </div>

      <div className="relative z-10 flex justify-center">
        <div
          key={i}
          role="img"
          aria-label={`${cur.name}${cur.detail ? `, ${cur.detail}` : ""}`}
          onPointerDown={(e) => {
            if (flash) return;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // no capture available: the drag still follows moves over the card
            }
            start.current = { x: e.clientX, y: e.clientY };
            setDrag({ dx: 0, dy: 0 });
          }}
          onPointerMove={(e) => {
            if (!start.current) return;
            setDrag({ dx: e.clientX - start.current.x, dy: e.clientY - start.current.y });
            setOver(binAt(e.clientX, e.clientY));
          }}
          onPointerUp={(e) => {
            const s = start.current;
            start.current = null;
            setDrag(null);
            setOver(null);
            if (!s) return;
            if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 8) return; // a tap on the card itself does nothing
            const b = binAt(e.clientX, e.clientY);
            if (b) put(b);
          }}
          onPointerCancel={() => {
            start.current = null;
            setDrag(null);
            setOver(null);
          }}
          className={cn(
            "caption-in flex w-full max-w-[17rem] cursor-grab touch-none select-none items-center gap-3 rounded-xl border border-line bg-paper px-3.5 py-3 shadow-card",
            drag && "cursor-grabbing shadow-[0_18px_30px_-12px_rgba(0,0,0,0.5)]",
            flash && "opacity-0 transition-opacity duration-300",
          )}
          style={drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.04)` } : undefined}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-note text-heading">
            <Package className="size-6" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-base font-bold leading-tight text-heading">{cur.name}</span>
            {cur.detail ? <span className="block text-xs leading-snug text-muted">{cur.detail}</span> : null}
          </span>
        </div>
      </div>
      <p className="text-center text-xs text-muted">Drag it into its place — or tap the place.</p>

      {/* the bag, open: left tray, right tray, the two pouches and the front pocket */}
      <div className="rounded-2xl bg-gradient-to-b from-[#22406e] to-[#1a3357] p-2.5 shadow-card">
        <div className="mx-auto -mt-1 mb-2 h-2 w-16 rounded-full bg-[#0f2140]" aria-hidden="true" />
        <div className="grid grid-cols-2 gap-2">
          {bin("airway", "row-span-2 min-h-28")}
          {bin("circulation", "min-h-14")}
          {bin("monitor", "min-h-14")}
          {bin("wound", "min-h-14")}
          {bin("drugs", "min-h-14")}
          {bin("ppe", "col-span-2 min-h-12")}
        </div>
      </div>
      {bin("replace", "min-h-14")}
      {flash && !flash.ok ? (
        <p className="caption-in text-center text-sm font-medium text-ink" aria-live="polite">
          {cur.fault ? `${cur.fault} It goes in the replace bin.` : `It goes in ${binTitle(flash.right)}.`}
        </p>
      ) : null}
    </div>
  );
}
