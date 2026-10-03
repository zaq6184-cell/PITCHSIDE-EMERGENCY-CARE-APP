import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bone,
  Brain,
  BriefcaseMedical,
  CalendarDays,
  ChevronRight,
  FileText,
  HeartPulse,
  Stethoscope,
  ClipboardList,
  PlayCircle,
  UsersRound,
} from "lucide-react";
import { AppShell, HeroPhoto, Note, Panel, SectionLabel } from "@/components/workshop";
import { programme } from "@/lib/programme";
import { workshop } from "@/lib/workshop";
import { asset } from "@/lib/asset";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <Note>
          <span className="font-semibold text-navy">{workshop.rule}</span>
        </Note>
        <SectionLabel>TAP YOUR COLOUR</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          {workshop.roles.map((r) => (
            <Link
              key={r.id}
              to="/role/$id"
              params={{ id: r.id }}
              className={`flex min-h-[4.75rem] flex-col items-center justify-center rounded-lg px-2 py-4 text-center transition-transform duration-150 ease-out active:scale-95${r.id === "yellow" ? " col-span-2" : ""}`}
              style={{
                backgroundColor: r.color,
                color: r.text,
                boxShadow: r.id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.22)" : undefined,
              }}
            >
              <span className="font-display text-xl font-bold tracking-[0.1em]">{r.name}</span>
              <span className="mt-1 text-[11px] font-medium opacity-90">
                {r.id === "yellow" ? "× 4 First Aiders · second response" : r.role}
              </span>
            </Link>
          ))}
        </div>
        <Note>If it is not your colour, do not reach in.</Note>
        <Panel>
          <div className="px-3.5 py-3.5">
            <SectionLabel>FIELD OF PLAY (FoP) MEDICAL TEAM</SectionLabel>
            <dl className="mt-2 flex flex-col divide-y divide-line text-sm leading-snug">
              {[
                ["Match Doctor / Leader", "Black — leads the FoP medical team."],
                ["First-response team", "Red + Blue + White + Green + Orange."],
                ["Second-response team", "Yellow — the First Aiders."],
              ].map(([t, d]) => (
                <div key={t} className="py-1.5">
                  <dt className="font-display text-xs font-semibold tracking-wide text-navy">{t}</dt>
                  <dd>{d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Panel>
        <Panel>
          <div className="px-3.5 py-3.5">
            <SectionLabel>PRINTABLE HKL CARDS & HANDOUTS (PDF)</SectionLabel>
            <p className="mt-2 text-xs leading-snug text-muted">
              Updated: Blue takes over compressions at 2 min · White = spinal board ± basket · first carry after the 3rd shock (earlier if ROSC) · LMA connected: oxygen stays on for shocks.
            </p>
            <PdfList
              items={[
                ["Colour role cards (A4, 10 cards)", "/docs/HKL-SCA-Colour-Role-Cards-2026.pdf"],
                ["Pictorial participant card (2 pages)", "/docs/HKL-SCA-Pictorial-Participant-Card-2026.pdf"],
                ["On-field colour reference (2 pages)", "/docs/HKL-SCA-OnField-Colour-Reference-2026.pdf"],
              ]}
            />
            <p className="mt-3 font-display text-[11px] font-semibold tracking-[0.12em] text-navy">STATION HANDOUTS</p>
            <PdfList
              items={[
                ["Station 1 · FIFA PEAP (3 pages)", "/docs/HKL-Station-1-FIFA-PEAP-2026.pdf"],
                ["Station 2 · Cardiac arrest (2 pages)", "/docs/HKL-Station-2-Cardiac-Arrest-2026.pdf"],
                ["Station 3 · Primary survey (5 pages)", "/docs/HKL-Station-3-Primary-Survey-2026.pdf"],
                ["Station 4 · Immobilization (6 pages)", "/docs/HKL-Station-4-Immobilization-2026.pdf"],
                ["Station 5 · Emergency care bag (7 pages)", "/docs/HKL-Station-5-Emergency-Care-Bag-2026.pdf"],
              ]}
            />
          </div>
        </Panel>
        <HeroPhoto
          src={asset("/img/stations/positions-aerial-v3.jpg")}
          alt="Team positions around the collapsed player: Orange and Green at the head, Red chest, Blue right hip, White right leg, Black left flank, four Yellow First Aiders at the feet; below the feet, in line with the player, the split scoop stretcher and then the basket stretcher"
          caption="FIFA PEAP 2025 positions. Orange, Red, Blue and White on the player's RIGHT. Green at the head on the LEFT. Black on the LEFT flank. Yellow First Aiders at the FEET. Extrication kit below the feet, in line with the player (FIFA): split scoop, then the basket 2–3 lengths away (arrest: spinal board ± basket)."
          contain
          tall
        />
        <SectionLabel>FIFA TOPICS</SectionLabel>
        <Tiles
          items={[
            { to: "/fifa", icon: HeartPulse, title: "Sudden cardiac arrest", sub: "Signs · emergency steps · videos · official downloads", wide: true },
            { to: "/focus", icon: Brain, title: "Concussion assessment (FOCUS)", sub: "11 domains · FIFA video · lanyard card · PDFs", wide: true },
            { to: "/cspine", icon: Bone, title: "Cervical spine injury", sub: "FIFA film · set piece by colour · collar · log roll", wide: true },
            { to: "/pitchside", icon: Stethoscope, title: "Pitchside emergency care", sub: "5 Skill Zone films · set-piece protocols · role cards · bag", wide: true },
          ]}
        />
        <SectionLabel>WORKSHOP</SectionLabel>
        <Tiles
          items={[
            { to: "/groups", icon: UsersRound, title: "Find your group", sub: "Sunday practical session · Groups 1–6 · search your name", wide: true },
            { to: "/stations", icon: ClipboardList, title: "Skill stations", sub: "Stations 1–5 + simulation" },
            { to: "/event", icon: CalendarDays, title: "Programme", sub: `${programme.datesLabel}` },
            { to: "/bag", icon: BriefcaseMedical, title: "Emergency bag", sub: "FIFA packing list" },
            { to: "/guides", icon: PlayCircle, title: "Films", sub: "SCA · Skill Zone · concussion · airway" },
          ]}
        />
        <HeroPhoto
          src={asset("/img/stations/peap-marks.jpg")}
          alt="FIFA PEAP 2025 official position marks around the player"
          caption="FIFA PEAP 2025 official marks. May flip all aspects depending on site of injury and hazards."
          contain
        />
      </div>
    </AppShell>
  );
}

function PdfList({ items }: { items: [string, string][] }) {
  return (
    <ul className="mt-2 flex flex-col divide-y divide-line">
      {items.map(([t, h]) => (
        <li key={h}>
          <a
            href={asset(h)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-2.5 py-2 text-sm leading-snug text-navy"
          >
            <FileText className="size-4 shrink-0 text-gold" />
            {t}
          </a>
        </li>
      ))}
    </ul>
  );
}

type Tile = {
  to: "/fifa" | "/focus" | "/cspine" | "/pitchside" | "/groups" | "/stations" | "/event" | "/bag" | "/guides";
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
              <div>
                <p className="font-display text-xs font-semibold tracking-[0.12em] text-navy">{t.title.toUpperCase()}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted">{t.sub}</p>
              </div>
              {t.wide ? <ChevronRight className="ml-auto size-5 shrink-0 text-gold" /> : null}
            </div>
          </Panel>
        </Link>
      ))}
    </div>
  );
}
