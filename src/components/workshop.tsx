import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  ListOrdered,
  LogOut,
  Timer,
  Users,
} from "lucide-react";
import { useEffect } from "react";
import { lockApp } from "@/components/access-gate";
import { isOpenAccess } from "@/lib/access-gate";
import { cn } from "@/lib/utils";
import { getRole, type RoleId, workshop } from "@/lib/workshop";

export type EventNavId = "programme" | "speakers" | "venue" | "team" | "bag";

export function AppShell({
  children,
  tab,
}: {
  children: React.ReactNode;
  tab: "home" | "stations" | "drill" | "timer" | "rules" | "event";
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const bag = pathname.startsWith("/bag");
  const guides = pathname.startsWith("/guides");
  const topic = (
    [
      ["/focus", "FIFA FOCUS · on-pitch concussion assessment"],
      ["/cspine", "FIFA Medical Set Piece · cervical spine injury"],
      ["/fifa", "FIFA Health & Medical · sudden cardiac arrest"],
      ["/pitchside", "FIFA Health & Medical · pitchside emergency care"],
    ] as const
  ).find(([p]) => pathname.startsWith(p))?.[1];

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b-[3px] border-gold bg-navy px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-on-navy">
        <div className="min-w-0 flex-1">
          <p className="font-display text-[13px] font-bold tracking-[0.04em] text-on-navy">
            {workshop.event}
          </p>
          <p className="mt-0.5 text-[11px] text-gold-soft">
            {bag
              ? "FIFA Medical Emergency Bag · Green brings this"
              : guides
                ? "FIFA / UEFA guideline films · needs a connection"
                : topic
                  ? topic
                  : tab === "event"
                    ? "3–4 Oct 2026 · Hospital Tunku Azizah"
                    : tab === "stations"
                      ? "Skill stations & simulation · Sunday 4 Oct"
                      : `${workshop.title} · Participant app`}
          </p>
        </div>
        {isOpenAccess() ? null : (
          <button
            type="button"
            onClick={lockApp}
            className="-mr-1.5 flex min-h-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[10px] font-semibold tracking-wide text-gold-soft transition-transform duration-150 ease-out active:scale-95"
          >
            <LogOut className="size-[18px] text-gold" aria-hidden />
            Sign out
          </button>
        )}
      </header>
      <main className="mx-auto w-full max-w-xl px-3.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3.5">
        {children}
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-line bg-paper pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5"
        aria-label="Primary"
      >
        <TabLink to="/" label="Roles" icon={Users} active={tab === "home"} />
        <TabLink to="/stations" label="Stations" icon={ClipboardList} active={tab === "stations"} />
        <TabLink to="/drill" label="Drill" icon={ListOrdered} active={tab === "drill"} />
        <TabLink to="/timer" label="Dash" icon={Timer} active={tab === "timer"} />
        <TabLink to="/rules" label="Rules" icon={BookOpen} active={tab === "rules"} />
        <TabLink to="/event" label="Event" icon={CalendarDays} active={tab === "event"} />
      </nav>
    </div>
  );
}

function TabLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: "/" | "/stations" | "/drill" | "/timer" | "/rules" | "/event";
  label: string;
  icon: typeof Users;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex min-h-11 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold tracking-wide",
        active ? "text-navy" : "text-muted",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
      {label}
    </Link>
  );
}

export function EventSubNav({ active }: { active: EventNavId }) {
  const items: { id: EventNavId; label: string }[] = [
    { id: "programme", label: "Prog" },
    { id: "speakers", label: "Talks" },
    { id: "venue", label: "Venue" },
    { id: "team", label: "Team" },
    { id: "bag", label: "Bag" },
  ];
  return (
    <div className="-mx-3.5 bg-bg px-3.5 py-1.5">
      <div className="grid grid-cols-5 gap-1 rounded-lg bg-paper p-1 shadow-card">
        {items.map((t) => {
          const className = cn(
            "flex min-h-9 items-center justify-center rounded-md px-1 font-display text-[11px] font-semibold tracking-wide transition-colors duration-150",
            active === t.id ? "bg-navy text-on-navy" : "text-muted",
          );
          if (t.id === "bag") {
            return (
              <Link
                key={t.id}
                to="/bag"
                className={className}
                aria-current={active === t.id ? "page" : undefined}
              >
                {t.label}
              </Link>
            );
          }
          return (
            <Link
              key={t.id}
              to="/event"
              search={{ tab: t.id as "programme" | "speakers" | "venue" | "team" }}
              className={className}
              aria-current={active === t.id ? "page" : undefined}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl bg-paper shadow-card", className)}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-xs font-semibold tracking-[0.14em] text-navy">
      {children}
      <span className="mt-1 block h-0.5 w-9 bg-gold" aria-hidden="true" />
    </h3>
  );
}

export function RoleChip({ id }: { id: RoleId }) {
  const r = getRole(id);
  if (!r) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 font-display text-[11px] font-semibold tracking-wide"
      style={{
        backgroundColor: r.color,
        color: r.text,
        boxShadow: r.id === "white" ? "inset 0 0 0 1px rgba(11,31,58,0.2)" : undefined,
      }}
    >
      {r.name}
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
          contain ? "bg-cream object-contain" : "object-cover object-center",
        )}
      />
      {caption ? (
        <figcaption className="px-3 py-2.5 text-xs leading-snug text-muted">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

export function SayLine({ text }: { text: string }) {
  return (
    <p className="rounded-lg bg-cream px-2.5 py-2 text-sm italic leading-snug text-ink">{text}</p>
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
              className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-line bg-paper px-3 font-display text-[11px] font-semibold tracking-wide text-navy shadow-card active:bg-cream"
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
