import { asset } from "@/lib/asset";

export { type BagGroup, type BagItem, bagGroups, filterBagGroups } from "./bag-groups.ts";

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
    packed: { src: asset("/img/bag/pitchside-bag.jpg"), alt: "A navy pitchside emergency bag, packed and closed" },
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
