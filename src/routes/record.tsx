import { createFileRoute } from "@tanstack/react-router";
import { Check, ClipboardCheck, Lock, Printer, Share2 } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { asset } from "@/lib/asset";
import { translateText } from "@/lib/i18n";
import { EMPTY, getProgress, subscribeProgress } from "@/lib/progress";
import { dailyRows, drillName, practiceRows, recordBadges, type Row, teamRuns } from "@/lib/record";
import { APP_VERSION } from "@/lib/release";
import { tap } from "@/lib/sound";
import { useDay, useReview } from "@/lib/use-review";
import { cn } from "@/lib/utils";
import { getRole, roleTag } from "@/lib/workshop";

export const Route = createFileRoute("/record")({
  component: RecordPage,
  head: () => ({ meta: [{ title: "Training record · Pitchside Emergency Care" }] }),
});

/** The name shown on the record: typed by the person, kept on this device only. */
const NAME_KEY = "pec-record-name";

function Rows({ rows }: { rows: Row[] }) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3 py-2 text-sm">
          <span className={cn("grid size-5 shrink-0 place-items-center rounded-full", r.done ? "bg-[#1A7F45] text-white" : "bg-note text-transparent")} aria-hidden="true">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <span className="min-w-0 flex-1 leading-snug text-ink">{r.label}</span>
          <span className="shrink-0 font-display font-bold tabular-nums text-heading">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

function RecordPage() {
  const p = useSyncExternalStore(subscribeProgress, getProgress, () => EMPTY);
  const review = useReview();
  const day = useDay();
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      // storage blocked: the name lasts for this visit
    }
  }, []);
  const saveName = (v: string) => {
    const n = v.slice(0, 60);
    setName(n);
    try {
      if (n.trim()) localStorage.setItem(NAME_KEY, n);
      else localStorage.removeItem(NAME_KEY);
    } catch {
      // storage blocked
    }
  };

  const badges = recordBadges(p);
  const earned = badges.filter((b) => b.earned).length;
  const practice = practiceRows(p);
  const daily = day ? dailyRows(review, day) : [];
  const team = teamRuns(p);

  /** The record as plain text, in the reader's language, for the share sheet or the clipboard. */
  const asText = () => {
    const t = translateText;
    const rows = (list: Row[]) => list.map((r) => `${r.done ? "✓" : "·"} ${t(r.label)}: ${t(r.value)}`);
    return [
      `Pitchside Emergency Care · ${t("Training record")}`,
      name.trim() ? `${t("Name")}: ${name.trim()}` : "",
      `${t("Updated")}: ${day ?? ""} · ${t("Version")} ${APP_VERSION}`,
      "",
      `${t("Badges")}: ${earned} / ${badges.length}`,
      ...badges.filter((b) => b.earned).map((b) => `✓ ${t(b.title)}${b.day ? ` (${b.day})` : ""}`),
      "",
      t("Practice"),
      ...rows(practice),
      "",
      t("Daily 5"),
      ...rows(daily),
      "",
      `${t("Team drills")}: ${team.length}`,
      ...team.map((r) => `${r.d} · ${t(drillName(r.drill))} · ${t(roleLabel(r.role))}`),
      "",
      t("Kept by the trainee on their own device. Not a FIFA certificate or a qualification."),
    ]
      .filter((l, i, all) => l !== "" || all[i - 1] !== "")
      .join("\n");
  };

  const share = async () => {
    tap();
    const text = asText();
    try {
      if (navigator.share) {
        await navigator.share({ title: translateText("Training record"), text });
        return;
      }
    } catch {
      // the share sheet was closed: fall through to copying
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // no clipboard here
    }
  };

  return (
    <AppShell tab="home" heading="Training record">
      <div className="flex flex-col gap-3.5">
        <Panel className="no-print">
          <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
            <label className="flex flex-col gap-1 text-sm font-medium text-heading">
              Your name on the record (optional)
              <input
                name="record-name"
                autoComplete="name"
                maxLength={60}
                value={name}
                onChange={(e) => saveName(e.target.value)}
                placeholder="Name, as you want it printed"
                className="min-h-12 rounded-xl border border-line bg-cream px-3 text-base text-ink outline-none focus:border-gold"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  tap();
                  window.print();
                }}
                className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-navy px-3 font-display text-sm font-semibold tracking-wide text-gold active:scale-[0.98]"
              >
                <Printer className="size-4" aria-hidden />
                Print or save as PDF
              </button>
              <button
                type="button"
                onClick={() => void share()}
                className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-line bg-paper px-3 font-display text-sm font-semibold tracking-wide text-heading active:scale-[0.98]"
              >
                {copied ? <Check className="size-4 text-[#1A7F45]" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
                {copied ? "Copied" : "Share as text"}
              </button>
            </div>
          </div>
        </Panel>

        <article className="print-area overflow-hidden rounded-xl bg-paper shadow-card" aria-label="Training record">
          <div className="flex items-center gap-3 border-b-[3px] border-gold bg-navy px-3.5 py-3 text-on-navy">
            <img src={asset("/brand/logo-mark.svg")} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <p translate="no" className="font-display text-xs font-semibold tracking-[0.14em] text-gold">
                PITCHSIDE EMERGENCY CARE
              </p>
              <p className="font-display text-xl font-bold leading-tight">Training record</p>
            </div>
            <ClipboardCheck className="size-7 shrink-0 text-gold" aria-hidden />
          </div>
          <div className="flex flex-col gap-4 px-3.5 py-3.5">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted">Name</dt>
              <dd translate="no" className="font-semibold text-heading">{name.trim() || "—"}</dd>
              <dt className="text-muted">Updated</dt>
              <dd className="font-semibold tabular-nums text-heading">{day ?? "—"}</dd>
              <dt className="text-muted">Version</dt>
              <dd className="font-semibold tabular-nums text-heading">{APP_VERSION}</dd>
            </dl>

            <section className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <SectionLabel>BADGES</SectionLabel>
                <span className="font-display text-sm font-bold tabular-nums text-heading">
                  {earned} / {badges.length}
                </span>
              </div>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {badges.map((b) => (
                  <li key={b.id} className={cn("flex items-start gap-2 rounded-lg px-2.5 py-2", b.earned ? "bg-note" : "border border-dashed border-line")}>
                    {b.earned ? <Check className="mt-0.5 size-4 shrink-0 text-[#1A7F45]" strokeWidth={3} aria-hidden /> : <Lock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />}
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-sm font-semibold tracking-wide text-heading">{b.title}</span>
                      <span className="block text-xs leading-snug text-muted">{b.how}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-heading">{b.earned ? (b.day ?? "✓") : "Not yet"}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-1">
              <SectionLabel>PRACTICE</SectionLabel>
              <Rows rows={practice} />
            </section>

            <section className="flex flex-col gap-1">
              <SectionLabel>DAILY 5</SectionLabel>
              <Rows rows={daily} />
            </section>

            <section className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <SectionLabel>TEAM DRILLS</SectionLabel>
                <span className="font-display text-sm font-bold tabular-nums text-heading">{team.length}</span>
              </div>
              {team.length ? (
                <ul className="flex flex-col divide-y divide-line">
                  {team.map((r) => (
                    <li key={`${r.d}-${r.drill}-${r.role}`} className="flex items-center gap-3 py-2 text-sm">
                      <span className="shrink-0 font-semibold tabular-nums text-heading">{r.d}</span>
                      <span className="min-w-0 flex-1 text-ink">{drillName(r.drill)}</span>
                      <span className="shrink-0 font-display font-bold tracking-wide text-heading">{roleLabel(r.role)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-snug text-muted">None yet. Join a team drill from your phone when an instructor runs one.</p>
              )}
            </section>

            <p className="border-t border-line pt-2.5 text-xs leading-snug text-muted">
              Kept by the trainee on their own device. Not a FIFA certificate or a qualification.
            </p>
          </div>
        </article>

        <Note>
          <span className="font-semibold text-heading">Your own record. </span>
          It is built from what this guide keeps on this device — badges, best scores and times, the Daily 5 and team drills — and
          nothing is sent anywhere. Print it, save it as a PDF from the print window, or share it as text, for a CPD portfolio or to
          show your team leader.
        </Note>
      </div>
    </AppShell>
  );
}

/** "RED 3" for a colour's id; anything unknown as it was kept. */
function roleLabel(id: string) {
  const r = getRole(id);
  return r ? roleTag(r) : id;
}
