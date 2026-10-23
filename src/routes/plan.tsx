import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ClipboardCheck, Eye, PencilLine, Phone, RotateCcw, Share2, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { AppShell, Note, Panel, RoleChip, SectionLabel } from "@/components/workshop";
import { CHECKLIST, COLOURS, EMPTY_PLAN, isBlank, type MatchPlan, parsePlan, planText, prettyDate, telHref } from "@/lib/match-plan";
import { shareOrCopy, siteUrl } from "@/lib/share";
import { sfx, tap } from "@/lib/sound";
import { translateText } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getRole, workshop } from "@/lib/workshop";

export const Route = createFileRoute("/plan")({
  component: PlanPage,
  head: () => ({ meta: [{ title: "Match plan · Pitchside Emergency Care" }] }),
});

const KEY = "pec-match-plan";

/**
 * FIFA's Pre-Match Emergency Action Plan on the phone: fill it in before the match, show it at the
 * briefing, call the hospital or the team leader with one tap, and tick off the pre-match checks.
 * Saved on this device only; it leaves only if someone shares it.
 */
function PlanPage() {
  const [plan, setPlan] = useState<MatchPlan>(EMPTY_PLAN);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<"edit" | "card">("edit");
  const [note, setNote] = useState("");

  useEffect(() => {
    let saved = EMPTY_PLAN;
    try {
      saved = parsePlan(localStorage.getItem(KEY));
    } catch {
      // storage blocked
    }
    setPlan(saved);
    setView(isBlank(saved) ? "edit" : "card");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(plan));
    } catch {
      // storage blocked: the plan works until the page closes
    }
  }, [plan, ready]);

  const set = (patch: Partial<MatchPlan>) => setPlan((p) => ({ ...p, ...patch }));
  const done = CHECKLIST.filter((c) => plan.checks[c.id]).length;

  async function share() {
    tap();
    const r = await shareOrCopy({ title: "Match plan", text: planText(plan, workshop.roles, siteUrl()) });
    setNote(r === "copied" ? "Plan copied — paste it into the team chat." : r === "failed" ? "Sharing is not available on this device." : "");
  }

  function clearAll() {
    if (!window.confirm(translateText("Clear the whole plan and the checklist on this device?"))) return;
    tap();
    setPlan(EMPTY_PLAN);
    setView("edit");
    setNote("");
  }

  return (
    <AppShell tab="timer">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="flex flex-col gap-3 px-3.5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#1A7F45]/12 text-[#1A7F45] dark:text-[#4cc47f]">
                <ClipboardCheck className="size-6" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-xl font-bold leading-tight tracking-wide text-heading">Match plan</h1>
                <p className="text-sm leading-snug text-muted">FIFA's Pre-Match Emergency Action Plan, filled in on your phone.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-cream p-1" role="group" aria-label="Show">
              {(
                [
                  ["edit", "Fill in", PencilLine],
                  ["card", "Briefing card", Eye],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={view === id}
                  onClick={() => {
                    tap();
                    setView(id);
                  }}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg font-display text-sm font-semibold tracking-wide",
                    view === id ? "bg-navy text-gold shadow-card" : "text-heading",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        {!ready ? null : view === "edit" ? <PlanForm plan={plan} set={set} /> : <BriefingCard plan={plan} />}

        {ready ? (
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={share}
                disabled={isBlank(plan)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold font-display text-sm font-semibold tracking-wide text-on-gold shadow-card active:scale-95 disabled:opacity-50"
              >
                <Share2 className="size-4" aria-hidden />
                Share plan
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-paper font-display text-sm font-semibold tracking-wide text-heading active:scale-95"
              >
                <Trash2 className="size-4" aria-hidden />
                Clear plan
              </button>
            </div>
            <p className="min-h-4 text-center text-xs text-muted" aria-live="polite">
              {note}
            </p>
          </div>
        ) : null}

        <Panel>
          <div className="flex flex-col gap-2 px-3.5 py-3.5">
            <div className="flex items-end justify-between gap-2">
              <SectionLabel>BEFORE KICK-OFF</SectionLabel>
              <p className="text-xs font-medium text-muted" aria-live="polite">
                {done} of {CHECKLIST.length} done
              </p>
            </div>
            <ul className="flex flex-col">
              {CHECKLIST.map((c) => {
                const on = Boolean(plan.checks[c.id]);
                return (
                  <li key={c.id}>
                    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5">
                      <input
                        type="checkbox"
                        name={`check-${c.id}`}
                        checked={on}
                        onChange={(e) => {
                          const checks = { ...plan.checks, [c.id]: e.target.checked };
                          if (e.target.checked && CHECKLIST.every((x) => checks[x.id])) sfx("correct", 0.4);
                          else tap();
                          set({ checks });
                        }}
                        className="mt-0.5 size-5 shrink-0 accent-gold"
                      />
                      <span className={cn("text-sm leading-snug", on && "text-muted line-through")}>{c.text}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {done === CHECKLIST.length ? (
              <p className="flex items-center gap-2 rounded-lg bg-[#1A7F45]/12 px-3 py-2 text-sm font-medium text-ink">
                <Check className="size-4 text-[#1A7F45]" strokeWidth={3} aria-hidden />
                Ready for kick-off.
              </p>
            ) : null}
            {done ? (
              <button
                type="button"
                onClick={() => {
                  tap();
                  set({ checks: {} });
                }}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 self-start rounded-lg px-1 text-xs font-medium text-muted underline underline-offset-2"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Untick all for the next match
              </button>
            ) : null}
          </div>
        </Panel>

        <Note>
          Saved on this device only — nothing is sent anywhere unless you share it. FIFA's printable PEAP is on the{" "}
          <Link to="/pitchside" className="font-medium text-heading underline underline-offset-2">
            pitchside page
          </Link>
          .
        </Note>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  type = "text",
  placeholder,
  max = 120,
}: {
  label: React.ReactNode;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "tel" | "date" | "time";
  placeholder?: string;
  max?: number;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-heading">
        {label}
        {hint ? <span className="font-normal text-muted"> {hint}</span> : null}
      </label>
      <input
        id={id}
        type={type}
        inputMode={type === "tel" ? "tel" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={max}
        autoComplete="off"
        className="min-h-11 w-full min-w-0 rounded-lg border border-line bg-cream px-3 text-base text-ink placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
      />
    </div>
  );
}

function PlanForm({ plan, set }: { plan: MatchPlan; set: (patch: Partial<MatchPlan>) => void }) {
  const notesId = useId();
  return (
    <Panel>
      <form className="flex flex-col gap-4 px-3.5 py-4" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1">
            <SectionLabel>MATCH DETAILS</SectionLabel>
          </legend>
          <Field label="Venue" value={plan.venue} onChange={(venue) => set({ venue })} placeholder="Stadium or ground" />
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Date" type="date" value={plan.date} onChange={(date) => set({ date })} />
            <Field label="KO time" type="time" value={plan.ko} onChange={(ko) => set({ ko })} />
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1">
            <SectionLabel>CONTACT INFORMATION</SectionLabel>
          </legend>
          <Field label="Nearest hospital" value={plan.hospital} onChange={(hospital) => set({ hospital })} placeholder="Name of the hospital" />
          <Field label="Phone no. of nearest hospital" type="tel" value={plan.hospitalPhone} onChange={(hospitalPhone) => set({ hospitalPhone })} max={40} />
          <Field label={<><RoleChip id="black" /> Team leader</>} value={plan.leader} onChange={(leader) => set({ leader })} placeholder="Name" />
          <Field label="Team leader's mobile" hint="(ensures the ambulance is called)" type="tel" value={plan.leaderPhone} onChange={(leaderPhone) => set({ leaderPhone })} max={40} />
          <Field label="Ambulance" hint="where it waits, access gate" value={plan.ambulance} onChange={(ambulance) => set({ ambulance })} placeholder="e.g. Gate 3, behind the north stand" />
        </fieldset>
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1">
            <SectionLabel>RESPONSIBLE — A NAME FOR EACH COLOUR</SectionLabel>
          </legend>
          {COLOURS.map((id) => {
            const r = getRole(id);
            return (
              <Field
                key={id}
                label={
                  <>
                    <RoleChip id={id} /> <span className="font-medium text-muted">{r?.role}</span>
                  </>
                }
                value={plan.names[id]}
                onChange={(v) => set({ names: { ...plan.names, [id]: v } })}
                placeholder="Name(s)"
              />
            );
          })}
          <Field
            label="Extrication team"
            hint="if the venue provides one"
            value={plan.extrication}
            onChange={(extrication) => set({ extrication })}
            placeholder="First aiders' names"
          />
        </fieldset>
        <div className="flex flex-col gap-1">
          <label htmlFor={notesId} className="text-xs font-semibold text-heading">
            Notes
          </label>
          <textarea
            id={notesId}
            value={plan.notes}
            onChange={(e) => set({ notes: e.target.value })}
            maxLength={1000}
            rows={3}
            placeholder="Hazards, the receiving hospital's details, who brings what…"
            className="w-full min-w-0 rounded-lg border border-line bg-cream px-3 py-2.5 text-base text-ink placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>
        <p className="text-xs leading-snug text-muted">Saved as you type.</p>
      </form>
    </Panel>
  );
}

function CallRow({ title, sub, name, phone, chip }: { title: string; sub?: string; name: string; phone: string; chip?: "black" }) {
  const tel = telHref(phone);
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          {chip ? <RoleChip id={chip} /> : null}
          {title}
        </p>
        <p className="truncate text-base font-semibold text-heading">{name.trim() || "—"}</p>
        {phone.trim() ? <p className="text-sm tabular-nums text-ink">{phone}</p> : null}
        {sub ? <p className="text-xs leading-snug text-muted">{sub}</p> : null}
      </div>
      {tel ? (
        <a
          href={tel}
          aria-label={`Call ${title.toLowerCase()}, ${phone}`}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#1A7F45] px-3.5 font-display text-sm font-semibold tracking-wide text-white active:scale-95"
        >
          <Phone className="size-4" aria-hidden />
          Call
        </a>
      ) : null}
    </div>
  );
}

function BriefingCard({ plan }: { plan: MatchPlan }) {
  const when = [prettyDate(plan.date), plan.ko ? `KO ${plan.ko}` : ""].filter(Boolean).join(" · ");
  return (
    <Panel>
      <div className="bg-navy px-3.5 py-3.5 text-on-navy">
        <p className="font-display text-[11px] font-semibold tracking-[0.16em] text-gold">MATCH PLAN · FIFA PEAP</p>
        <p className="mt-0.5 font-display text-xl font-bold leading-tight">{plan.venue.trim() || "Venue not set"}</p>
        <p className="mt-0.5 text-sm text-gold-soft">{when || "Date and kick-off not set"}</p>
      </div>
      <p className="bg-gold/15 px-3.5 py-2 font-display text-xs font-semibold leading-snug tracking-wide text-heading">
        Initial priority of the team: always assess for potential sudden cardiac arrest.
      </p>
      <div className="flex flex-col divide-y divide-line px-3.5">
        <CallRow title="Nearest hospital" name={plan.hospital} phone={plan.hospitalPhone} />
        <CallRow title="Team leader" chip="black" sub="Ensures the ambulance is called." name={plan.leader} phone={plan.leaderPhone} />
        {plan.ambulance.trim() ? (
          <div className="py-2.5">
            <p className="text-xs font-semibold text-muted">Ambulance</p>
            <p className="text-sm leading-snug text-ink">{plan.ambulance}</p>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 border-t border-line px-3.5 py-3">
        <SectionLabel>RESPONSIBLE</SectionLabel>
        <ul className="mt-1 flex flex-col divide-y divide-line">
          {COLOURS.map((id) => {
            const r = getRole(id);
            const name = plan.names[id].trim();
            return (
              <li key={id} className="flex items-center gap-2.5 py-2">
                <span className="w-[4.6rem] shrink-0">
                  <RoleChip id={id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-base font-semibold leading-tight", name ? "text-heading" : "text-muted")}>{name || "—"}</span>
                  <span className="block text-xs text-muted">{r?.role}</span>
                </span>
              </li>
            );
          })}
        </ul>
        {plan.extrication.trim() ? (
          <p className="mt-1 text-sm leading-snug">
            <span className="font-semibold text-heading">Extrication team: </span>
            {plan.extrication}
          </p>
        ) : null}
        {plan.notes.trim() ? (
          <p className="mt-1 whitespace-pre-line text-sm leading-snug">
            <span className="font-semibold text-heading">Notes: </span>
            {plan.notes}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
