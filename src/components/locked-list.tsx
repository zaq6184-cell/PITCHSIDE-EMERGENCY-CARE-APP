import { Eye, EyeOff, Lock, LockOpen } from "lucide-react";
import { useEffect, useState } from "react";

export type LockedPayload = { salt: string; iv: string; data: string };

const STORE_KEY = "hkl-unlock";

const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** AES-GCM decrypt with a PBKDF2-SHA256 key (250k iterations) — the page only ships ciphertext. */
async function unlock(payload: LockedPayload, password: string): Promise<string[]> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: fromB64(payload.salt), iterations: 250000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(payload.iv) },
    key,
    fromB64(payload.data),
  );
  return JSON.parse(new TextDecoder().decode(plain)) as string[];
}

/** Tries the password as typed, then trimmed, in upper case, and with a leading "#". */
async function unlockAny(payload: LockedPayload, typed: string): Promise<[string[], string]> {
  const t = typed.trim();
  const tries = [...new Set([typed, t, t.toUpperCase(), "#" + t.replace(/^#/, "").toUpperCase()])];
  for (const pw of tries) {
    try {
      return [await unlock(payload, pw), pw];
    } catch {
      // wrong variant — try the next
    }
  }
  throw new Error("wrong password");
}

function readStored() {
  try {
    return sessionStorage.getItem(STORE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function LockedList({ payload }: { payload: LockedPayload }) {
  const [items, setItems] = useState<string[] | null>(null);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  // Reuse a password already entered this session so both scenarios open together.
  useEffect(() => {
    const tryStored = () => {
      const saved = readStored();
      if (saved) unlock(payload, saved).then(setItems, () => {});
    };
    tryStored();
    window.addEventListener(STORE_KEY, tryStored);
    return () => window.removeEventListener(STORE_KEY, tryStored);
  }, [payload]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const [items, used] = await unlockAny(payload, pw);
      setItems(items);
      try {
        sessionStorage.setItem(STORE_KEY, used);
        window.dispatchEvent(new Event(STORE_KEY));
      } catch {
        // storage unavailable — stays unlocked until the page closes
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (items) {
    return (
      <>
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
          <LockOpen className="size-3" /> Unlocked
        </p>
        <ol className="mt-1.5 flex list-decimal flex-col gap-1 pl-5 text-sm leading-snug marker:text-muted">
          {items.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2 rounded-lg bg-cream px-3 py-3">
      <p className="flex items-center gap-1.5 text-sm text-muted">
        <Lock className="size-4 text-navy" /> Locked — facilitators only. Enter the password.
      </p>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            type={show ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            aria-label="Password"
            autoComplete="off"
            autoCapitalize="none"
            className="h-11 w-full rounded-lg border border-line bg-paper pl-3 pr-12 text-sm outline-none focus:border-navy"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide the password" : "Show the password"}
            aria-pressed={show}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted"
          >
            {show ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>
        <button
          type="submit"
          disabled={busy || !pw}
          className="h-11 shrink-0 rounded-lg bg-navy px-4 font-display text-sm font-semibold tracking-wide text-on-navy disabled:opacity-50"
        >
          {busy ? "…" : "Unlock"}
        </button>
      </div>
      {error ? <p className="text-xs font-medium text-danger">Wrong password.</p> : null}
    </form>
  );
}
