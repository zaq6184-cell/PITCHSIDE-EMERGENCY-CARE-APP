# Pitchside Emergency Care

A free, phone-first study guide to pitchside emergency care in football, built around FIFA's medical set piece: the six colour roles, sudden cardiac arrest, the primary survey, cervical spine injury, concussion assessment and the emergency care bag.

**Open on a phone:** [https://zaq6184-cell.github.io/PITCHSIDE-EMERGENCY-CARE-APP/](https://zaq6184-cell.github.io/PITCHSIDE-EMERGENCY-CARE-APP/)

Developed by the Sports-Emergency Football Medicine team, HKL.

It installs as an app on phones and computers, works offline once saved, and has a dark mode. Sound is off until you turn it on.

## What is in it

- **Roles** — Black, Orange, Red, Blue, White and Green: where to stand, what to bring, what to do and what to say
- **Skills** — five modules: FIFA PEAP and roles, cardiac arrest, primary survey, immobilisation, emergency care bag
- **Drill** — the cardiac arrest drill in six steps, with a 3D team to watch or step through
- **Tools** — 10-second carry timer and a CPR rhythm trainer (100–120 per minute)
- **Rules** — the golden rules at a glance
- **Films** — links to FIFA's films, and films from other publishers (UEFA Medical, U.S. Soccer, airway skills) that play in the app
- **Test yourself** — a role quiz and a "place the team" game
- Also: FIFA Emergency Care Bag list and AED travel, sudden cardiac arrest, pitchside care, cervical spine injury and FIFA FOCUS concussion pages

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

```bash
npm run typecheck
npm test
```

Public site (GitHub Pages): `npm run build:pages`; in `.output/public` copy `_shell.html` to `404.html` (and to `index.html` if it is missing) and add an empty `.nojekyll`; run `npm run sw` to write the service worker; then publish `.output/public` to the `gh-pages` branch. After adding or changing pictures in `public/img`, run `npm run image-sizes`.

## Stack

TanStack Start (React), Tailwind CSS v4, Vite, three.js for the 3D team.

No login and nothing collected. The clinical content follows FIFA's published documents; do not invent protocol.

## Licence

The original material (summaries, diagrams, logo and title cards) may be used free of charge for non-commercial teaching, with credit. FIFA's protocols, documents, images and films belong to FIFA; other films belong to their publishers. This guide is not affiliated with or endorsed by FIFA.
