import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bone,
  Brain,
  BriefcaseMedical,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Gamepad2,
  HeartPulse,
  ListOrdered,
  PlayCircle,
  Stethoscope,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { InstallCard } from "@/components/install-app";
import { PositionDiagram } from "@/components/position-diagram";
import { roleIcons } from "@/components/role-icon";
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
          <span className="font-semibold text-heading">{workshop.rule}</span>
        </Note>
        <SectionLabel>TAP A COLOUR</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          {workshop.roles.map((r, i) => {
            const Icon = roleIcons[r.id];
            return (
              <Link
                key={r.id}
                to="/role/$id"
                params={{ id: r.id }}
                className={`shine relative flex min-h-[5.5rem] flex-col justify-end overflow-hidden rounded-xl px-3 pb-2.5 pt-3 transition-transform duration-150 ease-out active:scale-95${r.id === "black" ? " dark:outline dark:outline-1 dark:outline-white/25" : ""}`}
                style={
                  {
                    "--d": `${i * 0.7}s`,
                    backgroundColor: r.color,
                    backgroundImage: "linear-gradient(150deg, rgba(255,255,255,0.16), rgba(0,0,0,0.14))",
                    color: r.text,
                    boxShadow:
                      r.id === "white"
                        ? "inset 0 0 0 1px rgba(11,31,58,0.22), 0 6px 14px -8px rgba(11,31,58,0.35)"
                        : `0 8px 16px -8px ${r.color}`,
                  } as React.CSSProperties
                }
              >
                <Icon className="float-y absolute right-2.5 top-2.5 size-9 opacity-30" strokeWidth={1.6} aria-hidden />
                <span className="font-display text-xl font-bold leading-none tracking-[0.1em]">{r.name}</span>
                <span className="mt-1 text-[11px] font-medium leading-tight">{r.role}</span>
              </Link>
            );
          })}
        </div>
        <Note>If it is not your colour, do not reach in.</Note>

        <Link to="/quiz" className="block active:scale-[0.99]">
          <div
            className="reveal shine relative overflow-hidden rounded-xl bg-gradient-to-br from-navy to-navy-2 px-4 py-4 text-on-navy shadow-card dark:from-[#0e1d35] dark:to-[#1a3460]"
            style={{ "--d": "2s" } as React.CSSProperties}
          >
            <div className="flex items-center gap-3">
              <span className="float-y grid size-12 shrink-0 place-items-center rounded-2xl bg-gold text-on-gold shadow-[0_6px_14px_-6px_rgba(0,0,0,0.5)]">
                <Gamepad2 className="size-6" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[11px] font-semibold tracking-[0.16em] text-gold">TEST YOURSELF</span>
                <span className="block font-display text-lg font-bold leading-tight">Who does what? · Place the team</span>
                <span className="mt-0.5 block text-xs leading-snug text-gold-soft">Two quick games built from the role cards</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-gold" aria-hidden />
            </div>
          </div>
        </Link>
        <InstallCard />

        <Panel>
          <div id="set-piece-3d" className="scroll-mt-24 px-3.5 pt-3.5">
            <SectionLabel>THE SET PIECE IN 3D</SectionLabel>
          </div>
          <div className="mt-3">
            <RoleExplorer3D />
          </div>
          <details className="border-t border-line px-3.5 py-1">
            <summary className="flex min-h-11 cursor-pointer items-center font-display text-xs font-semibold tracking-wide text-heading">
              Show the flat diagram
            </summary>
            <div className="-mx-3.5 pb-2">
              <PositionDiagram />
            </div>
          </details>
          <ul className="flex flex-col divide-y divide-line px-3.5 py-2 text-sm leading-snug">
            <li className="py-1.5">
              <span className="font-semibold text-heading">At the head: </span>Orange, with Green beside the bag and AED on the
              player's left.
            </li>
            <li className="py-1.5">
              <span className="font-semibold text-heading">Player's right: </span>Red at the chest, Blue at the pelvis, White at the
              lower legs.
            </li>
            <li className="py-1.5">
              <span className="font-semibold text-heading">Player's left: </span>Black, the team leader, level with the chest.
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
            { to: "/fifa", icon: HeartPulse, tint: "#FBE9E7", ink: "#C0392B", title: "Sudden cardiac arrest", sub: "Signs · emergency steps · FIFA's films and downloads", wide: true },
            { to: "/focus", icon: Brain, tint: "#EFE8F7", ink: "#6B3FA0", title: "Concussion assessment (FOCUS)", sub: "On-pitch assessment, domain by domain", wide: true },
            { to: "/cspine", icon: Bone, tint: "#E4EFF8", ink: "#1F6AA5", title: "Cervical spine injury", sub: "Set piece by colour · collar · log roll", wide: true },
            { to: "/pitchside", icon: Stethoscope, tint: "#E3F2E8", ink: "#1A7F45", title: "Pitchside emergency care", sub: "Set-piece protocols · role cards · bag", wide: true },
          ]}
        />
        <SectionLabel>STUDY</SectionLabel>
        <Tiles
          items={[
            { to: "/stations", icon: ClipboardList, tint: "#F6EFD6", ink: "#8A6D10", title: "Skill modules", sub: "PEAP · arrest · survey · immobilisation · bag" },
            { to: "/drill", icon: ListOrdered, tint: "#FBE9E7", ink: "#C0392B", title: "Team drill", sub: "Cardiac arrest in six steps" },
            { to: "/bag", icon: BriefcaseMedical, tint: "#E3F2E8", ink: "#1A7F45", title: "Emergency bag", sub: "FIFA packing list" },
            { to: "/guides", icon: PlayCircle, tint: "#E4EFF8", ink: "#1F6AA5", title: "Films", sub: "Links to FIFA's films" },
            { to: "/quiz", icon: Gamepad2, tint: "#F6EFD6", ink: "#8A6D10", title: "Test yourself", sub: "Quiz · place the team", wide: true },
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
                    className="flex min-h-11 items-center gap-2 py-2 text-sm font-medium leading-snug text-heading"
                  >
                    <span className="min-w-0 flex-1">{d.label}</span>
                    <ExternalLink className="size-4 shrink-0 text-gold-ink" aria-hidden />
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
                    className="flex min-h-11 items-center gap-2 py-2 text-sm font-medium leading-snug text-heading"
                  >
                    <span className="min-w-0 flex-1">{label}</span>
                    <ChevronRight className="size-4 shrink-0 text-gold-ink" aria-hidden />
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
              className="mb-1 block h-auto w-full max-w-[17rem] outline-none dark:hidden"
            />
            <img
              src={asset("/brand/logo-horizontal-dark.png")}
              alt="Pitchside Emergency Care — set-piece study guide"
              width={1600}
              height={512}
              className="mb-1 hidden h-auto w-full max-w-[17rem] rounded-lg outline-none dark:block"
            />
            <SectionLabel>ABOUT THE APP</SectionLabel>
            <p className="text-sm leading-snug">{about}</p>
            <p className="text-sm leading-snug">{aboutApp.developers[0]}</p>
            <p className="text-xs leading-snug text-muted">{disclaimer.short}</p>
            <Link
              to="/about"
              className="inline-flex min-h-11 items-center gap-1 font-display text-sm font-semibold tracking-wide text-gold-ink"
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
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-gold px-3 font-display text-sm font-semibold tracking-wide text-on-gold transition-transform duration-150 ease-out active:scale-95"
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
  to: "/fifa" | "/focus" | "/cspine" | "/pitchside" | "/stations" | "/drill" | "/bag" | "/guides" | "/quiz";
  icon: typeof HeartPulse;
  tint: string;
  ink: string;
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
              <span
                className="tint-chip grid size-10 shrink-0 place-items-center rounded-xl"
                style={{ "--tint": t.tint, "--ink": t.ink } as React.CSSProperties}
              >
                <t.icon className="size-5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-semibold tracking-wide text-heading">{t.title}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted">{t.sub}</span>
              </span>
              {t.wide ? <ChevronRight className="size-5 shrink-0 text-gold-ink" aria-hidden /> : null}
            </div>
          </Panel>
        </Link>
      ))}
    </div>
  );
}
