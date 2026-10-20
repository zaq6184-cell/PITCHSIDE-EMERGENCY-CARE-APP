/**
 * Spot the mistake: the 3D drills replay one step with a single planted error. The player finds who made it,
 * then what it was. Each mistake breaks a rule this guide teaches. Plain data, tested with `node --test`;
 * scene-3d.tsx draws the faults and components/mistake-game.tsx runs the game.
 */
export type Scenario = "arrest" | "spine";
type RoleId = "black" | "orange" | "red" | "blue" | "white" | "green";

export type Mistake = {
  id: string;
  scenario: Scenario;
  step: number;
  /** what the step is, for the caption */
  title: string;
  who: RoleId;
  what: string;
  /** two wrong descriptions for the "what" question */
  wrong: [string, string];
  why: string;
};

export const MISTAKES: Mistake[] = [
  {
    id: "orange-side",
    scenario: "arrest",
    step: 4,
    title: "Airway and oxygen",
    who: "orange",
    what: "Kneeling at the side of the head, not directly behind it",
    wrong: ["Squeezing the bag after every compression", "Working without the oxygen connected"],
    why: "Orange kneels directly behind the head, in line with the body — the position for the airway and for the neck.",
  },
  {
    id: "pads-pause",
    scenario: "arrest",
    step: 3,
    title: "AED and shock",
    who: "red",
    what: "Stops compressions while the pads go on",
    wrong: ["Compressing far too slowly", "Hands on the belly instead of the chest"],
    why: "Compressions continue while the pads go on; hands come off only for the analysis and the shock.",
  },
  {
    id: "touch-shock",
    scenario: "arrest",
    step: 3,
    title: "AED and shock",
    who: "blue",
    what: "Still touching the player at the shock",
    wrong: ["Kneeling at the wrong mark", "The oxygen cylinder left at the feet"],
    why: "Everyone clear before every shock — Green looks round the whole team before pressing the button.",
  },
  {
    id: "black-hands-on",
    scenario: "arrest",
    step: 2,
    title: "Chest compressions",
    who: "black",
    what: "Kneeling with hands on the player — no longer hands-off",
    wrong: ["Standing on the player's right", "Walking away to fetch the AED"],
    why: "Black stays hands-off where possible: keeping the overview and directing the team is the job.",
  },
  {
    id: "green-right",
    scenario: "arrest",
    step: 3,
    title: "AED and shock",
    who: "green",
    what: "Working from the player's right, crowding Red",
    wrong: ["The pads put on the back", "Shocking before the analysis"],
    why: "Green works at the head on the player's left, with the bag and AED open beside them; the right side is Red, Blue and White's.",
  },
  {
    id: "white-reach",
    scenario: "arrest",
    step: 4,
    title: "Airway and oxygen",
    who: "white",
    what: "Reaching in to the chest — not White's job",
    wrong: ["Kneeling too far from the legs", "Bringing the scoop in too early"],
    why: "If it is not your colour, do not reach in — only Black, the team leader, steps in when a job is not being done.",
  },
  {
    id: "orange-release",
    scenario: "spine",
    step: 4,
    title: "Collar on",
    who: "orange",
    what: "Lets go of the head while the collar goes on",
    wrong: ["Kneeling at the side of the head", "Counting the roll too early"],
    why: "Orange holds the head in line until the blocks and tape are on — a collar alone does not hold the neck.",
  },
  {
    id: "no-straps",
    scenario: "spine",
    step: 7,
    title: "Basket and lift",
    who: "black",
    what: "Calls the lift before the player is strapped",
    wrong: ["Calls the count too quietly", "Has the basket too far away"],
    why: "Straps, blocks and tape first, so player and scoop move as one unit — then the lift on Black's count.",
  },
];

export const getMistake = (id: string) => MISTAKES.find((m) => m.id === id);

/** A round of `n` different mistakes in a random order. */
export function mistakeRound(n = 6, rand: () => number = Math.random): Mistake[] {
  const a = [...MISTAKES];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

/** The three answers to "what was wrong?", in a random order. */
export function whatOptions(m: Mistake, rand: () => number = Math.random): string[] {
  const a = [m.what, ...m.wrong];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
