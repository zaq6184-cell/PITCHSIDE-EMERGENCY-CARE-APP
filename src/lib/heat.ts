/**
 * Heat illness: heat-risk zones from a WBGT reading, and a cooling model for exertional heat stroke
 * ("cool first, transport second"). Plain functions, tested with `node --test`; the page is routes/heat.tsx.
 *
 * Thresholds are the football bodies' own: FIFPRO (2023) calls for cooling breaks above WBGT 26 °C and for
 * delaying or rescheduling matches at higher readings; FIFA's long-standing rule made cooling breaks
 * mandatory in both halves above WBGT 32 °C. At the 2026 World Cup every match had a 3-minute hydration break
 * 22 minutes into each half, whatever the heat. The competition's own rules always decide.
 */
/** `label` is the whole phrase ("High risk"), so it reads the same wherever it shows — and translates as one. */
export type Zone = { id: "low" | "high" | "very" | "extreme"; from: number; label: string; actions: string[]; who: string };

export const ZONES: Zone[] = [
  {
    id: "low",
    from: -Infinity,
    label: "Lower risk",
    actions: ["Normal drink plan: before, at half-time and at stoppages.", "Shade and cold drinks at the bench.", "Know the signs — heat stroke can happen in milder weather too."],
    who: "Usual precautions",
  },
  {
    id: "high",
    from: 26,
    label: "High risk",
    actions: [
      "Cooling breaks around the 30th minute of each half.",
      "Ice towels, cold drinks and shade ready for every break.",
      "Cold-water immersion tub set up and filled before kick-off.",
      "Watch the players most at risk: just back from illness, not used to the heat, the hardest workers.",
    ],
    who: "FIFPRO: cooling breaks above WBGT 26 °C",
  },
  {
    id: "very",
    from: 28,
    label: "Very high risk",
    actions: [
      "FIFPRO advises delaying or rescheduling — raise it with the match officials and organisers.",
      "If play goes ahead: cooling breaks in both halves, the tub ready at the pitch, a cooling plan for every substitute.",
    ],
    who: "FIFPRO: consider delaying or rescheduling",
  },
  {
    id: "extreme",
    from: 32,
    label: "Extreme risk",
    actions: [
      "FIFA: cooling breaks mandatory in both halves; the organisers decide on suspending or cancelling.",
      "FIFPRO: matches and training should be rescheduled.",
    ],
    who: "FIFA's long-standing threshold: WBGT 32 °C",
  },
];

/** The zone for a WBGT reading (°C). */
export function zoneFor(wbgt: number): Zone {
  return [...ZONES].reverse().find((z) => wbgt >= z.from) ?? ZONES[0];
}

/** The World Cup 2026 rule: a fixed hydration break in each half, whatever the heat. */
export const WORLD_CUP_2026 = { minute: 22, length: 3 } as const;

// ------------------------------------------------------------------ cooling exertional heat stroke
export type MethodId = "cwi" | "taco" | "towels" | "fan" | "packs";
export type Method = { id: MethodId; name: string; short: string; rate: number; range?: [number, number] };

/**
 * Typical whole-body cooling rates in °C a minute, from published field and laboratory studies (ILCOR first-aid
 * review; NATA; SCCM). The evidence is low certainty and rates vary widely — the order is what matters.
 */
export const METHODS: Method[] = [
  { id: "cwi", name: "Cold-water immersion (tub, stirred)", short: "Cold-water tub", rate: 0.2, range: [0.15, 0.35] },
  { id: "taco", name: "Tarp-assisted cooling (ice water in a tarp)", short: "Tarp + ice water", rate: 0.14, range: [0.1, 0.17] },
  { id: "towels", name: "Ice-water towels, swapped every few minutes", short: "Ice towels", rate: 0.11 },
  { id: "fan", name: "Fan and water spray", short: "Fan + spray", rate: 0.07, range: [0.04, 0.15] },
  { id: "packs", name: "Ice packs at neck, armpits and groin", short: "Ice packs", rate: 0.03, range: [0.028, 0.036] },
];

export const START_TEMP = 41.5; // rectal, at collapse
export const TARGET_TEMP = 39; // cool to below about 39 °C (stop at 38.6–39 to avoid overcooling)
export const CRITICAL_TEMP = 40.5; // the longer above this, the greater the risk of organ damage
export const GOAL_MINUTES = 30; // below the target within 30 minutes of collapse
/** The pace the experts ask for (SCCM): at least 0.155 °C a minute. */
export const GOOD_RATE = 0.155;

/** Rectal temperature `t` minutes after collapse, when cooling at `rate` starts `delay` minutes in. */
export function tempAt(t: number, rate: number, delay: number, start = START_TEMP): number {
  if (t <= delay) return start;
  return Math.max(TARGET_TEMP - 0.3, start - rate * (t - delay)); // removed from the tub near the target
}

/** Minutes from collapse until the temperature is below the target. */
export function minutesToTarget(rate: number, delay: number, start = START_TEMP): number {
  return delay + (start - TARGET_TEMP) / rate;
}

/** Minutes spent above the critical 40.5 °C. */
export function minutesAboveCritical(rate: number, delay: number, start = START_TEMP): number {
  if (start <= CRITICAL_TEMP) return 0;
  return delay + (start - CRITICAL_TEMP) / rate;
}

export type Plan = { id: "site" | "transport"; label: string; delay: number; note: string };
export const PLANS: Plan[] = [
  { id: "site", label: "Cool first, at the pitch", delay: 3, note: "Into the tub about 3 minutes after the collapse." },
  { id: "transport", label: "Transport first", delay: 30, note: "Cooling only starts at hospital, about 30 minutes later." },
];
