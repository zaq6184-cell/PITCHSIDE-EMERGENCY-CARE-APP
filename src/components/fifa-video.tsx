import { ExternalLink, Play } from "lucide-react";
import { Note, Panel, SectionLabel } from "@/components/workshop";
import { fifaClips, fifaDocs, fifaSkillList, skillClips, type FifaClip } from "@/lib/videos";

type SkillClip = (typeof skillClips)[number];

/** Films page: FIFA / UEFA guideline films as compact rows. */
export function FifaVideoList() {
  return (
    <section id="films-sca" className="flex scroll-mt-24 flex-col gap-3">
      <SectionLabel>SCA GUIDELINE FILMS</SectionLabel>
      <p className="text-sm leading-snug text-muted">
        FIFA, UEFA Medical and U.S. Soccer. Each film opens on its owner's website.
      </p>
      <VideoList clips={fifaClips} />
      <Panel>
        <div className="flex flex-col gap-2 px-3.5 py-3.5">
          <SectionLabel>READ THE PROTOCOL</SectionLabel>
          <ul className="mt-1 flex flex-col gap-2">
            {fifaDocs.map((d) => (
              <li key={d.href}>
                <a
                  href={d.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium leading-snug text-navy underline-offset-2 hover:underline"
                >
                  {d.label}
                </a>
              </li>
            ))}
          </ul>
          <Note>
            Films are not copied into this guide: FIFA's open on FIFA's website, the others on YouTube. This guide does
            not replace life support certification.
          </Note>
        </div>
      </Panel>
    </section>
  );
}

export function FifaSkillZoneList() {
  return (
    <section id="films-skill" className="flex scroll-mt-24 flex-col gap-3">
      <SectionLabel>FIFA SKILL ZONE</SectionLabel>
      <p className="text-sm leading-snug text-muted">
        FIFA’s pitchside technique films: sideline, set-up, Hands On 1-2-3, cervical spine and lower limb.
      </p>
      <VideoList clips={fifaSkillList} />
    </section>
  );
}

export function SkillVideoList() {
  return (
    <section id="films-airway" className="flex scroll-mt-24 flex-col gap-3">
      <SectionLabel>AIRWAY & EQUIPMENT SKILLS</SectionLabel>
      <p className="text-sm leading-snug text-muted">
        Technique films from the i-gel manufacturer and medical-education channels, each with what the FIFA
        Emergency Care Manual says. Where a film differs, follow FIFA and the device instructions.
      </p>
      <Panel>
        <ul className="divide-y divide-line">
          {skillClips.map((clip) => (
            <li key={clip.youtubeId}>
              <VideoRow
                id={clip.youtubeId}
                title={clip.title}
                source={clip.source}
                poster={clip.poster}
                watchUrl={`https://www.youtube.com/watch?v=${clip.youtubeId}`}
                watchLabel="Watch on YouTube"
                summary={clip.fifa[0]}
              >
                <SkillPoints clip={clip} />
              </VideoRow>
            </li>
          ))}
        </ul>
      </Panel>
    </section>
  );
}

function SkillPoints({ clip }: { clip: SkillClip }) {
  return (
    <>
      <p className="font-display text-[11px] font-semibold tracking-[0.12em] text-navy">FIFA ECM KEY POINTS</p>
      <ul className="mt-1 flex list-disc flex-col gap-1 pl-4 text-sm leading-snug marker:text-gold">
        {clip.fifa.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </>
  );
}

/** A panel of film rows, each linking out to the film. */
export function VideoList({ clips }: { clips: FifaClip[] }) {
  return (
    <Panel>
      <ul className="divide-y divide-line">
        {clips.map((c) => (
          <li key={c.youtubeId}>
            <VideoRow
              id={c.youtubeId}
              title={c.title}
              source={c.source}
              duration={c.duration}
              poster={c.poster}
              watchUrl={c.watchUrl ?? `https://www.youtube.com/watch?v=${c.youtubeId}`}
              watchLabel={c.watchUrl ? "Watch on FIFA's website" : "Watch on YouTube"}
              summary={c.why}
            />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** Compact row: the film is not embedded — the row links out to the page where its owner publishes it. */
function VideoRow({
  title,
  source,
  duration,
  watchUrl,
  watchLabel,
  summary,
  children,
}: {
  id: string;
  title: string;
  source: string;
  duration?: string;
  poster?: string;
  watchUrl: string;
  watchLabel: string;
  summary: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-3 py-3">
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${title} — ${watchLabel} (opens in a new tab)`}
        className="flex items-center gap-3 active:opacity-80"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy text-gold">
          <Play className="size-4 translate-x-px" fill="currentColor" strokeWidth={0} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[13px] font-semibold leading-tight tracking-wide text-navy">
            {title}
          </span>
          <span className="mt-0.5 block text-[11px] text-muted">
            {source}
            {duration ? ` · ${duration}` : ""}
          </span>
        </span>
        <ExternalLink className="size-4 shrink-0 text-gold" aria-hidden />
      </a>
      <div className="mt-2 pl-[3.25rem]">
        {children ?? <p className="text-sm leading-snug">{summary}</p>}
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-navy underline underline-offset-2"
        >
          {watchLabel}
        </a>
      </div>
    </div>
  );
}

const watchTarget = (clip: FifaClip) => clip.watchUrl ?? `https://www.youtube.com/watch?v=${clip.youtubeId}`;
const watchText = (clip: FifaClip) => (clip.watchUrl ? "Watch on FIFA's website" : "Watch on YouTube");

/** Single-film card (used inside the lessons): a link to the film on its owner's site. */
export function FifaClipCard({ clip }: { clip: FifaClip }) {
  return (
    <Panel>
      <a
        href={watchTarget(clip)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-3.5 py-3 active:opacity-80"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy text-gold">
          <Play className="size-5 translate-x-px" fill="currentColor" strokeWidth={0} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-sm font-semibold tracking-wide text-navy">{clip.title}</span>
          <span className="mt-0.5 block text-[11px] text-muted">
            {clip.source} · {clip.duration}
          </span>
        </span>
        <ExternalLink className="size-4 shrink-0 text-gold" aria-hidden />
      </a>
      <div className="px-3.5 pb-3">
        <p className="text-sm leading-snug">{clip.why}</p>
        <a
          href={watchTarget(clip)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-navy underline underline-offset-2"
        >
          {watchText(clip)}
        </a>
      </div>
    </Panel>
  );
}
