import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Briefcase, Candy, ChevronRight, ClipboardList, Hand, HeartCrack, HeartPulse, type LucideIcon, Syringe, Venus, Wind } from "lucide-react";
import { CareCardView } from "@/components/care-card";
import { AppShell, JumpChips, Panel } from "@/components/workshop";
import { MEDICAL, MEDICAL_INTRO, MEDICAL_RULE, MEDICAL_TEAM, type MedicalId } from "@/lib/medical";
import { MEDICAL_PICS } from "@/lib/scene-images";

export const Route = createFileRoute("/medical")({
  component: MedicalPage,
  head: () => ({ meta: [{ title: "Medical emergencies · Pitchside Emergency Care" }] }),
});

const ICONS: Record<MedicalId, LucideIcon> = { chest: HeartCrack, anaphylaxis: Syringe, asthma: Wind, hypo: Candy, seizure: Activity, choking: Hand, female: Venus };
const CHIPS: Record<MedicalId, string> = {
  chest: "Chest pain",
  anaphylaxis: "Anaphylaxis",
  asthma: "Asthma",
  hypo: "Low blood sugar",
  seizure: "Seizure",
  choking: "Choking",
  female: "Women's health",
};

const ROW = "flex items-center gap-3 px-3.5 py-3 active:bg-cream";

function RowBody({ Icon, label, sub }: { Icon: LucideIcon; label: string; sub: string }) {
  return (
    <>
      <Icon className="size-5 shrink-0 text-gold-ink" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-semibold tracking-wide text-heading">{label}</span>
        <span className="block text-xs leading-snug text-muted">{sub}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-gold-ink" aria-hidden />
    </>
  );
}

function MedicalPage() {
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
            <h1 className="font-display text-xl font-bold tracking-wide text-heading">Medical emergencies</h1>
            <p className="text-sm leading-snug">{MEDICAL_INTRO}</p>
            <p className="flex items-start gap-2.5 rounded-lg bg-danger-fill px-3 py-2.5 text-sm font-semibold leading-snug text-white">
              <HeartPulse className="mt-0.5 size-5 shrink-0" aria-hidden />
              <span>{MEDICAL_RULE}</span>
            </p>
            <p className="text-xs leading-snug text-muted">{MEDICAL_TEAM}</p>
          </div>
        </Panel>
        <JumpChips items={MEDICAL.map((c) => ({ id: `med-${c.id}`, label: CHIPS[c.id] }))} />
        {MEDICAL.map((c, i) => (
          <CareCardView key={c.id} c={c} anchor={`med-${c.id}`} icon={ICONS[c.id]} pic={MEDICAL_PICS[c.id]} eager={i === 0} />
        ))}
        <Panel>
          <ul className="divide-y divide-line">
            <li>
              <Link to="/station/$id" params={{ id: "5" }} className={ROW}>
                <RowBody Icon={Briefcase} label="The drugs in the FIFA emergency bag" sub="Module 5 · emergency care bag" />
              </Link>
            </li>
            <li>
              <Link to="/handover" className={ROW}>
                <RowBody Icon={ClipboardList} label="Handover to the ambulance crew" sub="ATMIST, ready to read out or share" />
              </Link>
            </li>
            <li>
              <Link to="/arrest" className={ROW}>
                <RowBody Icon={HeartPulse} label="Arrest timer" sub="CPR clock · 2-minute checks · shock and drug log" />
              </Link>
            </li>
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
