import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowDown, Check, CloudDownload, Download, Laptop, MoreVertical, Share, Share2, Smartphone, SquarePlus, WifiOff, X } from "lucide-react";
import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { asset } from "@/lib/asset";
import {
  askSaveStatus,
  getInstallState,
  getServerInstallState,
  INSTALL_CARD_KEY,
  type InstallState,
  type Platform,
  promptInstall,
  type SaveState,
  saveEverything,
  subscribeInstall,
} from "@/lib/install";
import { shareOrCopy, siteUrl } from "@/lib/share";
import { sfx, tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

export function useInstall(): InstallState {
  return useSyncExternalStore(subscribeInstall, getInstallState, getServerInstallState);
}

/** The install card was closed less than a month ago. */
function cardClosed() {
  try {
    return Number(localStorage.getItem(INSTALL_CARD_KEY) || 0) > Date.now();
  } catch {
    return false;
  }
}

/**
 * Home: a card inviting people to install, until they install or close it. It is in the built page and
 * hidden before the first paint where it is not wanted (installBootScript, .install-card in styles.css),
 * and it keeps the same height whether or not the browser offers a one-tap install — so the page below
 * it never jumps when the app starts.
 */
export function InstallCard() {
  const s = useInstall();
  const [hidden, setHidden] = useState(() => typeof window !== "undefined" && cardClosed());
  const off = s.ready && (s.installed || hidden);
  useEffect(() => {
    // wanted after all (the browser offers the install again): lift the mark that hid it before the first paint
    if (s.ready && !off) delete document.documentElement.dataset.installCard;
  }, [s.ready, off]);
  if (off) return null;
  const close = () => {
    tap();
    setHidden(true);
    try {
      localStorage.setItem(INSTALL_CARD_KEY, String(Date.now() + 1000 * 60 * 60 * 24 * 30)); // a month
    } catch {
      // storage blocked
    }
  };
  return (
    <div className="install-card reveal relative overflow-hidden rounded-xl border border-gold/40 bg-paper shadow-card">
      <button
        type="button"
        onClick={close}
        aria-label="Hide this"
        className="absolute right-1 top-1 grid size-10 place-items-center rounded-full text-muted active:scale-95"
      >
        <X className="size-4" aria-hidden />
      </button>
      <div className="flex items-center gap-3 px-3.5 py-3.5 pr-10">
        <img src={asset("/icons/maskable-192.png")} alt="" width={56} height={56} className="size-14 shrink-0 rounded-2xl shadow-card outline-none" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[11px] font-semibold tracking-[0.16em] text-gold-ink">GET THE APP</p>
          <p className="font-display text-base font-bold leading-tight text-heading">Install on your phone or computer</p>
          <p className="mt-0.5 text-xs leading-snug text-muted">Opens full screen from your home screen and works offline at the pitch. Free, no account.</p>
          {/* every device's line is in the page; CSS shows this device's one (data-platform) from the first paint */}
          {PLATFORMS.map((id) => (
            <p key={id} data-quick={id} className="install-quick mt-1.5 text-xs leading-relaxed text-ink">
              {QUICK[id]}
            </p>
          ))}
        </div>
      </div>
      <div className="flex gap-2 px-3.5 pb-3.5">
        {s.canPrompt ? (
          <button
            type="button"
            onClick={async () => {
              tap();
              if ((await promptInstall()) === "accepted") sfx("cheer", 0.4);
            }}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gold font-display text-sm font-semibold tracking-wide text-on-gold active:scale-95"
          >
            <Download className="size-4" aria-hidden />
            Install
          </button>
        ) : null}
        <Link
          to="/install"
          className={cn(
            "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl font-display text-sm font-semibold tracking-wide active:scale-95",
            s.canPrompt ? "border border-line bg-paper text-heading" : "bg-navy text-gold",
          )}
        >
          {s.canPrompt ? "More" : (
            <>
              <Download className="size-4" aria-hidden />
              How to install
            </>
          )}
        </Link>
      </div>
    </div>
  );
}

/** The Install button glows on the first page of a visit only, not on every page change. */
let glowed = false;

/**
 * Top bar, on every page and screen until the app is installed: one tap installs where the browser
 * offers it (Chrome, Edge, Android); on iPhone, iPad, Safari and Firefox it opens this device's steps.
 */
export function InstallHeaderButton() {
  const s = useInstall();
  const navigate = useNavigate();
  const onInstallPage = useRouterState({ select: (r) => r.location.pathname.startsWith("/install") });
  const [glow] = useState(() => !glowed);
  const installed = s.ready && s.installed;
  useEffect(() => {
    if (s.ready) glowed = true;
    // not installed after all (the browser offers the install again): lift the mark that hid it before the first paint
    if (s.ready && !installed) delete document.documentElement.dataset.installed;
  }, [s.ready, installed]);
  // in the built page from the start, hidden before the first paint once installed (installBootScript)
  if (installed || onInstallPage) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        tap();
        if (s.canPrompt) {
          if ((await promptInstall()) === "accepted") sfx("cheer", 0.4);
        } else void navigate({ to: "/install", hash: "install-steps" });
      }}
      aria-label="Install the app"
      title="Install the app"
      className={cn(
        "install-offer group grid min-h-11 shrink-0 place-items-center rounded-full px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy",
        glow && "install-attn",
      )}
    >
      {/* icon only on phones, so the title in the bar keeps its room */}
      <span className="inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full bg-gold px-2 font-display text-xs font-bold tracking-wide text-on-gold shadow-[0_3px_10px_-4px_rgba(0,0,0,0.55)] transition-transform duration-150 group-active:scale-95 min-[420px]:px-2.5">
        <Download className="size-4" strokeWidth={2.4} aria-hidden />
        <span className="hidden min-[420px]:inline">Install</span>
      </span>
    </button>
  );
}

/** Sends the guide's address to teammates: the device's share sheet, or the link copied where there is none. */
export function ShareAppButton() {
  const [note, setNote] = useState("");
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={async () => {
          tap();
          const r = await shareOrCopy({
            title: "Pitchside Emergency Care",
            text: "FIFA medical set piece study guide — install it on your phone and it works offline at the pitch.",
            url: siteUrl(),
          });
          setNote(r === "copied" ? "Link copied — paste it into your team chat." : r === "failed" ? "Sharing is not available here — copy the address from the browser." : "");
        }}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-paper font-display text-sm font-semibold tracking-wide text-heading active:scale-[0.98]"
      >
        <Share2 className="size-4" aria-hidden />
        Share the app with your team
      </button>
      <p className="min-h-4 text-center text-xs text-muted" aria-live="polite">
        {note}
      </p>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy font-display text-xs font-bold text-gold">{n}</span>
      <span className="pt-0.5 text-sm leading-snug">{children}</span>
    </li>
  );
}

const Key = ({ children }: { children: ReactNode }) => (
  <span className="mx-0.5 inline-flex items-center gap-1 rounded-md border border-line bg-cream px-1.5 py-px align-middle font-display text-[12px] font-semibold tracking-wide text-heading">
    {children}
  </span>
);

const PLATFORMS: Platform[] = ["ios", "android", "desktop", "mac-safari", "firefox-desktop"];

/** The shortest way to install on each kind of device, for the card on Home. */
const QUICK: Record<Platform, ReactNode> = {
  ios: (
    <>
      Tap <Key><Share className="size-3.5" aria-hidden />Share</Key> then <Key><SquarePlus className="size-3.5" aria-hidden />Add to Home Screen</Key>.
    </>
  ),
  android: (
    <>
      Browser menu <Key><MoreVertical className="size-3.5" aria-hidden /><span className="sr-only">menu</span></Key> → <Key>Install app</Key> or <Key>Add to Home screen</Key>.
    </>
  ),
  desktop: <>Click the install icon at the right of the address bar, or the browser menu → <Key>Install</Key>.</>,
  "mac-safari": (
    <>
      <Key>File</Key> → <Key>Add to Dock</Key>.
    </>
  ),
  "firefox-desktop": <>Open this page in Chrome or Edge to install it.</>,
};

const GUIDES: { id: Platform; title: string; icon: typeof Smartphone; steps: ReactNode[] }[] = [
  {
    id: "ios",
    title: "iPhone and iPad",
    icon: Smartphone,
    steps: [
      <>Open this page in <b>Safari</b> (Chrome and Edge on iOS 16.4 or later work too).</>,
      <>Tap <Key><Share className="size-3.5" aria-hidden />Share</Key> — at the bottom on iPhone, at the top on iPad.</>,
      <>Scroll down and tap <Key><SquarePlus className="size-3.5" aria-hidden />Add to Home Screen</Key>.</>,
      <>Tap <Key>Add</Key>. The app appears on your home screen.</>,
    ],
  },
  {
    id: "android",
    title: "Android",
    icon: Smartphone,
    steps: [
      <>In <b>Chrome</b>, tap <Key>Install</Key> when it appears, or tap <Key><MoreVertical className="size-3.5" aria-hidden />menu</Key> → <Key>Install app</Key> (or <Key>Add to Home screen</Key>).</>,
      <><b>Samsung Internet</b>: menu → <Key>Add page to</Key> → <Key>Home screen</Key>. <b>Firefox</b>: menu → <Key>Install</Key>.</>,
      <>Confirm. The app appears on your home screen and in your app list.</>,
    ],
  },
  {
    id: "desktop",
    title: "Windows, Mac, Linux, ChromeOS — Chrome or Edge",
    icon: Laptop,
    steps: [
      <>Click <Key><Download className="size-3.5" aria-hidden />Install</Key> on this page, or the install icon at the right end of the address bar.</>,
      <><b>Chrome</b>: menu <Key>⋮</Key> → <Key>Cast, save and share</Key> → <Key>Install page as app</Key>. <b>Edge</b>: menu <Key>⋯</Key> → <Key>Apps</Key> → <Key>Install this site as an app</Key>.</>,
      <>It opens in its own window and can be pinned to the taskbar or Dock.</>,
    ],
  },
  {
    id: "mac-safari",
    title: "Mac — Safari",
    icon: Laptop,
    steps: [
      <>Safari 17 or later (macOS Sonoma or newer): <Key>File</Key> → <Key>Add to Dock</Key>, or <Key><Share className="size-3.5" aria-hidden />Share</Key> → <Key>Add to Dock</Key>.</>,
      <>Click <Key>Add</Key>. The app sits in your Dock and Launchpad.</>,
    ],
  },
  {
    id: "firefox-desktop",
    title: "Firefox on a computer",
    icon: Laptop,
    steps: [
      <>Firefox on computers cannot install web apps. Open this page in <b>Chrome</b> or <b>Edge</b> to install it — or keep using it here in the browser.</>,
    ],
  },
];

/**
 * Step-by-step install instructions; the reader's own device comes first, marked "This device".
 * CSS does that before the first paint (see .install-guide-badge in styles.css); once the app runs the
 * list is put in the same order for screen readers, so nothing on screen moves.
 */
export function InstallGuides() {
  const s = useInstall();
  const mine = s.ready ? GUIDES.find((g) => g.id === s.platform) : undefined;
  const ordered = mine ? [mine, ...GUIDES.filter((g) => g !== mine)] : GUIDES;
  return (
    <div id="install-steps" tabIndex={-1} className="flex scroll-mt-24 flex-col gap-2.5 outline-none">
      {ordered.map((g) => (
        <div key={g.id} data-guide={g.id} className="rounded-xl border border-line bg-paper px-3.5 py-3">
          <p className="flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-heading">
            <g.icon className="size-4 text-gold-ink" aria-hidden />
            {g.title}
            <span className="install-guide-badge ml-auto shrink-0 whitespace-nowrap rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold tracking-wider text-on-gold">
              THIS DEVICE
            </span>
          </p>
          <ol className="mt-2.5 flex flex-col gap-2">
            {g.steps.map((st, i) => (
              <Step key={i} n={i + 1}>
                {st}
              </Step>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

/**
 * Big install button / installed state, for the install page. The slot is filled from the first paint
 * (with a jump to this device's steps), so the page does not shift when the browser offers an install.
 */
export function InstallNow() {
  const s = useInstall();
  if (s.ready && s.installed)
    return (
      <p className="flex min-h-12 items-center gap-2 rounded-xl bg-[#1A7F45]/12 px-3.5 text-sm font-medium text-ink">
        <Check className="size-5 text-[#1A7F45]" strokeWidth={3} aria-hidden />
        Installed — you are using the app.
      </p>
    );
  if (!s.ready || !s.canPrompt)
    return (
      <a
        href="#install-steps"
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-gold font-display text-base font-semibold tracking-wide text-heading active:scale-[0.98]"
      >
        <ArrowDown className="size-5" aria-hidden />
        Steps for this device
      </a>
    );
  return (
    <button
      type="button"
      onClick={async () => {
        tap();
        if ((await promptInstall()) === "accepted") sfx("cheer", 0.4);
      }}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold font-display text-base font-semibold tracking-wide text-on-gold shadow-card active:scale-[0.98]"
    >
      <Download className="size-5" aria-hidden />
      Install Pitchside Emergency Care
    </button>
  );
}

/** Save every picture, sound and film so the whole guide works without a signal. */
export function OfflineSave() {
  const [st, setSt] = useState<SaveState | null>(null);
  useEffect(() => {
    let off: (() => void) | void;
    void askSaveStatus(setSt).then((f) => {
      off = f;
    });
    return () => {
      if (off) off();
    };
  }, []);
  if (!st) return null;
  if (!st.supported)
    return <p className="text-xs leading-snug text-muted">Offline saving starts after the first visit to the published site (not available in private browsing).</p>;
  const all = st.total > 0 && st.saved >= st.total;
  return (
    <div className="flex flex-col gap-2">
      <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full rounded-full bg-gold transition-[width] duration-300" style={{ width: `${st.total ? (st.saved / st.total) * 100 : 0}%` }} />
      </div>
      <p className="text-xs leading-snug text-muted" aria-live="polite">
        {all ? "Everything is saved on this device." : st.busy ? `Saving… ${st.saved} of ${st.total}` : `${st.saved} of ${st.total} pictures, sounds and films saved.`}
      </p>
      {!all ? (
        <button
          type="button"
          disabled={st.busy}
          onClick={() => {
            tap();
            setSt({ ...st, busy: true });
            void saveEverything();
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy font-display text-sm font-semibold tracking-wide text-gold active:scale-95 disabled:opacity-60"
        >
          <CloudDownload className="size-4" aria-hidden />
          {st.busy ? "Saving…" : "Save everything for offline (about 15 MB)"}
        </button>
      ) : null}
    </div>
  );
}

/** A thin strip under the top bar while there is no connection. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const set = () => setOffline(!navigator.onLine);
    set();
    window.addEventListener("online", set);
    window.addEventListener("offline", set);
    return () => {
      window.removeEventListener("online", set);
      window.removeEventListener("offline", set);
    };
  }, []);
  if (!offline) return null;
  return (
    <div className="caption-in relative z-[1] mx-auto flex w-full max-w-xl items-center gap-2 px-3.5 pt-2" role="status">
      <p className="flex w-full items-center gap-2 rounded-lg bg-navy px-3 py-1.5 text-xs text-on-navy">
        <WifiOff className="size-3.5 shrink-0 text-gold" aria-hidden />
        Offline — saved pages still work. FIFA's films need a connection.
      </p>
    </div>
  );
}
