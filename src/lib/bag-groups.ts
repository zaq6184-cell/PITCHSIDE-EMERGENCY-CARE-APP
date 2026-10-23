/** FIFA Medical Emergency Bag packing list, tray by tray (pure data, so the games can be tested with `node --test`). */
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
    tray: "Right tray — removable · Green on Black's order",
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
