import { asset } from "@/lib/asset";

/**
 * AI-generated header pictures for the six skill modules: kit on a floodlit pitch, no people, no marks. Each has a
 * quiet silent loop made from it (Google Flow, Omni 1.1 Flash: grass, fabric and floodlight flare stir; mist asked of
 * the models came out as smoke), played on the module's page under the picture's own slow drift. The list keeps stills.
 */
const alts: Record<string, string> = {
  "1": "Six training bibs in the role colours — black, orange, red, blue, white and green — laid in a row on a floodlit pitch",
  "2": "An AED with its pads and a bag-valve mask on the grass of a floodlit pitch",
  "3": "Stethoscope, pulse oximeter, pen torch, gloves and an oxygen mask laid out on a floodlit pitch",
  "4": "Spinal board with head blocks and a cervical collar on the grass of a floodlit pitch",
  "5": "An open emergency backpack with colour-coded pouches and an oxygen cylinder on a floodlit pitch",
  "6": "A pen torch, a stopwatch and a blank pocket card on a lanyard, on the grass of a floodlit pitch",
};

export function moduleCover(id: string) {
  const alt = alts[id];
  if (!alt) return undefined;
  return {
    src: asset(`/img/modules/module-${id}.webp`),
    small: asset(`/img/modules/module-${id}-sm.webp`),
    video: asset(`/video/module-${id}.mp4`),
    alt,
  };
}
