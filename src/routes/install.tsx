import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Download, WifiOff } from "lucide-react";
import { InstallGuides, InstallNow, OfflineSave, ShareAppButton } from "@/components/install-app";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { asset } from "@/lib/asset";

export const Route = createFileRoute("/install")({
  component: InstallPage,
  head: () => ({ meta: [{ title: "Install the app · Pitchside Emergency Care" }] }),
});

const PERKS = [
  "Opens full screen from its own icon, like any app.",
  "Works offline at the pitch once saved — no signal needed.",
  "Shortcuts to the arrest timer, match plan, drill and carry timer: long-press the icon on Android, or right-click it on a computer.",
  "Updates itself whenever you are online. No app store, no account, nothing collected.",
];

function InstallPage() {
  return (
    <AppShell tab="about">
      <div className="flex flex-col gap-3.5">
        <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 self-start font-display text-sm font-semibold tracking-wide text-gold-ink">
          <ArrowLeft className="size-4" strokeWidth={2.4} />
          Home
        </Link>
        <Panel>
          <div className="flex flex-col gap-3 px-3.5 py-4">
            <div className="flex items-center gap-3">
              <img src={asset("/icons/maskable-192.png")} alt="" width={64} height={64} className="float-y size-16 shrink-0 rounded-2xl shadow-card outline-none" />
              <div className="min-w-0">
                <h1 className="font-display text-xl font-bold leading-tight tracking-wide text-heading">Install the app</h1>
                <p className="text-sm leading-snug text-muted">On your phone, tablet or computer — straight from this website.</p>
              </div>
            </div>
            <ul className="flex flex-col gap-1.5">
              {PERKS.map((p) => (
                <li key={p} className="flex gap-2 text-sm leading-snug">
                  <Check className="mt-0.5 size-4 shrink-0 text-gold-ink" strokeWidth={3} aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
            <InstallNow />
          </div>
        </Panel>

        <SectionLabel>HOW TO INSTALL</SectionLabel>
        <InstallGuides />

        {/* computers only, decided by CSS before the first paint */}
        <div className="install-desktop-only">
          <Panel>
            <div className="flex items-center gap-3.5 px-3.5 py-3.5">
              <div className="shrink-0 rounded-lg bg-white p-1.5">
                <img src={asset("/icons/install-qr.svg")} alt="QR code that opens this guide on a phone" width={112} height={112} loading="lazy" className="size-28 outline-none" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold tracking-wide text-heading">On your phone too</p>
                <p className="mt-1 text-sm leading-snug text-muted">Scan with the phone's camera to open the guide there, then follow the phone steps above.</p>
              </div>
            </div>
          </Panel>
        </div>

        <Panel>
          <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
            <SectionLabel>USE IT WITHOUT A SIGNAL</SectionLabel>
            <p className="flex gap-2 text-sm leading-snug">
              <WifiOff className="mt-0.5 size-4 shrink-0 text-gold-ink" aria-hidden />
              Every page and the 3D drill are saved on this device automatically. Pictures, sounds and films are saved as you open them — or all at once here.
            </p>
            <OfflineSave />
          </div>
        </Panel>

        <ShareAppButton />

        <Note>
          <Download className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />
          Installing adds a shortcut that opens this website as an app; nothing is downloaded from an app store and nothing about you is collected. To remove it, delete it like any other app.
        </Note>
      </div>
    </AppShell>
  );
}
