import { asset } from "@/lib/asset";
import type { MedicalId } from "@/lib/medical";

/**
 * AI-generated scene pictures (Higgsfield) for the case simulator, the page headers and the medical emergency
 * cards, in the same style as the role pictures. A case picture shows the moment before the first decision, so it
 * never gives the answer away; the cooling picture and the medical cards' pictures show the technique the page
 * teaches (whole body in stirred iced water with the head held; aspirin offered for chest pain; the auto-injector into
 * the thigh; the inhaler through a spacer; glucose gel, with no sports drink, as the FIFA manual warns they hold too
 * little sugar; the head cushioned, not restrained; back blows from behind; a chaperone present). Brand logos removed.
 */
/** `video`: a short silent loop of the same scene (Higgsfield image-to-video), played over the picture where motion is welcome. */
export type ScenePic = { src: string; alt: string; video?: string };

const pic = (name: string, alt: string): ScenePic => ({ src: asset(`/img/scenes/${name}.webp`), alt });
/** A medical card's picture with its animated loop. */
const card = (name: string, alt: string): ScenePic => ({ ...pic(name, alt), video: asset(`/video/${name}.mp4`) });
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
export const HANDOVER_PIC = pic(
  "handover",
  "At the open doors of an ambulance beside a floodlit pitch, the team leader in a black bib reads the handover from his phone to two paramedics, one writing on a clipboard, while the player lies awake on the trolley under a blanket",
);

export const ENVIRONMENT_PIC = pic(
  "env-cold-altitude",
  "A mountain stadium at dusk, snowy peaks behind the floodlights: a medic wraps a shivering player in a purple kit in a foil blanket while a second medic clips a pulse oximeter onto his finger",
);

/** One picture per medical emergency card, each showing the card's key action (960 × 540: they sit inside a card). */
export const MEDICAL_PICS: Record<MedicalId, ScenePic> = {
  chest: card(
    "medical-chest",
    "A pale, sweating coach in his fifties sits on the team bench with a hand pressed to the centre of his chest, while a medic kneeling in front of him offers an aspirin tablet, the defibrillator case beside them",
  ),
  female: card(
    "medical-female",
    "In a quiet treatment room a female player in a purple kit lies on a couch under a blanket while a female doctor checks the pulse at her wrist and a second member of staff stands by as a chaperone",
  ),
  anaphylaxis: card(
    "medical-anaphylaxis",
    "A medic in a green bib presses an adrenaline auto-injector into the thigh of a player in a purple kit who lies flat with a red rash on his neck, while a second medic phones for the ambulance",
  ),
  asthma: card(
    "medical-asthma",
    "A breathless player in a purple kit sits on the bench and breathes in through a spacer from his reliever inhaler, while a medic kneels in front of him counting the puffs on her fingers",
  ),
  hypo: card(
    "medical-hypo",
    "A pale, sweaty player in a purple kit sits on the grass while a medic kneels beside him, offering glucose gel and holding a blood glucose meter",
  ),
  seizure: card(
    "medical-seizure",
    "A player in a purple kit lies on the grass; a medic in an orange bib cushions his head on a folded towel without holding him down, and a second medic times it on her watch",
  ),
  choking: card(
    "medical-choking",
    "A choking player in a purple kit leans forward with a hand at his throat while a medic standing behind him supports his chest and gives back blows to his upper back with the heel of her hand",
  ),
};
