import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ChevronLeft, ChevronRight, Maximize, Minimize, RotateCw, ScanLine, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { PeapMarks } from "@/components/peap-marks";
import { SetPiece } from "@/components/scene-3d";
import { spineSteps } from "@/lib/spine-drill";
import { tap } from "@/lib/sound";
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
 * The set piece live in augmented reality (WebXR: Chrome on phones with Google Play Services for AR):
 * sweep the floor until the gold ring shows, tap to place the team at full size — or table-top size — turn
 * it, and step through the drill with each colour's numbered mark on the floor.
 */
export default function ArSession({ session, root, scenario, startStep, onEnd }: { session: XRSession; root: HTMLElement; scenario: Scenario; startStep: number; onEnd: () => void }) {
  const team = useRef<THREE.Group>(null);
  const [placed, setPlaced] = useState(false);
  const [found, setFound] = useState(false);
  const [slow, setSlow] = useState(false);
  const [small, setSmall] = useState(false);
  const steps = scenario === "spine" ? spineSteps : workshop.steps;
  const [step, setStep] = useState(Math.max(0, Math.min(startStep, steps.length)));
  const cur = step > 0 ? steps[step - 1] : null;
  // the neck drill's last step: the basket at the player, lifted on Black's count
  const phase = scenario === "spine" && step === 7 ? 2 : 0;

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

  const btn = "grid size-11 place-items-center rounded-full bg-[#0b1f3a]/85 text-[#f7f4ee] active:scale-95";
  const pill = "rounded-2xl bg-[#0b1f3a]/85 px-3.5 py-2 text-center text-sm font-medium leading-snug text-[#f7f4ee]";
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
          <hemisphereLight args={["#ffffff", "#5b6470", 1.1]} />
          <directionalLight position={[2, 5, 3]} intensity={1.6} />
          <Placer team={team} onPlace={() => setPlaced(true)} onFound={setFound} />
          <group ref={team} visible={false}>
            <PeapMarks />
            <SetPiece step={step} phase={phase} scenario={scenario} />
          </group>
          <HideParked team={team} />
        </Canvas>
      </div>
      {createPortal(
        <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-3 font-sans">
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous step"
              className={btn}
              onClick={() => {
                tap();
                setStep((v) => Math.max(0, v - 1));
              }}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <p className="min-w-0 flex-1 truncate rounded-full bg-[#0b1f3a]/90 px-3 py-2 text-center font-display text-sm font-semibold tracking-wide text-[#c9a227]">
              {cur ? `STEP ${cur.n} · ${cur.title.toUpperCase()}` : "THE TEAM IN PLACE"}
            </p>
            <button
              type="button"
              aria-label="Next step"
              className={btn}
              onClick={() => {
                tap();
                setStep((v) => Math.min(steps.length, v + 1));
              }}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <button type="button" aria-label="Leave AR" className={btn} onClick={() => void session.end()}>
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="pointer-events-auto flex flex-col items-center gap-2">
            {placed ? (
              <>
                <p className={pill}>Tap the floor to move the team · walk round it</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      tap();
                      team.current?.rotateY(-Math.PI / 4);
                    }}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#0b1f3a]/85 px-3.5 font-display text-sm font-semibold text-[#f7f4ee] active:scale-95"
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
              </>
            ) : found ? (
              <p className={pill}>Floor found — tap the screen to place the team on the gold ring</p>
            ) : (
              <div className={`${pill} flex max-w-sm flex-col items-center gap-1`}>
                <span className="flex items-center gap-2 font-semibold">
                  <ScanLine className="ar-scan size-5 text-[#c9a227]" aria-hidden />
                  Finding the floor…
                </span>
                <span className="text-xs text-[#f7f4ee]/85">
                  Hold the phone at chest height, pointing down, and move it slowly from side to side.
                </span>
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
