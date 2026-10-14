import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Download } from "lucide-react";
import { SoundSettings } from "@/components/sound-control";
import { ThemeSwitch } from "@/components/theme-switch";
import { AppShell, JumpChips, Panel, SectionLabel } from "@/components/workshop";
import { asset } from "@/lib/asset";
import { aboutApp, disclaimer } from "@/lib/disclaimer";

export const Route = createFileRoute("/about")({ component: About });

const sections: { id: string; chip: string; title: string; paragraphs: string[] }[] = [
  { id: "about-purpose", chip: "Purpose", title: "PURPOSE OF THE APP", paragraphs: aboutApp.purpose },
  { id: "about-developers", chip: "Developers", title: "DEVELOPERS", paragraphs: aboutApp.developers },
  { id: "about-disclaimer", chip: "Disclaimer", title: "DISCLAIMER", paragraphs: disclaimer.paragraphs },
  { id: "about-copyright", chip: "Copyright", title: "COPYRIGHT", paragraphs: aboutApp.copyright },
  { id: "about-ai", chip: "Use of AI", title: "USE OF AI", paragraphs: aboutApp.ai },
];

function About() {
  return (
    <AppShell tab="about">
      <div className="flex flex-col gap-3.5">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-1.5 self-start font-display text-sm font-semibold tracking-wide text-gold"
        >
          <ArrowLeft className="size-4" strokeWidth={2.4} />
          Home
        </Link>
        <Panel>
          <div className="px-3.5 py-3.5">
            <img
              src={asset("/brand/logo-horizontal-light.png")}
              alt="Pitchside Emergency Care — set-piece study guide"
              width={1600}
              height={512}
              className="block h-auto w-full max-w-[18rem] dark:hidden"
            />
            <img
              src={asset("/brand/logo-horizontal-dark.png")}
              alt="Pitchside Emergency Care — set-piece study guide"
              width={1600}
              height={512}
              className="hidden h-auto w-full max-w-[18rem] rounded-lg dark:block"
            />
            <h1 className="mt-3 font-display text-xl font-bold tracking-wide text-heading">About the app</h1>
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold tracking-wide text-heading">Dark mode</p>
              <p className="text-xs leading-snug text-muted">
                Easier on the eyes at night and pitchside after dark. Also in the top bar. Saved on this device only.
              </p>
            </div>
            <ThemeSwitch label="Dark mode" />
          </div>
        </Panel>
        <Panel>
          <div className="px-3.5 py-2">
            <SoundSettings />
          </div>
        </Panel>
        <Link to="/install" className="block active:scale-[0.99]">
          <Panel>
            <div className="flex items-center gap-3 px-3.5 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold text-on-gold">
                <Download className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-semibold tracking-wide text-heading">Install the app</span>
                <span className="block text-xs leading-snug text-muted">Phone, tablet or computer — and save it for offline use</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-gold" aria-hidden />
            </div>
          </Panel>
        </Link>
        <JumpChips items={sections.map((s) => ({ id: s.id, label: s.chip }))} />
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <Panel>
              <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
                <SectionLabel>{s.title}</SectionLabel>
                {s.paragraphs.map((p) => (
                  <p key={p} className="text-sm leading-snug">
                    {p}
                  </p>
                ))}
              </div>
            </Panel>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
