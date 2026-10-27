import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, MonitorPlay, Smartphone } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { LoopClip } from "@/components/loop-clip";
import { AppShell, Note, Panel } from "@/components/workshop";
import { cardClip, cardPicture } from "@/lib/ar";
import { asset } from "@/lib/asset";
import { tap } from "@/lib/sound";
import { codeFromHash, isRoomCode } from "@/lib/team";

// the phone's side loads only once someone joins
const TeamPhone = lazy(() => import("@/components/team-drill").then((m) => ({ default: m.TeamPhone })));

export const Route = createFileRoute("/team")({
  component: TeamPage,
  head: () => ({ meta: [{ title: "Team drill on every phone · Pitchside Emergency Care" }] }),
});

function Loading() {
  return <div className="h-64 animate-pulse rounded-xl bg-paper shadow-card" aria-label="Loading" />;
}

function TeamPage() {
  const [code, setCode] = useState("");
  const [typed, setTyped] = useState("");
  // once the phone joins, its colour and the line to say come first: the introduction steps aside
  const [joined, setJoined] = useState(false);

  // a join link opens the join step — on arrival, or when one is opened while this page is already showing
  useEffect(() => {
    const read = () => {
      const c = codeFromHash(window.location.hash);
      if (c) setCode(c);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  return (
    <AppShell tab="drill" heading="Team drill on every phone">
      <div className="flex flex-col gap-3.5">
        {joined ? null : (
        <Panel>
          <div className="relative aspect-[3/2] overflow-hidden bg-[#447a3c]">
            <img src={asset(cardPicture("arrest", "all"))} alt="The six-colour team at work around the player, from the app's own 3D drill" width={720} height={480} className="block h-full w-full object-cover" />
            <LoopClip src={asset(cardClip("arrest", "all"))} />
          </div>
          <div className="bg-navy px-3.5 py-3 text-on-navy">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-gold">TEAM DRILL ON EVERY PHONE</p>
            <p className="mt-0.5 font-display text-xl font-bold leading-tight">Everyone plays their colour from their phone</p>
            <p className="mt-1 text-sm text-gold-soft">
              The instructor plays the 3D drill on a big screen. Each trainee takes a colour on their phone, which shows their part
              of each step, buzzes when their line is due and says it, so the six voices come from the six people.
            </p>
          </div>
        </Panel>
        )}

        {isRoomCode(code) ? (
          <Suspense fallback={<Loading />}>
            <TeamPhone code={code} onJoin={() => setJoined(true)} />
          </Suspense>
        ) : (
          <div className="flex flex-col gap-2.5">
            <Link to="/drill" hash="team" className="block active:scale-[0.99]">
              <Panel>
                <div className="flex items-center gap-3 px-3.5 py-3.5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy text-gold">
                    <MonitorPlay className="size-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold leading-tight text-heading">Run it on the drill screen</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">For the instructor: open the drill on the projector and start a team drill under it</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-gold-ink" aria-hidden />
                </div>
              </Panel>
            </Link>
            <Panel>
              <form
                className="flex flex-col gap-2 px-3.5 py-3.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const c = typed.trim().toUpperCase();
                  if (!isRoomCode(c)) return;
                  tap();
                  setCode(c);
                }}
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold text-on-gold">
                    <Smartphone className="size-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold leading-tight text-heading">Join a team drill</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">Scan the QR code under the drill — or type its code</span>
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
          the phones connect directly to the drill screen. Public relays only introduce them, and that introduction is encrypted with
          the room code. Only the colour each phone takes goes to the screen, for this drill, and nothing is stored. Some strict
          networks block direct connections — if a phone cannot join, try mobile data.
        </Note>
      </div>
    </AppShell>
  );
}
