/**
 * Soft access gate for the static site: name + workshop access code, with Google
 * sign-in in front when a client ID is configured. It runs entirely in the browser,
 * so it keeps casual visitors out but is not real protection — the files are public.
 */

/** Google Identity Services OAuth client ID (Web application). Empty = Google step is skipped. */
export const GOOGLE_CLIENT_ID = "990074289489-llka0vnfqmmn5uflhdm8tb1p0tqbgsd1.apps.googleusercontent.com";

const CODE_SALT = "hkl-fm-2026:";
/** SHA-256 of CODE_SALT + access code — the code itself is not shipped. */
const CODE_HASH = "e32128e6b9f364482d6e372a075965990816bbf95788bf2b11b2a4e530226606";
const STORE_KEY = "hkl-access";
/** A sign-in lasts one day; after that the access screen comes back. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type Access = { name: string; email?: string; at: string };

export async function checkCode(code: string): Promise<boolean> {
  const bytes = new TextEncoder().encode(CODE_SALT + code.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return hex === CODE_HASH;
}

export function readAccess(): Access | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Partial<Access>;
    if (typeof a.name !== "string" || !a.name) return null;
    if (GOOGLE_CLIENT_ID && !a.email) return null;
    const age = Date.now() - Date.parse(a.at ?? "");
    if (!(age >= 0 && age < MAX_AGE_MS)) {
      clearAccess();
      return null;
    }
    return { name: a.name, email: a.email, at: a.at ?? "" };
  } catch {
    return null;
  }
}

export function saveAccess(a: Access) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(a));
  } catch {
    // private window or blocked storage: access lasts for this page load only
  }
}

export function clearAccess() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // nothing stored
  }
}

/** Reads the profile out of a Google ID token. Not verified — this gate is client-side only. */
export function readGoogleProfile(credential: string): { email: string; name: string } | null {
  try {
    const part = credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      Array.from(atob(part), (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""),
    );
    const p = JSON.parse(json) as { email?: string; name?: string };
    return p.email ? { email: p.email, name: p.name ?? "" } : null;
  } catch {
    return null;
  }
}
