import { asset } from "@/lib/asset";

export type BagItem = {
  name: string;
  qty?: string;
};

export type BagGroup = {
  id: string;
  title: string;
  tray: string;
  items: BagItem[];
};

export const bag = {
  title: "FIFA Medical Emergency Bag",
  blurb:
    "A portable life-saving unit designed around human-factors ergonomics. It folds out to a flat table so every item is labelled and reachable.",
  greenNote: "Green brings the emergency care bag and the AED onto the field.",
  shell: "Rucksack outer shell — water-resistant membrane with an anti-microbial coating.",
  contact: {
    name: "Roisin McClory, Promote Medical",
    email: "roisin.mcclory@promotemedical.com",
    web: "https://www.promotemedical.com",
  },
  disclaimer:
    "FIFA Medical Emergency Bag packing list (factsheet). Check the bag in front of you — local stock may differ. Not a substitute for ALS certification or hospital protocol.",
  layout: [
    {
      side: "Left tray",
      text: "Airway and breathing. The airway section folds in on itself (concertina) to save space. Optional store for surgical airway kit.",
    },
    {
      side: "Right tray",
      text: "Defibrillator and circulation kit. Two removable pouches: wound materials, and emergency drugs.",
    },
  ],
  photos: {
    afc: { src: asset("/img/bag/afc-bag.jpg"), alt: "A navy pitchside emergency bag, packed and closed" },
    closed: { src: asset("/img/bag/fifa-closed.jpg"), alt: "FIFA Medical Emergency Bag closed" },
    open: { src: asset("/img/bag/fifa-open.jpg"), alt: "FIFA Medical Emergency Bag folded open" },
    trays: { src: asset("/img/bag/fifa-trays.jpg"), alt: "Labelled trays inside the FIFA emergency bag" },
    aed: { src: asset("/img/bag/aed.jpg"), alt: "Philips HeartStart FRx AED and red carry case" },
    batteryTab: {
      src: asset("/img/bag/battery-tab.jpg"),
      alt: "Green tab on the back of the Philips FRx for battery removal",
    },
    battery: { src: asset("/img/bag/battery.jpg"), alt: "Philips HeartStart FRx lithium battery pack" },
  },
} as const;

export const bagGroups: BagGroup[] = [
  {
    id: "airway",
    title: "Airway & breathing",
    tray: "Left tray",
    items: [
      { name: "Suction Hepa" },
      { name: "Bag valve mask" },
      { name: "NPA", qty: "sizes 6, 7, 8" },
      { name: "Guedel / OPA", qty: "sizes 2, 3, 4" },
      { name: "i-gel LMA", qty: "sizes 4, 5" },
      { name: "Magill forceps" },
      { name: "Lubricating jelly" },
      { name: "Trauma mask" },
      { name: "Nebuliser mask" },
      { name: "Pocket mask" },
      { name: "Spacer" },
    ],
  },
  {
    id: "circulation",
    title: "Circulation & access",
    tray: "Right tray",
    items: [
      { name: "Philips HeartStart FRx AED" },
      { name: "Giving set" },
      { name: "Cannula 14 g", qty: "×2" },
      { name: "Cannula 18 g", qty: "×2" },
      { name: "10 ml syringe", qty: "×2" },
      { name: "5 ml syringe", qty: "×2" },
      { name: "Needle 23 g", qty: "×5" },
      { name: "Needle 21 g", qty: "×5" },
      { name: "Vecafix", qty: "×4" },
      { name: "Tourniquet", qty: "×4" },
      { name: "Sterets", qty: "×8" },
    ],
  },
  {
    id: "wound",
    title: "Wound pouch",
    tray: "Right tray — removable",
    items: [
      { name: "Swab 5×5 cm", qty: "×2" },
      { name: "Swab 10×10 cm", qty: "×2" },
      { name: "Small scissors" },
      { name: "Tuff Cut shears" },
      { name: "Leukoplast 2.5 cm" },
      { name: "Finepore 2.5 cm" },
      { name: "Bronze suture" },
      { name: "Suture 2/0", qty: "×2" },
      { name: "Suture 4/0", qty: "×2" },
      { name: "Steristrips 6 mm", qty: "×2" },
      { name: "Steristrips 3 mm", qty: "×2" },
      { name: "Eyewash", qty: "×5" },
    ],
  },
  {
    id: "monitor",
    title: "Monitor & collar",
    tray: "Right tray",
    items: [
      { name: "Ambu Perfit adult collar" },
      { name: "Stethoscope" },
      { name: "Sats probe" },
      { name: "Blood pressure monitor" },
      { name: "Glucose meter" },
      { name: "Pentorch" },
      { name: "Peak flow" },
      { name: "Digital thermometer" },
    ],
  },
  {
    id: "ppe",
    title: "Protection",
    tray: "Bag",
    items: [
      { name: "Hand gel" },
      { name: "Aprons", qty: "×2" },
      { name: "Gloves medium", qty: "×4" },
      { name: "Gloves large", qty: "×4" },
      { name: "Protective spectacles" },
      { name: "Sharps bin 0.2 L" },
    ],
  },
  {
    id: "drugs",
    title: "Emergency drugs pouch",
    tray: "Right tray — removable · Green on Black’s order",
    items: [
      { name: "Adrenaline 1:10 000", qty: "10 ml prefilled ×1" },
      { name: "Emerade / Epi-Pen" },
      { name: "Atropine", qty: "3 mg prefilled" },
      { name: "Amiodarone", qty: "300 mg prefilled ×1" },
      { name: "GTN spray", qty: "×1" },
      { name: "Aspirin", qty: "300 mg or 75 mg tabs, total 900 mg" },
      { name: "Diazepam IV", qty: "10 mg in 2 ml ×1" },
      { name: "Diazepam rectal", qty: "5 mg tube ×1" },
      { name: "Hydrocortisone IV", qty: "100 mg ×1" },
      { name: "Salbutamol nebules", qty: "5 mg ×2" },
      { name: "Salbutamol inhaler", qty: "×1" },
      { name: "Chlorpheniramine", qty: "10 mg amp ×2" },
      { name: "Dextrose gel", qty: "×3" },
      { name: "Glucagon", qty: "prefilled ×1" },
      { name: "Prochlorperazine IM", qty: "12.5 mg ×1" },
      { name: "Ondansetron", qty: "IV or melts" },
      { name: "Lignocaine 1%", qty: "5 ml amps ×4" },
      { name: "Water or saline flush", qty: "10 ml ×4" },
    ],
  },
];

export const aedTravel = {
  device: "Philips HeartStart FRx AED with carry case",
  rules: [
    "The FRx is a portable medical electronic device. With its battery in, it goes in hand luggage only — it contains a lithium battery, and lithium batteries must not go in checked baggage.",
    "The red carry case lets you take the AED as hand luggage, separate from the FIFA Medical Emergency Bag.",
    "Preferred: AED + case as hand luggage. If you must check the AED, first remove the lithium battery from the back (green tab). The battery stays in your hand luggage; the AED can then be checked.",
    "The AED is fully off only when the battery is out. See page 16 of the FRx user manual for removal and insertion.",
    "A Material Safety Data Sheet (MSDS) is included with the AED if check-in staff ask for it.",
    "Lithium metal content is 5.04 g per battery. Air-safety rules (ICAO/IATA) allow a medical device battery over 2 g, up to 8 g, only with the airline's approval — ask for it when you book, and confirm again before you fly.",
  ],
};

export function filterBagGroups(query: string): BagGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return bagGroups;
  return bagGroups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          (it.qty && it.qty.toLowerCase().includes(q)) ||
          g.title.toLowerCase().includes(q) ||
          g.tray.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.items.length > 0);
}
