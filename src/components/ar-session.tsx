import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play, Repeat, RotateCw, ScanLine, Snail, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { PeapMarks } from "@/components/peap-marks";
import { SetPiece } from "@/components/scene-3d";
import { DEFAULT_HOLD_MS, LEAD_MS, REST_MIN_MS, SFX_MS, VOICE_GAP_MS, VOICE_MIN_MS } from "@/lib/drill-timeline";
import { type SfxName, say, sfx, startMetronome, stopMetronome, stopVoice, tap, useSoundPrefs } from "@/lib/sound";
import { spineCallouts, spineSteps } from "@/lib/spine-drill";
import { SPOTS } from "@/lib/spots";
import { panFrom } from "@/lib/view3d";
import { type Callout, callouts, drillCallouts } from "@/lib/voice";
import { workshop } from "@/lib/workshop";

type Scenario = "arrest" | "spine";

/** Floor detection: a gold ring where the team would stand; a tap on the screen places the team there. */
function Placer({ team, onPlace, onFound }: { team: React.RefObject<THREE.Group | null>; onPlace: () => void; onFound: (found: boolean) => void }) {
  const { gl, camera } = useThree();
  const reticle = useRef<THREE.Mesh>(null);
  const source = useRef<XRHitTestSource | null>(null);
  const ring = useMemo(() => new THREE.RingGeometry(0.16, 0.21, 40).rotateX(-Math.PI / 2), []);
  const placed = useRef(onPlace);
  const found = useRef(onFound);
  const seen = useRef(false);
  useEffect(() => {
    placed.current = onPlace;
    found.current = onFound;
  });
  useEffect(() => {
    const session = gl.xr.getSession();
    if (!session) return;
    let cancelled = false;
    void session
      .requestReferenceSpace("viewer")
      .then((space) => session.requestHitTestSource?.({ space }))
      .then((src) => {
        if (!cancelled && src) source.current = src;
      })
      .catch(() => {});
    const onSelect = () => {
      const r = reticle.current;
      const g = team.current;
      if (!r || !g || !r.visible) return;
      g.position.setFromMatrixPosition(r.matrix);
      // the team faces you: the player's feet towards you, as in the drill
      const dx = camera.position.x - g.position.x;
      const dz = camera.position.z - g.position.z;
      g.rotation.set(0, Math.atan2(dx, dz), 0);
      g.visible = true;
      placed.current();
    };
    session.addEventListener("select", onSelect);
    return () => {
      cancelled = true;
      session.removeEventListener("select", onSelect);
      source.current?.cancel();
      source.current = null;
    };
  }, [gl, camera, team]);
  useFrame((_, __, frame) => {
    const r = reticle.current;
    if (!r) return;
    const ref = gl.xr.getReferenceSpace();
    const hit = frame && source.current && ref ? frame.getHitTestResults(source.current)[0] : undefined;
    const pose = hit && ref ? hit.getPose(ref) : undefined;
    r.visible = Boolean(pose);
    if (pose) r.matrix.fromArray(pose.transform.matrix);
    // tell the page only when the floor is first found or lost
    if (Boolean(pose) !== seen.current) {
      seen.current = Boolean(pose);
      found.current(seen.current);
    }
  });
  return (
    <mesh ref={reticle} geometry={ring} matrixAutoUpdate={false} visible={false}>
      <meshBasicMaterial color="#c9a227" />
    </mesh>
  );
}

/**
 * Kit parked more than a metre below the feet (the scoop, the basket 2–3 lengths away) is left out, as in
 * the AR models: the team at work fits in a room. It comes back when a step brings it to the player.
 */
function HideParked({ team }: { team: React.RefObject<THREE.Group | null> }) {
  const ours = useRef(new Set<THREE.Object3D>());
  const at = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const g = team.current;
    if (!g) return;
    g.updateMatrixWorld();
    const beyond = (o: THREE.Object3D) => g.worldToLocal(o.getWorldPosition(at)).z > 2.0;
    g.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return;
      const far = beyond(o) || Boolean(o.parent && o.parent !== g && beyond(o.parent));
      if (far && o.visible) {
        o.visible = false;
        ours.current.add(o);
      } else if (!far && ours.current.has(o)) {
        o.visible = true;
        ours.current.delete(o);
      }
    });
  });
  return null;
}

/**
 * The scene's own clock, held still while paused and run at half speed in slow motion: it goes first each
 * frame (priority -1), so every pose that follows reads the adjusted time.
 */
function TimeControl({ rate }: { rate: React.RefObject<number> }) {
  useFrame((state, delta) => {
    state.clock.elapsedTime -= delta * (1 - rate.current);
  }, -1);
  return null;
}

/** Where the camera stands and looks, kept for placing each colour's voice to the left or the right. */
function Listener({ team, out }: { team: React.RefObject<THREE.Group | null>; out: React.RefObject<(role: string) => number> }) {
  const { camera } = useThree();
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const at = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const g = team.current;
    if (!g) return;
    camera.getWorldDirection(fwd);
    const cx = camera.position.x;
    const cz = camera.position.z;
    const fx = fwd.x;
    const fz = fwd.z;
    out.current = (role) => {
      const s = SPOTS.find((x) => x.id === role);
      if (!s) return 0;
      g.localToWorld(at.set(s.x, 0, s.z));
      return panFrom(at.x, at.z, cx, cz, fx, fz, 1.2);
    };
  });
  return null;
}

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/**
 * The set piece live in augmented reality (WebXR: Chrome on phones with Google Play Services for AR):
 * sweep the floor until the gold ring shows, tap to place the team at full size — or table-top size — and
 * play the drill: each step's call-outs with captions and the team moving, play and pause, slow motion,
 * every step in turn, and each colour's numbered mark on the floor.
 */
export default function ArSession({
  session,
  root,
  scenario,
  startStep,
  autoPlay = false,
  onEnd,
}: {
  session: XRSession;
  root: HTMLElement;
  scenario: Scenario;
  startStep: number;
  autoPlay?: boolean;
  onEnd: () => void;
}) {
  const team = useRef<THREE.Group>(null);
  const [placed, setPlaced] = useState(false);
  const [found, setFound] = useState(false);
  const [slow, setSlow] = useState(false);
  const [small, setSmall] = useState(false);
  const steps: readonly { n: number; title: string; hold?: number }[] = scenario === "spine" ? spineSteps : workshop.steps;
  const script = scenario === "spine" ? spineCallouts : drillCallouts;
  const [step, setStep] = useState(Math.max(0, Math.min(startStep, steps.length)));
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [halfSpeed, setHalfSpeed] = useState(false);
  const [auto, setAuto] = useState(autoPlay);
  const [caption, setCaption] = useState<Callout | null>(null);
  const prefs = useSoundPrefs();
  const cur = step > 0 ? steps[step - 1] : null;
  // the scene's time runs only once the team is on the floor, and not while paused
  const live = placed && playing;
  const rate = useRef(0);
  const speed = halfSpeed ? 0.5 : 1;
  rate.current = live ? speed : 0;
  const pan = useRef<(role: string) => number>(() => 0);
  const ctl = useRef({ live, speed, auto });
  ctl.current = { live, speed, auto };

  useEffect(() => {
    const end = () => onEnd();
    session.addEventListener("end", end);
    // taps on the buttons in the overlay should not also move the team
    const keep = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest?.("button")) e.preventDefault();
    };
    root.addEventListener("beforexrselect", keep);
    return () => {
      session.removeEventListener("end", end);
      root.removeEventListener("beforexrselect", keep);
      stopVoice();
      stopMetronome();
    };
  }, [session, root, onEnd]);

  // no floor after a while: show the tips
  useEffect(() => {
    if (found || placed) return setSlow(false);
    const t = window.setTimeout(() => setSlow(true), 9000);
    return () => window.clearTimeout(t);
  }, [found, placed]);

  useEffect(() => {
    team.current?.scale.setScalar(small ? 0.2 : 1);
  }, [small]);

  // each step's script, as the 3D drill player runs it (lib/drill-timeline.ts): call-outs with captions,
  // effects and cues, on the scene's own time — held while paused, stretched in slow motion
  useEffect(() => {
    if (!placed) return;
    let cancelled = false;
    setPhase(0);
    const untilLive = async () => {
      while (!ctl.current.live && !cancelled) await sleep(100);
    };
    const waitScene = async (ms: number) => {
      let left = ms;
      let last = performance.now();
      while (left > 0 && !cancelled) {
        await sleep(Math.min(100, Math.max(16, left)));
        const now = performance.now();
        if (ctl.current.live) left -= (now - last) * ctl.current.speed;
        last = now;
      }
    };
    const run = async () => {
      let spent = 0;
      const timed = async (ms: number) => {
        await waitScene(ms);
        spent += ms;
      };
      await timed(LEAD_MS);
      for (const id of script[step] ?? []) {
        await untilLive();
        if (cancelled) return;
        if (id === "cue") {
          setPhase((p) => p + 1);
        } else if (id.startsWith("wait:")) {
          await timed(Number(id.slice(5)) || 0);
        } else if (id.startsWith("sfx:")) {
          const name = id.slice(4) as SfxName;
          sfx(name, name === "siren" ? 0.35 : 0.6);
          await timed(SFX_MS);
        } else {
          const c = callouts[id];
          if (c) setCaption(c);
          const started = performance.now();
          await say(id, false, c ? pan.current(c.role) : 0);
          const heard = (performance.now() - started) * ctl.current.speed;
          spent += heard;
          if (heard < VOICE_MIN_MS) await timed(VOICE_MIN_MS - heard);
          await timed(VOICE_GAP_MS);
        }
      }
      if (cancelled) return;
      setCaption(null);
      if (ctl.current.auto) {
        await timed(Math.max((steps[step - 1]?.hold ?? DEFAULT_HOLD_MS) - spent, REST_MIN_MS));
        if (!cancelled && ctl.current.auto) setStep((v) => (v >= steps.length ? 1 : v + 1));
      }
    };
    void run();
    return () => {
      cancelled = true;
      stopVoice();
      setCaption(null);
    };
  }, [placed, step, script, steps]);

  // pausing cuts the voice off; the script waits at its next line
  useEffect(() => {
    if (!playing) stopVoice();
  }, [playing]);

  // the CPR rhythm at 110 a minute while compressions run — at normal speed only, never a slow beat
  const compressing = scenario === "arrest" && step >= 2 && step <= 4;
  useEffect(() => {
    if (!(compressing && live && speed === 1 && prefs.sfx)) return;
    startMetronome(110);
    return () => stopMetronome();
  }, [compressing, live, speed, prefs.sfx]);

  const go = (n: number) => {
    tap();
    setStep(Math.max(0, Math.min(steps.length, n)));
  };
  const btn = "grid size-11 place-items-center rounded-full bg-[#0b1f3a]/85 text-[#f7f4ee] active:scale-95";
  const chip = "inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#0b1f3a]/85 px-3.5 font-display text-sm font-semibold text-[#f7f4ee] active:scale-95";
  const pill = "rounded-2xl bg-[#0b1f3a]/85 px-3.5 py-2 text-center text-sm font-medium leading-snug text-[#f7f4ee]";
  const role = caption ? workshop.roles.find((r) => r.id === caption.role) : undefined;
  return (
    <>
      <div style={{ position: "fixed", left: 0, top: 0, width: 2, height: 2, opacity: 0, pointerEvents: "none" }} aria-hidden="true">
        <Canvas
          gl={{ alpha: true, antialias: true }}
          camera={{ near: 0.02, far: 40 }}
          onCreated={async ({ gl, scene }) => {
            scene.background = null;
            gl.xr.enabled = true;
            gl.xr.setReferenceSpaceType("local");
            try {
              await gl.xr.setSession(session);
            } catch {
              void session.end();
            }
          }}
        >
          <TimeControl rate={rate} />
          <hemisphereLight args={["#ffffff", "#5b6470", 1.1]} />
          <directionalLight position={[2, 5, 3]} intensity={1.6} />
          <Placer team={team} onPlace={() => setPlaced(true)} onFound={setFound} />
          <group ref={team} visible={false}>
            <PeapMarks />
            <SetPiece step={step} phase={phase} scenario={scenario} />
          </group>
          <HideParked team={team} />
          <Listener team={team} out={pan} />
        </Canvas>
      </div>
      {createPortal(
        <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-3 font-sans">
          <div className="pointer-events-auto flex items-center gap-2">
            <button type="button" aria-label="Previous step" className={btn} onClick={() => go(step - 1)}>
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <p className="min-w-0 flex-1 truncate rounded-full bg-[#0b1f3a]/90 px-3 py-2 text-center font-display text-sm font-semibold tracking-wide text-[#c9a227]">
              {cur ? `STEP ${cur.n} · ${cur.title.toUpperCase()}` : "THE TEAM IN PLACE"}
            </p>
            <button type="button" aria-label="Next step" className={btn} onClick={() => go(step + 1)}>
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <button type="button" aria-label="Leave AR" className={btn} onClick={() => void session.end()}>
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="pointer-events-auto flex flex-col items-center gap-2">
            {placed ? (
              <>
                {caption ? (
                  <p className="flex max-w-sm items-center gap-2 rounded-2xl bg-[#0b1f3a]/90 px-3 py-2 text-left text-sm leading-snug text-[#f7f4ee]" aria-live="polite">
                    {role ? (
                      <span className="shrink-0 rounded-full px-2 py-0.5 font-display text-xs font-bold tracking-wide" style={{ backgroundColor: role.color, color: role.text }}>
                        {role.name} {role.num}
                      </span>
                    ) : null}
                    <span>“{caption.text}”</span>
                  </p>
                ) : null}
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    aria-label={playing ? "Pause" : "Play"}
                    onClick={() => {
                      tap();
                      setPlaying((v) => !v);
                    }}
                    className="grid size-11 place-items-center rounded-full bg-[#c9a227] text-[#0b1f3a] active:scale-95"
                  >
                    {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
                  </button>
                  <button
                    type="button"
                    aria-pressed={halfSpeed}
                    onClick={() => {
                      tap();
                      setHalfSpeed((v) => !v);
                    }}
                    className={chip}
                  >
                    <Snail className="size-4" aria-hidden />
                    {halfSpeed ? "½ speed" : "Slow"}
                  </button>
                  <button
                    type="button"
                    aria-pressed={auto}
                    onClick={() => {
                      tap();
                      setAuto((v) => !v);
                      if (!auto && step === 0) setStep(1);
                    }}
                    className={chip}
                  >
                    <Repeat className="size-4" aria-hidden />
                    {auto ? "Playing all" : "Play all"}
                  </button>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      tap();
                      team.current?.rotateY(-Math.PI / 4);
                    }}
                    className={chip}
                  >
                    <RotateCw className="size-4" aria-hidden />
                    Turn
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      tap();
                      setSmall((v) => !v);
                    }}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#c9a227] px-3.5 font-display text-sm font-semibold text-[#0b1f3a] active:scale-95"
                  >
                    {small ? <Maximize className="size-4" aria-hidden /> : <Minimize className="size-4" aria-hidden />}
                    {small ? "Full size" : "Table top"}
                  </button>
                </div>
                <p className="text-xs text-[#f7f4ee] [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">Tap the floor to move the team · walk round it</p>
              </>
            ) : found ? (
              <p className={pill}>Floor found — tap the screen to place the team on the gold ring</p>
            ) : (
              <div className={`${pill} flex max-w-sm flex-col items-center gap-1`}>
                <span className="flex items-center gap-2 font-semibold">
                  <ScanLine className="ar-scan size-5 text-[#c9a227]" aria-hidden />
                  Finding the floor…
                </span>
                <span className="text-xs text-[#f7f4ee]/85">Hold the phone at chest height, pointing down, and move it slowly from side to side.</span>
                {slow ? (
                  <span className="text-xs text-[#f2c811]">
                    Still looking: turn on more light, aim at a floor with some pattern (a rug, tiles, wood) — plain, shiny floors
                    are hard to see — and step back to show more of it.
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>,
        root,
      )}
    </>
  );
}
