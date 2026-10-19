import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { FifaClipCard, VideoList } from "@/components/fifa-video";
import { SpineDrill3D } from "@/components/set-piece-3d";
import { ZoomImage } from "@/components/zoom-image";
import { AppShell, JumpChips, Note, Panel, RoleChip, SectionLabel } from "@/components/workshop";
import { asset, imageSize } from "@/lib/asset";
import { COLLAR_SIZING_ALT } from "@/lib/stations";
import { FIFA_PITCHSIDE_PAGE, type FifaClip, fifaSkillClips, skillClips } from "@/lib/videos";
import type { RoleId } from "@/lib/workshop";

export const Route = createFileRoute("/cspine")({
  component: CspinePage,
  head: () => ({ meta: [{ title: "Cervical spine injury · Pitchside Emergency Care" }] }),
});

type Task = [RoleId, string];
const setPiece: { title: string; note?: string; tasks: Task[] }[] = [
  {
    title: "Suspected cervical spine injury — cannot be ruled out clinically",
    tasks: [
      ["black", "Team leader. Focus on good communication. Ensure the ambulance is called."],
      ["orange", "Immobilise the cervical spine (MILS)."],
      ["red", "A (c-spine) B C assessment."],
      ["green", "Bring the FIFA bag. Assist as directed by the team leader."],
      ["blue", "Bring oxygen."],
      ["white", "Bring the scoop and splints. Assist as directed by the team leader."],
    ],
  },
  {
    title: "Airway assessment",
    tasks: [
      ["orange", "Jaw thrust (immobilise the spine)."],
      ["red", "Apply an airway adjunct and / or trauma mask if needed."],
      ["blue", "Oxygen at 15 L/min to the trauma mask."],
    ],
  },
  {
    title: "Breathing assessment",
    tasks: [
      ["orange", "Immobilise the spine. Inform if any airway issues."],
      ["red", "Respiratory rate. 2 hands on 3 places."],
    ],
  },
  {
    title: "Circulation assessment",
    tasks: [
      ["orange", "Immobilise the spine. Inform if any airway issues."],
      ["red", "Pulse rate. 2 hands on 3 places."],
    ],
  },
  {
    title: "Disability assessment",
    tasks: [
      ["orange", "Immobilise the spine. Inform if any airway issues."],
      ["red", "AVPU (alert, voice, pain, unresponsive). 2 pupils. Motor and sensation in 3 places."],
    ],
  },
  {
    title: "Set up to extricate as per the FIFA set piece",
    note: "Scoop and basket below the feet, in line with the player.",
    tasks: [
      ["orange", "Immobilise the spine. Inform if any airway issues. Lead the log roll."],
      ["red", "Size and apply the collar, then reassess the airway. Chest in the log roll."],
      ["blue", "Pelvis in the log roll."],
      ["white", "Legs in the log roll."],
      ["green", "Prepare to assist / apply the extrication device."],
    ],
  },
  {
    title: "Extrication device applied",
    tasks: [
      ["orange", "Immobilise the spine until blocks and tape are on — then you can remove your hands."],
      ["red", "Apply straps. Apply blocks, then tape. Reassess."],
      ["blue", "Apply straps."],
      ["white", "Apply straps."],
    ],
  },
  {
    title: "Utilise the basket (if present) — extricate using 6 people if possible",
    tasks: [],
  },
];

const clearing = [
  "No midline tenderness",
  "Glasgow Coma Scale (GCS) 15",
  "No distracting injury",
  "No neurology",
  "No concerning mechanism (e.g. fall onto the head, axial load)",
  "Active range of movement: 45° lateral rotation to each side — the player moves, not the clinician",
];

const pick = (id: string): FifaClip => {
  const c = skillClips.find((s) => s.youtubeId === id);
  if (!c) throw new Error(`Unknown skill clip ${id}`);
  return { youtubeId: c.youtubeId, title: c.title, source: c.source, duration: "", poster: c.poster ?? "", why: c.fifa[0] };
};
const moreFilms: FifaClip[] = [
  fifaSkillClips.handsOn,
  fifaSkillClips.setup,
  pick("tzobASnovRc"),
  pick("5FUnepktYxE"),
  pick("qUGWDodlGK4"),
];

const downloads: [string, string][] = [
  ["FIFA Set-Piece Protocol — cervical spine injury (poster)", asset("/docs/FIFA-Set-Piece-Protocol-Cervical-Spine.pdf")],
  ["Medical Set Piece — Protocols for on-field interventions (9 MB)", "https://digitalhub.fifa.com/m/2d07e67482901eb2/original/FIFA-Medical-Set-Piece-Protocols-for-on-field-interventions-during-matches.pdf"],
  ["Medical Set Piece — Roles within the PEAP (role cards)", "https://digitalhub.fifa.com/m/6ba55c14845ba5b8/original/FIFA-Medical-Set-Piece-Roles-within-the-Pre-Match-Emergency-Action-Plan.pdf"],
  ["FIFA Emergency Care Manual (PDF, 45 MB)", "https://digitalhub.fifa.com/m/1fc77540eab37831/original/FIFA-Emergency-Care-Manual-EN.pdf"],
];

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

const bullets = "flex list-disc flex-col gap-1.5 pl-5 text-sm leading-snug marker:text-gold";
const numbered = "flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-snug marker:font-semibold marker:text-heading";
const more = "inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold-ink";

function CspinePage() {
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">FIFA MEDICAL SET PIECE</p>
            <h1 className="mt-0.5 font-display text-xl font-bold leading-tight">Cervical spine injury</h1>
            <p className="mt-1 text-sm text-gold-soft">
              The colour-coded protocol, the FIFA film, collar, log roll and extrication — in one place.
            </p>
          </div>
          <ul className="flex list-disc flex-col gap-1.5 px-3.5 py-3 pl-8 text-sm leading-snug marker:text-gold">
            <li>Initial priority of the team: always assess for potential sudden cardiac arrest.</li>
            <li>Use this set piece when a neck injury is suspected and cannot be ruled out clinically.</li>
            <li>Treat any issue you find before moving on to the next assessment.</li>
          </ul>
        </Panel>

        <JumpChips
          items={[
            { id: "cs-3d", label: "3D set piece" },
            { id: "cs-video", label: "FIFA film" },
            { id: "cs-clear", label: "Clearing the spine" },
            { id: "cs-setpiece", label: "Set piece by colour" },
            { id: "cs-collar", label: "Collar & blocks" },
            { id: "cs-logroll", label: "Log roll & extrication" },
            { id: "cs-films", label: "More films" },
            { id: "cs-poster", label: "Poster & downloads" },
          ]}
        />

        <div className="rounded-xl border-l-4 border-danger bg-danger/10 px-3 py-2.5 text-sm leading-snug">
          <p className="font-semibold text-danger">Collapsed + unresponsive = sudden cardiac arrest</p>
          <p>
            Start chest compressions and apply the AED. Do not delay CPR or defibrillation for the cervical spine in a
            non-contact collapse.
          </p>
        </div>

        <section id="cs-3d" className="scroll-mt-24">
          <Panel>
            <div className="px-3.5 pt-3.5">
              <SectionLabel>THE SET PIECE IN 3D</SectionLabel>
              <p className="mt-2 text-xs leading-snug text-muted">
                Seven steps with the team's call-outs, from holding the head to the basket lift. Tap a step, or Play all. Works
                offline.
              </p>
            </div>
            <div className="mt-3">
              <SpineDrill3D />
            </div>
          </Panel>
        </section>

        <Section id="cs-video" title="FIFA SKILL ZONE FILM">
          <p className="text-xs leading-snug text-muted">FIFA's own film of the full set piece. Tap play — needs a connection.</p>
          <div className="-mx-3.5">
            <FifaClipCard clip={fifaSkillClips.cspine} />
          </div>
        </Section>

        <Section id="cs-clear" title="CLEARING THE CERVICAL SPINE">
          <p className="text-sm leading-snug">FIFA: the spine is cleared only if all 6 are met.</p>
          <ol className={numbered}>
            {clearing.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <div className="rounded-lg border-l-4 border-heading bg-note px-2.5 py-2 text-sm leading-snug">
            <p className="font-semibold text-heading">Mnemonic — NSAID</p>
            <p>
              Neurological deficit · Spinal midline tenderness · Altered mental status (GCS &lt; 15) · Intoxication
              (includes strong analgesics) · Distracting injury. Any one present → the spine cannot be cleared;
              extricate in a collar.
            </p>
          </div>
          <ul className={bullets}>
            <li>Start manual in-line stabilisation (MILS) and palpate for midline tenderness.</li>
            <li>An alert, conscious player splints their own neck — an early collar is not required.</li>
            <li>Clearing can wait until the primary survey is done. The collar goes on as part of extrication.</li>
            <li>
              FOCUS red flags for the neck: midline tenderness, restricted active movement, unexplained limb weakness
              or sensory change, numbness / tingling.
            </li>
          </ul>
          <Link to="/focus" className={more}>
            Concussion assessment (FOCUS) →
          </Link>
        </Section>

        <Section id="cs-setpiece" title="THE SET PIECE — BY COLOUR">
          <p className="text-xs leading-snug text-muted">
            Colours match the FIFA Pre-Match Emergency Action Plan roles. May flip all positions depending on the site
            of injury and hazards.
          </p>
          <ol className="flex flex-col gap-2.5">
            {setPiece.map((st, i) => (
              <li key={st.title} className="overflow-hidden rounded-lg border border-line">
                <div className="flex items-center gap-2 bg-navy px-2.5 py-2 text-on-navy">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold font-display text-xs font-bold text-on-gold">
                    {i + 1}
                  </span>
                  <p className="font-display text-xs font-semibold leading-snug tracking-wide">{st.title.toUpperCase()}</p>
                </div>
                {st.note || st.tasks.length ? (
                  <div className="flex flex-col divide-y divide-line bg-paper px-2.5">
                    {st.note ? <p className="py-2 text-xs leading-snug text-muted">{st.note}</p> : null}
                    {st.tasks.map(([role, text]) => (
                      <div key={role} className="flex items-start gap-2.5 py-2">
                        <span className="w-[4.6rem] shrink-0 pt-0.5">
                          <RoleChip id={role} />
                        </span>
                        <p className="text-sm leading-snug">{text}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
          <Note>Hands On 1, 2, 3: 1 observation, then 2 hands on 3 places — for B, C and D.</Note>
        </Section>

        <Section id="cs-collar" title="COLLAR AND HEAD BLOCKS">
          <ZoomImage src={asset("/img/s5/collar-sizing.svg")} alt={COLLAR_SIZING_ALT} className="-mx-3.5 w-[calc(100%+1.75rem)]">
            <img
              src={asset("/img/s5/collar-sizing.svg")}
              alt=""
              width={960}
              height={540}
              loading="lazy"
              className="block w-full bg-white"
            />
          </ZoomImage>
          <p className="text-xs leading-snug text-muted">
            Sizing, after the FIFA Emergency Care Manual: count fingerbreadths on the player, then find the same distance on the
            opened collar. Tap to enlarge. Always follow the manufacturer's instructions.
          </p>
          <ol className={numbered}>
            <li>Maintain MILS throughout.</li>
            <li>Size: neutral head, line from the chin back to the sternomastoid, measure fingerbreadths down to trapezius.</li>
            <li>Between two sizes → start with the SMALLER one (too big extends the neck).</li>
            <li>Position the posterior section; support the chin in the chin piece. Secure without over-tightening.</li>
            <li>Check the mouth can still open, then reassess the airway.</li>
            <li>Blocks placed evenly, fixed to the device, then tape. Keep access to the airway and ears.</li>
          </ol>
          <p className="rounded-lg bg-navy px-2.5 py-2 text-center font-display text-xs font-semibold tracking-wide text-gold">
            MILS → SIZE → COLLAR → STRAPS → BLOCKS → TAPE → RELEASE
          </p>
          <ul className={bullets}>
            <li>Contraindication: airway obstruction — keep MILS instead until the airway is dealt with.</li>
            <li>A collar alone does not immobilise. Keep MILS until blocks and tape are on.</li>
            <li>Follow local guidance — some countries no longer use collars.</li>
          </ul>
        </Section>

        <Section id="cs-logroll" title="LOG ROLL AND EXTRICATION">
          <dl className="flex flex-col divide-y divide-line">
            {[
              ["Head (Orange 2)", "Directly behind the head: MILS. Controls the move: explains the signal and says how far — 90° log roll, or a 15–20° tilt for a scoop."],
              ["Chest (Red 3)", "One hand on the far shoulder, one on the hip."],
              ["Pelvis (Blue 4)", "One hand on the waist, the other under the knee."],
              ["Legs (White 5)", "One hand under the lower leg, the other under the ankle."],
              ["Fifth person (Green 6)", "Places the scoop or board."],
            ].map(([t, d]) => (
              <div key={t} className="py-1.5">
                <dt className="font-display text-xs font-semibold tracking-wide text-heading">{t}</dt>
                <dd className="text-sm leading-snug">{d}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm font-semibold text-heading">Extrication order</p>
          <ol className={numbered}>
            <li>Size and fit the collar — check the mouth can still open.</li>
            <li>Log roll or tilt onto the scoop — Orange leads the count.</li>
            <li>Apply straps — the first, centre strap lined up with the sternum.</li>
            <li>Apply head blocks and fix them to the device, then tape.</li>
            <li>Only now can MILS be released.</li>
            <li>Slide the basket under the scoop and extricate with 6 people if possible.</li>
          </ol>
          <ZoomImage
            src={asset("/img/fifa/onfield/extrication-setup.jpg")}
            alt="FIFA extrication set-up: bag and oxygen at the head, scoop between the feet and the basket, basket 2–3 lengths from the feet"
          >
            <img
              src={asset("/img/fifa/onfield/extrication-setup.jpg")}
              alt=""
              {...imageSize("/img/fifa/onfield/extrication-setup.jpg")}
              loading="lazy"
              className="block max-h-80 w-full rounded-lg border border-line bg-white object-contain"
            />
          </ZoomImage>
          <Note>
            For trauma: scoop stretcher and basket, set up below the feet in line with the player —
            basket 2–3 lengths away. A scoop moves the player only ~15° instead of a 90° log roll.
          </Note>
        </Section>

        <Section id="cs-films" title="MORE FILMS">
          <p className="text-xs leading-snug text-muted">Assessment, set-up, collar, log roll and scoop. Each film opens on its owner's website.</p>
          <div className="-mx-3.5">
            <VideoList clips={moreFilms} />
          </div>
        </Section>

        <Section id="cs-poster" title="FIFA POSTER AND DOWNLOADS">
          <ZoomImage
            src={asset("/img/fifa/cspine-protocol-v2.jpg")}
            alt="FIFA Medical Set-Piece protocol for cervical spine injury: colour-coded tasks from assessment to extrication"
            className="overflow-hidden rounded-lg border border-line bg-paper active:scale-[0.99]"
          >
            <img
              src={asset("/img/fifa/cspine-protocol-v2.jpg")}
              alt=""
              {...imageSize("/img/fifa/cspine-protocol-v2.jpg")}
              loading="lazy"
              className="block max-h-[30rem] w-full bg-white object-contain"
            />
            <span className="block border-t border-line px-3 py-2 text-xs leading-snug text-muted">
              Tap to open full size and zoom in.
            </span>
          </ZoomImage>
          <ul className="flex flex-col divide-y divide-line">
            {downloads.map(([t, h]) => (
              <li key={h}>
                <a
                  href={h}
                  download={h.includes("/docs/") ? "" : undefined}
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-2.5 py-2 text-sm leading-snug text-heading"
                >
                  <FileText className="size-4 shrink-0 text-gold-ink" />
                  <span>{t}</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="RELATED IN THIS GUIDE">
          <Link to="/station/$id" params={{ id: "3" }} className={more}>
            Skill module 3 — primary survey (A: airway & cervical spine) →
          </Link>
          <Link to="/station/$id" params={{ id: "4" }} className={more}>
            Skill module 4 — immobilisation devices →
          </Link>
          <Link to="/focus" className={more}>
            Concussion assessment (FOCUS) →
          </Link>
        </Section>

        <Note>
          From the FIFA Medical Set-Piece Protocol for Cervical Spine Injury, the FIFA Emergency Care Manual and{" "}
          <a href={FIFA_PITCHSIDE_PAGE} rel="noopener noreferrer" className="underline">
            FIFA's Pitchside emergency care page
          </a>
          . Film, poster and documents © FIFA. Follow FIFA's current documents and your local protocol.
        </Note>
      </div>
    </AppShell>
  );
}
