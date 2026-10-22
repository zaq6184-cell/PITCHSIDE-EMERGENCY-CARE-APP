import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, ChevronRight, Download, GraduationCap, Images, Languages, ListChecks, type LucideIcon, Music, Rotate3d, Sparkles, Timer, Volume2 } from "lucide-react";
import { ShareAppButton } from "@/components/install-app";
import { LanguageList } from "@/components/language-switch";
import { SoundSettings } from "@/components/sound-control";
import { ThemeSwitch } from "@/components/theme-switch";
import { AppShell, JumpChips, Panel, SectionLabel } from "@/components/workshop";
import { asset } from "@/lib/asset";
import { LANGS } from "@/lib/i18n";
import { aboutApp, disclaimer } from "@/lib/disclaimer";
import { APP_VERSION, RELEASED, WHATS_NEW } from "@/lib/release";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({ meta: [{ title: "About the app · Pitchside Emergency Care" }] }),
});

const sections: { id: string; chip: string; title: string; paragraphs: string[] }[] = [
  { id: "about-purpose", chip: "Purpose", title: "PURPOSE OF THE APP", paragraphs: aboutApp.purpose },
  { id: "about-developers", chip: "Developers", title: "DEVELOPERS", paragraphs: aboutApp.developers },
  { id: "about-disclaimer", chip: "Disclaimer", title: "DISCLAIMER", paragraphs: disclaimer.paragraphs },
  { id: "about-copyright", chip: "Copyright", title: "COPYRIGHT", paragraphs: aboutApp.copyright },
  { id: "about-ai", chip: "Use of AI", title: "USE OF AI", paragraphs: aboutApp.ai },
];

const NOTE_ICONS: Record<string, LucideIcon> = {
  "role-voices": Volume2,
  music: Music,
  "live-timer": Timer,
  languages: Languages,
  kit: Box,
  ar: Rotate3d,
  pictures: Images,
  tools: GraduationCap,
  recheck: ListChecks,
};

function About() {
  return (
    <AppShell tab="about">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="px-3.5 py-3.5">
            <img
              src={asset("/brand/logo-horizontal-light.png")}
              alt="Pitchside Emergency Care — set-piece study guide"
              width={1600}
              height={512}
              className="block h-auto w-full max-w-[18rem] outline-none dark:hidden"
            />
            <img
              src={asset("/brand/logo-horizontal-dark.png")}
              alt="Pitchside Emergency Care — set-piece study guide"
              width={1600}
              height={512}
              className="hidden h-auto w-full max-w-[18rem] rounded-lg outline-none dark:block"
            />
            <h1 className="mt-3 font-display text-xl font-bold tracking-wide text-heading">About the app</h1>
            <p className="mt-0.5 text-xs text-muted">
              {`Version ${APP_VERSION} · ${RELEASED}`} ·{" "}
              <a href="#about-whats-new" className="font-semibold text-gold-ink underline underline-offset-2">
                What's new
              </a>
            </p>
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
              <ChevronRight className="size-5 shrink-0 text-gold-ink" aria-hidden />
            </div>
          </Panel>
        </Link>
        <ShareAppButton />
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
        {LANGS.length > 1 ? (
          <Panel>
            <div className="px-3.5 py-2.5">
              <p className="font-display text-sm font-semibold tracking-wide text-heading">Language</p>
              <p className="text-xs leading-snug text-muted">
                English is the reference version; the others are translations of it. The voices stay in English, with captions. Also in
                the top bar.
              </p>
              <div className="mt-2">
                <LanguageList />
              </div>
            </div>
          </Panel>
        ) : null}
        <JumpChips items={[{ id: "about-whats-new", label: "What's new" }, ...sections.map((s) => ({ id: s.id, label: s.chip }))]} />
        <section id="about-whats-new" className="scroll-mt-24">
          <Panel>
            <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
              <SectionLabel>WHAT'S NEW</SectionLabel>
              <p className="text-xs text-muted">{`Version ${APP_VERSION} · ${RELEASED}`}</p>
              <ul className="flex flex-col gap-3">
                {WHATS_NEW.map((n) => {
                  const Icon = NOTE_ICONS[n.id] ?? Sparkles;
                  return (
                    <li key={n.id} className="flex gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-note text-gold-ink">
                        <Icon className="size-[18px]" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-sm font-semibold tracking-wide text-heading">{n.title}</span>
                        <span className="block text-sm leading-snug">{n.text}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Panel>
        </section>
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
