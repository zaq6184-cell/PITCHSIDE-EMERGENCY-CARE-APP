import type { Step } from "@/lib/workshop";

/**
 * The FIFA set piece for a suspected cervical spine injury, as a 3D drill with the team's call-outs.
 * Steps follow the cervical spine page and Module 4: MILS → A-c-B-C-D-E → collar → log roll onto the
 * scoop → straps, blocks, tape → basket and lift with six. `hold` is how long "Play all" stays on a step.
 */
export type DrillStep = Step & { hold?: number };

export const spineSteps: DrillStep[] = [
  {
    n: 1,
    title: "Hold the head",
    time: "At once",
    who: ["black", "orange", "red"],
    hold: 8500,
    lines: [
      "Orange kneels directly behind the head and holds it in line (MILS), talking to the player.",
      "Black leads hands-off and makes sure the ambulance is called. Red starts A-c-B-C-D-E.",
    ],
  },
  {
    n: 2,
    title: "Airway and oxygen",
    time: "A — with the neck held",
    who: ["orange", "red", "blue"],
    hold: 10000,
    lines: [
      "Orange: jaw thrust if experienced, without moving the neck. Red: airway adjunct or trauma mask if needed.",
      "Blue: oxygen at 15 L/min to the trauma mask.",
    ],
  },
  {
    n: 3,
    title: "Breathing, circulation, disability",
    time: "Hands On 1, 2, 3",
    who: ["red", "orange"],
    hold: 11000,
    lines: [
      "Red: one look, then 2 hands on 3 places — breathing, then circulation (pulse), then AVPU, pupils, movement and feeling.",
      "Midline neck tenderness: the spine cannot be cleared, so the player leaves in a collar on a scoop.",
    ],
  },
  {
    n: 4,
    title: "Size and fit the collar",
    time: "Orange keeps hold",
    who: ["red", "orange", "green", "white"],
    hold: 10000,
    lines: [
      "Red sizes and fits the collar while Orange keeps holding the head, then checks that the mouth still opens.",
      "The scoop comes up from below the feet and is laid alongside, on the player's left.",
    ],
  },
  {
    n: 5,
    title: "Log roll onto the scoop",
    time: "On Orange's count",
    who: ["orange", "red", "blue", "white", "green"],
    hold: 19000,
    lines: [
      "Orange gives the count. Red takes the chest, Blue the pelvis, White the legs; Green slides the scoop in from the far side.",
      "With a split scoop, a gentle 15–20° tilt to each side is enough; a long board needs the log roll.",
    ],
  },
  {
    n: 6,
    title: "Straps, blocks, tape",
    time: "Then release",
    who: ["red", "blue", "white", "green", "orange"],
    hold: 13500,
    lines: [
      "Straps chest → pelvis → legs, the first strap over the sternum. Then head blocks fixed to the scoop, then tape.",
      "Only now does Orange let go of the head.",
    ],
  },
  {
    n: 7,
    title: "Basket and lift",
    time: "Six people",
    who: ["black", "orange", "red", "blue", "white", "green"],
    hold: 16000,
    lines: [
      "Lift the scoop a little, slide the basket under, lower the scoop into it.",
      "Six people lift on Black's count, Orange at the head. Reassess after every move.",
    ],
  },
];

/**
 * What is said in each step, in order. "cue" moves the 3D team on to its next action (Orange takes the
 * head, the roll, the release, the lift); "wait:ms" leaves time for the hands to do the work first.
 */
export const spineCallouts: Record<number, string[]> = {
  1: ["black-s1", "cue", "orange-s1"],
  2: ["wait:2000", "red-s1", "blue-1"],
  3: ["wait:6000", "red-s3"],
  4: ["wait:2600", "red-s2", "white-1"],
  5: ["orange-2", "blue-3", "white-2", "orange-3", "cue"],
  6: ["wait:3500", "white-3", "cue", "wait:2500", "orange-s2", "cue"],
  7: ["wait:1500", "cue", "wait:4200", "black-3", "cue"],
};
