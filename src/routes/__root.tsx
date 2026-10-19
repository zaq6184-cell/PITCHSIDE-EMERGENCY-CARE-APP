import { createRootRoute, HeadContent, Outlet, ScriptOnce, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { BadgeToaster } from "@/components/progress-ui";
import { SearchHost } from "@/components/search";
import appCss from "../styles.css?url";
import { asset } from "@/lib/asset";
import { useEffect } from "react";
import { installBootScript, registerServiceWorker } from "@/lib/install";
import { themeBootScript } from "@/lib/theme";

const APP_NAME = "Pitchside Emergency Care";
const DESCRIPTION =
  "Study guide to FIFA's medical set piece for football: the six colour roles, sudden cardiac arrest, the primary survey, cervical spine injury, concussion (FOCUS) and the emergency care bag, with links to FIFA's films and documents.";
/** Public address of the site, for link previews (set VITE_SITE_URL when it moves). */
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://zaq6184-cell.github.io/PITCHSIDE-EMERGENCY-CARE-APP/";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: APP_NAME },
      { name: "description", content: DESCRIPTION },
      // link previews (WhatsApp, Facebook, X, LinkedIn…)
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: APP_NAME },
      { property: "og:title", content: `${APP_NAME} — FIFA medical set piece study guide` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: new URL("og.jpg", SITE_URL).href },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Pitchside Emergency Care — the six colour roles of FIFA's medical set piece" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: APP_NAME },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: new URL("og.jpg", SITE_URL).href },
      { name: "theme-color", content: "#0B1F3A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Pitchside" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "application-name", content: "Pitchside" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: asset("/favicon.svg") },
      { rel: "icon", type: "image/png", sizes: "64x64", href: asset("/icons/favicon-64.png") },
      { rel: "stylesheet", href: appCss },
      // the three fonts every page opens with: loading them early stops text reflowing when they arrive
      { rel: "preload", as: "font", type: "font/woff2", href: asset("/fonts/f5.woff2"), crossOrigin: "anonymous" },
      { rel: "preload", as: "font", type: "font/woff2", href: asset("/fonts/f2.woff2"), crossOrigin: "anonymous" },
      { rel: "preload", as: "font", type: "font/woff2", href: asset("/fonts/f26.woff2"), crossOrigin: "anonymous" },
      { rel: "manifest", href: asset("/manifest.webmanifest") },
      { rel: "apple-touch-icon", sizes: "180x180", href: asset("/icons/apple-touch-icon.png") },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
        <ScriptOnce>{themeBootScript}</ScriptOnce>
        <ScriptOnce>{installBootScript}</ScriptOnce>
      </head>
      <body className="bg-bg text-ink">
        <PreviewHostBridge />
        <PwaRegister />
        <AuthProvider>
          <Outlet />
          <SearchHost />
          <BadgeToaster />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});

/** Offline use and installing: the service worker is registered in the published site only. */
function PwaRegister() {
  useEffect(() => {
    registerServiceWorker();
    // After an update, a page that was already open may ask for a code file that no longer exists:
    // reload once to pick up the new version instead of showing an error.
    const onMissingChunk = (e: Event) => {
      e.preventDefault();
      try {
        if (sessionStorage.getItem("pec-reloaded")) return;
        sessionStorage.setItem("pec-reloaded", "1");
      } catch {
        // storage blocked: still reload once
      }
      window.location.reload();
    };
    window.addEventListener("vite:preloadError", onMissingChunk);
    const settle = window.setTimeout(() => {
      try {
        sessionStorage.removeItem("pec-reloaded");
      } catch {
        // storage blocked
      }
    }, 15000);
    return () => {
      window.removeEventListener("vite:preloadError", onMissingChunk);
      window.clearTimeout(settle);
    };
  }, []);
  return null;
}
