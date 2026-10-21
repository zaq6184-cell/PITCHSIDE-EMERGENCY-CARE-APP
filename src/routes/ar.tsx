import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Box, Check, ExternalLink, Footprints, Hand, Lightbulb, Move, ScanLine, ShieldAlert, Smartphone, Sun, Wifi, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ArButton } from "@/components/ar-button";
import { AppShell, JumpChips, Note, Panel, SectionLabel } from "@/components/workshop";
import { AR_STEPS, type ArDrill, clampStep, detectAr, modelFile } from "@/lib/ar";
import { AR_DRILL_NAME, arStepTitle } from "@/lib/ar-steps";
import { asset, imageSize } from "@/lib/asset";
import { tap } from "@/lib/sound";
import { cn } from "@/lib/utils";

type Search = { drill?: ArDrill; step?: number };

export const Route = createFileRoute("/ar")({
  component: ArPage,
  validateSearch: (s: Record<string, unknown>): Search => {
    const drill = s.drill === "spine" || s.drill === "arrest" ? s.drill : undefined;
    const step = Number(s.step);
    return { ...(drill ? { drill } : {}), ...(Number.isFinite(step) && s.step !== undefined ? { step: clampStep(drill ?? "arrest", step) } : {}) };
  },
  head: () => ({ meta: [{ title: "AR · the team in your room · Pitchside Emergency Care" }] }),
});

const noSubscribe = () => () => {};
const PLAY_AR = "https://play.google.com/store/apps/details?id=com.google.ar.core";
const ARCORE_PHONES = "https://developers.google.com/ar/devices";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <Panel>
        <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
          <SectionLabel>{title}</SectionLabel>
          {children}
        </div>
      </Panel>
    </section>
  );
}

/** Numbered instructions, each with a picture of the move. */
function Steps({ items }: { items: { icon: React.ComponentType<{ className?: string }>; text: React.ReactNode }[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-note text-gold-ink">
            <it.icon className="size-[18px]" />
            <span className="absolute -left-1 -top-1 grid size-4 place-items-center rounded-full bg-navy font-display text-[10px] font-bold text-gold">{i + 1}</span>
          </span>
          <span className="pt-1 text-sm leading-snug">{it.text}</span>
        </li>
      ))}
    </ol>
  );
}

const ext = { target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-0.5 font-semibold text-gold-ink underline-offset-2 hover:underline" } as const;

function ArPage() {
  const search = Route.useSearch();
  // the page is built without the query: a step named in a link switches on once the built page has
  // hydrated (no hydration mismatch); on visits from inside the app it is there from the first frame
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);
  const drill: ArDrill = (ready && search.drill) || "arrest";
  const step = ready && search.step !== undefined ? clampStep(drill, search.step) : 0;
  const navigate = useNavigate({ from: "/ar" });
  const pick = (d: ArDrill, s: number) => {
    tap();
    void navigate({ search: { drill: d, step: s }, replace: true, resetScroll: false });
  };
  // the instructions open on this phone's own system
  const [os, setOs] = useState<"android" | "ios">("android");
  useEffect(() => {
    void detectAr().then((s) => {
      if (!s.android && (s.quicklook || /iPhone|iPad|iPod/.test(navigator.userAgent))) setOs("ios");
    });
  }, []);

  const count = AR_STEPS[drill];
  return (
    <AppShell tab="drill">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">AUGMENTED REALITY</p>
            <h1 className="mt-0.5 font-display text-xl font-bold leading-tight">The team in your room</h1>
            <p className="mt-1 text-sm text-gold-soft">
              Put the medical team on the floor in front of you at full size — the same 3D team as the drills — and walk round each
              step of the set piece. Each colour's number is on the floor behind them.
            </p>
          </div>
          <figure>
            <img
              src={asset("/img/ar/ar-phone.webp")}
              alt="A phone held over a sports-hall floor, showing the 3D medical team doing CPR on the floor through its camera"
              {...imageSize("/img/ar/ar-phone.webp")}
              className="block h-auto w-full"
            />
            <figcaption className="px-3.5 py-2 text-[11px] leading-snug text-muted">What you see: the team on the floor through the phone's camera (illustration).</figcaption>
          </figure>
        </Panel>

        <JumpChips
          items={[
            { id: "ar-pick", label: "Choose a step" },
            { id: "ar-how", label: "How to use it" },
            { id: "ar-ready", label: "Before you start" },
            { id: "ar-help", label: "If it does not work" },
            { id: "ar-teach", label: "Teaching with AR" },
          ]}
        />

        <Section id="ar-pick" title="CHOOSE A STEP">
          <div role="tablist" aria-label="Which drill" className="grid grid-cols-2 gap-1 rounded-full bg-note p-1">
            {(["arrest", "spine"] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={drill === d}
                onClick={() => pick(d, 0)}
                className={cn("min-h-10 rounded-full px-2 font-display text-sm font-semibold tracking-wide", drill === d ? "bg-navy text-gold" : "text-heading")}
              >
                {AR_DRILL_NAME[d]}
              </button>
            ))}
          </div>
          <figure className="overflow-hidden rounded-xl bg-note">
            <img src={asset(modelFile(drill, step, "webp"))} alt="" width={720} height={480} className="block h-auto w-full" />
            <figcaption className="border-t border-line bg-paper px-3 py-2 font-display text-sm font-bold tracking-wide text-heading">
              {step > 0 ? `STEP ${step} OF ${count} · ` : ""}
              {arStepTitle(drill, step).toUpperCase()}
            </figcaption>
          </figure>
          <ArButton scenario={drill} step={step} help={false} />
          <div className="-mx-1 grid grid-cols-2 gap-2 min-[480px]:grid-cols-3" aria-label="Steps">
            {Array.from({ length: count + 1 }, (_, i) => i).map((i) => (
              <button
                key={i}
                type="button"
                aria-pressed={i === step}
                onClick={() => pick(drill, i)}
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border text-left transition-colors active:scale-[0.98]",
                  i === step ? "border-navy ring-2 ring-gold" : "border-line",
                )}
              >
                <img src={asset(modelFile(drill, i, "webp"))} alt="" width={720} height={480} loading="lazy" className="block h-auto w-full bg-note" />
                <span className="flex min-h-11 flex-col justify-center bg-paper px-2 py-1.5">
                  <span className="font-display text-[11px] font-semibold tracking-[0.12em] text-muted">{i === 0 ? "START" : `STEP ${i}`}</span>
                  <span className="text-xs font-semibold leading-tight text-heading">{arStepTitle(drill, i)}</span>
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section id="ar-how" title="HOW TO USE IT">
          <div role="tablist" aria-label="Your phone" className="grid grid-cols-2 gap-1 rounded-full bg-note p-1">
            {(
              [
                ["android", "Android"],
                ["ios", "iPhone and iPad"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={os === id}
                onClick={() => {
                  tap();
                  setOs(id);
                }}
                className={cn("min-h-10 rounded-full px-2 font-display text-sm font-semibold tracking-wide", os === id ? "bg-navy text-gold" : "text-heading")}
              >
                {label}
              </button>
            ))}
          </div>
          {os === "android" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Google's AR viewer</p>
              <Steps
                items={[
                  { icon: Box, text: <>Tap <b>See the team in your room (AR)</b>. Google's AR viewer opens over the app — the first time, allow the camera.</> },
                  { icon: ScanLine, text: <>Hold the phone at chest height, pointing at the floor, and sweep it slowly from side to side until the team appears.</> },
                  { icon: Footprints, text: <>The team stands on the floor at full size, the player's feet towards you. Walk round it: each colour's number is on the floor behind them — Black 1, Orange 2, Red 3, Blue 4, White 5, Green 6.</> },
                  { icon: Hand, text: <>Pinch with two fingers to make it smaller (desk size for a small group), drag with one finger to move it, twist two fingers to turn it.</> },
                  { icon: X, text: <>Tap the back arrow (top left) to come back, choose another step and open it the same way.</> },
                ]}
              />
              <Note>
                A phone that cannot do AR opens the team in 3D instead: drag to turn it, pinch to zoom.
              </Note>
              <p className="pt-1 text-xs font-semibold uppercase tracking-wider text-muted">Live AR with step controls · Chrome</p>
              <p className="text-sm leading-snug text-muted">
                On phones where Chrome can run AR itself, a second button keeps you in the app and steps through the drill in the room.
              </p>
              <Steps
                items={[
                  { icon: Footprints, text: <>Tap <b>Live AR with step controls</b> and allow the camera.</> },
                  { icon: ScanLine, text: <>Sweep the floor slowly until a gold ring appears, then tap the screen to put the team on it.</> },
                  { icon: Move, text: <>‹ › at the top step through the drill; <b>Turn</b> rotates the team; <b>Table top</b> shrinks it for a desk; tap the floor to move it.</> },
                  { icon: X, text: <>Tap ✕ to leave AR.</> },
                ]}
              />
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">AR Quick Look · Safari</p>
              <Steps
                items={[
                  { icon: Box, text: <>In Safari, tap <b>See the team in your room (AR)</b>. AR Quick Look opens.</> },
                  { icon: Smartphone, text: <>If the team shows on a white background, tap <b>AR</b> at the top.</> },
                  { icon: ScanLine, text: <>Move the phone slowly over the floor; the team appears at full size, with each colour's number on the floor behind them.</> },
                  { icon: Hand, text: <>Pinch to resize, drag to move, twist two fingers to turn. The round white button takes a photo.</> },
                  { icon: X, text: <>Tap ✕ (top left) to come back to the app.</> },
                ]}
              />
            </>
          )}
        </Section>

        <Section id="ar-ready" title="BEFORE YOU START">
          <ul className="flex flex-col gap-2 text-sm leading-snug">
            {[
              { icon: Move, text: "Space: about 4 × 5 m of clear floor for full size — or shrink the team to fit a desk." },
              { icon: Sun, text: "Light: a well-lit room. In the dark the phone cannot see the floor." },
              { icon: ScanLine, text: "Floor: matt, with some pattern — carpet, tiles, wood. Plain white, black or shiny floors are hard to follow." },
              { icon: Wifi, text: "Internet: each step downloads once — about 0.3 MB on Android, 0.7 MB on iPhone." },
              { icon: Smartphone, text: "Android: the guide open in Chrome, with the Google app and Google Play Services for AR. iPhone and iPad: Safari, iOS 12 or later." },
              { icon: ShieldAlert, text: "Safety: keep the floor clear, and look up from the screen when you walk." },
            ].map((r) => (
              <li key={r.text} className="flex gap-2.5">
                <r.icon className="mt-0.5 size-4 shrink-0 text-gold-ink" aria-hidden />
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="ar-help" title="IF IT DOES NOT WORK">
          <div className="flex flex-col divide-y divide-line">
            {[
              {
                q: "The button does nothing, or opens a web page",
                a: (
                  <>
                    Open the guide in Chrome — not inside WhatsApp, Instagram or Facebook (use ⋮ → Open in Chrome). Update the Google
                    app, and install or update{" "}
                    <a href={PLAY_AR} {...ext}>
                      Google Play Services for AR
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                    .
                  </>
                ),
              },
              {
                q: "It shows the team in 3D, but no AR",
                a: (
                  <>
                    The phone may not support Google's AR — check{" "}
                    <a href={ARCORE_PHONES} {...ext}>
                      Google's list of phones
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                    . You can still turn and zoom the team in 3D, or use the 3D drills in the app.
                  </>
                ),
              },
              { q: "The team never appears", a: "Turn on more light, move the phone more slowly, aim at a floor with some pattern, and step back so more of it is in view." },
              { q: "It is too big for the room", a: "Pinch to shrink it, or turn it so the player lies along the longest side of the room." },
              { q: "The team drifts or floats", a: "Sweep the floor a little longer before it appears, and avoid shiny floors and people walking through the view." },
              { q: "Nothing happens on an iPhone", a: "Use Safari: other browsers on iPhone may not open AR Quick Look." },
              { q: "On a laptop or desktop", a: "AR needs a phone or tablet camera: scan the QR code by the step with your phone." },
            ].map((x) => (
              <details key={x.q} className="group py-1">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-heading">
                  {x.q}
                  <span className="text-gold-ink transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="pb-2 text-sm leading-snug text-muted">{x.a}</p>
              </details>
            ))}
          </div>
        </Section>

        <Section id="ar-teach" title="TEACHING WITH AR">
          <ul className="flex flex-col gap-2 text-sm leading-snug">
            {[
              "Full size on the floor: each trainee kneels at their colour's numbered mark, beside their AR colour, and you step through the drill together.",
              "Table top on a desk: a quick briefing for a small group — turn it to show each side of the player.",
              "Step by step: open step 1, then ask what each colour does next before you open step 2.",
              "Spot the difference: compare the AR team with your own set-up at the touchline or in the medical room.",
              "Photos for your slides: take one in AR (iPhone: the round button; Android: a screenshot).",
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-[#1A7F45]" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <Note>
            <span className="inline-flex items-center gap-1 font-semibold text-heading">
              <Lightbulb className="size-3.5 text-gold-ink" aria-hidden />
              The layout:
            </span>{" "}
            the player lies on their back; Orange kneels directly behind the head, Green at the head on the player's left with the
            bag and AED, Red, Blue and White down the player's right, and Black — the team leader — stands on the left.
          </Note>
        </Section>
      </div>
    </AppShell>
  );
}
