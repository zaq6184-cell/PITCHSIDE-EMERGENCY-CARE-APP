import { createRootRoute, HeadContent, Outlet, ScriptOnce, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";
import { asset } from "@/lib/asset";
import { useEffect } from "react";
import { installBootScript, registerServiceWorker } from "@/lib/install";
import { themeBootScript } from "@/lib/theme";

const APP_NAME = "Pitchside Emergency Care";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Study guide to FIFA's medical set piece for football: the six colour roles, sudden cardiac arrest, the primary survey, cervical spine injury, concussion (FOCUS) and the emergency care bag, with links to FIFA's films and documents.",
      },
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
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});

/** Offline use and installing: the service worker is registered in the published site only. */
function PwaRegister() {
  useEffect(() => registerServiceWorker(), []);
  return null;
}
