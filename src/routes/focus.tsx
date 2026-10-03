import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUp, Eye, FileText, RefreshCw } from "lucide-react";
import { FifaClipCard } from "@/components/fifa-video";
import { AppShell, JumpChips, Note, Panel, SectionLabel } from "@/components/workshop";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";
import { FIFA_FOCUS_PAGE, fifaFocusClip } from "@/lib/videos";

export const Route = createFileRoute("/focus")({ component: FocusPage });

/** watch = lower threshold for concern + continue; sub = substitute + assess off the pitch. */
/** step = a workshop action between FIFA's domains, not an assessment item. */
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
  ["FIFA Medical Concussion Protocol — elite", "https://digitalhub.fifa.com/asset/b6bc9c16-b211-47f4-b5e0-3e929df9115c/Medical-concussion-protocol-Elite_EN_Final.pdf", "PDF"],
  ["FIFA Medical Concussion Protocol — non-elite", "https://digitalhub.fifa.com/m/a78bb271b8035ab/original/Medical-Concussion-Protocol-non-elite_EN_Final.pdf", "PDF"],
  ["FOCUS — international consensus recommendations (JAMA Neurology)", "https://jamanetwork.com/journals/jamaneurology/fullarticle/2851047", "Paper"],
  ["Concussion: Suspect and Protect (FIFA campaign)", "https://inside.fifa.com/campaigns/concussion", "Web"],
];

function OutcomeIcon({ outcome }: { outcome: Outcome }) {
  if (outcome === "step") {
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy text-gold" title="Workshop step">
        <ArrowUp className="size-3.5" strokeWidth={2.6} />
      </span>
    );
  }
  return outcome === "sub" ? (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-danger text-white" title="Substitute">
      <RefreshCw className="size-3.5" strokeWidth={2.4} />
    </span>
  ) : (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold text-navy" title="Continue assessment">
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
            <h2 className="mt-0.5 font-display text-xl font-bold leading-tight">Concussion assessment protocol (FOCUS)</h2>
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
                  <p className="font-display text-sm font-semibold tracking-wide text-navy">{st.where.toUpperCase()}</p>
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
                            ? "border-navy bg-note"
                            : "border-gold bg-gold/15",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-xs font-semibold tracking-wide text-navy">{d.domain}</p>
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
            ACVPU = Alert, Confusion (new), Voice, Pain, Unresponsive. “Sit the player up” is a workshop step added
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
            className="inline-flex min-h-11 items-center gap-2 font-display text-sm font-semibold tracking-wide text-gold"
          >
            <FileText className="size-4" />
            Open the print PDF
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
                className="flex items-center gap-3 rounded-lg border border-line bg-white p-2 active:scale-[0.99]"
              >
                <img src={r.img} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded object-cover" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug text-navy">{r.title}</span>
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
                  className="flex min-h-11 items-center gap-2.5 py-2 text-sm leading-snug text-navy"
                >
                  <FileText className="size-4 shrink-0 text-gold" />
                  <span className="flex-1">{t}</span>
                  <span className="shrink-0 rounded-full bg-cream px-2 py-0.5 font-display text-[10px] font-semibold tracking-wide text-muted">
                    {kind}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="RELATED IN THIS APP">
          <Link to="/cspine" className="inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold">
            Cervical spine injury — FIFA set piece →
          </Link>
          <Link
            to="/station/$id"
            params={{ id: "3" }}
            className="inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold"
          >
            Station 3 — primary survey (D: disability) →
          </Link>
        </Section>

        <Note>
          From{" "}
          <a href={FIFA_FOCUS_PAGE} target="_blank" rel="noopener noreferrer" className="underline">
            FIFA's FOCUS page
          </a>{" "}
          and the FOCUS lanyard (April 2026). Film, card and documents © FIFA, shown for workshop education.
        </Note>
      </div>
    </AppShell>
  );
}
