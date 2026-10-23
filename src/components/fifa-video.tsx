import { useEffect, useState } from "react";
import { ExternalLink, Play, X } from "lucide-react";
import { Note, Panel, SectionLabel } from "@/components/workshop";
import { holdMusic } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { FIFA_EMBEDS_ENABLED, fifaClips, fifaDocs, fifaSkillList, skillClips, type FifaClip } from "@/lib/videos";

type SkillClip = (typeof skillClips)[number];

/** Films page: FIFA / UEFA guideline films as compact rows. */
export function FifaVideoList() {
  return (
    <section id="films-sca" className="flex scroll-mt-24 flex-col gap-3">
      <SectionLabel>SCA GUIDELINE FILMS</SectionLabel>
      <p className="text-sm leading-snug text-muted">
        FIFA's films open on FIFA's website. The UEFA Medical and U.S. Soccer films play here — tap to play; needs a connection.
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
                  rel="noopener noreferrer"
                  className="text-sm font-medium leading-snug text-heading underline-offset-2 hover:underline"
                >
                  {d.label}
                  <span className="sr-only"> (opens on that website — use Back to return)</span>
                </a>
              </li>
            ))}
          </ul>
          <Note>
            FIFA's films are linked, not embedded: they open on FIFA's website or FIFA's YouTube channel. Films from other
            publishers play here in YouTube's player. This guide does not replace life support certification.
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
        FIFA's pitchside technique films: sideline, set-up, Hands On 1-2-3, cervical spine and lower limb.
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
                playHere
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
      <p className="font-display text-[11px] font-semibold tracking-[0.12em] text-heading">FIFA ECM KEY POINTS</p>
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
              embed={fifaPlayer(c)}
              playHere={!isFifaFilm(c) || Boolean(fifaPlayer(c))}
            />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** Big gold play button: the one thing on a film row that should catch the eye. */
function PlayDisc() {
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gold text-on-gold shadow-[0_6px_14px_-6px_rgba(0,0,0,0.55)] ring-4 ring-gold/25">
      <Play className="size-6 translate-x-0.5" fill="currentColor" strokeWidth={0} aria-hidden />
    </span>
  );
}

/** Says what a tap does: plays the film here, closes it, or opens the owner's site. */
function ActionPill({ kind }: { kind: "play" | "close" | "open" }) {
  const Icon = kind === "play" ? Play : kind === "close" ? X : ExternalLink;
  return (
    <span
      className={cn(
        "inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full px-3 font-display text-xs font-semibold tracking-wide",
        kind === "open" ? "border border-line text-muted" : "border-2 border-gold text-heading",
      )}
    >
      <Icon className="size-3.5" fill={kind === "play" ? "currentColor" : "none"} strokeWidth={kind === "play" ? 0 : 2.2} aria-hidden />
      {kind === "play" ? "Play" : kind === "close" ? "Close" : "Open"}
    </span>
  );
}

/**
 * Film row. FIFA's films are never embedded: the row links to the FIFA page that shows them.
 * Films from other publishers play here in YouTube's own player, loaded only when tapped.
 */
function VideoRow({
  id,
  embed,
  title,
  source,
  duration,
  watchUrl,
  watchLabel,
  summary,
  playHere,
  children,
}: {
  id: string;
  embed?: string;
  title: string;
  source: string;
  duration?: string;
  poster?: string;
  watchUrl: string;
  watchLabel: string;
  summary: string;
  playHere?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // the background music pauses while a film plays here
  useEffect(() => {
    if (!open) return;
    holdMusic(true);
    return () => holdMusic(false);
  }, [open]);
  const head = (
    <>
      <PlayDisc />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[13px] font-semibold leading-tight tracking-wide text-heading">{title}</span>
        <span className="mt-0.5 block text-[11px] text-muted">
          {source}
          {duration ? ` · ${duration}` : ""}
        </span>
      </span>
    </>
  );
  return (
    <div className="px-3 py-3">
      {playHere ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 text-left active:opacity-80"
        >
          {head}
          <ActionPill kind={open ? "close" : "play"} />
        </button>
      ) : (
        <a href={watchUrl} rel="noopener noreferrer" className="flex items-center gap-3 active:opacity-80">
          {head}
          <ActionPill kind="open" />
          <span className="sr-only"> — {watchLabel} (opens on that website — use Back to return)</span>
        </a>
      )}
      {playHere && open ? (
        <div className="relative -mx-3 mt-3 aspect-video bg-navy">
          <iframe
            src={embed ?? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={`${title} — ${source}`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : null}
      <div className="mt-2 pl-[3.75rem]">
        {children ?? <p className="text-sm leading-snug">{summary}</p>}
        <a
          href={watchUrl}
          rel="noopener noreferrer"
          className="mt-1 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-heading underline underline-offset-2"
        >
          {watchLabel}
          <span className="sr-only"> (opens on that website — use Back to return)</span>
        </a>
      </div>
    </div>
  );
}

/** FIFA's player address for a film — only once embedding FIFA's films has been switched on. */
const fifaPlayer = (c: { embed?: string }) => (FIFA_EMBEDS_ENABLED ? c.embed : undefined);
/** FIFA's own films stay as links, whether FIFA shows them on its site or on YouTube. */
const isFifaFilm = (c: { watchUrl?: string; source: string }) => Boolean(c.watchUrl) || /\bFIFA\b/.test(c.source);

const watchTarget = (clip: FifaClip) => clip.watchUrl ?? `https://www.youtube.com/watch?v=${clip.youtubeId}`;
const watchText = (clip: FifaClip) => (clip.watchUrl ? "Watch on FIFA's website" : "Watch on YouTube");

/** Single-film card (used inside the skill modules): a link to the film on its owner's site. */
export function FifaClipCard({ clip }: { clip: FifaClip }) {
  if (fifaPlayer(clip)) {
    return (
      <Panel>
        <VideoRow
          id={clip.youtubeId}
          embed={fifaPlayer(clip)}
          title={clip.title}
          source={clip.source}
          duration={clip.duration}
          watchUrl={watchTarget(clip)}
          watchLabel={watchText(clip)}
          summary={clip.why}
          playHere
        />
      </Panel>
    );
  }
  return (
    <Panel>
      <a
        href={watchTarget(clip)}
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-3.5 py-3 active:opacity-80"
      >
        <PlayDisc />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-sm font-semibold tracking-wide text-heading">{clip.title}</span>
          <span className="mt-0.5 block text-[11px] text-muted">
            {clip.source} · {clip.duration}
          </span>
        </span>
        <ActionPill kind="open" />
        <span className="sr-only"> — {watchText(clip)} (opens on that website — use Back to return)</span>
      </a>
      <div className="px-3.5 pb-3">
        <p className="text-sm leading-snug">{clip.why}</p>
        <a
          href={watchTarget(clip)}
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-heading underline underline-offset-2"
        >
          {watchText(clip)}
          <span className="sr-only"> (opens on that website — use Back to return)</span>
        </a>
      </div>
    </Panel>
  );
}
