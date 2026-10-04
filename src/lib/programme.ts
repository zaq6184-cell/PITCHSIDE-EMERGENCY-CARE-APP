import { asset } from "@/lib/asset";

export type EventTab = "programme" | "speakers" | "venue" | "team";

export type SpeakerId =
  | "mahathar"
  | "harikrishna"
  | "gurcharan"
  | "massey"
  | "zoran"
  | "peter"
  | "celeste"
  | "jeffrey"
  | "zohreh"
  | "fenton"
  | "alzamani"
  | "arshad"
  | "ahmad"
  | "vinotha";

export type SessionKind =
  | "reg"
  | "talk"
  | "break"
  | "ceremony"
  | "interactive"
  | "lunch"
  | "skills"
  | "sim";

export type Session = {
  start: string;
  end: string;
  topic: string;
  speakerId?: SpeakerId;
  speakerLabel?: string;
  kind: SessionKind;
};

export type Speaker = {
  id: SpeakerId;
  name: string;
  honorific: string;
  country: string;
  title: string;
  org: string;
  bio: string;
  photo: string;
};

export const EVENT_START_MS = Date.parse("2026-10-03T07:30:00+08:00");
export const EVENT_END_MS = Date.parse("2026-10-04T17:00:00+08:00");

export const programme = {
  name: "HKL’s Sports-Emergency Football Medicine Workshop 2026",
  short: "SEFM HKL 2026",
  datesLabel: "3–4 October 2026",
  days: [
    { id: "d1", date: "2026-10-03", label: "Saturday 3 Oct", tag: "Lectures" },
    { id: "d2", date: "2026-10-04", label: "Sunday 4 Oct", tag: "Skills & simulation" },
  ],
  venue: {
    hall: "Dewan Perdana",
    building: "Hospital Tunku Azizah",
    aka: "Hospital Wanita & Kanak-Kanak",
    city: "Kuala Lumpur",
    maps: "https://maps.app.goo.gl/GGHKjksbyddbquPF9",
    lobbyMaps: "https://maps.app.goo.gl/tt5tSdHozG9TYDbm9",
    mrtMaps: "https://share.google/uaRRONcZrM8lCoyKg",
  },
  quote: {
    text: "Education is for improving the lives of others and for leaving your community and world better than you found it.",
    by: "Marian Wright Edelman",
  },
} as const;

export const speakers: Speaker[] = [
  {
    id: "mahathar",
    name: "Mahathar Abd Wahab",
    honorific: "Datuk Dr.",
    country: "Malaysia",
    title: "Director General, Ministry of Health Malaysia",
    org: "Consultant Emergency Medicine Physician",
    photo: asset("/img/event/speakers/mahathar.jpg"),
    bio: "Datuk Dr. Mahathar Abd Wahab is the Director General of the Ministry of Health Malaysia and a distinguished consultant emergency medicine physician. Appointed as DG in 2025, he draws on decades of clinical experience, including his tenure as Head of the Emergency and Trauma Department at Hospital Kuala Lumpur. His leadership focuses on advancing national healthcare resilience, clinical governance, and frontline services.",
  },
  {
    id: "harikrishna",
    name: "Harikrishna K. Ragavan Nair",
    honorific: "Prof. Dato' Dr.",
    country: "Malaysia",
    title: "Director, Hospital Kuala Lumpur",
    org: "Wound care · President, World Union of Wound Healing Societies",
    photo: asset("/img/event/speakers/harikrishna.jpg"),
    bio: "Prof. Dato' Dr. Harikrishna K. Ragavan Nair is the Director of Hospital Kuala Lumpur and specialises in wound care management. He leads major international organisations, serving as President of the World Union of Wound Healing Societies. During his tenure at HKL he has modernised hospital operations through healthcare digitalisation, facility upgrades, and nationally recognised quality initiatives.",
  },
  {
    id: "gurcharan",
    name: "Gurcharan Singh",
    honorific: "Dato' Dr.",
    country: "Malaysia",
    title: "Chairman, AFC Medical Committee",
    org: "Member, FIFA Medical Committee",
    photo: asset("/img/event/speakers/gurcharan.jpg"),
    bio: "Dato' Dr. Gurcharan Singh, commonly known as Dato' Guru, is a senior sports medicine physician with over 35 years of involvement in sports medicine and anti-doping programmes globally. He is a Consultant Sports Medicine Physician, Chairman of the AFC Medical Committee, and a member of the FIFA Medical Committee.",
  },
  {
    id: "massey",
    name: "Andrew Massey",
    honorific: "Dr.",
    country: "Northern Ireland",
    title: "FIFA Medical Director",
    org: "FIFA Medical Subdivision",
    photo: asset("/img/event/speakers/massey.jpg"),
    bio: "Andrew Massey joined FIFA in 2020, having worked at Liverpool FC for the previous 7 years as Head of Medical Services. At FIFA he leads the Medical Subdivision. His current projects look at strategies to improve the physical and mental health of footballers globally and provide frameworks for clubs, member associations and confederations to deliver optimal medical care — and to encourage football participation.",
  },
  {
    id: "zoran",
    name: "Zoran Bahtijarević",
    honorific: "Dr.",
    country: "Croatia",
    title: "UEFA Chief Medical Officer",
    org: "UEFA Medical Unit, Switzerland",
    photo: asset("/img/event/speakers/zoran.jpg"),
    bio: "Dr. Zoran is a Croatian medical doctor who currently resides in Switzerland, where he serves as UEFA’s Chief Medical Officer. Originating from Zagreb, he built an extensive clinical background with 30 years as a paediatric surgeon and 20 years in elite sports medicine as the official team doctor for the Croatian National Football Team. He now directs UEFA’s medical unit and overall healthcare strategy, overseeing player health policies, injury research, and emergency health initiatives across European football.",
  },
  {
    id: "peter",
    name: "Peter Dzendrowskyj",
    honorific: "Dr.",
    country: "United Kingdom",
    title: "FIFA Medical Officer / Aspetar",
    org: "Intensive care & anaesthesia",
    photo: asset("/img/event/speakers/peter.jpg"),
    bio: "Born and educated in England, Peter finished his dual intensive care and anaesthesia training in New Zealand. He then worked in South Auckland for many years before moving to Qatar. Out of hospital he teaches around the world with the BASIC critical care group, running courses in hospitals and pre-hospital settings, mostly in low-resource environments. He has worked in aero-medical retrievals, at Wembley Stadium, the Rugby World Cup, IAAF World Championships, and trained medical teams for the FIFA World Cup — including pitchside.",
  },
  {
    id: "celeste",
    name: "Celeste Geertsema",
    honorific: "Dr.",
    country: "New Zealand",
    title: "FIFA Medical Officer / Aspetar",
    org: "Sports physician · major event coverage",
    photo: asset("/img/event/speakers/celeste.jpg"),
    bio: "Dr. Celeste Geertsema is a sports physician whose career focuses on major international event coverage and supporting athletes in maximising human performance. Her experience includes working at ten FIFA World Cups, the Summer and Winter Olympic Games, the Commonwealth Games, World Championships in Athletics, Handball and Swimming, and several other international sporting events in 17 countries.",
  },
  {
    id: "jeffrey",
    name: "Jeffrey Jeswant Dillon",
    honorific: "Prof. Dato' Seri Dr.",
    country: "Malaysia",
    title: "Senior Consultant Cardiothoracic Surgeon, IJN",
    org: "Director, Cardiovascular Sports & Fitness, National Heart Institute",
    photo: asset("/img/event/speakers/jeffrey.jpg"),
    bio: "Prof. Dato' Seri Dr. Jeffrey Jeswant Dillon is a Senior Consultant Cardiothoracic Surgeon and Director of Cardiovascular Sports & Fitness at the National Heart Institute Malaysia. He is Mayo Clinic-trained and serves as President of MATCVS, a Board Director for the National Sports Institute, and a SEAGF Medical Committee member. He was Malaysia’s cycling team doctor at the Paris 2024 Olympics, specialising in complex valve reconstruction, minimally invasive cardiac surgery, and sports cardiology.",
  },
  {
    id: "zohreh",
    name: "Zohreh Haratian",
    honorific: "Dr.",
    country: "IR Iran",
    title: "FIFA Doctor & AFC Medical Officer",
    org: "FIFA / AFC Medical Centre of Excellence",
    photo: asset("/img/event/speakers/zohreh.jpg"),
    bio: "Dr. Zohreh Haratian is an Iranian sports medicine specialist serving as a FIFA Doctor and AFC Medical Officer since 2013. She heads both the Iran Football League Organization’s Medical Department and the FIFA and AFC Medical Centre of Excellence. Named the AFC Best Young Medical Officer from 2015 to 2019, she remains a key figure in Asian and international football healthcare.",
  },
  {
    id: "fenton",
    name: "Fenton De Souza",
    honorific: "Dr.",
    country: "India",
    title: "FIFA Match Doctor",
    org: "Emergency medicine · AFC since 2016",
    photo: asset("/img/event/speakers/fenton.jpg"),
    bio: "Dr. Fenton is an Emergency Medicine Physician based in Goa, India, with 14 years of clinical experience. He serves as Director of an emergency medical and repatriation service, leading a team of 60 staff and a fleet of 10 Advanced Life Support ambulances. Deeply involved in sports medicine, he has worked with the Asian Football Confederation since 2016 and served as a FIFA Match Doctor since 2022.",
  },
  {
    id: "alzamani",
    name: "Alzamani Mohammad Idrose",
    honorific: "Datuk Dr.",
    country: "Malaysia",
    title: "Head of Emergency Department, Hospital Kuala Lumpur",
    org: "Immediate Past President, College of Emergency Physicians Malaysia",
    photo: asset("/img/event/speakers/alzamani.jpg"),
    bio: "Datuk Dr. Alzamani Mohammad Idrose is Head of the Emergency Department at Hospital Kuala Lumpur and Immediate Past President of the College of Emergency Physicians, Malaysia. He holds a PhD in Sports Science focusing on high-altitude medicine alongside fellowships in emergency critical care and ultrasound. A former personal physician to His Majesty the 14th Agong, his expertise spans disaster management, wilderness emergencies, and sports critical care.",
  },
  {
    id: "arshad",
    name: "Arshad Puji",
    honorific: "Dr.",
    country: "Malaysia",
    title: "Head of Sports Medicine Unit, Hospital Kuala Lumpur",
    org: "Past President, Malaysian Association of Sports Medicine (2024–2026)",
    photo: asset("/img/event/speakers/arshad.jpg"),
    bio: "Dr. Arshad Puji is a Consultant Sports Medicine Physician and Head of the Sports Medicine Unit at Hospital Kuala Lumpur. He previously served as Medical Director at the National Sports Institute and Chief Medical Officer for Malaysian contingents at the SEA, Asian, and Olympic Games. His clinical expertise focuses on ultrasound-guided musculoskeletal procedures, interventional pain management, and return-to-sports rehabilitation. He is also the Past President of the Malaysian Association of Sports Medicine (2024–2026).",
  },
  {
    id: "ahmad",
    name: "Ahmad Ibrahim Kamal Batcha",
    honorific: "Dr.",
    country: "Malaysia",
    title: "Deputy Head of Emergency and Trauma, Hospital Kuala Lumpur",
    org: "President, Kuala Lumpur Trauma Care Society",
    photo: asset("/img/event/speakers/ahmad.jpg"),
    bio: "Dr. Ahmad Ibrahim Bin Kamal Batcha is Deputy Head of Emergency and Trauma at Hospital Kuala Lumpur and President of the Kuala Lumpur Trauma Care Society. Fellowship-trained at Royal London Hospital with an MSc in Trauma Sciences (Distinction), he specialises in emergency trauma systems and resuscitation protocols. His sports and event medical coverage includes the 2017 SEA Games and VVIP medical teams.",
  },
  {
    id: "vinotha",
    name: "Vinotha Genisan",
    honorific: "Dr.",
    country: "Malaysia",
    title: "Sports Medicine Specialist, Hospital Kuala Lumpur",
    org: "National classifier, para-athletics",
    photo: asset("/img/event/speakers/vinotha.jpg"),
    bio: "Dr. Vinotha Genisan is a dedicated Sports Medicine Specialist. She earned her MBBS from Melaka-Manipal Medical College before a Master’s in Sports Medicine at the University of Malaya. Since 2014 she has been an integral part of Hospital Kuala Lumpur, supporting the recovery and performance of countless athletes. She has served as team physician or tournament doctor at SUKMA, Para SUKMA, SEA Games, Badminton Asia, and more. As a national classifier for para-athletics, she is deeply involved in advancing adaptive sports.",
  },
];

export const day1: Session[] = [
  { start: "07:30", end: "08:30", topic: "Registration", kind: "reg" },
  {
    start: "08:30",
    end: "08:50",
    topic: "Emergency action plan & medical set-piece",
    speakerId: "celeste",
    kind: "talk",
  },
  {
    start: "08:50",
    end: "09:10",
    topic: "Sudden cardiac arrest on the field of play",
    speakerId: "peter",
    kind: "talk",
  },
  {
    start: "09:10",
    end: "09:30",
    topic: "Sudden cardiac arrest — lessons learnt!",
    speakerId: "zoran",
    kind: "talk",
  },
  {
    start: "09:30",
    end: "09:50",
    topic: "RTP after SCA — making the appropriate decisions",
    speakerId: "jeffrey",
    kind: "talk",
  },
  {
    start: "09:50",
    end: "10:10",
    topic: "Concussion — evaluation on the field of play",
    speakerId: "massey",
    kind: "talk",
  },
  {
    start: "10:10",
    end: "10:30",
    topic: "Significance of integrative care in a competitive sports environment — are we equipped?",
    speakerId: "mahathar",
    kind: "talk",
  },
  { start: "10:30", end: "11:00", topic: "Coffee / tea break", kind: "break" },
  { start: "11:00", end: "12:00", topic: "Opening ceremony", kind: "ceremony" },
  {
    start: "12:00",
    end: "12:20",
    topic: "Keeping sports clean of doping — prevention & TUEs",
    speakerId: "gurcharan",
    kind: "talk",
  },
  {
    start: "12:20",
    end: "12:40",
    topic: "Management of wounds post-match",
    speakerId: "harikrishna",
    kind: "talk",
  },
  {
    start: "12:40",
    end: "13:00",
    topic: "Interactive session",
    speakerLabel: "All speakers",
    kind: "interactive",
  },
  { start: "13:00", end: "14:00", topic: "Luncheon", kind: "lunch" },
  {
    start: "14:00",
    end: "14:20",
    topic: "The medical bag — a set of complete essentials",
    speakerId: "zohreh",
    kind: "talk",
  },
  {
    start: "14:20",
    end: "14:40",
    topic: "Medical emergencies on the field of play",
    speakerId: "fenton",
    kind: "talk",
  },
  {
    start: "14:40",
    end: "15:00",
    topic: "Stadium emergencies & prevention",
    speakerId: "alzamani",
    kind: "talk",
  },
  {
    start: "15:00",
    end: "15:30",
    topic: "Interactive session",
    speakerLabel: "All speakers",
    kind: "interactive",
  },
  {
    start: "15:30",
    end: "15:50",
    topic: "Role of radiology & MSK injury diagnosis",
    speakerId: "ahmad",
    kind: "talk",
  },
  {
    start: "15:50",
    end: "16:10",
    topic: "Hamstring injuries: grading, pitfalls and care",
    speakerId: "arshad",
    kind: "talk",
  },
  {
    start: "16:10",
    end: "16:30",
    topic: "Injuries in male & female football players — etiological differences",
    speakerId: "vinotha",
    kind: "talk",
  },
  {
    start: "16:30",
    end: "17:00",
    topic: "Interactive session / closing remarks",
    speakerId: "alzamani",
    speakerLabel: "All speakers / Datuk Dr. Alzamani",
    kind: "interactive",
  },
];

export const day2: Session[] = [
  { start: "07:30", end: "08:00", topic: "Registration", kind: "reg" },
  {
    start: "08:00",
    end: "08:30",
    topic: "Briefing on workshop & grouping",
    speakerId: "ahmad",
    kind: "talk",
  },
  {
    start: "08:30",
    end: "10:30",
    topic: "Emergency action plan skill stations",
    speakerLabel: "Facilitators",
    kind: "skills",
  },
  { start: "10:30", end: "11:00", topic: "Coffee / tea break", kind: "break" },
  {
    start: "11:00",
    end: "13:00",
    topic: "Emergency action plan skill stations",
    speakerLabel: "Facilitators",
    kind: "skills",
  },
  { start: "13:00", end: "14:00", topic: "Luncheon", kind: "lunch" },
  {
    start: "14:00",
    end: "16:30",
    topic: "Scenario-based simulation",
    speakerLabel: "Facilitators",
    kind: "sim",
  },
  {
    start: "16:30",
    end: "17:00",
    topic: "Closing ceremony",
    speakerId: "alzamani",
    kind: "ceremony",
  },
];

export const parking = [
  {
    id: "hta",
    name: "Hospital Tunku Azizah multilevel parking",
    hint: "Closest to Dewan Perdana — park here first.",
    photo: asset("/img/event/venue/hta.jpg"),
    maps: "https://maps.app.goo.gl/GGHKjksbyddbquPF9",
  },
  {
    id: "ortho",
    name: "HKL Orthopaedic Clinic parking",
    hint: "Klinik Ortopedik — short walk across the campus.",
    photo: asset("/img/event/venue/ortho.jpg"),
    maps: "https://www.google.com/maps/search/?api=1&query=Klinik+Ortopedik+Hospital+Kuala+Lumpur",
  },
  {
    id: "takraw",
    name: "Akademi Sepak Takraw Malaysia carpark",
    hint: "Overflow lot beside the sepak takraw hall.",
    photo: asset("/img/event/venue/takraw.jpg"),
    maps: "https://www.google.com/maps/search/?api=1&query=Akademi+Sepak+Takraw+Malaysia+Kuala+Lumpur",
  },
];

export const committee = [
  {
    role: "Patrons",
    names: [
      "Datuk Dr. Mahathar Abd Wahab",
      "Prof. Dato' Dr. Harikrishna K.R. Nair",
      "Datuk Dr. Alzamani Md Idrose",
      "Dr. Siti Hawa Tahir",
      "Dr. Arshad Puji",
    ],
  },
  { role: "Chairperson", names: ["Dr. Kamaljeet Singh"] },
  { role: "Co-chair", names: ["Dr. Ahmad Ibrahim Kamal Batcha"] },
  { role: "Secretary", names: ["Dr. Vinotha Genisan"] },
  { role: "Assistant secretary", names: ["Pn. Norzehan Binti Masri"] },
  { role: "Treasurer", names: ["Dr. Pabrinder Kaur"] },
  {
    role: "Scientific committee",
    names: [
      "Dato' Dr. Gurcharan Singh",
      "Dr. Kamaljeet Singh",
      "Dr. Ahmad Ibrahim Kamal Batcha",
      "Dr. Hafiz Syarbaini Mansor",
    ],
  },
  { role: "Programme book", names: ["Dr. Kamil Norzam"] },
  {
    role: "Miscellaneous",
    names: ["Department of Emergency Medicine", "Department of Orthopaedics & Traumatology"],
  },
];

const logo = (file: string) => asset(`/img/event/sponsors/${file}.png`);

export const sponsors = {
  platinum: [{ name: "ZOLL", logo: logo("zoll") }],
  gold: [{ name: "medsyn — The Orthopaedic Device Company", logo: logo("medsyn") }],
  silver: [
    { name: "Primo Orthocare", logo: logo("primo") },
    { name: "medispec", logo: logo("medispec") },
    { name: "Medi Trump Sdn Bhd", logo: logo("meditrump") },
    { name: "CIMed Healthcare", logo: logo("cimed") },
    { name: "PhilosMed", logo: logo("philosmed") },
    { name: "Humedical", logo: logo("humedical") },
    { name: "Reliance Medical", logo: logo("reliance") },
    { name: "WFL World Football Legends", logo: logo("wfl") },
  ],
};

const SPEAKER_IDS: SpeakerId[] = speakers.map((s) => s.id);

export function isSpeakerId(id: string): id is SpeakerId {
  return (SPEAKER_IDS as string[]).includes(id);
}

export function getSpeaker(id: string): Speaker | undefined {
  return speakers.find((s) => s.id === id);
}

export function displayName(s: Speaker): string {
  return `${s.honorific} ${s.name}`;
}

export function sessionStartMs(date: string, hhmm: string): number {
  return Date.parse(`${date}T${hhmm}:00+08:00`);
}

export function currentSession(now = Date.now()): { date: string; session: Session } | null {
  for (const [date, list] of [
    ["2026-10-03", day1],
    ["2026-10-04", day2],
  ] as const) {
    for (const s of list) {
      const a = sessionStartMs(date, s.start);
      const b = sessionStartMs(date, s.end);
      if (now >= a && now < b) return { date, session: s };
    }
  }
  return null;
}

export function talksForSpeaker(id: SpeakerId): { dayLabel: string; date: string; session: Session }[] {
  const out: { dayLabel: string; date: string; session: Session }[] = [];
  for (const s of day1) {
    if (s.speakerId === id) out.push({ dayLabel: "Sat 3 Oct", date: "2026-10-03", session: s });
  }
  for (const s of day2) {
    if (s.speakerId === id) out.push({ dayLabel: "Sun 4 Oct", date: "2026-10-04", session: s });
  }
  return out;
}
