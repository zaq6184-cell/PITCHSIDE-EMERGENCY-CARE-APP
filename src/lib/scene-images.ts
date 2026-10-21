import { asset } from "@/lib/asset";

/**
 * AI-generated scene pictures (Higgsfield) for the case simulator and the page headers, in the same style
 * as the role pictures. A case picture shows the moment before the first decision, so it never gives the
 * answer away; the cooling picture shows the technique the heat page teaches (whole body in stirred iced
 * water, the head held). Brand logos removed.
 */
export type ScenePic = { src: string; alt: string };

const pic = (name: string, alt: string): ScenePic => ({ src: asset(`/img/scenes/${name}.webp`), alt });
/** A case's picture also comes small, for the list of cases. */
const casePic = (name: string, alt: string) => ({ ...pic(name, alt), small: asset(`/img/scenes/${name}-sm.webp`) });

export const CASE_PICS: Record<"vf" | "commotio" | "heat", ScenePic & { small: string }> = {
  vf: casePic("case-vf", "An evening match under floodlights: a player in a purple kit lies face down, alone, while other players and the referee turn towards him"),
  commotio: casePic("case-commotio", "A player in a purple kit falls backwards, his hands at his chest, as the ball rebounds after striking him in the chest"),
  heat: casePic("case-heat", "A hot, hazy afternoon match: a flushed, sweating player in a purple kit stumbles with a hand on his head while a teammate holds his arm and waves for help"),
};

export const HEAT_PIC = pic(
  "heat-cooling",
  "Cold-water immersion at the pitch side: a player lies in a tub of iced water up to the neck, one medic holding his head, another stirring the water",
);
export const LIVE_PIC = pic("live-quiz", "Medical staff on a training course answering a live quiz on their phones, a chart of the answers on the screen behind them");
export const SCORER_PIC = pic(
  "scorer",
  "An instructor with a tablet scores a trainee in a red bib giving chest compressions on a manikin, while trainees in other colours wait their turn",
);
