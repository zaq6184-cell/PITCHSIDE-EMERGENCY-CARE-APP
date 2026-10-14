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
import { useEffect, useRef } from "react";
import { PositionDiagram } from "@/components/position-diagram";
import { RoleExplorer3D } from "@/components/set-piece-3d";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { asset } from "@/lib/asset";
import { about, aboutApp, disclaimer } from "@/lib/disclaimer";
import { fifaDownloads } from "@/lib/fifa-links";
import { workshop } from "@/lib/workshop";

export const Route = createFileRoute("/")({ component: Home });

/** Original artwork for this guide, in public/brand. */
const teachingKit: [string, string][] = [
  ["Logo — horizontal, light background (PNG)", "logo-horizontal-light.png"],
  ["Logo — horizontal, dark background (PNG)", "logo-horizontal-dark.png"],
  ["Logo — stacked (PNG)", "logo-stacked.png"],
  ["Logo mark (SVG)", "logo-mark.svg"],
  ["Title card — Module 1 · FIFA PEAP & roles", "module-1-title.png"],
  ["Title card — Module 2 · Cardiac arrest", "module-2-title.png"],
  ["Title card — Module 3 · Primary survey", "module-3-title.png"],
  ["Title card — Module 4 · Immobilisation", "module-4-title.png"],
  ["Title card — Module 5 · Emergency care bag", "module-5-title.png"],
  ["Brand sheet — colours and usage (PNG)", "brand-sheet.png"],
];

function Home() {
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <IntroHero />
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
          <div id="set-piece-3d" className="scroll-mt-24 px-3.5 pt-3.5">
            <SectionLabel>THE SET PIECE IN 3D</SectionLabel>
          </div>
          <div className="mt-3">
            <RoleExplorer3D />
          </div>
          <details className="border-t border-line px-3.5 py-1">
            <summary className="flex min-h-11 cursor-pointer items-center font-display text-xs font-semibold tracking-wide text-navy">
              Show the flat diagram
            </summary>
            <div className="-mx-3.5 pb-2">
              <PositionDiagram />
            </div>
          </details>
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
          <div className="px-3.5 py-3.5">
            <SectionLabel>TEACHING KIT</SectionLabel>
            <p className="mt-2 text-xs leading-snug text-muted">
              Logo and title cards made for this guide, free to use on slides and handouts when you teach these modules.
            </p>
            <ul className="mt-2 flex flex-col divide-y divide-line">
              {teachingKit.map(([label, file]) => (
                <li key={file}>
                  <a
                    href={asset(`/brand/${file}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center gap-2 py-2 text-sm font-medium leading-snug text-navy"
                  >
                    <span className="min-w-0 flex-1">{label}</span>
                    <ChevronRight className="size-4 shrink-0 text-gold" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel>
          <div id="about" className="flex scroll-mt-24 flex-col gap-2 px-3.5 py-3.5">
            <img
              src={asset("/brand/logo-horizontal-light.png")}
              alt="Pitchside Emergency Care — set-piece study guide"
              width={1600}
              height={512}
              className="mb-1 block h-auto w-full max-w-[17rem]"
            />
            <SectionLabel>ABOUT THE APP</SectionLabel>
            <p className="text-sm leading-snug">{about}</p>
            <p className="text-sm leading-snug">{aboutApp.developers[0]}</p>
            <p className="text-xs leading-snug text-muted">{disclaimer.short}</p>
            <Link
              to="/about"
              className="inline-flex min-h-11 items-center gap-1 font-display text-sm font-semibold tracking-wide text-gold"
            >
              Purpose, developers, disclaimer, copyright and use of AI
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

/** Top of Home: a short looping intro film behind the title, with the two quickest ways in. */
function IntroHero() {
  const film = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = film.current;
    if (!v) return;
    // people who ask for less motion get the still cover frame instead of the moving film
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      return;
    }
    v.play().catch(() => {
      // autoplay refused (data saver, low power): the cover frame stays
    });
  }, []);
  return (
    <section className="overflow-hidden rounded-xl bg-navy shadow-card" aria-label="Pitchside Emergency Care">
      {/* the film stays clear of the title, so the six runners are never hidden behind text */}
      <div className="relative">
        <video
          ref={film}
          className="block aspect-video w-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
          poster={asset("/img/intro/intro-poster.jpg")}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={asset("/video/intro.mp4")} type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-navy to-transparent" />
        <p className="absolute right-2 top-2 rounded-full bg-navy/70 px-2 py-0.5 text-[10px] font-medium text-on-navy">
          AI-generated illustration
        </p>
      </div>
      <div className="px-3.5 pb-3.5 pt-1">
        <p className="font-display text-[11px] font-semibold tracking-[0.16em] text-gold">SET-PIECE STUDY GUIDE</p>
        <h1 className="mt-0.5 font-display text-[1.7rem] font-bold leading-[1.05] tracking-wide text-on-navy">
          Pitchside Emergency Care
        </h1>
        <p className="mt-1.5 text-sm leading-snug text-gold-soft">Six colours. One job each. Rehearsed before it is needed.</p>
        <div className="mt-3 flex gap-2">
          <a
            href="#set-piece-3d"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-gold px-3 font-display text-sm font-semibold tracking-wide text-navy transition-transform duration-150 ease-out active:scale-95"
          >
            Explore in 3D
          </a>
          <Link
            to="/drill"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-on-navy/70 px-3 font-display text-sm font-semibold tracking-wide text-on-navy transition-transform duration-150 ease-out active:scale-95"
          >
            Run the drill
          </Link>
        </div>
      </div>
    </section>
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
