import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { VideoList } from "@/components/fifa-video";
import { ZoomImage } from "@/components/zoom-image";
import { AppShell, Note, Panel, SectionLabel } from "@/components/workshop";
import { asset, imageSize } from "@/lib/asset";
import { FIFA_PITCHSIDE_PAGE, fifaSkillList } from "@/lib/videos";

export const Route = createFileRoute("/pitchside")({
  component: PitchsidePage,
  head: () => ({ meta: [{ title: "Pitchside emergency care · Pitchside Emergency Care" }] }),
});

const posters = [
  {
    src: asset("/img/fifa/peap.jpg"),
    title: "FIFA Pre-Match Emergency Action Plan (PEAP)",
    note: "Fill in before every match: venue, hospital, team leader and a name for each colour.",
  },
  {
    src: asset("/img/fifa/set-piece.jpg"),
    title: "Set-Piece protocol: sudden cardiac arrest",
    note: "Each colour's tasks from collapse to transfer.",
  },
  {
    src: asset("/img/fifa/cspine-protocol-v2.jpg"),
    title: "Set-Piece protocol: cervical spine injury",
    note: "MILS, A–E assessment, collar, blocks, straps and extrication with 6 people.",
  },
  {
    src: asset("/img/fifa/bag-factsheet.jpg"),
    title: "FIFA Emergency Care Bag factsheet",
    note: "Design, full contents and the emergency drugs pouch.",
  },
  {
    src: asset("/img/fifa/aed-travel.jpg"),
    title: "Philips HeartStart FRx — travel guidance",
    note: "Hand luggage only; remove the lithium battery before checking it in.",
  },
];

const downloads = [
  ["FIFA Emergency Care Manual (PDF, 45 MB)", "https://digitalhub.fifa.com/m/1fc77540eab37831/original/FIFA-Emergency-Care-Manual-EN.pdf"],
  ["FIFA Pre-Match Emergency Action Plan (PEAP)", "https://digitalhub.fifa.com/m/4ae3f3f5b8c62bb6/original/FIFA-Pre-match-Emergency-Action-Plan-PEAP.pdf"],
  ["Medical Set Piece — Roles within the PEAP (role cards)", "https://digitalhub.fifa.com/m/6ba55c14845ba5b8/original/FIFA-Medical-Set-Piece-Roles-within-the-Pre-Match-Emergency-Action-Plan.pdf"],
  ["Medical Set Piece — Protocols for on-field interventions (9 MB)", "https://digitalhub.fifa.com/m/2d07e67482901eb2/original/FIFA-Medical-Set-Piece-Protocols-for-on-field-interventions-during-matches.pdf"],
  ["Medical Set Piece — Sudden cardiac arrest protocol", "https://digitalhub.fifa.com/m/70de10635046d5a4/original/FIFA-Medical-Set-Piece-Emergency-Protocol-for-Sudden-Cardiac-Arrest.pdf"],
  ["Medical Set Piece — Cervical spine injury protocol", "https://digitalhub.fifa.com/m/251163df71285d43/original/FIFA-Medical-Set-Piece-Emergency-Protocol-for-Cervical-Spine-Injury.pdf"],
  ["FIFA Emergency Care Bag and AED factsheet", "https://digitalhub.fifa.com/m/234b69d94d8a67e5/original/FIFA-Emergency-Care-Bag-and-AED-Factsheet.pdf"],
  ["Set-piece approach for medical teams (2022 paper)", "https://digitalhub.fifa.com/m/49b7cd327c95c7ae/original/Set-piece-approach-for-medical-teams-managing-emergencies-in-sport-introducing-the-FIFA-Poster-for-Emergency-Action-Planning-PEAP.pdf"],
  ["Simpler means safer: the new Set-Piece toolkit and PEAP (BJSM blog, 2025)", "https://blogs.bmj.com/bjsm/2025/09/01/simpler-means-safer-when-responding-to-an-emergency-the-new-fifa-medical-set-piece-toolkit-and-pre-match-emergency-action-plan/"],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel>
      <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
        <SectionLabel>{title}</SectionLabel>
        {children}
      </div>
    </Panel>
  );
}

function PitchsidePage() {
  return (
    <AppShell tab="home">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">FIFA HEALTH & MEDICAL</p>
            <h1 className="mt-0.5 font-display text-xl font-bold leading-tight">Pitchside emergency care</h1>
            <p className="mt-1 text-sm text-gold-soft">
              FIFA's Skill Zone films, set-piece protocols, role cards and the emergency care bag.
            </p>
          </div>
          <ul className="flex list-disc flex-col gap-1.5 px-3.5 py-3 pl-8 text-sm leading-snug marker:text-gold">
            <li>Every collapse or injury is assessed the same structured way — the medical version of a “set piece”.</li>
            <li>The same framework applies in training, warm-up and matches.</li>
            <li>FIFA's Emergency Care Manual holds the full protocols (the main source for this guide).</li>
          </ul>
        </Panel>

        <Section title="FIFA SKILL ZONE — 5 FILMS">
          <p className="text-xs leading-snug text-muted">Each film opens on FIFA's website.</p>
          <VideoList clips={fifaSkillList} />
        </Section>

        <Section title="PEAP & ROLE CARDS">
          <p className="text-sm leading-snug">
            <b>The Pre-Match Emergency Action Plan</b> links each key intervention to a pre-assigned colour role, so the team
            prepares proactively instead of reacting. Use and rehearse it in <b>all</b> football settings — training and matches —
            adapted to the site and the expertise available.
          </p>
          <p className="text-sm leading-snug">
            FIFA's <b>role cards</b> give each member one colour and one set of tasks. Ideally one card per person; in a small team one
            person may hold more than one role if competent to do both.
          </p>
          <Link to="/" className="inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold-ink">
            Open your colour — each role page now shows FIFA's official card →
          </Link>
        </Section>

        <Section title="THE FIFA MEDICAL SET PIECE">
          <p className="text-sm leading-snug">
            A rehearsed, scripted response: every member has one clearly defined role, stays task-focused and does not interfere with
            anyone else's. FIFA's toolkit gives colour-coded protocols for on-field interventions, sudden cardiac arrest and cervical
            spine injury — the colours match the PEAP roles.
          </p>
          <Link to="/cspine" className="inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold-ink">
            Cervical spine injury — set piece by colour →
          </Link>
          <Link to="/focus" className="inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold-ink">
            Concussion assessment (FOCUS) →
          </Link>
        </Section>

        <Section title="PROTOCOLS FOR ON-FIELD INTERVENTIONS">
          <p className="text-xs leading-snug text-muted">FIFA Medical Set Piece booklet, version 3 (March 2025) — used at FIFA World Cups.</p>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-snug marker:text-gold">
            <li><b>Team:</b> 8–9 members — one emergency physician plus paramedics / health professionals, trained in the set piece by the FIFA Match Doctor (usually Black, the team leader) 5–7 days before the first match.</li>
            <li><b>Matchday:</b> present and kit checked by kick-off −2 h; moulages between −2 h and −1 h; always present at half-time and cool-down.</li>
            <li><b>Entering the pitch:</b> only on the referee's stretcher signal — except a non-contact collapse, when the team runs on at once.</li>
            <li><b>Ready position:</b> move along the touchline level with the incident and squat with the stretcher.</li>
            <li><b>Kit:</b> two identical sets — basket, scoop or spine board, head blocks, collar, straps; AED; oxygen; splints.</li>
            <li><b>SCA:</b> the chance of a good outcome falls by up to 10% per minute. After the third shock and medications the team leader considers moving the player, with a mechanical CPR device (LUCAS) fitted first where available. FIFA's advice: bring the ambulance onto the pitch to the player wherever possible — the 10-second stop-and-start carry is a last resort.</li>
            <li><b>Neck injury:</b> collar → log roll onto the scoop → straps (centre strap on the sternum) → head blocks → tape → release MILS → basket, 6 people.</li>
            <li><b>Extremity fracture:</b> full A–E first; hands above and below; analgesia; clean and dress wounds; splint and recheck.</li>
          </ul>
          <div className="grid grid-cols-2 gap-2">
            {["ready-position", "extrication-setup", "access-rules", "carry-photo"].map((f) => (
              <ZoomImage key={f} src={asset(`/img/fifa/onfield/${f}.jpg`)} alt={`FIFA on-field protocols: ${f.replace("-", " ")}`}>
                <img
                  src={asset(`/img/fifa/onfield/${f}.jpg`)}
                  alt=""
                  {...imageSize(`/img/fifa/onfield/${f}.jpg`)}
                  loading="lazy"
                  className="aspect-[3/4] w-full rounded-lg border border-line bg-white object-cover object-top"
                />
              </ZoomImage>
            ))}
          </div>
          <p className="text-xs leading-snug text-muted">Details are in skill modules 1 to 4.</p>
        </Section>

        <Section title="FIFA POSTERS AND FACTSHEETS">
          <p className="text-xs leading-snug text-muted">Tap a picture to open it full size and zoom in.</p>
          <div className="flex flex-col gap-3">
            {posters.map((g) => (
              <ZoomImage key={g.src} src={g.src} alt={g.title} captioned className="overflow-hidden rounded-lg border border-line bg-paper active:scale-[0.99]">
                <img src={g.src} alt="" {...imageSize(g.src)} loading="lazy" className="block max-h-96 w-full bg-white object-contain" />
                <span className="block border-t border-line px-3 py-2">
                  <span className="block text-sm font-semibold text-heading">{g.title}</span>
                  <span className="block text-xs leading-snug text-muted">{g.note}</span>
                </span>
              </ZoomImage>
            ))}
          </div>
        </Section>

        <Section title="FIFA EMERGENCY CARE BAG">
          <p className="text-sm leading-snug">
            A portable life-saving unit built around human-factors ergonomics: it folds out flat like a table so every clearly
            labelled item is in reach.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {["fecb-2", "fecb-3"].map((f) => (
              <ZoomImage key={f} src={asset(`/img/fifa/${f}.jpg`)} alt="FIFA Emergency Care Bag opened out, showing labelled compartments">
                <img src={asset(`/img/fifa/${f}.jpg`)} alt="" {...imageSize(`/img/fifa/${f}.jpg`)} loading="lazy" className="aspect-video w-full rounded-lg object-cover" />
              </ZoomImage>
            ))}
          </div>
          <Link to="/bag" className="inline-flex min-h-11 items-center font-display text-sm font-semibold tracking-wide text-gold-ink">
            Full bag packing list →
          </Link>
        </Section>

        <Section title="OFFICIAL FIFA DOWNLOADS">
          <ul className="flex flex-col divide-y divide-line">
            {downloads.map(([t, h]) => (
              <li key={h}>
                <a
                  href={h}
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

        <Note>
          From{" "}
          <a href={FIFA_PITCHSIDE_PAGE} rel="noopener noreferrer" className="underline">
            FIFA's Pitchside emergency care page
          </a>
          . Films, posters, photos and documents © FIFA.
        </Note>
      </div>
    </AppShell>
  );
}
