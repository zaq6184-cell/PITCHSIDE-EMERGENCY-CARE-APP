import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { AccessGate } from "@/components/access-gate";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";
import { asset } from "@/lib/asset";

const APP_NAME = "HKL Football Medicine 2026";

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
          "Hospital Kuala Lumpur participant app for the Sports-Emergency Football Medicine Workshop 2026 — programme, skill stations, FIFA topics (cardiac arrest, concussion FOCUS, cervical spine), colour roles, drill and 10-second dash timer.",
      },
      { name: "theme-color", content: "#0B1F3A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: asset("/favicon.svg") },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: asset("/__grok/manifest.webmanifest") },
      { rel: "apple-touch-icon", href: asset("/__grok/icon-180.png") },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-ink">
        <PreviewHostBridge />
        <AuthProvider>
          <AccessGate>
            <Outlet />
          </AccessGate>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
