import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bone,
  Box,
  Brain,
  BriefcaseMedical,
  PersonStanding,
  MonitorPlay,
  QrCode,
  ClipboardPen,
  ThermometerSun,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  Gamepad2,
  HeartPulse,
  ListOrdered,
  PlayCircle,
  Stethoscope,
  Timer,
  Zap,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { ArButton } from "@/components/ar-button";
import { InstallCard } from "@/components/install-app";
import { TrainingCard } from "@/components/progress-ui";
import { SearchBar } from "@/components/search";
import { PositionDiagram } from "@/components/position-diagram";
import { roleIcons } from "@/components/role-icon";
import { RoleExplorer3D } from "@/components/set-piece-3d";
import { AppShell, Note, Panel, SectionLabel, Tiles } from "@/components/workshop";
import { asset } from "@/lib/asset";
import { about, aboutApp, disclaimer } from "@/lib/disclaimer";
import { fifaDownloads } from "@/lib/fifa-links";
import { roleTag, workshop } from "@/lib/workshop";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <IntroHero />
        <SearchBar />
        <InstallCard />
        <TrainingCard />
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
                <span className="font-display text-xl font-bold leading-none tracking-[0.1em]">{roleTag(r)}</span>
                <span className="mt-1 text-[11px] font-medium leading-tight">{r.role}</span>
              </Link>
            );
          })}
        </div>
        <Note>
          If it is not your colour, do not reach in — except Black 1, the team leader, who is in overall control and steps in when a
          job is not being done.
        </Note>
        <Note>
          <span className="font-semibold text-heading">Numbers for hand signals: </span>
          {workshop.numberNote}
        </Note>

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
                <span className="block font-display text-lg font-bold leading-tight">Who does what? · Place the team · Hand signals</span>
                <span className="mt-0.5 block text-xs leading-snug text-gold-soft">Three quick games built from the role cards</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-gold" aria-hidden />
            </div>
          </div>
        </Link>

        <Panel>
          <div id="set-piece-3d" className="scroll-mt-24 px-3.5 pt-3.5">
            <SectionLabel>THE SET PIECE IN 3D</SectionLabel>
          </div>
          <div className="mt-3">
            <RoleExplorer3D />
          </div>
          <ArButton className="px-3.5 pb-3" />
          <details className="border-t border-line px-3.5 py-1">
            <summary className="flex min-h-11 cursor-pointer items-center font-display text-xs font-semibold tracking-wide text-heading">
              Show the flat diagram
            </summary>
            <div className="-mx-3.5 pb-2">
              <PositionDiagram linkRoles />
            </div>
          </details>
          <ul className="flex flex-col divide-y divide-line px-3.5 py-2 text-sm leading-snug">
            <li className="py-1.5">
              <span className="font-semibold text-heading">At the head: </span>Orange 2 kneels directly behind the head, in line with
              the body; Green 6 is beside the head on the player's left, with the bag and AED.
            </li>
            <li className="py-1.5">
              <span className="font-semibold text-heading">Player's right: </span>Red 3 at the chest, Blue 4 at the pelvis, White 5 at
              the lower legs.
            </li>
            <li className="py-1.5">
              <span className="font-semibold text-heading">Player's left: </span>Black 1, the team leader, level with the chest.
            </li>
          </ul>
        </Panel>
        <Panel>
          <div className="flex flex-col gap-2 px-3.5 py-3.5">
            <SectionLabel>EXTRICATION TEAM</SectionLabel>
            <p className="text-sm leading-snug">{workshop.stretcherNote}</p>
          </div>
        </Panel>

        <SectionLabel>MATCH DAY</SectionLabel>
        <Tiles
          items={[
            { to: "/plan", icon: ClipboardCheck, tint: "#E3F2E8", ink: "#1A7F45", title: "Match plan", sub: "FIFA PEAP on your phone · names, hospital, checklist", wide: true },
            { to: "/arrest", icon: Timer, tint: "#FBE9E7", ink: "#C0392B", title: "Arrest timer", sub: "CPR clock · 2-minute checks · shock and drug log", wide: true },
          ]}
        />

        <SectionLabel>FIFA TOPICS</SectionLabel>
        <Tiles
          items={[
            { to: "/pitchside", icon: Stethoscope, tint: "#E3F2E8", ink: "#1A7F45", title: "Pitchside emergency care", sub: "Set-piece protocols · role cards · bag", wide: true },
            { to: "/fifa", icon: HeartPulse, tint: "#FBE9E7", ink: "#C0392B", title: "Sudden cardiac arrest", sub: "Signs · emergency steps · FIFA's films and downloads", wide: true },
            { to: "/cspine", icon: Bone, tint: "#E4EFF8", ink: "#1F6AA5", title: "Major trauma · cervical spine injury", sub: "Set piece in 3D · collar sizing · log roll", wide: true },
            { to: "/focus", icon: Brain, tint: "#EFE8F7", ink: "#6B3FA0", title: "Concussion assessment (FOCUS)", sub: "On-pitch assessment, domain by domain · spot the sign in 3D", wide: true },
          ]}
        />
        <SectionLabel>MORE PITCHSIDE TOPICS</SectionLabel>
        <Tiles
          items={[
            { to: "/heat", icon: ThermometerSun, tint: "#FDEBDD", ink: "#B3541E", title: "Heat illness", sub: "Heat risk · cool first, transport second" },
            { to: "/injuries", icon: PersonStanding, tint: "#E4EFF8", ink: "#1F6AA5", title: "Injury map", sub: "Tap where it hurts · Ottawa rules" },
          ]}
        />
        <SectionLabel>STUDY</SectionLabel>
        <Tiles
          items={[
            { to: "/stations", icon: ClipboardList, tint: "#F6EFD6", ink: "#8A6D10", title: "Skill modules", sub: "PEAP · arrest · survey · immobilisation · bag · concussion" },
            { to: "/drill", icon: ListOrdered, tint: "#FBE9E7", ink: "#C0392B", title: "Team drills", sub: "Cardiac arrest · neck injury, in 3D" },
            { to: "/bag", icon: BriefcaseMedical, tint: "#E3F2E8", ink: "#1A7F45", title: "Emergency bag", sub: "FIFA packing list" },
            { to: "/guides", icon: PlayCircle, tint: "#E4EFF8", ink: "#1F6AA5", title: "Films", sub: "Links to FIFA's films" },
            { to: "/cases", icon: MonitorPlay, tint: "#FBE9E7", ink: "#C0392B", title: "Case simulator", sub: "Make the calls with a live monitor · arrest, ball to the chest, heat stroke", wide: true },
            { to: "/aed", icon: Zap, tint: "#F6EFD6", ink: "#8A6D10", title: "AED pads trainer", sub: "Place the pads in 3D · everyone clear · shock", wide: true },
            { to: "/ar", icon: Box, tint: "#E4EFF8", ink: "#1F6AA5", title: "AR · the team in your room", sub: "Put the 3D team on the floor at full size · how to use it", wide: true },
            { to: "/quiz", icon: Gamepad2, tint: "#F6EFD6", ink: "#8A6D10", title: "Test yourself", sub: "Quiz · place the team · hand signals", wide: true },
          ]}
        />
        <SectionLabel>FOR INSTRUCTORS</SectionLabel>
        <Tiles
          items={[
            { to: "/live", icon: QrCode, tint: "#EFE8F7", ink: "#6B3FA0", title: "Live class quiz", sub: "Trainees answer from their phones" },
            { to: "/scorer", icon: ClipboardPen, tint: "#E3F2E8", ink: "#1A7F45", title: "Practical scorer", sub: "Time a team on the manikin · debrief" },
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
/** A monitor's heartbeat trace along the foot of the banner, with a bright sweep running across it. */
function HeartbeatTrace() {
  const beat = (x: number) => `L${x + 26},20 Q${x + 31},15 ${x + 36},20 L${x + 44},20 L${x + 48},4 L${x + 53},33 L${x + 57},20 L${x + 66},20 Q${x + 74},11 ${x + 82},20 L${x + 100},20`;
  const d = `M0,20 ${[0, 100, 200, 300].map(beat).join(" ")}`;
  return (
    <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-1 h-8 w-full" aria-hidden="true">
      <path d={d} fill="none" stroke="var(--color-gold)" strokeOpacity="0.28" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      <path
        d={d}
        pathLength={600}
        fill="none"
        stroke="#ffe08a"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="ecg-sweep"
        style={{ filter: "drop-shadow(0 0 3px rgba(255, 214, 102, 0.9))" }}
      />
    </svg>
  );
}

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
        <HeartbeatTrace />
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
