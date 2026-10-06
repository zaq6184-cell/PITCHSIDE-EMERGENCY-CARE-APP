import { Eye, EyeOff, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type Access,
  checkCode,
  clearAccess,
  GOOGLE_CLIENT_ID,
  isOpenAccess,
  readAccess,
  readGoogleProfile,
  saveAccess,
} from "@/lib/access-gate";
import { disclaimer } from "@/lib/disclaimer";

const LOCK_EVENT = "hkl-access-lock";
const GSI_SRC = "https://accounts.google.com/gsi/client";

type Gsi = {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, o: Record<string, string | number>) => void;
      disableAutoSelect?: () => void;
    };
  };
};

/** Signs this device out of the app and shows the access screen again. */
export function lockApp() {
  clearAccess();
  // Stop Google from signing the same account straight back in on this device.
  (window as unknown as { google?: Gsi }).google?.accounts.id.disableAutoSelect?.();
  window.dispatchEvent(new Event(LOCK_EVENT));
}

/** The name entered at the access screen, once the page has loaded on the device. */
export function useAccessName() {
  const [name, setName] = useState("");
  useEffect(() => setName(readAccess()?.name ?? ""), []);
  return name;
}

/** Renders the app only after the access screen has been passed on this device. */
export function AccessGate({ children }: { children: React.ReactNode }) {
  // "checking" is what the prerendered HTML holds, so page content is not in the static files' markup.
  const [state, setState] = useState<"checking" | "locked" | "open">("checking");

  useEffect(() => {
    setState(isOpenAccess() || readAccess() ? "open" : "locked");
    const lock = () => setState("locked");
    // The sign-in expires after a day, and the open-access window ends: re-check when the app
    // comes back into view and once a minute.
    const recheck = () => {
      if (!isOpenAccess() && !readAccess()) lock();
    };
    const timer = window.setInterval(recheck, 60_000);
    window.addEventListener(LOCK_EVENT, lock);
    document.addEventListener("visibilitychange", recheck);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(LOCK_EVENT, lock);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, []);

  if (state === "open") return <>{children}</>;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-navy px-4 py-8 text-on-navy">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-xs font-semibold tracking-[0.14em] text-gold">
          HKL'S SPORTS-EMERGENCY FOOTBALL MEDICINE WORKSHOP 2026
        </p>
        {state === "locked" ? <GateForm onOpen={() => setState("open")} /> : null}
        {state === "locked" ? (
          <details className="mt-4 text-xs leading-snug text-gold-soft">
            <summary className="flex min-h-11 cursor-pointer items-center justify-center text-center">
              <span>
                {disclaimer.short} <span className="font-semibold underline">Read the disclaimer</span>
              </span>
            </summary>
            <div className="flex flex-col gap-2 pb-2">
              {disclaimer.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </main>
  );
}

function GateForm({ onOpen }: { onOpen: () => void }) {
  const [google, setGoogle] = useState<{ email: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const button = useRef<HTMLDivElement>(null);
  const needGoogle = Boolean(GOOGLE_CLIENT_ID) && !google;

  useEffect(() => {
    if (!needGoogle) return;
    const start = () => {
      const gsi = (window as unknown as { google?: Gsi }).google;
      if (!gsi || !button.current) return;
      gsi.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (r) => {
          const profile = readGoogleProfile(r.credential);
          if (!profile) return setError("Google sign-in did not return an email address. Try again.");
          setError("");
          setGoogle(profile);
          setName((n) => n || profile.name);
        },
      });
      gsi.accounts.id.renderButton(button.current, { theme: "outline", size: "large", shape: "pill", text: "signin_with", width: 280 });
    };
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      start();
      return;
    }
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.onload = start;
    s.onerror = () => setError("Google sign-in could not load. Check your connection and reload.");
    document.head.appendChild(s);
  }, [needGoogle]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.length < 2) return setError("Enter your name.");
    setBusy(true);
    setError("");
    const ok = await checkCode(code).catch(() => false);
    setBusy(false);
    if (!ok) return setError("That security code is not right.");
    const access: Access = { name: clean, email: google?.email, at: new Date().toISOString() };
    saveAccess(access);
    onOpen();
  }

  const field =
    "min-h-11 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-gold";

  return (
    <div className="mt-4 rounded-xl bg-paper px-4 py-5 text-ink shadow-card">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy text-gold">
          <Lock className="size-[18px]" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-lg font-bold tracking-wide text-navy">Participants only</h1>
          <p className="text-xs leading-snug text-muted">
            {needGoogle ? "Step 1 of 2 · Sign in with your Google account." : "Enter your name and the workshop security code."}
          </p>
        </div>
      </div>

      {needGoogle ? (
        <div className="mt-4 flex min-h-11 justify-center" ref={button} />
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3" noValidate>
          {google ? (
            <p className="rounded-lg bg-note px-2.5 py-2 text-xs leading-snug text-muted">
              Signed in as <span className="font-semibold text-navy">{google.email}</span>
            </p>
          ) : null}
          <label className="flex flex-col gap-1 text-sm font-medium text-navy">
            Your name
            <input
              className={field}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoCapitalize="words"
              maxLength={80}
              required
            />
          </label>
          <div className="flex flex-col gap-1 text-sm font-medium text-navy">
            <label htmlFor="access-code">Security code</label>
            <div className="relative">
              <input
                id="access-code"
                className={`${field} pr-12`}
                type={showCode ? "text" : "password"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={40}
                required
              />
              <button
                type="button"
                onClick={() => setShowCode((v) => !v)}
                aria-label={showCode ? "Hide the code" : "Show the code"}
                aria-pressed={showCode}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted"
              >
                {showCode ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 rounded-lg bg-navy px-4 font-display text-sm font-semibold tracking-wide text-on-navy transition-transform duration-150 ease-out active:scale-95 disabled:opacity-60"
          >
            {busy ? "Checking…" : "Open the app"}
          </button>
        </form>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <p className="mt-4 text-xs leading-snug text-muted">
        The security code was given out by the organisers at the workshop. Sign-in lasts 1 day on this device.
      </p>
    </div>
  );
}
