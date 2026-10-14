import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, ClipboardList, Info, ListOrdered, PlayCircle, Timer, Users } from "lucide-react";
import { useEffect } from "react";
import { ThemeSwitch } from "@/components/theme-switch";
import { asset } from "@/lib/asset";
import { syncThemeColor } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getRole, type RoleId, workshop } from "@/lib/workshop";

export function AppShell({
  children,
  tab,
}: {
  children: React.ReactNode;
  tab: "home" | "stations" | "drill" | "timer" | "rules" | "films" | "about";
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    window.scrollTo(0, 0);
    syncThemeColor();
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
      <header className="sticky top-0 z-20 border-b-[3px] border-gold bg-gradient-to-r from-navy to-navy-2 px-3.5 dark:from-[#0e1d35] dark:to-[#16305a] pb-2.5 pt-[max(0.6rem,env(safe-area-inset-top))] text-on-navy">
        <div className="mx-auto flex w-full max-w-xl items-center gap-2.5">
          <Link to="/" aria-label="Home" className="shrink-0 transition-transform duration-150 ease-out active:scale-95">
            <img src={asset("/brand/logo-mark.svg")} alt="" width={36} height={36} className="size-9 rounded-full" />
          </Link>
          <div className="min-w-0">
            <p className="font-display text-[15px] font-bold leading-tight tracking-[0.06em] text-on-navy">{workshop.event}</p>
            <p className="truncate text-[11px] leading-snug text-gold-soft">
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
          <ThemeSwitch className="-my-1.5 -mr-1.5 ml-auto" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl px-3.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3.5">
        {children}
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-4px_16px_-8px_rgba(11,31,58,0.25)] backdrop-blur"
        aria-label="Primary"
      >
        <div className="mx-auto grid w-full max-w-xl grid-cols-7">
          <TabLink to="/" label="Roles" icon={Users} active={tab === "home"} />
          <TabLink to="/stations" label="Skills" icon={ClipboardList} active={tab === "stations"} />
          <TabLink to="/drill" label="Drill" icon={ListOrdered} active={tab === "drill"} />
          <TabLink to="/timer" label="Dash" icon={Timer} active={tab === "timer"} />
          <TabLink to="/rules" label="Rules" icon={BookOpen} active={tab === "rules"} />
          <TabLink to="/guides" label="Films" icon={PlayCircle} active={tab === "films"} />
          <TabLink to="/about" label="About" icon={Info} active={tab === "about"} />
        </div>
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
  to: "/" | "/stations" | "/drill" | "/timer" | "/rules" | "/guides" | "/about";
  label: string;
  icon: typeof Users;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold tracking-wide",
        active ? "text-heading" : "text-muted",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn(
          "grid h-7 w-10 place-items-center rounded-full transition-colors duration-200",
          active ? "bg-navy text-gold" : "text-muted",
        )}
      >
        <Icon className="size-[18px]" strokeWidth={active ? 2.4 : 1.8} />
      </span>
      {label}
    </Link>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("animate-rise overflow-hidden rounded-xl bg-paper shadow-card", className)}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-xs font-semibold tracking-[0.14em] text-heading">
      {children}
      <span className="mt-1 block h-[3px] w-8 rounded-full bg-gold" aria-hidden="true" />
    </h3>
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
          contain ? "bg-matte object-contain" : "object-cover object-center",
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
