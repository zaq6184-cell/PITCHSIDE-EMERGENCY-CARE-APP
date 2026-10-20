import { type RoleId, voiceId, workshop } from "@/lib/workshop";

/**
 * Questions built straight from the role cards — what each colour brings, says and does — shared by
 * "Who does what?" and the live class quiz.
 */
export type Question = { prompt: string; text: string; answer: RoleId; voice?: string };

const NAMES = /\b(black|orange|red|blue|white|green)\b/i;

/** Questions come straight from the role cards: what each colour brings, says and does. */
export function questionPool(): Question[] {
  const qs: Question[] = [];
  for (const r of workshop.roles) {
    qs.push({ prompt: "Who brings this onto the pitch?", text: r.bring, answer: r.id });
    r.say.forEach((t, i) => qs.push({ prompt: "Who says this?", text: `“${t}”`, answer: r.id, voice: voiceId(r, i) }));
    [...r.arrest, ...r.trauma, ...r.both]
      .filter((t) => !NAMES.test(t) && !/^Bring /.test(t))
      .forEach((t) => qs.push({ prompt: "Whose job is this?", text: t, answer: r.id }));
  }
  return qs;
}

export function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
