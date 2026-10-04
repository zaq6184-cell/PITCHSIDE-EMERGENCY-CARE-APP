import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowLeft, Box, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { useState } from "react";
import { FifaClipCard } from "@/components/fifa-video";
import { AppShell, JumpChips, Note, Panel, RoleChip, SectionLabel } from "@/components/workshop";
import { type Block, getStation, stations } from "@/lib/stations";

export const Route = createFileRoute("/station/$id")({ component: StationPage });

const slug = (t: string) =>
  "s-" + t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Chip label: the part before any dash, colon or bracket. */
const shortTitle = (t: string) => {
  const cut = t.split(/ — | – |: | \(/)[0].trim();
  return cut.length > 28 ? cut.slice(0, 26).trimEnd() + "…" : cut;
};

function StationPage() {
  const { id } = Route.useParams();
  const s = getStation(id);
  if (!s) return <Navigate to="/stations" />;
  const i = stations.indexOf(s);
  const prev = stations[i - 1];
  const next = stations[i + 1];

  return (
    <AppShell tab="stations">
      <div className="flex flex-col gap-3">
        <Link
          to="/stations"
          className="inline-flex min-h-11 items-center gap-1.5 font-display text-sm font-semibold tracking-wide text-gold"
        >
          <ArrowLeft className="size-4" strokeWidth={2.4} />
          All stations
        </Link>
        <Panel>
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">
              STATION {s.id}
            </p>
            <h2 className="mt-0.5 font-display text-xl font-bold leading-tight">{s.title}</h2>
            <p className="mt-1 text-sm text-gold-soft">{s.subtitle}</p>
          </div>
          {s.location || s.pic ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-3.5 pt-3 text-xs text-muted">
              {s.location ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {s.location}
                </span>
              ) : null}
              {s.pic ? <span>PIC: {s.pic}</span> : null}
            </div>
          ) : null}
          <details className="group px-3.5 py-3">
            <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between font-display text-xs font-semibold tracking-[0.14em] text-navy">
              STATION EQUIPMENT ({s.equipment.length})
              <ChevronRight className="size-4 text-gold transition-transform group-open:rotate-90" />
            </summary>
            <ul className="mt-1 divide-y divide-line">
              {s.equipment.map((e) => (
                <li key={e.name} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
                  <span className="leading-snug">{e.name}</span>
                  <span className="shrink-0 font-display text-xs font-semibold tracking-wide text-navy">
                    {e.qty}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </Panel>

        {s.sections.length > 5 ? (
          <JumpChips items={s.sections.map((sec) => ({ id: slug(sec.title), label: shortTitle(sec.title) }))} />
        ) : null}

        {s.sections.map((sec) => (
          <section key={sec.title} id={slug(sec.title)} className="scroll-mt-24">
            <Panel>
              <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
                <SectionLabel>{sec.title.toUpperCase()}</SectionLabel>
                {sec.blocks.map((b, j) => (
                  <BlockView key={j} b={b} />
                ))}
              </div>
            </Panel>
          </section>
        ))}

        <Note>Source: {s.source} Teaching aid only — follow local protocol.</Note>

        <div className="grid grid-cols-2 gap-2.5">
          {prev ? (
            <Link
              to="/station/$id"
              params={{ id: prev.id }}
              className="flex min-h-11 items-center gap-1 rounded-lg bg-paper px-3 py-2 text-sm shadow-card"
            >
              <ChevronLeft className="size-4 shrink-0 text-gold" />
              <span className="truncate">
                {prev.id} · {prev.short}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to="/station/$id"
              params={{ id: next.id }}
              className="flex min-h-11 items-center justify-end gap-1 rounded-lg bg-paper px-3 py-2 text-right text-sm shadow-card"
            >
              <span className="truncate">
                {next.id} · {next.short}
              </span>
              <ChevronRight className="size-4 shrink-0 text-gold" />
            </Link>
          ) : (
            <Link
              to="/stations"
              className="flex min-h-11 items-center justify-end gap-1 rounded-lg bg-paper px-3 py-2 text-right text-sm shadow-card"
            >
              <span className="truncate">Simulation</span>
              <ChevronRight className="size-4 shrink-0 text-gold" />
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function BlockView({ b }: { b: Block }) {
  switch (b.kind) {
    case "text":
      return <p className="text-sm leading-snug">{b.text}</p>;
    case "list":
      return b.ordered ? (
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm leading-snug marker:text-muted">
          {b.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      ) : (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-snug marker:text-gold">
          {b.items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      );
    case "defs":
      return (
        <dl className="flex flex-col divide-y divide-line">
          {b.items.map((d) => (
            <div key={d.term} className="py-1.5">
              <dt className="font-display text-xs font-semibold tracking-wide text-navy">{d.term}</dt>
              <dd className="text-sm leading-snug">{d.text}</dd>
            </div>
          ))}
        </dl>
      );
    case "table":
      return (
        <div className="-mx-3.5 overflow-x-auto px-3.5">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                {b.head.map((h) => (
                  <th
                    key={h}
                    className="border-b-2 border-navy px-1.5 py-1.5 font-display text-[11px] font-semibold tracking-wide text-navy first:pl-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row) => (
                <tr key={row.join("|")} className="border-b border-line align-top">
                  {row.map((cell, i) => (
                    <td
                      key={i}
                      className={
                        i === 0
                          ? "py-1.5 pr-1.5 font-medium leading-snug"
                          : "px-1.5 py-1.5 leading-snug"
                      }
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "remember":
      return (
        <p className="rounded-lg bg-navy px-2.5 py-2 text-center font-display text-xs font-semibold tracking-wide text-gold">
          {b.text}
        </p>
      );
    case "alert":
      return (
        <div className="rounded-lg border-l-4 border-danger bg-danger/10 px-2.5 py-2 text-sm leading-snug">
          {b.title ? <p className="font-semibold text-danger">{b.title}</p> : null}
          <p>{b.text}</p>
        </div>
      );
    case "info":
      return (
        <div className="rounded-lg border-l-4 border-navy bg-note px-2.5 py-2 text-sm leading-snug">
          {b.title ? <p className="font-semibold text-navy">{b.title}</p> : null}
          <p>{b.text}</p>
        </div>
      );
    case "link":
      return (
        <Link
          to={b.to}
          className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-gold/60 bg-note px-3 py-2 text-sm leading-snug"
        >
          <span>
            <span className="block font-display font-semibold tracking-wide text-navy">{b.label}</span>
            {b.text ? <span className="block text-muted">{b.text}</span> : null}
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-gold" aria-hidden />
        </Link>
      );
    case "video":
      return (
        <div className="-mx-3.5">
          <FifaClipCard clip={b.clip} />
        </div>
      );
    case "device":
      return <DeviceFigure b={b} />;
    case "image":
      return (
        <figure className="-mx-3.5">
          <a href={b.src} target="_blank" rel="noopener noreferrer">
            <img src={b.src} alt={b.alt} loading="lazy" className="block max-h-[28rem] w-full bg-cream object-contain" />
          </a>
          {b.caption ? (
            <figcaption className="px-3.5 pt-2 text-xs leading-snug text-muted">{b.caption}</figcaption>
          ) : null}
        </figure>
      );
    case "steps":
      return (
        <div className="flex flex-col divide-y divide-line">
          {b.items.map((st) => (
            <article key={st.title} className="py-2.5 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold">{st.title}</p>
              {st.who?.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {st.who.map((id) => (
                    <RoleChip key={id} id={id} />
                  ))}
                </div>
              ) : null}
              <ul className="mt-1.5 flex flex-col gap-1">
                {st.lines.map((l) => (
                  <li key={l} className="text-sm leading-snug">
                    {l}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      );
    case "cards":
      return (
        <div className="flex flex-col gap-2">
          {b.items.map((c) => (
            <div key={c.title} className="rounded-lg bg-cream px-3 py-2.5">
              <p className="font-display text-sm font-semibold text-navy">{c.title}</p>
              {c.sub ? <p className="text-xs text-muted">{c.sub}</p> : null}
              <ul className="mt-1.5 flex list-disc flex-col gap-0.5 pl-4 text-sm leading-snug marker:text-gold">
                {c.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
  }
}

function DeviceFigure({ b }: { b: Extract<Block, { kind: "device" }> }) {
  const [show3d, setShow3d] = useState(false);
  return (
    <figure className="-mx-3.5 -mt-1">
      {show3d && b.model ? (
        <div className="relative aspect-[4/3] w-full bg-navy">
          <iframe
            title={`3D model: ${b.model.name}`}
            src={`https://sketchfab.com/models/${b.model.uid}/embed?autostart=1&ui_theme=dark&dnt=1&ui_infos=0&ui_watermark_link=0`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; xr-spatial-tracking"
            allowFullScreen
          />
        </div>
      ) : (
        <img src={b.src} alt={b.alt} loading="lazy" className="block max-h-72 w-full bg-white object-contain" />
      )}
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3.5 pt-2">
        {b.model ? (
          <button
            type="button"
            onClick={() => setShow3d((v) => !v)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-navy px-3 font-display text-xs font-semibold tracking-wide text-gold"
          >
            {show3d ? <X className="size-3.5" /> : <Box className="size-3.5" />}
            {show3d ? "Back to photo" : "View in 3D"}
          </button>
        ) : null}
        <span className="text-[11px] leading-snug text-muted">
          {show3d && b.model ? (
            <>
              3D model “{b.model.name}” by {b.model.by} on{" "}
              <a
                href={`https://sketchfab.com/3d-models/${b.model.uid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Sketchfab
              </a>
              . Drag to rotate, pinch to zoom. Needs a connection.
            </>
          ) : b.credit.href ? (
            <>
              Photo:{" "}
              <a href={b.credit.href} target="_blank" rel="noopener noreferrer" className="underline">
                {b.credit.by}
              </a>
              , {b.credit.license}, via Wikimedia Commons
            </>
          ) : (
            <>Diagram drawn for this workshop app</>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
