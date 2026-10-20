import { bagGroups } from "./bag-groups.ts";

/**
 * "Pack the bag": items from FIFA's emergency bag packing list go into the right tray or pouch; faulty kit —
 * the critical fails of Module 5 — goes in the replace bin. Plain functions, tested with `node --test`.
 */
export type BinId = "airway" | "circulation" | "wound" | "monitor" | "ppe" | "drugs" | "replace";

export const BINS: { id: BinId; title: string; where: string }[] = [
  { id: "airway", title: "Airway & breathing", where: "Left tray" },
  { id: "circulation", title: "Circulation & access", where: "Right tray" },
  { id: "monitor", title: "Monitor & collar", where: "Right tray" },
  { id: "wound", title: "Wound pouch", where: "Removable pouch" },
  { id: "drugs", title: "Drugs pouch", where: "Removable pouch" },
  { id: "ppe", title: "Protection", where: "Front of the bag" },
  { id: "replace", title: "Replace before kick-off", where: "Faulty or out of date" },
];

export type PackItem = { name: string; detail?: string; bin: BinId; fault?: string };

/** Faulty kit: each one is a critical fail if it goes into the bag. */
export const FAULTS: PackItem[] = [
  { name: "Defibrillator pads", detail: "expired last month", bin: "replace", fault: "Expired defibrillator pads are a critical fail." },
  { name: "AED", detail: "battery warning showing", bin: "replace", fault: "An AED with a failing battery is a critical fail." },
  { name: "Suction unit", detail: "battery flat", bin: "replace", fault: "No working suction is a critical fail." },
  { name: "Adrenaline 1:10 000", detail: "past its expiry date", bin: "replace", fault: "Expired emergency medication is a critical fail." },
  { name: "Bag valve mask", detail: "mask cracked", bin: "replace", fault: "No working bag-valve mask is a critical fail." },
];

/** Every good item on FIFA's packing list, with the tray or pouch it belongs in. */
export const GOOD_ITEMS: PackItem[] = bagGroups.flatMap((g) => g.items.map((it) => ({ name: it.name, detail: it.qty, bin: g.id as BinId })));

function shuffle<T>(a: readonly T[], rand: () => number): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** A round: one item from each tray or pouch, more good items to make up `good`, and `faults` faulty ones. */
export function makeRound(rand: () => number = Math.random, good = 9, faults = 2): PackItem[] {
  const picked: PackItem[] = [];
  for (const g of bagGroups) {
    const items = GOOD_ITEMS.filter((i) => i.bin === g.id);
    picked.push(items[Math.floor(rand() * items.length)]);
  }
  const rest = shuffle(
    GOOD_ITEMS.filter((i) => !picked.includes(i)),
    rand,
  ).slice(0, Math.max(0, good - picked.length));
  return shuffle([...picked, ...rest, ...shuffle(FAULTS, rand).slice(0, faults)], rand);
}

export type Placement = { item: PackItem; bin: BinId };

/** The score for a finished round. */
export function scoreRound(placements: Placement[]) {
  const right = placements.filter((p) => p.bin === p.item.bin).length;
  const criticalFails = placements.filter((p) => p.item.fault && p.bin !== "replace").map((p) => p.item);
  const wrongBin = placements.filter((p) => p.bin !== p.item.bin && !(p.item.fault && p.bin !== "replace"));
  return { right, total: placements.length, criticalFails, wrongBin, clean: right === placements.length };
}
