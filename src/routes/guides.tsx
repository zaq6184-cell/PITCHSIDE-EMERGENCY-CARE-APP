import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, HeartPulse } from "lucide-react";
import { FifaSkillZoneList, FifaVideoList, SkillVideoList, VideoList } from "@/components/fifa-video";
import { AppShell, JumpChips, SectionLabel } from "@/components/workshop";
import { fifaFocusClip } from "@/lib/videos";

export const Route = createFileRoute("/guides")({
  component: GuidesPage,
  head: () => ({ meta: [{ title: "Films · Pitchside Emergency Care" }] }),
});

function GuidesPage() {
  return (
    <AppShell tab="films" heading="Films">
      <div className="flex flex-col gap-5">
        <JumpChips
          items={[
            { id: "films-sca", label: "SCA films" },
            { id: "films-skill", label: "FIFA Skill Zone" },
            { id: "films-focus", label: "Concussion (FOCUS)" },
            { id: "films-airway", label: "Airway & equipment" },
          ]}
        />
        <Link
          to="/fifa"
          className="flex items-center gap-3 rounded-xl bg-navy px-3.5 py-3 text-on-navy shadow-card active:scale-[0.99]"
        >
          <HeartPulse className="size-6 shrink-0 text-gold" />
          <span className="min-w-0 flex-1">
            <span className="block font-display text-xs font-semibold tracking-[0.14em] text-gold">
              FIFA: SUDDEN CARDIAC ARREST
            </span>
            <span className="block text-sm leading-snug">FIFA's signs, steps, infographics and downloads</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-gold" />
        </Link>
        <FifaVideoList />
        <FifaSkillZoneList />
        <section id="films-focus" className="flex scroll-mt-24 flex-col gap-3">
          <SectionLabel>CONCUSSION — FOCUS</SectionLabel>
          <p className="text-sm leading-snug text-muted">
            FIFA's on-pitch concussion assessment film.{" "}
            <Link to="/focus" className="font-medium text-heading underline underline-offset-2">
              Open the FOCUS protocol
            </Link>
            .
          </p>
          <VideoList clips={[fifaFocusClip]} />
        </section>
        <div id="skills">
          <SkillVideoList />
        </div>
      </div>
    </AppShell>
  );
}
