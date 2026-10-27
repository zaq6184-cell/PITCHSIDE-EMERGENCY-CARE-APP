import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, CircleCheck, HeartPulse, Thermometer, Volleyball } from "lucide-react";
import { useSyncExternalStore } from "react";
import { LoopClip } from "@/components/loop-clip";
import { AppShell, Note, Panel } from "@/components/workshop";
import { CASES } from "@/lib/cases";
import { EMPTY, getProgress, subscribeProgress } from "@/lib/progress";
import { CASE_PICS } from "@/lib/scene-images";

export const Route = createFileRoute("/cases")({
  component: CasesPage,
  head: () => ({ meta: [{ title: "Case simulator · Pitchside Emergency Care" }] }),
});

const ICON = { vf: HeartPulse, commotio: Volleyball, heat: Thermometer } as const;
const TINT = { vf: ["#FBE9E7", "#C0392B"], commotio: ["#E4EFF8", "#1F6AA5"], heat: ["#FDEBDD", "#B3541E"] } as const;

function CasesPage() {
  const p = useSyncExternalStore(subscribeProgress, getProgress, () => EMPTY);
  return (
    <AppShell tab="drill">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">CASE SIMULATOR</p>
            <h1 className="mt-0.5 font-display text-xl font-bold leading-tight">Make the calls, watch the monitor</h1>
            <p className="mt-1 text-sm text-gold-soft">
              Three pitchside cases. Every decision costs time on the case clock, and the monitor answers. The debrief shows each
              decision and what it meant.
            </p>
          </div>
        </Panel>
        <Note>
          <span className="font-semibold text-heading">Teaching with it: </span>
          open a case in full screen on a projector and let the group call each decision before you tap it. Sound on gives the
          monitor's beep and alarms.
        </Note>
        <div className="flex flex-col gap-2.5">
          {CASES.map((c) => {
            const Icon = ICON[c.id];
            const [tint, ink] = TINT[c.id];
            const solved = p.cases.includes(c.id);
            return (
              <Link key={c.id} to="/case/$id" params={{ id: c.id }} className="block active:scale-[0.99]">
                <Panel>
                  <div className="flex items-center gap-3 px-3 py-3">
                    <span className="relative shrink-0">
                      <span className="relative block w-28 overflow-hidden rounded-xl">
                        <img src={CASE_PICS[c.id].small} alt="" width={640} height={360} loading="lazy" className="block aspect-video w-full bg-navy object-cover" />
                        <LoopClip src={CASE_PICS[c.id].smallVideo} />
                      </span>
                      <span
                        className="tint-chip absolute -bottom-1.5 -right-1.5 grid size-8 place-items-center rounded-full ring-2 ring-paper"
                        style={{ "--tint": tint, "--ink": ink } as React.CSSProperties}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 font-display text-[11px] font-semibold tracking-[0.14em] text-muted">
                        {c.short.toUpperCase()}
                        {solved ? <CircleCheck className="size-3.5 text-[#1A7F45]" aria-label="solved" /> : null}
                      </span>
                      <span className="block font-display text-lg font-bold leading-tight text-heading">{c.title}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted">{c.setting}</span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-gold-ink" aria-hidden />
                  </div>
                </Panel>
              </Link>
            );
          })}
        </div>
        <p className="px-1 text-[11px] leading-snug text-muted">
          The cases follow this guide's FIFA set piece (FIFA on-field protocols, 2025; FIFA Emergency Care Manual), the AHA's figures
          for survival over time, and NATA / ACSM guidance on exertional heat stroke. Times and outcomes are teaching estimates.
        </p>
      </div>
    </AppShell>
  );
}
