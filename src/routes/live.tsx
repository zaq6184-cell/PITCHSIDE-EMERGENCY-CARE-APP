import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, MonitorPlay, Smartphone } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { ScenePicture } from "@/components/scene-picture";
import { AppShell, Note, Panel } from "@/components/workshop";
import { codeFromHash, isRoomCode } from "@/lib/live";
import { LIVE_PIC } from "@/lib/scene-images";
import { tap } from "@/lib/sound";

// the room code needs a browser, so the quiz itself loads only once someone hosts or joins
const LiveHost = lazy(() => import("@/components/live-quiz").then((m) => ({ default: m.LiveHost })));
const LivePlayer = lazy(() => import("@/components/live-quiz").then((m) => ({ default: m.LivePlayer })));

export const Route = createFileRoute("/live")({
  component: LivePage,
  head: () => ({ meta: [{ title: "Live class quiz · Pitchside Emergency Care" }] }),
});

function Loading() {
  return <div className="h-64 animate-pulse rounded-xl bg-paper shadow-card" aria-label="Loading" />;
}

function LivePage() {
  const [mode, setMode] = useState<"choose" | "host" | "join">("choose");
  const [code, setCode] = useState("");
  const [typed, setTyped] = useState("");

  // a join link opens the join form — on arrival, or when one is opened while this page is already showing
  useEffect(() => {
    const read = () => {
      const c = codeFromHash(window.location.hash);
      if (c) {
        setCode(c);
        setMode("join");
      }
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  return (
    <AppShell tab="home" heading="Live class quiz">
      <div className="flex flex-col gap-3.5">
        <Panel>
          <ScenePicture pic={LIVE_PIC} />
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">LIVE CLASS QUIZ</p>
            <p className="mt-0.5 font-display text-xl font-bold leading-tight">Everyone answers from their phone</p>
            <p className="mt-1 text-sm text-gold-soft">
              The instructor's screen shows a QR code; trainees scan it, then tap a colour for each question. The room's answers
              appear as a chart, and a leaderboard closes the round.
            </p>
          </div>
        </Panel>

        {mode === "host" ? (
          <Suspense fallback={<Loading />}>
            <LiveHost />
          </Suspense>
        ) : mode === "join" && isRoomCode(code) ? (
          <Suspense fallback={<Loading />}>
            <LivePlayer code={code} />
          </Suspense>
        ) : (
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                tap();
                setMode("host");
              }}
              className="block text-left active:scale-[0.99]"
            >
              <Panel>
                <div className="flex items-center gap-3 px-3.5 py-3.5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy text-gold">
                    <MonitorPlay className="size-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold leading-tight text-heading">Run a quiz on this screen</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">For the instructor: a laptop or tablet on the projector</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-gold-ink" aria-hidden />
                </div>
              </Panel>
            </button>
            <Panel>
              <form
                className="flex flex-col gap-2 px-3.5 py-3.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const c = typed.trim().toUpperCase();
                  if (!isRoomCode(c)) return;
                  tap();
                  setCode(c);
                  setMode("join");
                }}
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold text-on-gold">
                    <Smartphone className="size-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold leading-tight text-heading">Join a quiz</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">Scan the QR code on the screen — or type its code</span>
                  </span>
                </span>
                <div className="flex gap-2">
                  <input
                    name="room-code"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="ROOM CODE"
                    autoCapitalize="characters"
                    autoComplete="off"
                    aria-label="Room code"
                    className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-cream px-3 font-display text-xl font-bold tracking-[0.3em] text-heading outline-none focus:border-gold"
                  />
                  <button
                    type="submit"
                    disabled={!isRoomCode(typed.trim().toUpperCase())}
                    className="inline-flex min-h-12 items-center gap-1 rounded-xl bg-navy px-4 font-display text-base font-semibold tracking-wide text-gold active:scale-95 disabled:opacity-40"
                  >
                    Join
                  </button>
                </div>
              </form>
            </Panel>
          </div>
        )}

        <Note>
          <span className="font-semibold text-heading">How it connects: </span>
          the phones connect directly to the instructor's screen. Public relays only introduce them, and that introduction is
          encrypted with the room code. Names and answers stay in this quiz and are not stored. Some strict networks block direct
          connections — if a phone cannot join, try mobile data.
        </Note>
      </div>
    </AppShell>
  );
}
