import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { imageSize } from "@/lib/asset";
import { aedTravel, bag, filterBagGroups } from "@/lib/bag";

export const Route = createFileRoute("/bag")({
  component: BagPage,
  head: () => ({ meta: [{ title: "FIFA Emergency Care Bag · Pitchside Emergency Care" }] }),
});

function BagPage() {
  const [q, setQ] = useState("");
  const groups = useMemo(() => filterBagGroups(q), [q]);
  const searching = q.trim().length > 0;

  return (
    <AppShell tab="stations" heading="FIFA Emergency Care Bag">
      <div className="flex flex-col gap-3.5">
        <figure className="overflow-hidden rounded-xl bg-paper shadow-card">
          <img
            src={bag.photos.packed.src}
            alt={bag.photos.packed.alt}
            {...imageSize(bag.photos.packed.src)}
            className="block max-h-80 w-full object-cover object-[50%_28%]"
          />
          <figcaption className="px-3.5 py-2.5 text-xs leading-snug text-muted">
            A pitchside emergency bag, packed and closed. The contents below follow FIFA's Emergency Care Bag factsheet.
          </figcaption>
        </figure>

        <Panel>
          <div className="px-3.5 py-3.5">
            <SectionLabel>FIFA MEDICAL EMERGENCY BAG</SectionLabel>
            <p className="mt-2 text-sm leading-snug">{bag.blurb}</p>
            <p className="mt-2 text-sm font-medium text-heading">{bag.greenNote}</p>
            <p className="mt-2 text-xs leading-snug text-muted">{bag.shell}</p>
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-2.5">
          <figure className="overflow-hidden rounded-xl bg-paper shadow-card">
            <img
              src={bag.photos.closed.src}
              alt={bag.photos.closed.alt}
              {...imageSize(bag.photos.closed.src)}
              className="mx-auto block h-40 w-auto object-contain p-3"
            />
            <figcaption className="px-2 pb-2 text-center text-[11px] text-muted">Closed</figcaption>
          </figure>
          <figure className="overflow-hidden rounded-xl bg-paper shadow-card">
            <img
              src={bag.photos.open.src}
              alt={bag.photos.open.alt}
              {...imageSize(bag.photos.open.src)}
              className="mx-auto block h-40 w-auto object-contain p-3"
            />
            <figcaption className="px-2 pb-2 text-center text-[11px] text-muted">Open</figcaption>
          </figure>
        </div>

        <Panel>
          <img
            src={bag.photos.trays.src}
            alt={bag.photos.trays.alt}
            {...imageSize(bag.photos.trays.src)}
            className="block w-full object-contain bg-matte"
          />
          <div className="flex flex-col gap-3 px-3.5 py-3.5">
            <SectionLabel>HOW IT OPENS</SectionLabel>
            {bag.layout.map((row) => (
              <div key={row.side}>
                <p className="font-display text-xs font-semibold tracking-[0.12em] text-heading">{row.side}</p>
                <p className="mt-1 text-sm leading-snug">{row.text}</p>
              </div>
            ))}
          </div>
        </Panel>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            name="bag-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find an item — i-gel, amiodarone, collar…"
            aria-label="Find a bag item"
            className="h-11 w-full rounded-lg border border-line bg-paper pl-9 pr-3 text-sm text-ink shadow-card outline-none placeholder:text-muted focus:border-heading"
          />
        </label>

        {groups.length === 0 ? (
          <Note>No match for “{q}”. Try i-gel, adrenaline, or AED.</Note>
        ) : (
          groups.map((g) => (
            <Panel key={g.id}>
              <div className="px-3.5 py-3.5">
                <SectionLabel>{g.title.toUpperCase()}</SectionLabel>
                <p className="mt-1 text-[11px] text-muted">{g.tray}</p>
                <ul className="mt-3 divide-y divide-line">
                  {g.items.map((it) => (
                    <li key={it.name} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
                      <span className="leading-snug">{it.name}</span>
                      {it.qty ? (
                        <span className="shrink-0 font-display text-xs font-semibold tracking-wide text-heading">
                          {it.qty}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          ))
        )}

        {searching ? null : (
        <>
        <Panel>
          <img
            src={bag.photos.aed.src}
            alt={bag.photos.aed.alt}
            {...imageSize(bag.photos.aed.src)}
            className="mx-auto block max-h-44 w-auto object-contain bg-matte p-4"
          />
          <div className="px-3.5 py-3.5">
            <SectionLabel>PHILIPS HEARTSTART FRX — TRAVEL</SectionLabel>
            <p className="mt-2 text-sm font-medium">{aedTravel.device}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {aedTravel.rules.map((line) => (
                <li key={line} className="text-sm leading-snug">
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line">
            <img
              src={bag.photos.batteryTab.src}
              alt={bag.photos.batteryTab.alt}
              {...imageSize(bag.photos.batteryTab.src)}
              className="max-h-44 w-full object-cover object-center"
            />
            <img
              src={bag.photos.battery.src}
              alt={bag.photos.battery.alt}
              {...imageSize(bag.photos.battery.src)}
              className="max-h-44 w-full bg-matte object-contain p-3"
            />
          </div>
          <p className="px-3.5 py-2 text-[11px] leading-snug text-muted">
            Green tab on the back of the FRx — pull to remove the lithium battery before any checked bag.
          </p>
        </Panel>

        <Panel>
          <div className="px-3.5 py-3.5">
            <SectionLabel>SUPPLY</SectionLabel>
            <p className="mt-2 text-sm leading-snug">Re-order: {bag.contact.name}</p>
            <div className="flex flex-col items-start text-sm">
              <a
                href={`mailto:${bag.contact.email}`}
                className="inline-flex min-h-11 items-center font-medium text-heading underline underline-offset-2"
              >
                {bag.contact.email}
              </a>
              <a
                href={bag.contact.web}
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center font-medium text-heading underline underline-offset-2"
              >
                promotemedical.com
                <span className="sr-only"> (opens on that website — use Back to return)</span>
              </a>
            </div>
            <div className="mt-3">
              <Note>{bag.disclaimer}</Note>
            </div>
          </div>
        </Panel>
        </>
        )}
      </div>
    </AppShell>
  );
}
