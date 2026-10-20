/**
 * Spot the sign: a 3D player acts out a visible sign from FIFA FOCUS, the player names it, and learns what
 * FOCUS asks for — substitute and assess off the pitch, or a lower threshold for concern while the
 * assessment continues. Plain data, tested with `node --test`; the scene is components/concussion-scene-3d.tsx.
 */
export type SignId = "motionless" | "no-protect" | "tonic" | "seizure" | "incoordination" | "blank";
export type SignOutcome = "sub" | "watch";

export type Sign = { id: SignId; name: string; outcome: SignOutcome; what: string };

export const SIGNS: Sign[] = [
  { id: "motionless", name: "Lying motionless", outcome: "watch", what: "Down and not moving after the impact. FOCUS: observe it on approach — a reason for a lower threshold for concern." },
  { id: "no-protect", name: "No protective action", outcome: "sub", what: "Falls stiffly with no arms out to break the fall — the brain was not protecting the body." },
  { id: "tonic", name: "Tonic posturing", outcome: "sub", what: "Arms (and often legs) stiffen and lift, sometimes one arm up and one bent — straight after the impact." },
  { id: "seizure", name: "Seizure", outcome: "sub", what: "Rhythmic jerking of the arms and legs after the impact (an impact seizure)." },
  { id: "incoordination", name: "Motor incoordination", outcome: "sub", what: "Unsteady on getting up: stumbling, staggering, legs not doing what they should." },
  { id: "blank", name: "Blank / vacant look", outcome: "watch", what: "Staring, not responding to people around — FOCUS: a reason for a lower threshold for concern." },
];

export const OUTCOME_TEXT: Record<SignOutcome, string> = {
  sub: "Substitute and assess off the pitch.",
  watch: "Lower your threshold for concern and carry on with the assessment.",
};

export const getSign = (id: SignId) => SIGNS.find((s) => s.id === id) as Sign;

function shuffle<T>(a: readonly T[], rand: () => number): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Every sign once, in a random order. */
export const signRound = (rand: () => number = Math.random) => shuffle(SIGNS, rand);

/** Four names to choose from: the right one and three others. */
export function signOptions(id: SignId, rand: () => number = Math.random): Sign[] {
  const others = shuffle(
    SIGNS.filter((s) => s.id !== id),
    rand,
  ).slice(0, 3);
  return shuffle([getSign(id), ...others], rand);
}
