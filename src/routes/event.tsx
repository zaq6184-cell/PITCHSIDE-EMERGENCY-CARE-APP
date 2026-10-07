import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Car,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  TrainFront,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EventSubNav, AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { asset } from "@/lib/asset";
import {
  committee,
  currentSession,
  day1,
  day2,
  displayName,
  EVENT_END_MS,
  EVENT_START_MS,
  getSpeaker,
  parking,
  programme,
  speakers,
  sponsors,
  type EventTab,
  type Session,
} from "@/lib/programme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/event")({
  validateSearch: (search: Record<string, unknown>): { tab?: EventTab } => {
    const t = search.tab;
    if (t === "speakers" || t === "venue" || t === "team" || t === "programme") {
      return { tab: t };
    }
    return {};
  },
  component: EventPage,
});

function EventPage() {
  const { tab = "programme" } = Route.useSearch();
  return (
    <AppShell tab="event">
      <div className="flex flex-col gap-3.5">
        {tab === "programme" ? <Cover /> : null}
        {tab === "programme" ? <LaunchVideo /> : null}
        <EventSubNav active={tab} />
        {tab === "programme" ? <ProgrammeView /> : null}
        {tab === "speakers" ? <SpeakersView /> : null}
        {tab === "venue" ? <VenueView /> : null}
        {tab === "team" ? <TeamView /> : null}
      </div>
    </AppShell>
  );
}

function Cover() {
  return (
    <figure className="overflow-hidden rounded-xl bg-navy shadow-card">
      <img
        src={asset("/img/event/cover-v2.jpg")}
        alt="HKL Sports-Emergency Football Medicine Workshop 2026 programme cover"
        width={1100}
        height={1578}
        className="block h-auto w-full"
      />
      <figcaption className="px-3.5 py-3">
        <p className="font-display text-sm font-semibold tracking-[0.08em] text-gold">
          {programme.datesLabel}
        </p>
        <p className="mt-0.5 text-sm text-on-navy">
          {programme.venue.hall}, {programme.venue.building}
        </p>
      </figcaption>
    </figure>
  );
}

const LAUNCH_VIDEO = "https://drive.google.com/file/d/1_y5n0agkWSYOzGejnHYlwFeJPNxJSMmE";

function LaunchVideo() {
  return (
    <Panel>
      <div className="px-3.5 pt-3.5">
        <SectionLabel>EVENT LAUNCH VIDEO</SectionLabel>
      </div>
      <div className="relative mt-3 aspect-video bg-navy">
        <iframe
          src={`${LAUNCH_VIDEO}/preview`}
          title="HKL's Sports-Emergency Football Medicine Workshop 2026 — event launch video"
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="px-3.5 pb-3 pt-2.5">
        <p className="text-xs leading-snug text-muted">
          Needs a connection. On some phones the player above does not start — use the button instead.
        </p>
        <a
          href={`${LAUNCH_VIDEO}/view`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-navy px-4 font-display text-sm font-semibold tracking-wide text-on-navy transition-transform duration-150 ease-out active:scale-95"
        >
          Play in Google Drive
        </a>
      </div>
    </Panel>
  );
}

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function Countdown() {
  const now = useNow();
  if (now >= EVENT_END_MS) {
    return (
      <Panel>
        <p className="px-3.5 py-3 text-sm text-muted">Workshop complete. Thank you for attending.</p>
      </Panel>
    );
  }
  if (now >= EVENT_START_MS) {
    const live = currentSession(now);
    return (
      <Panel>
        <div className="flex items-start gap-3 px-3.5 py-3">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-danger" aria-hidden="true" />
          <div>
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-navy">HAPPENING NOW</p>
            {live ? (
              <p className="mt-1 text-sm leading-snug">
                <span className="font-semibold">{live.session.start}–{live.session.end}</span>
                {" · "}
                {live.session.topic}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">Between sessions — see the timetable below.</p>
            )}
          </div>
        </div>
      </Panel>
    );
  }
  const ms = EVENT_START_MS - now;
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return (
    <Panel>
      <div className="flex items-center gap-3 px-3.5 py-3">
        <Clock className="size-5 shrink-0 text-gold" strokeWidth={2} />
        <p className="text-sm leading-snug">
          <span className="font-semibold text-navy">
            {days === 0 ? `${hours}h` : `${days}d ${hours}h`}
          </span>{" "}
          to registration · Saturday 07:30
        </p>
      </div>
    </Panel>
  );
}

function ProgrammeView() {
  const [day, setDay] = useState<"d1" | "d2">("d1");
  const now = useNow();
  const sessions = day === "d1" ? day1 : day2;
  const date = day === "d1" ? "2026-10-03" : "2026-10-04";
  const live = currentSession(now);

  return (
    <>
      <Countdown />
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-paper p-1 shadow-card">
        {programme.days.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDay(d.id as "d1" | "d2")}
            className={cn(
              "min-h-11 rounded-md px-2 py-1.5 text-center transition-colors duration-150",
              day === d.id ? "bg-navy text-on-navy" : "text-navy",
            )}
          >
            <span className="block font-display text-sm font-semibold tracking-wide">{d.label}</span>
            <span className={cn("block text-[11px]", day === d.id ? "text-gold-soft" : "text-muted")}>
              {d.tag}
            </span>
          </button>
        ))}
      </div>
      <Panel>
        <ol>
          {sessions.map((s, i) => {
            const isLive =
              live?.date === date && live.session.start === s.start && live.session.topic === s.topic;
            return (
              <SessionRow
                key={`${s.start}-${s.topic}`}
                session={s}
                last={i === sessions.length - 1}
                live={isLive}
              />
            );
          })}
        </ol>
      </Panel>
      {day === "d2" ? (
        <Note>
          Sunday is practical: colour-role skill stations in the morning, then scenario simulation after lunch.
        </Note>
      ) : null}
    </>
  );
}

function SessionRow({
  session,
  last,
  live,
}: {
  session: Session;
  last: boolean;
  live: boolean;
}) {
  const speaker = session.speakerId ? getSpeaker(session.speakerId) : undefined;
  const quiet = session.kind === "break" || session.kind === "reg" || session.kind === "lunch";
  const body = (
    <div
      className={cn(
        "flex gap-3 px-3.5 py-3",
        !last && "border-b border-line",
        live && "bg-note",
        quiet && "bg-cream/60",
      )}
    >
      <p className="w-[4.4rem] shrink-0 font-display text-xs font-semibold tabular-nums tracking-wide text-navy">
        {session.start}
        <span className="block font-normal text-muted">{session.end}</span>
      </p>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug", quiet ? "text-muted" : "font-medium text-ink")}>
          {session.topic}
        </p>
        {speaker ? (
          <p className="mt-0.5 text-xs text-muted">
            {displayName(speaker)}
            <span className="text-gold"> · {speaker.country}</span>
          </p>
        ) : session.speakerLabel ? (
          <p className="mt-0.5 text-xs text-muted">{session.speakerLabel}</p>
        ) : null}
        {live ? (
          <p className="mt-1 font-display text-[10px] font-semibold tracking-[0.14em] text-danger">NOW</p>
        ) : null}
      </div>
      {speaker ? (
        <img
          src={speaker.photo}
          alt=""
          className="size-10 shrink-0 rounded-full bg-cream object-cover object-top"
        />
      ) : null}
    </div>
  );

  if (!speaker) return <li>{body}</li>;
  return (
    <li>
      <Link to="/speaker/$id" params={{ id: speaker.id }} className="block active:opacity-80">
        {body}
      </Link>
    </li>
  );
}

function SpeakersView() {
  const faculty = speakers;
  return (
    <>
      <SectionLabel>FACULTY</SectionLabel>
      <div className="grid grid-cols-1 gap-2">
        {faculty.map((s) => (
          <SpeakerCard key={s.id} id={s.id} />
        ))}
      </div>
    </>
  );
}

function SpeakerCard({ id }: { id: (typeof speakers)[number]["id"] }) {
  const s = getSpeaker(id);
  if (!s) return null;
  return (
    <Link to="/speaker/$id" params={{ id: s.id }} className="block active:scale-[0.99]">
      <Panel>
        <div className="flex gap-3 px-3 py-3">
          <img
            src={s.photo}
            alt=""
            className="size-16 shrink-0 rounded-full bg-cream object-cover object-top"
          />
          <div className="min-w-0">
            <p className="font-display text-base font-semibold leading-tight tracking-wide text-navy">
              {displayName(s)}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-gold">{s.country}</p>
            <p className="mt-1 text-xs leading-snug text-muted">{s.title}</p>
          </div>
        </div>
      </Panel>
    </Link>
  );
}

function MapLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-1.5 font-display text-sm font-semibold tracking-wide text-gold"
    >
      {children}
      <ExternalLink className="size-3.5" strokeWidth={2.2} />
    </a>
  );
}

function VenueView() {
  const v = programme.venue;
  return (
    <>
      <Panel>
        <img
          src={asset("/img/event/venue/hta.jpg")}
          alt="Hospital Tunku Azizah entrance"
          className="block max-h-52 w-full object-cover object-center"
        />
        <div className="px-3.5 py-3.5">
          <SectionLabel>HALL</SectionLabel>
          <p className="mt-2 font-display text-xl font-semibold tracking-wide text-navy">{v.hall}</p>
          <p className="text-sm leading-snug">
            {v.building}
            <span className="block text-muted">{v.aka}</span>
          </p>
          <MapLink href={v.maps}>
            <MapPin className="size-4" />
            Open in Google Maps
          </MapLink>
        </div>
      </Panel>

      <Panel>
        <div className="px-3.5 py-3.5">
          <SectionLabel>FROM THE LOBBY</SectionLabel>
          <ol className="mt-3 flex flex-col gap-2 text-sm leading-snug">
            <li>1. Enter Hospital Tunku Azizah at the main lobby.</li>
            <li>2. Turn right — the registration counter is in front of Auditorium Perdana.</li>
            <li>3. Ushers will take you into the hall.</li>
          </ol>
        </div>
        <img
          src={asset("/img/event/venue/lobby.jpg")}
          alt="Hospital Tunku Azizah lobby"
          className="block max-h-48 w-full object-cover object-center"
        />
        <img
          src={asset("/img/event/venue/stairs.jpg")}
          alt="Stairs to Auditorium Perdana"
          className="block max-h-44 w-full object-cover object-center"
        />
        <div className="px-3.5 py-2">
          <MapLink href={v.lobbyMaps}>
            <Navigation className="size-4" />
            Lobby pin
          </MapLink>
        </div>
      </Panel>

      <Panel>
        <img
          src={asset("/img/event/venue/mrt.jpg")}
          alt="Hospital Kuala Lumpur MRT station Door A"
          className="block max-h-52 w-full object-cover object-center"
        />
        <div className="px-3.5 py-3.5">
          <SectionLabel>BY MRT</SectionLabel>
          <p className="mt-2 text-sm leading-snug">
            Alight at <span className="font-semibold">Hospital Kuala Lumpur</span> (PY18). Use{" "}
            <span className="font-semibold">Door A / Pintu A</span>. Walk about 7 minutes (550 m) to the
            HTA lobby.
          </p>
          <div className="mt-1 flex flex-col">
            <MapLink href={v.mrtMaps}>
              <TrainFront className="size-4" />
              Door A
            </MapLink>
            <MapLink href={v.lobbyMaps}>Walking route to lobby</MapLink>
          </div>
        </div>
        <img
          src={asset("/img/event/venue/walk.jpg")}
          alt="Walking map from HKL MRT Door A to Hospital Tunku Azizah"
          className="block max-h-56 w-full object-contain bg-cream"
        />
      </Panel>

      <SectionLabel>PARKING</SectionLabel>
      {parking.map((p) => (
        <Panel key={p.id}>
          <img src={p.photo} alt={p.name} className="block max-h-44 w-full object-cover object-center" />
          <div className="px-3.5 py-3">
            <p className="font-medium leading-snug">{p.name}</p>
            <p className="mt-0.5 text-xs text-muted">{p.hint}</p>
            <MapLink href={p.maps}>
              <Car className="size-4" />
              Parking pin
            </MapLink>
          </div>
        </Panel>
      ))}
    </>
  );
}

function SponsorLogo({ s, className }: { s: { name: string; logo: string }; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-lg bg-white p-2 ${className ?? ""}`}>
      <img src={s.logo} alt={s.name} loading="lazy" className="block h-full w-full object-contain" />
    </div>
  );
}

function TeamView() {
  return (
    <>
      <Panel>
        <img
          src={asset("/img/event/venue/thanks-v2.jpg")}
          alt="Organising committee of the HKL football medicine workshop"
          width={1600}
          height={772}
          className="block h-auto w-full"
        />
        <div className="px-3.5 py-3.5">
          <p className="mb-2 font-display text-sm font-semibold tracking-[0.08em] text-navy">
            THANK YOU FROM ALL OF US!
          </p>
          <p className="text-sm italic leading-snug text-ink">“{programme.quote.text}”</p>
          <p className="mt-2 font-display text-xs font-semibold tracking-[0.08em] text-gold">
            {programme.quote.by}
          </p>
        </div>
      </Panel>

      <SectionLabel>COMMITTEE</SectionLabel>
      <Panel>
        <dl className="divide-y divide-line">
          {committee.map((c) => (
            <div key={c.role} className="px-3.5 py-3">
              <dt className="font-display text-[11px] font-semibold tracking-[0.14em] text-navy">{c.role}</dt>
              <dd className="mt-1 text-sm leading-snug">
                {c.names.map((n) => (
                  <span key={n} className="block">
                    {n}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

      <SectionLabel>SUPPORTED BY</SectionLabel>
      <Panel>
        <div className="px-3.5 py-3.5">
          <p className="text-center font-display text-[11px] font-semibold tracking-[0.14em] text-gold">
            PLATINUM
          </p>
          <SponsorLogo s={sponsors.platinum[0]} className="mx-auto mt-3 h-20 w-4/5" />
          <p className="mt-6 text-center font-display text-[11px] font-semibold tracking-[0.14em] text-gold">
            GOLD
          </p>
          <SponsorLogo s={sponsors.gold[0]} className="mx-auto mt-3 h-16 w-3/4" />
          <p className="mt-6 text-center font-display text-[11px] font-semibold tracking-[0.14em] text-gold">
            SILVER
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-2.5">
            {sponsors.silver.map((s) => (
              <li key={s.name}>
                <SponsorLogo s={s} className="h-14 w-full" />
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    </>
  );
}
