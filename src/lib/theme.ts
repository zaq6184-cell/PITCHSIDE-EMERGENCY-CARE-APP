/** Light or dark display. The choice is kept on this device only (localStorage), never sent anywhere. */
export type Theme = "light" | "dark";

const KEY = "pec-theme";
/** Browser bar colour: matches the top of the header in each theme. */
const BAR = { light: "#0B1F3A", dark: "#0E1D35" } as const;

const listeners = new Set<() => void>();

export function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function syncThemeColor() {
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BAR[getTheme()]);
}

export function setTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
  syncThemeColor();
  try {
    localStorage.setItem(KEY, t);
  } catch {
    // private mode or storage blocked: the choice lasts until the page is closed
  }
  listeners.forEach((l) => l());
}

export function subscribeTheme(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Runs in <head> before the first paint, so a saved dark choice never flashes light. */
export const themeBootScript = `try{if(localStorage.getItem("${KEY}")==="dark"){document.documentElement.dataset.theme="dark";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","${BAR.dark}")}}catch(e){}`;
