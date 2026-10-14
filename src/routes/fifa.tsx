import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { FifaClipCard } from "@/components/fifa-video";
import { fifaOwnClips } from "@/lib/videos";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { FIFA_SCA_URL, fifaSca } from "@/lib/fifa-sca";

export const Route = createFileRoute("/fifa")({ component: FifaScaPage });

function List({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const cls = "flex flex-col gap-1.5 pl-5 text-sm leading-snug";
  return ordered ? (
    <ol className={`${cls} list-decimal marker:font-semibold marker:text-heading`}>
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ol>
  ) : (
    <ul className={`${cls} list-disc marker:text-gold`}>
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel>
      <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
        <SectionLabel>{title}</SectionLabel>
        {children}
      </div>
    </Panel>
  );
}

function FifaScaPage() {
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">FIFA HEALTH & MEDICAL</p>
            <h2 className="mt-0.5 font-display text-xl font-bold leading-tight">Sudden cardiac arrest</h2>
            <p className="mt-1 text-sm text-gold-soft">Key points from FIFA's official page, with its videos and downloads.</p>
          </div>
          <div className="px-3.5 py-3">
            <List items={fifaSca.what} />
          </div>
        </Panel>

        <Section title="4 SIGNS OF SCA">
          <div className="grid grid-cols-1 gap-2">
            {fifaSca.signs.map((s, i) => (
              <div key={s.title} className="flex gap-3 rounded-lg bg-cream px-3 py-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-danger font-display text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-heading">{s.title}</p>
                  <p className="text-sm leading-snug">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="FIFA VIDEOS">
          <p className="text-xs leading-snug text-muted">FIFA's own films. Tap play — needs a connection.</p>
          <div className="-mx-3.5 flex flex-col gap-3">
            {fifaOwnClips.map((c) => (
              <FifaClipCard key={c.youtubeId} clip={c} />
            ))}
          </div>
          <Link
            to="/guides"
            className="inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold"
          >
            More films: Heart Heroes United, CPR and airway skills →
          </Link>
        </Section>

        <Section title="EMERGENCY STEPS">
          <List items={fifaSca.steps} ordered />
          <div className="rounded-lg border-l-4 border-heading bg-note px-2.5 py-2 text-sm leading-snug">
            <p className="font-semibold text-heading">Bystander steps vs the medical team</p>
            <p>
              These are FIFA's steps for anyone on the scene (hands-only CPR). The Field of Play (FoP) medical team follows the
              colour-role drill: 30:2 with a face mask until an i-gel is in, then continuous compressions with a breath
              every 10th compression.
            </p>
          </div>
          <Link
            to="/drill"
            className="inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold"
          >
            See the team drill →
          </Link>
        </Section>

        <Section title="FIFA INFOGRAPHICS">
          <p className="text-xs leading-snug text-muted">Tap a picture to open it full size and zoom in.</p>
          <div className="flex flex-col gap-3">
            {fifaSca.infographics.map((g) => (
              <a key={g.src} href={g.src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-line bg-paper active:scale-[0.99]">
                <img src={g.src} alt={g.title} loading="lazy" className="block max-h-96 w-full bg-white object-contain" />
                <span className="block border-t border-line px-3 py-2">
                  <span className="block text-sm font-semibold text-heading">{g.title}</span>
                  <span className="block text-xs leading-snug text-muted">{g.note}</span>
                </span>
              </a>
            ))}
          </div>
        </Section>


        <Section title="WHAT CAUSES SCA">
          <List items={fifaSca.causes} />
        </Section>

        <Section title="PREVENT AND PREPARE">
          <List items={fifaSca.prevention} />
          <div className="rounded-lg border-l-4 border-heading bg-note px-2.5 py-2 text-sm leading-snug">
            <p className="font-semibold text-heading">FIFA Medical Set Piece</p>
            <p>{fifaSca.setPiece}</p>
          </div>
        </Section>

        <Section title="CARDIAC SCREENING">
          <List items={fifaSca.screening} />
        </Section>

        <Section title="OFFICIAL FIFA DOWNLOADS">
          <ul className="flex flex-col divide-y divide-line">
            {fifaSca.downloads.map((d) => (
              <li key={d.href}>
                <a
                  href={d.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-2.5 py-2 text-sm leading-snug text-heading"
                >
                  <FileText className="size-4 shrink-0 text-gold" />
                  <span className="flex-1">{d.title}</span>
                  <span className="shrink-0 rounded-full bg-cream px-2 py-0.5 font-display text-[10px] font-semibold tracking-wide text-muted">
                    {d.kind}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="font-display text-[11px] font-semibold tracking-[0.12em] text-heading">READ MORE</p>
          {fifaSca.reading.map((r) => (
            <a
              key={r.href}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm leading-snug text-heading underline underline-offset-2"
            >
              {r.title}
            </a>
          ))}
        </Section>

        <Note>
          Summary of{" "}
          <a href={FIFA_SCA_URL} target="_blank" rel="noopener noreferrer" className="underline">
            FIFA's Sudden cardiac arrest page
          </a>
          . Infographics, films and documents © FIFA; the originals are on FIFA's website.
        </Note>
      </div>
    </AppShell>
  );
}
