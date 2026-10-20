/**
 * Case simulator: branching pitchside cases. Each stage shows the player and the monitor, and offers choices;
 * each choice costs time on the case clock and may be wrong or dangerous. The outcome comes from the times
 * of the actions that matter (CPR, the shock, cooling). Plain data and functions, tested with `node --test`;
 * the player is components/case-player.tsx. Content follows this guide's FIFA set piece and the sources cited.
 */
export type Rhythm = "none" | "vf" | "sinus" | "sinus-fast";

export type Vitals = {
  rhythm: Rhythm;
  /** compressions running: the monitor shows the CPR artefact over the rhythm */
  cpr?: boolean;
  hr?: number;
  spo2?: number;
  bp?: string;
  rr?: number;
  temp?: number;
};

/** What a choice changes in the case: when CPR started, when the shock came, how cooling was done. */
export type Effect = { cpr?: true; shock?: true; cool?: "cwi" | "packs" | "transport" | "shade" };

export type Choice = {
  label: string;
  ok: boolean;
  /** dangerous, not just slow */
  critical?: boolean;
  feedback: string;
  /** seconds on the case clock */
  seconds: number;
  next: string;
  effect?: Effect;
};

export type Stage = { id: string; text: string; vitals: Vitals; choices: Choice[] };

export type CaseDef = {
  id: "vf" | "commotio" | "heat";
  title: string;
  short: string;
  /** the match minute when it starts */
  minute: number;
  setting: string;
  start: string;
  stages: Stage[];
  /** after the last choice */
  ending: { text: string; vitals: Vitals };
  teaching: string[];
};

const SHOCK_FEEDBACK = "Hands off, everyone clear, oxygen away from the chest unless it is on a closed loop such as an i-gel — then shock.";

export const CASES: CaseDef[] = [
  {
    id: "vf",
    title: "Non-contact collapse",
    short: "Cardiac arrest · VF",
    minute: 63,
    setting: "Second half, warm evening. Your team of six is in the ready position on the touchline.",
    start: "s1",
    stages: [
      {
        id: "s1",
        text: "A midfielder jogging back on his own suddenly collapses, face down. No one was near him.",
        vitals: { rhythm: "none" },
        choices: [
          { label: "Enter the pitch at once with the team, the bag and the AED", ok: true, feedback: "Non-contact collapse = cardiac arrest until proven otherwise: enter at once.", seconds: 15, next: "s2" },
          { label: "Wait for the referee to stop play", ok: false, feedback: "Do not wait for the ball to go out of play — enter at once.", seconds: 40, next: "s2" },
          { label: "Send one person to have a look first", ok: false, feedback: "The whole team goes, with the kit: if it is an arrest, every second without the AED counts.", seconds: 30, next: "s2" },
        ],
      },
      {
        id: "s2",
        text: "You roll him onto his back. He does not respond. Every few seconds he takes a slow, noisy gasp; his arms twitch.",
        vitals: { rhythm: "none" },
        choices: [
          { label: "Gasping is not breathing: call the arrest, start compressions", ok: true, feedback: "Gasping and slow seizure-like movements are cardiac arrest, not a fit. Black calls it and the ambulance; Red compresses.", seconds: 10, next: "s3", effect: { cpr: true } },
          { label: "He is breathing — recovery position and watch the fit", ok: false, critical: true, feedback: "Agonal gasps are a sign of cardiac arrest. Treating it as a fit loses the minutes that decide survival.", seconds: 50, next: "s3", effect: { cpr: true } },
          { label: "Feel for a pulse for half a minute to be sure", ok: false, feedback: "Breathing and pulse together, no more than 10 seconds. Not sure = start compressions.", seconds: 30, next: "s3", effect: { cpr: true } },
        ],
      },
      {
        id: "s3",
        text: "Red is compressing hard and fast. Green arrives at the head with the AED open.",
        vitals: { rhythm: "none", cpr: true },
        choices: [
          { label: "Pads on while Red keeps compressing", ok: true, feedback: "Right: compressions continue while the pads go on.", seconds: 20, next: "s4" },
          { label: "Stop compressions so the pads can go on", ok: false, feedback: "Keep compressing while the pads go on; hands come off only for the analysis.", seconds: 30, next: "s4" },
          { label: "Finish the cycle of 30 first, then the pads", ok: false, feedback: "Apply the AED the moment it arrives — do not wait for the current 30-count.", seconds: 25, next: "s4" },
        ],
      },
      {
        id: "s4",
        text: "“Analysing heart rhythm. Do not touch the patient.” Then: “Shock advised. Charging.”",
        vitals: { rhythm: "vf" },
        choices: [
          { label: "Hands off, everyone clear, oxygen away — shock", ok: true, feedback: SHOCK_FEEDBACK, seconds: 10, next: "s5", effect: { shock: true } },
          { label: "Keep compressing while it analyses and charges", ok: false, critical: true, feedback: "Compressions during the analysis corrupt the rhythm check; touching at the shock is dangerous. Hands off.", seconds: 15, next: "s5", effect: { shock: true } },
          { label: "Shock while Orange is still holding the face mask on", ok: false, critical: true, feedback: "Everyone clear before every shock — and a face mask with oxygen comes away from the chest.", seconds: 5, next: "s5", effect: { shock: true } },
        ],
      },
      {
        id: "s5",
        text: "Shock delivered. The player jolts, then lies still.",
        vitals: { rhythm: "vf" },
        choices: [
          { label: "Compressions again at once — no pulse check", ok: true, feedback: "After a shock: no pulse check, straight back to 2 minutes of CPR.", seconds: 5, next: "s6" },
          { label: "Check for a pulse first", ok: false, feedback: "A pulse check now only delays CPR; the next check is the 2-minute rhythm check.", seconds: 20, next: "s6" },
        ],
      },
      {
        id: "s6",
        text: "CPR is running. Orange is ready with the i-gel and the bag valve; Blue has the oxygen.",
        vitals: { rhythm: "vf", cpr: true },
        choices: [
          { label: "i-gel in, oxygen 15 L/min to the bag — one breath every 10th compression", ok: true, feedback: "With an i-gel: continuous compressions and a breath every 10th — about 10 a minute.", seconds: 40, next: "s7" },
          { label: "Stop compressions to put the i-gel in", ok: false, feedback: "The airway goes in around the compressions, never instead of them.", seconds: 50, next: "s7" },
          { label: "Keep 30:2 with the i-gel in", ok: false, feedback: "30:2 is for a face mask, or an i-gel that leaks. A sealed i-gel: continuous compressions.", seconds: 40, next: "s7" },
        ],
      },
      {
        id: "s7",
        text: "Two-minute rhythm check. The monitor shows an organised rhythm and the player coughs and moves an arm.",
        vitals: { rhythm: "sinus", hr: 112, spo2: 91, bp: "102/64", rr: 14 },
        choices: [
          { label: "Check the pulse, oxygen on, bring the ambulance onto the pitch", ok: true, feedback: "Return of circulation: oxygen, monitor, and the ambulance comes to the player.", seconds: 30, next: "end" },
          { label: "Carry him to the touchline straight away", ok: false, feedback: "Carrying is a last resort — the ambulance or a buggy comes onto the pitch to the player.", seconds: 25, next: "end" },
        ],
      },
    ],
    ending: { text: "The ambulance reaches the player. He is breathing, with a pulse, and leaves for a hospital with 24/7 coronary angiography.", vitals: { rhythm: "sinus", hr: 104, spo2: 96, bp: "112/70", rr: 14 } },
    teaching: [
      "Non-contact collapse = cardiac arrest until proven otherwise.",
      "Gasping and slow jerky movements are cardiac arrest, not a fit.",
      "Compressions continue while the pads go on; hands off only for the analysis and the shock.",
      "No pulse check after a shock.",
    ],
  },
  {
    id: "commotio",
    title: "Ball to the chest",
    short: "Commotio cordis",
    minute: 37,
    setting: "First half. A free kick from the edge of the box; your team is on the touchline.",
    start: "c1",
    stages: [
      {
        id: "c1",
        text: "A defender blocks a hard shot with his chest, takes two steps and collapses. The referee waves play on, thinking he is winded.",
        vitals: { rhythm: "none" },
        choices: [
          { label: "Go on at once — a blow to the chest then collapse is an arrest until proven otherwise", ok: true, feedback: "Commotio cordis: a blow to the chest at the wrong moment of the heartbeat can trigger VF.", seconds: 15, next: "c2" },
          { label: "Give him a moment — players are often winded", ok: false, critical: true, feedback: "Winded players stay conscious. Collapse after a chest blow is cardiac arrest until proven otherwise.", seconds: 45, next: "c2" },
          { label: "Ask the referee to stop play, then walk on", ok: false, feedback: "Enter at once — and run.", seconds: 30, next: "c2" },
        ],
      },
      {
        id: "c2",
        text: "He is unresponsive and not breathing normally.",
        vitals: { rhythm: "none" },
        choices: [
          { label: "Start compressions — the contact does not change it", ok: true, feedback: "Treat it as any cardiac arrest: compressions now, the AED on the moment it arrives.", seconds: 10, next: "c3", effect: { cpr: true } },
          { label: "Hold the neck first — it was a collision", ok: false, critical: true, feedback: "A ball to the chest is not a neck mechanism. Do not delay CPR for neck precautions.", seconds: 40, next: "c3", effect: { cpr: true } },
          { label: "Feel the ribs for a fracture first", ok: false, feedback: "Rib injuries can wait; the arrest cannot.", seconds: 25, next: "c3", effect: { cpr: true } },
        ],
      },
      {
        id: "c3",
        text: "Compressions are running. Green kneels at the head with the AED.",
        vitals: { rhythm: "none", cpr: true },
        choices: [
          { label: "Pads on while compressions continue", ok: true, feedback: "Right — no pause for the pads.", seconds: 20, next: "c4" },
          { label: "Pause CPR so Green can work", ok: false, feedback: "Compressions continue while the pads go on.", seconds: 30, next: "c4" },
        ],
      },
      {
        id: "c4",
        text: "“Shock advised.” The AED is charging.",
        vitals: { rhythm: "vf" },
        choices: [
          { label: "Everyone clear, oxygen away — shock", ok: true, feedback: `${SHOCK_FEEDBACK} In commotio cordis, survival depends on the time to this shock.`, seconds: 10, next: "c5", effect: { shock: true } },
          { label: "Hold off — he is young and fit, it could be a faint", ok: false, critical: true, feedback: "The AED has found VF. Shock without delay.", seconds: 40, next: "c5", effect: { shock: true } },
        ],
      },
      {
        id: "c5",
        text: "After the shock and 2 more minutes of CPR, he coughs and opens his eyes.",
        vitals: { rhythm: "sinus", hr: 118, spo2: 93, bp: "106/66", rr: 16 },
        choices: [
          { label: "Oxygen, monitor, ambulance to the player — hospital and cardiology", ok: true, feedback: "Even after full recovery, commotio cordis needs hospital assessment.", seconds: 30, next: "end" },
          { label: "He is awake now — let him sit on the bench", ok: false, critical: true, feedback: "He has had a cardiac arrest. Hospital, every time.", seconds: 20, next: "end" },
        ],
      },
    ],
    ending: { text: "He leaves by ambulance, awake and talking, for cardiology review.", vitals: { rhythm: "sinus", hr: 98, spo2: 97, bp: "118/72", rr: 14 } },
    teaching: [
      "A blow to the chest followed by collapse is cardiac arrest until proven otherwise.",
      "Contact does not rule out a cardiac cause — and is no reason to delay CPR for the neck.",
      "Survival depends on early CPR and a shock within minutes.",
    ],
  },
  {
    id: "heat",
    title: "Confused in the heat",
    short: "Exertional heat stroke",
    minute: 74,
    setting: "A hot, humid afternoon; WBGT 30 °C at kick-off. Cooling breaks were taken.",
    start: "h1",
    stages: [
      {
        id: "h1",
        text: "A winger stumbles, sits down on the pitch and starts saying odd things. He does not know the score.",
        vitals: { rhythm: "sinus-fast", hr: 148 },
        choices: [
          { label: "Off the pitch with the team: suspect heat stroke, rectal temperature now", ok: true, feedback: "A change in thinking in the heat is heat stroke until proven otherwise.", seconds: 120, next: "h2" },
          { label: "Shade, a cold drink, and watch him", ok: false, critical: true, feedback: "Confusion in the heat is not heat exhaustion. Measure a rectal temperature and get ready to cool.", seconds: 480, next: "h2" },
          { label: "Ear thermometer: 38.4 °C — it's exhaustion", ok: false, critical: true, feedback: "Ear, mouth and forehead readings are unreliable after exercise. Only a rectal temperature counts.", seconds: 360, next: "h2" },
        ],
      },
      {
        id: "h2",
        text: "Rectal temperature 41.3 °C. Still confused. Pulse 148, blood pressure 100/58.",
        vitals: { rhythm: "sinus-fast", hr: 148, spo2: 96, bp: "100/58", rr: 26, temp: 41.3 },
        choices: [
          { label: "Cold-water immersion at the pitch now — and call the ambulance", ok: true, feedback: "Cool first, transport second.", seconds: 180, next: "h3", effect: { cool: "cwi" } },
          { label: "Ambulance to hospital now; cool on the way", ok: false, critical: true, feedback: "Cooling would only start at hospital, half an hour from now — far outside the window.", seconds: 180, next: "h3", effect: { cool: "transport" } },
          { label: "Ice packs at the neck, armpits and groin while you wait", ok: false, feedback: "Far too slow on its own. Immerse him.", seconds: 180, next: "h3", effect: { cool: "packs" } },
        ],
      },
      {
        id: "h3",
        text: "Cooling is under way. Ten minutes in, he says he feels cold and asks to get out.",
        vitals: { rhythm: "sinus-fast", hr: 128, spo2: 97, bp: "104/62", rr: 22, temp: 40.1 },
        choices: [
          { label: "Keep cooling: stir, add ice, rectal temperature every 5 minutes", ok: true, feedback: "Cool until about 39 °C rectal, whatever he says he feels.", seconds: 300, next: "h4" },
          { label: "Take him out — he is shivering", ok: false, critical: true, feedback: "Shivering is common in the tub. Stop at about 39 °C rectal, not by how cold he feels.", seconds: 120, next: "h4" },
          { label: "Give paracetamol to bring the temperature down", ok: false, critical: true, feedback: "Antipyretics do not work in heat stroke and can harm the liver. Keep cooling.", seconds: 120, next: "h4" },
        ],
      },
      {
        id: "h4",
        text: "Rectal temperature 39.0 °C. He is talking normally and knows where he is.",
        vitals: { rhythm: "sinus", hr: 104, spo2: 98, bp: "112/68", rr: 18, temp: 39.0 },
        choices: [
          { label: "Out of the water, dry, keep checking — then the ambulance", ok: true, feedback: "Stop at about 39 °C so he does not overcool, then transfer to hospital.", seconds: 120, next: "end" },
          { label: "Keep him in until he reaches 37 °C", ok: false, feedback: "Cooling past about 38.6–39 °C risks overcooling.", seconds: 300, next: "end" },
        ],
      },
    ],
    ending: { text: "He leaves by ambulance, talking, with his temperature monitored on the way.", vitals: { rhythm: "sinus", hr: 98, spo2: 98, bp: "116/70", rr: 16, temp: 38.7 } },
    teaching: [
      "Confusion or collapse in the heat is heat stroke until a rectal temperature says otherwise.",
      "Cool first, transport second: cold-water immersion, to about 39 °C within 30 minutes.",
      "No antipyretics; no return to play that day.",
    ],
  },
];

export const getCase = (id: string) => CASES.find((c) => c.id === id);

// ------------------------------------------------------------------ running a case
export type Step = { stage: string; choice: number; at: number; label: string; ok: boolean; critical: boolean; feedback: string };
export type Run = { caseId: CaseDef["id"]; stage: string; clock: number; steps: Step[]; cprAt: number | null; shockAt: number | null; cool: Effect["cool"] | null };

export function startRun(c: CaseDef): Run {
  return { caseId: c.id, stage: c.start, clock: 0, steps: [], cprAt: null, shockAt: null, cool: null };
}

/** Take choice `index` at the current stage. */
export function choose(c: CaseDef, run: Run, index: number): Run {
  const stage = c.stages.find((s) => s.id === run.stage);
  const ch = stage?.choices[index];
  if (!stage || !ch) return run;
  const clock = run.clock + ch.seconds;
  return {
    ...run,
    stage: ch.next,
    clock,
    steps: [...run.steps, { stage: stage.id, choice: index, at: clock, label: ch.label, ok: ch.ok, critical: Boolean(ch.critical), feedback: ch.feedback }],
    // CPR and the shock are timed at the end of the choice that delivers them
    cprAt: ch.effect?.cpr && run.cprAt == null ? clock : run.cprAt,
    shockAt: ch.effect?.shock && run.shockAt == null ? clock : run.shockAt,
    cool: ch.effect?.cool ?? run.cool,
  };
}

export const finished = (run: Run) => run.stage === "end";

/** Cooling rates and when cooling starts, for the heat case (see lib/heat.ts for the sources). */
const COOL = { cwi: { rate: 0.2, delay: 0 }, packs: { rate: 0.03, delay: 0 }, transport: { rate: 0.2, delay: 30 }, shade: { rate: 0.01, delay: 0 } } as const;

export type Outcome = { good: boolean; headline: string; detail: string; score: number; criticals: number; right: number; total: number };

/** How the case went, from the times of the actions that matter. */
export function outcome(c: CaseDef, run: Run): Outcome {
  const right = run.steps.filter((s) => s.ok).length;
  const criticals = run.steps.filter((s) => s.critical).length;
  const total = run.steps.length;
  if (c.id === "heat") {
    const m = COOL[run.cool ?? "shade"];
    const startMin = (run.steps[0]?.at ?? 0) / 60; // recognition and the rectal temperature
    const coolingFrom = startMin + 3 + m.delay; // into the tub about 3 minutes later
    const startTemp = 41.3;
    const above = coolingFrom + Math.max(0, startTemp - 40.5) / m.rate;
    const toTarget = coolingFrom + Math.max(0, startTemp - 39) / m.rate;
    const good = toTarget <= 30 && criticals === 0;
    return {
      good,
      headline: toTarget <= 30 ? `Below 39 °C about ${Math.round(toTarget)} minutes after the collapse` : `Below 39 °C only after about ${Math.round(toTarget)} minutes`,
      detail: `About ${Math.round(above)} minutes above 40.5 °C. ${toTarget <= 30 ? "Inside the 30-minute window." : "Outside the 30-minute window — the longer above 40.5 °C, the greater the damage."}`,
      score: Math.max(0, Math.round(100 - Math.max(0, toTarget - 15) * 3 - criticals * 15)),
      criticals,
      right,
      total,
    };
  }
  // cardiac arrest: about 8.5% of the chance lost each minute without CPR, 3.5% with it, until the shock
  const cpr = (run.cprAt ?? run.clock) / 60;
  const shock = (run.shockAt ?? run.clock) / 60;
  const chance = Math.max(0, Math.min(100, 100 - 8.5 * Math.min(cpr, shock) - 3.5 * Math.max(0, shock - cpr)));
  const good = shock <= 3 && criticals === 0;
  const mmss = (m: number) => `${Math.floor(m)}:${String(Math.round((m % 1) * 60)).padStart(2, "0")}`;
  return {
    good,
    headline: `First shock ${mmss(shock)} after the collapse`,
    detail: `Compressions from ${mmss(cpr)}. Estimated chance of survival: about ${Math.round(chance)}% of what an immediate shock would give.${shock <= 3 ? " Inside FIFA's 3-minute target." : " Later than FIFA's 3-minute target."}`,
    score: Math.round(chance - criticals * 10),
    criticals,
    right,
    total,
  };
}
