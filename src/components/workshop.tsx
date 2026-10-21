import { Link, useCanGoBack, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, ArrowUp, BookOpen, ChevronRight, ClipboardList, Info, ListOrdered, PlayCircle, Search, Timer, Users, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { InstallHeaderButton, OfflineBanner } from "@/components/install-app";
import { LanguageButton } from "@/components/language-switch";
import { openSearch } from "@/lib/search-open";
import { SoundButton } from "@/components/sound-control";
import { ThemeSwitch } from "@/components/theme-switch";
import { asset } from "@/lib/asset";
import { setTransitionDirection } from "@/lib/gestures";
import { type MusicScene, say, setMusicScene, tap } from "@/lib/sound";
import { syncThemeColor } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getRole, type RoleId, roleTag, workshop } from "@/lib/workshop";

/**
 * Music for each page: the calm theme on Home and the role pages, the drill at CPR tempo (110 a minute),
 * an upbeat loop for the games, a study loop for reading — and none on Tools, the arrest timer and the AED
 * trainer, where the CPR beat, the carry timer, the whistle and the AED's voice need to be heard on their own.
 */
function musicFor(pathname: string): MusicScene {
  // no music where a monitor, a metronome or the instructor's timing has to be heard
  if (pathname.startsWith("/timer") || pathname.startsWith("/arrest") || pathname.startsWith("/aed") || pathname.startsWith("/scorer") || pathname.startsWith("/case/") || pathname.startsWith("/live")) return "none";
  if (pathname.startsWith("/drill")) return "drill";
  if (pathname.startsWith("/quiz")) return "quiz";
  if (pathname === "/" || pathname.startsWith("/role") || pathname.startsWith("/about") || pathname.startsWith("/install")) return "theme";
  return "study";
}

/** Where Back goes when this page was the first one opened (from a shared link or a shortcut). */
function parentOf(pathname: string): "/" | "/stations" | "/timer" | "/cases" | "/drill" {
  if (pathname.startsWith("/station/")) return "/stations";
  if (pathname === "/ar" || pathname === "/ar/") return "/drill";
  if (pathname.startsWith("/case/")) return "/cases";
  if (pathname.startsWith("/plan") || pathname.startsWith("/arrest") || pathname.startsWith("/scorer")) return "/timer";
  return "/";
}

/** Back to the page you were on before — or, if this page was opened first, to its parent page. */
export function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <button
      type="button"
      onClick={() => {
        tap();
        setTransitionDirection("back");
        if (canGoBack) router.history.back();
        else void router.navigate({ to: parentOf(pathname) });
      }}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 self-start font-display text-sm font-semibold tracking-wide text-gold-ink active:scale-95",
        className,
      )}
    >
      <ArrowLeft className="size-4" strokeWidth={2.4} aria-hidden />
      Back
    </button>
  );
}

export function AppShell({
  children,
  tab,
  heading,
}: {
  children: React.ReactNode;
  tab: "home" | "stations" | "drill" | "timer" | "rules" | "films" | "about";
  /** The page's main heading for screen readers, when the page shows none of its own. */
  heading?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // the router puts new pages at the top and Back where you were; this only keeps the bar colour right
  useEffect(() => {
    syncThemeColor();
  }, [pathname]);

  useEffect(() => {
    setMusicScene(musicFor(pathname));
  }, [pathname]);

  const home = pathname === "/";
  const bag = pathname.startsWith("/bag");
  const guides = pathname.startsWith("/guides");
  const topic = (
    [
      ["/focus", "FIFA FOCUS · on-pitch concussion assessment"],
      ["/cspine", "Major trauma · cervical spine injury"],
      ["/fifa", "FIFA Health & Medical · sudden cardiac arrest"],
      ["/pitchside", "FIFA Health & Medical · pitchside emergency care"],
      ["/quiz", "Test yourself · quizzes and games"],
      ["/heat", "Heat illness · cool first, transport second"],
      ["/injuries", "Injury map · tap where it hurts"],
      ["/cases", "Case simulator · make the calls"],
      ["/scorer", "Practical scorer · for instructors"],
      ["/live", "Live class quiz · answer from your phone"],
      ["/case/", "Case simulator · make the calls"],
      ["/install", "Install the app · phone, tablet, computer"],
      ["/drill", "Team drills · cardiac arrest and neck injury in 3D"],
      ["/aed", "AED pads trainer · pads, everyone clear, shock"],
      ["/timer", "Match-day tools · timers and trainers"],
      ["/plan", "Match plan · FIFA PEAP on your phone"],
      ["/arrest", "Arrest timer · CPR clock and event log"],
      ["/rules", "Golden rules · FIFA key points"],
      ["/role", "Colour roles · FIFA PEAP positions"],
      // after /arrest, which also starts with "/ar"
      ["/ar", "AR · the team in your room"],
    ] as const
  ).find(([p]) => pathname.startsWith(p))?.[1];

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {/* slow floodlight glow behind the cards; decorative only */}
      <div className="ambient pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <span className="ambient-a" />
        <span className="ambient-b" />
        <span className="ambient-lines" />
      </div>
      <header style={{ viewTransitionName: "app-header" }} className="sticky top-0 z-20 border-b-[3px] border-gold bg-gradient-to-r from-navy to-navy-2 px-3.5 dark:from-[#0e1d35] dark:to-[#16305a] pb-2.5 pt-[max(0.6rem,env(safe-area-inset-top))] text-on-navy">
        <div className="mx-auto flex w-full max-w-xl items-center gap-2 min-[380px]:gap-2.5">
          <Link to="/" aria-label="Home" className="shrink-0 transition-transform duration-150 ease-out active:scale-95">
            <img src={asset("/brand/logo-mark.svg")} alt="" width={36} height={36} className="size-8 rounded-full min-[380px]:size-9" />
          </Link>
          <div className="min-w-0">
            {/* phones: the name on two lines, as in the logo lockup, so it is never cut short beside the buttons;
                wider screens: the name on one line and the page under it. The name is not translated. */}
            <p
              translate="no"
              className="font-display text-[14px] font-bold leading-[1.15] tracking-[0.04em] text-on-navy min-[380px]:text-[15px] min-[380px]:tracking-[0.06em] min-[480px]:truncate min-[480px]:leading-tight"
            >
              <span className="block min-[480px]:inline">{workshop.event.split(" ")[0]}</span>{" "}
              <span className="block truncate min-[480px]:inline">{workshop.event.split(" ").slice(1).join(" ")}</span>
            </p>
            <p className="hidden truncate text-[11px] leading-snug text-gold-soft min-[480px]:block">
              {bag
                ? "FIFA Emergency Care Bag · Green brings this"
                : guides
                  ? "Links to FIFA's films and downloads"
                  : topic
                    ? topic
                    : tab === "about"
                      ? "About the app"
                      : tab === "stations"
                        ? "Skill modules · study notes"
                        : workshop.title}
            </p>
          </div>
          <div className="relative -my-1.5 -mr-1.5 ml-auto flex shrink-0 items-center">
            <InstallHeaderButton />
            <LanguageButton />
            <SoundButton />
            <ThemeSwitch />
          </div>
        </div>
      </header>
      <OfflineBanner />
      <main style={{ viewTransitionName: "main-content" }} className="relative z-[1] mx-auto w-full max-w-xl px-3.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3.5">
        {heading ? <h1 className="sr-only">{heading}</h1> : null}
        {home ? null : <BackButton className="-mt-1.5 mb-1.5" />}
        {children}
        {home ? null : (
          <div className="mt-5 flex items-center justify-between border-t border-line pt-1.5">
            <BackButton />
            <button
              type="button"
              onClick={() => {
                tap();
                openSearch();
              }}
              className="inline-flex min-h-11 items-center gap-1.5 font-display text-sm font-semibold tracking-wide text-muted active:scale-95"
            >
              <Search className="size-4" strokeWidth={2.4} aria-hidden />
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                tap();
                window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
              }}
              className="inline-flex min-h-11 items-center gap-1.5 font-display text-sm font-semibold tracking-wide text-muted active:scale-95"
            >
              Top
              <ArrowUp className="size-4" strokeWidth={2.4} aria-hidden />
            </button>
          </div>
        )}
      </main>
      <nav
        style={{ viewTransitionName: "app-nav" }}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-4px_16px_-8px_rgba(11,31,58,0.25)] backdrop-blur"
        aria-label="Primary"
      >
        <div className="mx-auto grid w-full max-w-xl grid-cols-7">
          {TABS.map((t, i) => (
            <TabLink key={t.to} {...t} active={tab === t.tab} dir={i > TABS.findIndex((k) => k.tab === tab) ? "forward" : "back"} />
          ))}
        </div>
      </nav>
    </div>
  );
}

const TABS = [
  { to: "/", tab: "home", label: "Roles", icon: Users },
  { to: "/stations", tab: "stations", label: "Skills", icon: ClipboardList },
  { to: "/drill", tab: "drill", label: "Drill", icon: ListOrdered },
  { to: "/timer", tab: "timer", label: "Tools", icon: Timer },
  { to: "/rules", tab: "rules", label: "Rules", icon: BookOpen },
  { to: "/guides", tab: "films", label: "Films", icon: PlayCircle },
  { to: "/about", tab: "about", label: "About", icon: Info },
] as const;

function TabLink({
  to,
  label,
  icon: Icon,
  active,
  dir,
}: {
  to: (typeof TABS)[number]["to"];
  label: string;
  icon: typeof Users;
  active: boolean;
  dir: "forward" | "back";
}) {
  return (
    <Link
      to={to}
      onClick={() => {
        tap();
        if (!active) setTransitionDirection(dir);
      }}
      className={cn(
        "flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold tracking-wide",
        active ? "text-heading" : "text-muted",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        style={active ? { viewTransitionName: "nav-pill" } : undefined}
        className={cn(
          "grid h-7 w-10 place-items-center rounded-full transition-colors duration-200",
          active ? "bg-navy text-gold" : "text-muted",
        )}
      >
        <Icon className="size-[18px]" strokeWidth={active ? 2.4 : 1.8} />
      </span>
      {/* a long word in another language ends in … rather than running into the next tab */}
      <span className="max-w-full truncate px-0.5">{label}</span>
    </Link>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("reveal overflow-hidden rounded-xl bg-paper shadow-card", className)}>
      {children}
    </div>
  );
}

export type Tile = {
  to: "/fifa" | "/focus" | "/cspine" | "/pitchside" | "/stations" | "/drill" | "/bag" | "/guides" | "/quiz" | "/plan" | "/arrest" | "/timer" | "/aed" | "/cases" | "/heat" | "/injuries" | "/live" | "/scorer" | "/ar";
  icon: typeof Users;
  tint: string;
  ink: string;
  title: string;
  sub: string;
  wide?: boolean;
};

/** Link tiles in two columns; `wide` ones take the whole row, with a chevron. */
export function Tiles({ items }: { items: Tile[] }) {
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

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xs font-semibold tracking-[0.14em] text-heading">
      {children}
      <span className="mt-1 block h-[3px] w-8 rounded-full bg-gold" aria-hidden="true" />
    </h2>
  );
}

export function RoleChip({ id }: { id: RoleId }) {
  const r = getRole(id);
  if (!r) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-display text-[11px] font-semibold tracking-wide",
        r.id === "black" && "dark:outline dark:outline-1 dark:outline-white/30",
      )}
      style={{
        backgroundColor: r.color,
        color: r.text,
        boxShadow: r.id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.2)" : undefined,
      }}
    >
      {roleTag(r)}
    </span>
  );
}

export function HeroPhoto({
  src,
  alt,
  caption,
  contain,
  tall,
}: {
  src: string;
  alt: string;
  caption?: string;
  contain?: boolean;
  /** Portrait image: allow more height so it is not shrunk to a thumbnail. */
  tall?: boolean;
}) {
  return (
    <figure className="overflow-hidden rounded-xl bg-paper shadow-card">
      <img
        src={src}
        alt={alt}
        className={cn(
          "block w-full",
          tall ? "max-h-[36rem]" : "max-h-80",
          contain ? "bg-matte object-contain" : "object-cover object-center",
        )}
      />
      {caption ? (
        <figcaption className="px-3 py-2.5 text-xs leading-snug text-muted">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

/** A call-out line. With a `voice` id it becomes a button that plays the recorded call-out. */
export function SayLine({ text, voice }: { text: string; voice?: string }) {
  const [playing, setPlaying] = useState(false);
  if (!voice) return <p className="rounded-lg bg-cream px-2.5 py-2 text-sm italic leading-snug text-ink">{text}</p>;
  return (
    <button
      type="button"
      onClick={async () => {
        setPlaying(true);
        await say(voice, true);
        setPlaying(false);
      }}
      aria-label={`Hear it: ${text}`}
      className="flex w-full items-center gap-2.5 rounded-lg bg-cream px-2.5 py-2 text-left text-sm italic leading-snug text-ink transition-transform duration-150 active:scale-[0.99]"
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full bg-gold text-on-gold shadow-[0_3px_8px_-3px_rgba(0,0,0,0.4)]",
          playing && "sound-wave",
        )}
      >
        <Volume2 className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">{text}</span>
    </button>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-note px-2.5 py-2 text-xs leading-snug text-muted">{children}</p>
  );
}

/** Horizontal "jump to" chips for long pages. Targets need an id and scroll-mt. */
export function JumpChips({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav
      aria-label="Jump to section"
      className="-mx-3.5 overflow-x-auto px-3.5 pb-0.5 [scrollbar-width:none]"
    >
      <ul className="flex w-max gap-1.5">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-line bg-paper px-3 font-display text-[11px] font-semibold tracking-wide text-heading shadow-card active:bg-cream"
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
