import { asset } from "@/lib/asset";

/**
 * Installing the guide as an app (a PWA). Chrome, Edge and Android browsers offer a one-tap install
 * prompt; iPhone/iPad (Share → Add to Home Screen) and Mac Safari (File → Add to Dock) need steps.
 */
type BeforeInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type Platform = "ios" | "android" | "mac-safari" | "desktop" | "firefox-desktop";
export type InstallState = { ready: boolean; canPrompt: boolean; installed: boolean; platform: Platform };

declare global {
  interface Window {
    __pecBip?: BeforeInstallPrompt;
  }
}

/**
 * Runs in <head> before the first paint. Keeps the browser's install prompt for our own button (it can
 * fire before React starts) and marks the device type on <html> (data-platform), so the install page
 * shows this device's steps first from the start instead of jumping once the app loads.
 */
export const installBootScript = String.raw`window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__pecBip=e});(function(u){document.documentElement.dataset.platform=/iPhone|iPad|iPod/.test(u)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)?"ios":/Android/.test(u)?"android":/Firefox\//.test(u)?"firefox-desktop":/Macintosh/.test(u)&&/Safari\//.test(u)&&!/Chrome\/|Chromium\/|Edg\//.test(u)?"mac-safari":"desktop"})(navigator.userAgent);`;

const SERVER: InstallState = { ready: false, canPrompt: false, installed: false, platform: "desktop" };
let state: InstallState = SERVER;
let started = false;
const listeners = new Set<() => void>();

/** The device type installBootScript marked on <html>, so the page and the CSS always agree. */
function detectPlatform(): Platform {
  return (document.documentElement.dataset.platform as Platform | undefined) ?? "desktop";
}

function standalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function update() {
  state = {
    ready: true,
    canPrompt: Boolean(window.__pecBip),
    installed: standalone() || localStorage.getItem("pec-installed") === "1",
    platform: detectPlatform(),
  };
  listeners.forEach((l) => l());
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.__pecBip = e as BeforeInstallPrompt;
    try {
      localStorage.removeItem("pec-installed"); // the browser offers it again, so it is not installed here
    } catch {
      // storage blocked
    }
    update();
  });
  window.addEventListener("appinstalled", () => {
    window.__pecBip = undefined;
    try {
      localStorage.setItem("pec-installed", "1");
    } catch {
      // storage blocked
    }
    update();
  });
  window.matchMedia("(display-mode: standalone)").addEventListener("change", update);
  update();
}

export function getInstallState() {
  start();
  return state;
}
export const getServerInstallState = () => SERVER;
export function subscribeInstall(l: () => void) {
  start();
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Shows the browser's install dialog where there is one. */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const e = window.__pecBip;
  if (!e) return "unavailable";
  await e.prompt();
  const { outcome } = await e.userChoice;
  window.__pecBip = undefined;
  update();
  return outcome;
}

/** Registers the service worker (offline use and installability) in the built site only. */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const go = () => {
    navigator.serviceWorker.register(asset("/sw.js"), { scope: asset("/") }).catch(() => {
      // not available (private mode, file://): the website still works online
    });
  };
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

// ------------------------------------------------------------------ "save everything for offline"
export type SaveState = { saved: number; total: number; busy: boolean; supported: boolean };

export async function askSaveStatus(onState: (s: SaveState) => void) {
  if (!("serviceWorker" in navigator)) return onState({ saved: 0, total: 0, busy: false, supported: false });
  const reg = await navigator.serviceWorker.getRegistration(asset("/"));
  const sw = reg?.active;
  if (!sw) return onState({ saved: 0, total: 0, busy: false, supported: false });
  const onMsg = (e: MessageEvent) => {
    const d = e.data as { type?: string; saved?: number; done?: number; total?: number };
    if (d?.type === "save-status") onState({ saved: d.saved ?? 0, total: d.total ?? 0, busy: false, supported: true });
    if (d?.type === "save-progress") onState({ saved: d.done ?? 0, total: d.total ?? 0, busy: true, supported: true });
    if (d?.type === "save-done") onState({ saved: d.total ?? 0, total: d.total ?? 0, busy: false, supported: true });
  };
  navigator.serviceWorker.addEventListener("message", onMsg);
  sw.postMessage({ type: "save-status" });
  return () => navigator.serviceWorker.removeEventListener("message", onMsg);
}

export async function saveEverything() {
  const reg = await navigator.serviceWorker.getRegistration(asset("/"));
  reg?.active?.postMessage({ type: "save-all" });
}
