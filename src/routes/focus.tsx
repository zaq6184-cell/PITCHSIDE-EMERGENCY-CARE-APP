import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUp, Eye, FileText, RefreshCw } from "lucide-react";
import { FifaClipCard } from "@/components/fifa-video";
import { AppShell, JumpChips, Note, Panel, SectionLabel } from "@/components/workshop";
import { asset, imageSize } from "@/lib/asset";
import { cn } from "@/lib/utils";
import { FIFA_FOCUS_PAGE, fifaFocusClip } from "@/lib/videos";

export const Route = createFileRoute("/focus")({
  component: FocusPage,
  head: () => ({ meta: [{ title: "Concussion assessment (FOCUS) · Pitchside Emergency Care" }] }),
});

/** watch = lower threshold for concern + continue; sub = substitute + assess off the pitch. */
/** step = a practical action between FIFA's domains, not an assessment item. */
type Outcome = "watch" | "sub" | "step";
type Domain = { domain: string; outcome: Outcome; lead: string; items?: string[] };
type Stage = { id: string; where: string; when: string; domains: Domain[] };

const stages: Stage[] = [
  {
    id: "focus-before",
    where: "Touchline",
    when: "Before any incident",
    domains: [
      { domain: "Player medical history", outcome: "watch", lead: "Know: the player's medical and concussion history." },
    ],
  },
  {
    id: "focus-approach",
    where: "Touchline",
    when: "On approaching the player, and at any time after",
    domains: [
      {
        domain: "Mechanism of injury",
        outcome: "watch",
        lead: "Consider: the mechanism of injury. Observe: player lying motionless.",
      },
      {
        domain: "Visible signs",
        outcome: "sub",
        lead: "Observe:",
        items: [
          "No protective action",
          "Seizure",
          "Tonic posturing",
          "Motor incoordination",
          "Vomiting",
          "Abnormal emotional / behavioural response",
          "Possible skull fracture",
          "Abnormality of head / neck",
          "Blood / clear fluid from ear(s)",
          "Periocular / retroauricular haematoma",
          "Pupil abnormalities",
        ],
      },
      {
        domain: "Visible signs",
        outcome: "watch",
        lead: "Observe:",
        items: ["Superficial face / head injury / nosebleed", "Blank / vacant look"],
      },
    ],
  },
  {
    id: "focus-pitch",
    where: "Pitch",
    when: "With the player",
    domains: [
      {
        domain: "Level of consciousness",
        outcome: "sub",
        lead: "Assess: ACVPU scale. Ask: What happened? What is the last thing you remember?",
      },
      {
        domain: "Cervical spine assessment",
        outcome: "sub",
        lead: "Assess / ask:",
        items: [
          "Midline neck tenderness",
          "Restricted active range of neck motion",
          "Unexplained limb strength and / or sensation abnormality",
          "Numbness / tingling",
        ],
      },
      {
        domain: "Sit the player up",
        outcome: "step",
        lead: "Ask the player to sit up — once the cervical spine assessment is done — then carry on with the symptoms.",
      },
      {
        domain: "Symptoms",
        outcome: "sub",
        lead: "Ask:",
        items: [
          "Headache / pressure in head",
          "Feel normal",
          "Drowsy",
          "Disorientated",
          "Difficulty concentrating",
          "Nauseous",
          "Blurred / double vision",
          "Feeling slowed down",
          "Normal hearing",
        ],
      },
      {
        domain: "Orientation",
        outcome: "sub",
        lead: "Ask: What venue? Which half? Which team scored last? Which team did you play last week? Win / lose / draw?",
      },
      {
        domain: "Balance",
        outcome: "sub",
        lead: "Observe: tandem stand with eyes closed. Ask: dizziness, balance difficulties.",
      },
      {
        domain: "Proprioception",
        outcome: "sub",
        lead: "Observe: finger to nose with eyes closed (left and right index fingers).",
      },
      {
        domain: "Oculomotor",
        outcome: "sub",
        lead: "Observe:",
        items: ["Smooth pursuit (side to side, up and down)", "Convergence"],
      },
    ],
  },
  {
    id: "focus-activity",
    where: "Touchline",
    when: "After the on-pitch assessment",
    domains: [
      {
        domain: "Activity-based assessment",
        outcome: "sub",
        lead: "Observe: change-of-direction sprint. Ask: symptoms provoked.",
      },
    ],
  },
];

const resources = [
  {
    title: "FOCUS — full resource document",
    note: "The most comprehensive guide to the on-pitch assessment using FOCUS.",
    href: "https://digitalhub.fifa.com/asset/eb375882-be6a-4346-bad1-efc432d3906d/FOCUS-Concussion-Resource_EN.pdf",
    img: asset("/img/fifa/focus/cover-full.jpg"),
  },
  {
    title: "FOCUS — pocket leaflet",
    note: "A one-page reference guide to print.",
    href: "https://digitalhub.fifa.com/asset/8212b983-09fd-4c4b-92bf-b4b4ab90e55d/FOCUS-Concussion-Pocket-leaflet_EN.pdf",
    img: asset("/img/fifa/focus/cover-pocket.jpg"),
  },
  {
    title: "FOCUS — lanyard / pocket guide",
    note: "A palm-sized card to take onto the pitch.",
    href: "https://digitalhub.fifa.com/asset/06dd78e7-f86a-4ef8-bb2d-046a490f32a7/FOCUS-Concussion-lanyard_EN.pdf",
    img: asset("/img/fifa/focus/cover-lanyard.jpg"),
  },
];

const downloads: [string, string, string][] = [
  ["FOCUS lanyard — print version, April 2026", asset("/docs/FIFA-FOCUS-Concussion-Lanyard-April-2026.pdf"), "PDF"],
  ["FOCUS — frequently asked questions", "https://digitalhub.fifa.com/asset/c316e283-fe17-405e-b625-1fdbe1061df8/FIFA-Focus-FAQ-s.pdf", "PDF"],
  ["FIFA Concussion Protocol for Medical Staff (elite)", "https://digitalhub.fifa.com/asset/b6bc9c16-b211-47f4-b5e0-3e929df9115c/Medical-concussion-protocol-Elite_EN_Final.pdf", "PDF"],
  ["FIFA Concussion Protocol for Grassroots Football (non-elite)", "https://digitalhub.fifa.com/m/a78bb271b8035ab/original/Medical-Concussion-Protocol-non-elite_EN_Final.pdf", "PDF"],
  ["FOCUS — international consensus recommendations (JAMA Neurology)", "https://jamanetwork.com/journals/jamaneurology/fullarticle/2851047", "Paper"],
  ["Concussion: Suspect and Protect (FIFA campaign)", "https://inside.fifa.com/campaigns/concussion", "Web"],
];

function OutcomeIcon({ outcome }: { outcome: Outcome }) {
  if (outcome === "step") {
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy text-gold" title="Added step">
        <ArrowUp className="size-3.5" strokeWidth={2.6} />
      </span>
    );
  }
  return outcome === "sub" ? (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-danger text-white" title="Substitute">
      <RefreshCw className="size-3.5" strokeWidth={2.4} />
    </span>
  ) : (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold text-on-gold" title="Continue assessment">
      <Eye className="size-3.5" strokeWidth={2.4} />
    </span>
  );
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <Panel>
        <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
          <SectionLabel>{title}</SectionLabel>
          {children}
        </div>
      </Panel>
    </section>
  );
}

function FocusPage() {
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">FIFA HEALTH & MEDICAL</p>
            <h1 className="mt-0.5 font-display text-xl font-bold leading-tight">Concussion assessment protocol (FOCUS)</h1>
            <p className="mt-1 text-sm text-gold-soft">
              Football-Specific Standardised On-Pitch Concussion Assessment Protocol.
            </p>
          </div>
          <ul className="flex list-disc flex-col gap-1.5 px-3.5 py-3 pl-8 text-sm leading-snug marker:text-gold">
            <li>A practical tool to identify players who must come off for a formal concussion assessment after a head impact.</li>
            <li>11 domains, assessed from the touchline, on approaching the player, on the pitch, and back at the touchline.</li>
            <li>Built from a review of the scientific evidence with a global group of concussion clinicians and researchers.</li>
          </ul>
        </Panel>

        <JumpChips
          items={[
            { id: "focus-video", label: "Video" },
            { id: "focus-protocol", label: "The 11 domains" },
            { id: "focus-card", label: "Lanyard card" },
            { id: "focus-after", label: "Afterwards" },
            { id: "focus-resources", label: "FIFA resources" },
          ]}
        />

        <div className="rounded-xl border-l-4 border-danger bg-danger/10 px-3 py-2.5 text-sm leading-snug">
          <p className="font-semibold text-danger">Suspected concussion = remove from play immediately</p>
          <p>
            Footballers who play on are more likely to have a prolonged recovery, worse performance and a risk of
            further injury. The on-pitch assessment is not there to diagnose concussion — only to decide whether any
            sign or symptom raises suspicion.
          </p>
        </div>

        <Section id="focus-video" title="FIFA FOCUS VIDEO">
          <p className="text-xs leading-snug text-muted">FIFA's own film. Tap play — needs a connection.</p>
          <div className="-mx-3.5">
            <FifaClipCard clip={fifaFocusClip} />
          </div>
        </Section>

        <Section id="focus-protocol" title="THE PROTOCOL — 11 DOMAINS">
          <div className="flex flex-col gap-1.5 rounded-lg bg-cream px-3 py-2.5 text-xs leading-snug">
            <p className="flex items-center gap-2">
              <OutcomeIcon outcome="watch" />
              <span>Abnormal: lower your threshold for concern and continue the assessment.</span>
            </p>
            <p className="flex items-center gap-2">
              <OutcomeIcon outcome="sub" />
              <span>Abnormal: substitute the player; further assessment and treatment off the pitch.</span>
            </p>
          </div>
          <ol className="flex flex-col gap-3">
            {stages.map((st, i) => (
              <li key={st.id} id={st.id} className="scroll-mt-24">
                <div className="flex items-baseline gap-2">
                  <span className="grid size-6 shrink-0 place-items-center self-center rounded-full bg-navy font-display text-xs font-bold text-gold">
                    {i + 1}
                  </span>
                  <p className="font-display text-sm font-semibold tracking-wide text-heading">{st.where.toUpperCase()}</p>
                  <p className="text-xs text-muted">{st.when}</p>
                </div>
                <div className="mt-1.5 flex flex-col gap-1.5">
                  {st.domains.map((d) => (
                    <div
                      key={d.domain + d.outcome}
                      className={cn(
                        "flex gap-2.5 rounded-lg border-l-4 px-2.5 py-2",
                        d.outcome === "sub"
                          ? "border-danger bg-danger/10"
                          : d.outcome === "step"
                            ? "border-heading bg-note"
                            : "border-gold bg-gold/15",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-xs font-semibold tracking-wide text-heading">{d.domain}</p>
                        <p className="text-sm leading-snug">{d.lead}</p>
                        {d.items ? (
                          <ul className="mt-0.5 flex list-disc flex-col gap-0.5 pl-4 text-sm leading-snug marker:text-muted">
                            {d.items.map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                      <OutcomeIcon outcome={d.outcome} />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <Note>
            ACVPU = Alert, Confusion (new), Voice, Pain, Unresponsive. “Sit the player up” is a practical step added by this guide
            between FIFA's cervical spine and symptoms domains; it is not on FIFA's card.
          </Note>
        </Section>

        <Section id="focus-card" title="FOCUS LANYARD CARD">
          <p className="text-xs leading-snug text-muted">FIFA's palm-sized card (April 2026). Tap a side to open it full size.</p>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2].map((n) => (
              <a key={n} href={asset(`/img/fifa/focus/lanyard-${n}.jpg`)} target="_blank" rel="noopener noreferrer">
                <img
                  src={asset(`/img/fifa/focus/lanyard-${n}.jpg`)}
                  alt={`FIFA FOCUS lanyard card, side ${n}`}
                  {...imageSize(`/img/fifa/focus/lanyard-${n}.jpg`)}
                  loading="lazy"
                  className="block w-full rounded-lg border border-line bg-white"
                />
              </a>
            ))}
          </div>
          <a
            href={asset("/docs/FIFA-FOCUS-Concussion-Lanyard-April-2026.pdf")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 font-display text-sm font-semibold tracking-wide text-gold-ink"
          >
            <FileText className="size-4" />
            Open the print PDF
          </a>
        </Section>

        <Section id="focus-after" title="AFTER A SUSPECTED CONCUSSION">
          <p className="text-sm leading-snug">
            What FIFA's Concussion Protocol for Medical Staff (August 2024) asks for once a player has been removed.
            Concussion is a clinical diagnosis: a normal scan does not rule it out.
          </p>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-snug marker:text-gold">
            <li>
              <b>No return the same day.</b> A player with a suspected concussion does not go back on that day.
            </li>
            <li>
              <b>Red flags</b> — signs of a life-threatening problem or of bleeding in or around the brain: emergency
              management and consider immediate transfer to hospital.
            </li>
            <li>
              <b>Yellow flags</b> — any neurological or orthopaedic impairment, or the doctor is in doubt: remove from
              football and examine further, with a specialist if needed.
            </li>
            <li>
              <b>CT scan on the day</b> is recommended for any of: GCS below 13 (or below 15 after two hours),
              suspected skull fracture, more than one episode of vomiting, a seizure after the injury, loss of
              consciousness, persistent memory loss for events after the injury, or a focal neurological deficit.
            </li>
            <li>
              <b>72 hours of observation</b> by the team doctor, with a daily check, because symptoms can appear late.
              Avoid medication that could mask or worsen symptoms until a more serious injury is ruled out.
            </li>
            <li>
              <b>Before leaving the venue, and before any flight,</b> re-examine for new or worsening signs.
            </li>
          </ul>
          <p className="font-display text-xs font-semibold tracking-wide text-heading">GRADUATED RETURN TO FOOTBALL</p>
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm leading-snug marker:text-muted">
            <li>Symptom-limited daily activity, such as a short walk.</li>
            <li>Light aerobic exercise, up to about 70% of maximum heart rate.</li>
            <li>Football-specific exercises one-to-one (player and coach), with no contact and no heavy resistance.</li>
            <li>Non-contact training drills in a small group; only easy heading with a soft ball.</li>
            <li>Drills with controlled contact, and heading with a normal ball in a controlled setting.</li>
            <li>Full-contact team training, after medical clearance.</li>
            <li>Return to match play.</li>
          </ol>
          <Note>
            Each stage needs at least one session and lasts at least 24 hours. If symptoms return, rest until they
            settle (at least 24 hours) and go back to the last symptom-free stage. The doctor re-examines the player
            before stage 1 and again before stage 6, and clearance rests on medical grounds only. Be more cautious
            with younger players and after repeated concussions.
          </Note>
          <a
            href="https://digitalhub.fifa.com/asset/b6bc9c16-b211-47f4-b5e0-3e929df9115c/Medical-concussion-protocol-Elite_EN_Final.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-medium text-heading underline underline-offset-2"
          >
            Read FIFA's Concussion Protocol for Medical Staff (PDF, on FIFA's website)
          </a>
        </Section>

        <Section id="focus-resources" title="FIFA RESOURCES">
          <div className="flex flex-col gap-2">
            {resources.map((r) => (
              <a
                key={r.href}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-line bg-paper p-2 active:scale-[0.99]"
              >
                <img src={r.img} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded object-cover" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug text-heading">{r.title}</span>
                  <span className="block text-xs leading-snug text-muted">{r.note}</span>
                </span>
              </a>
            ))}
          </div>
          <ul className="flex flex-col divide-y divide-line">
            {downloads.map(([t, h, kind]) => (
              <li key={h}>
                <a
                  href={h}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-2.5 py-2 text-sm leading-snug text-heading"
                >
                  <FileText className="size-4 shrink-0 text-gold-ink" />
                  <span className="flex-1">{t}</span>
                  <span className="shrink-0 rounded-full bg-cream px-2 py-0.5 font-display text-[10px] font-semibold tracking-wide text-muted">
                    {kind}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="RELATED IN THIS GUIDE">
          <Link to="/cspine" className="inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold-ink">
            Cervical spine injury — FIFA set piece →
          </Link>
          <Link
            to="/station/$id"
            params={{ id: "3" }}
            className="inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold-ink"
          >
            Skill module 3 — primary survey (D: disability) →
          </Link>
        </Section>

        <Note>
          From{" "}
          <a href={FIFA_FOCUS_PAGE} target="_blank" rel="noopener noreferrer" className="underline">
            FIFA's FOCUS page
          </a>{" "}
          and the FOCUS lanyard (April 2026). Film, card and documents © FIFA.
        </Note>
      </div>
    </AppShell>
  );
}
