import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
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
    <AppShell tab="home">
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
              className="block h-auto w-full max-w-[18rem]"
            />
            <h1 className="mt-3 font-display text-xl font-bold tracking-wide text-navy">About the app</h1>
          </div>
        </Panel>
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
