import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bone,
  Brain,
  BriefcaseMedical,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  HeartPulse,
  ListOrdered,
  PlayCircle,
  Stethoscope,
} from "lucide-react";
import { PositionDiagram } from "@/components/position-diagram";
import { AppShell, HeroPhoto, Note, Panel, SectionLabel } from "@/components/workshop";
import { asset } from "@/lib/asset";
import { about, disclaimer } from "@/lib/disclaimer";
import { fifaDownloads } from "@/lib/fifa-links";
import { workshop } from "@/lib/workshop";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <Note>
          <span className="font-semibold text-navy">{workshop.rule}</span>
        </Note>
        <SectionLabel>TAP A COLOUR</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          {workshop.roles.map((r) => (
            <Link
              key={r.id}
              to="/role/$id"
              params={{ id: r.id }}
              className="flex min-h-[4.75rem] flex-col items-center justify-center rounded-lg px-2 py-4 text-center transition-transform duration-150 ease-out active:scale-95"
              style={{
                backgroundColor: r.color,
                color: r.text,
                boxShadow: r.id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.22)" : undefined,
              }}
            >
              <span className="font-display text-xl font-bold tracking-[0.1em]">{r.name}</span>
              <span className="mt-1 text-[11px] font-medium opacity-90">{r.role}</span>
            </Link>
          ))}
        </div>
        <Note>If it is not your colour, do not reach in.</Note>

        <Panel>
          <div className="px-3.5 pt-3.5">
            <SectionLabel>WHERE EACH COLOUR SITS</SectionLabel>
          </div>
          <div className="mt-3">
            <PositionDiagram />
          </div>
          <ul className="flex flex-col divide-y divide-line px-3.5 py-2 text-sm leading-snug">
            <li className="py-1.5">
              <span className="font-semibold text-navy">At the head: </span>Orange, with Green beside the bag and AED on the
              player's left.
            </li>
            <li className="py-1.5">
              <span className="font-semibold text-navy">Player's right: </span>Red at the chest, Blue at the pelvis, White at the
              lower legs.
            </li>
            <li className="py-1.5">
              <span className="font-semibold text-navy">Player's left: </span>Black, the team leader, level with the chest.
            </li>
          </ul>
        </Panel>
        <HeroPhoto
          src={asset("/img/stations/positions-aerial-v4.jpg")}
          alt="Six people kneeling around a player lying on the pitch: Orange and Green at the head, Red, Blue and White down the player's right side, Black on the player's left"
          caption="The same six positions seen from above. Illustration."
          contain
        />
        <Panel>
          <div className="flex flex-col gap-2 px-3.5 py-3.5">
            <SectionLabel>STRETCHER TEAM</SectionLabel>
            <p className="text-sm leading-snug">{workshop.stretcherNote}</p>
          </div>
        </Panel>

        <SectionLabel>FIFA TOPICS</SectionLabel>
        <Tiles
          items={[
            { to: "/fifa", icon: HeartPulse, title: "Sudden cardiac arrest", sub: "Signs · emergency steps · FIFA's films and downloads", wide: true },
            { to: "/focus", icon: Brain, title: "Concussion assessment (FOCUS)", sub: "On-pitch assessment, domain by domain", wide: true },
            { to: "/cspine", icon: Bone, title: "Cervical spine injury", sub: "Set piece by colour · collar · log roll", wide: true },
            { to: "/pitchside", icon: Stethoscope, title: "Pitchside emergency care", sub: "Set-piece protocols · role cards · bag", wide: true },
          ]}
        />
        <SectionLabel>STUDY</SectionLabel>
        <Tiles
          items={[
            { to: "/stations", icon: ClipboardList, title: "Skill modules", sub: "PEAP · arrest · survey · immobilisation · bag" },
            { to: "/drill", icon: ListOrdered, title: "Team drill", sub: "Cardiac arrest in six steps" },
            { to: "/bag", icon: BriefcaseMedical, title: "Emergency bag", sub: "FIFA packing list" },
            { to: "/guides", icon: PlayCircle, title: "Films", sub: "Links to FIFA's films" },
          ]}
        />

        <Panel>
          <div className="px-3.5 py-3.5">
            <SectionLabel>FIFA'S OFFICIAL DOCUMENTS</SectionLabel>
            <p className="mt-2 text-xs leading-snug text-muted">
              These open on FIFA's own website. They are FIFA's documents and the authoritative source.
            </p>
            <ul className="mt-2 flex flex-col divide-y divide-line">
              {fifaDownloads.map((d) => (
                <li key={d.href}>
                  <a
                    href={d.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center gap-2 py-2 text-sm font-medium leading-snug text-navy"
                  >
                    <span className="min-w-0 flex-1">{d.label}</span>
                    <ExternalLink className="size-4 shrink-0 text-gold" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel>
          <div id="about" className="flex scroll-mt-24 flex-col gap-2 px-3.5 py-3.5">
            <SectionLabel>ABOUT THIS GUIDE</SectionLabel>
            <p className="text-sm leading-snug">{about}</p>
            <p className="mt-1 font-display text-xs font-semibold tracking-wide text-navy">DISCLAIMER</p>
            {disclaimer.paragraphs.map((p) => (
              <p key={p} className="text-xs leading-snug text-muted">
                {p}
              </p>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

type Tile = {
  to: "/fifa" | "/focus" | "/cspine" | "/pitchside" | "/stations" | "/drill" | "/bag" | "/guides";
  icon: typeof HeartPulse;
  title: string;
  sub: string;
  wide?: boolean;
};

function Tiles({ items }: { items: Tile[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((t) => (
        <Link key={t.to} to={t.to} className={`block active:scale-[0.98]${t.wide ? " col-span-2" : ""}`}>
          <Panel className="h-full">
            <div className={`flex h-full gap-2 px-3 py-3${t.wide ? " flex-row items-center gap-3" : " flex-col"}`}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy text-gold">
                <t.icon className="size-[18px]" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-semibold tracking-wide text-navy">{t.title}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted">{t.sub}</span>
              </span>
              {t.wide ? <ChevronRight className="size-5 shrink-0 text-gold" aria-hidden /> : null}
            </div>
          </Panel>
        </Link>
      ))}
    </div>
  );
}
