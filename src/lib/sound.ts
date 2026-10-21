import { useSyncExternalStore } from "react";
import { asset } from "@/lib/asset";

/**
 * Sound for the guide: effects, spoken call-outs, a CPR rhythm click, stadium ambience and music that suits
 * each page. Everything is ON by default; browsers only allow sound after the first tap or key press, so it
 * starts then. Either switch remembers the person's choice on this device only. Files load when first needed.
 */
export type SfxName = "whistle" | "correct" | "wrong" | "whoosh" | "cheer" | "shock" | "siren";
export type SoundPrefs = { sfx: boolean; music: boolean };
/** The music for a page: Home's theme, a calm study loop, the drill at CPR tempo, the quiz — or none (Tools). */
export type MusicScene = "theme" | "study" | "drill" | "quiz" | "none";

const KEY = "pec-sound";
const DEFAULTS: SoundPrefs = { sfx: true, music: true };
let prefs: SoundPrefs = DEFAULTS;
let loaded = false;
let unlocked = false;
const listeners = new Set<() => void>();

// the first of these that the browser counts as a real interaction lets sound start
const UNLOCK_EVENTS = ["pointerdown", "pointerup", "touchend", "click", "keydown"] as const;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<SoundPrefs>;
    prefs = { sfx: v.sfx ?? DEFAULTS.sfx, music: v.music ?? DEFAULTS.music };
  } catch {
    prefs = DEFAULTS;
  }
  for (const type of UNLOCK_EVENTS) window.addEventListener(type, unlock, true);
  document.addEventListener("visibilitychange", () => {
    applyMusic();
    if (document.visibilityState !== "visible") {
      stopMetronome();
      stopVoice();
    }
  });
  // fetch the music once the page itself has loaded; some browsers (an installed app, a site visited
  // often) then even allow it to start before the first tap
  const warm = () =>
    window.setTimeout(() => {
      // only where the browser allows sound before a tap; elsewhere the first tap starts it (and the
      // browser is not asked for audio it would refuse, with a console warning)
      if (!soundAllowedNow()) return;
      musicReady = true;
      applyMusic();
    }, 800);
  if (document.readyState === "complete") warm();
  else window.addEventListener("load", warm, { once: true });
}

/** Sound can start now: after a tap, or where the browser already allows it (an installed app). */
function soundAllowedNow() {
  if (unlocked || navigator.userActivation?.hasBeenActive) return true;
  const nav = navigator as Navigator & { getAutoplayPolicy?: (type: "audiocontext") => string; standalone?: boolean };
  if (nav.getAutoplayPolicy) {
    try {
      return nav.getAutoplayPolicy("audiocontext") === "allowed";
    } catch {
      // fall through
    }
  }
  if (!navigator.userActivation) return true; // no way to tell: try, as before
  // no way to ask (Chrome, Safari): an installed app may play before the first tap, a browser tab may not —
  // there sound waits for the tap rather than being refused with a console warning
  return window.matchMedia?.("(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)").matches || nav.standalone === true;
}

function unlock() {
  // a touch's pointerdown does not count as a tap yet; its pointerup or touchend will
  if (!soundAllowedNow()) return;
  const c = ctx();
  musicReady = true;
  applyMusic();
  const done = () => {
    if (unlocked) return;
    unlocked = true;
    for (const type of UNLOCK_EVENTS) window.removeEventListener(type, unlock, true);
    if (ambienceWanted) startAmbience();
  };
  if (c?.state === "running") done();
  else c?.resume().then(() => c.state === "running" && done(), () => {});
}

export const getSoundPrefs = (): SoundPrefs => {
  load();
  return prefs;
};
export const getServerSoundPrefs = (): SoundPrefs => DEFAULTS;

/** The sound settings, kept up to date in a component. */
export function useSoundPrefs(): SoundPrefs {
  return useSyncExternalStore(subscribeSound, getSoundPrefs, getServerSoundPrefs);
}

export function subscribeSound(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function setSoundPrefs(next: Partial<SoundPrefs>) {
  load();
  const was = prefs;
  prefs = { ...prefs, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // storage blocked: the choice lasts for this visit
  }
  ctx(); // unlock audio inside the tap that changed the setting
  applyMusic();
  if (!prefs.sfx) {
    stopMetronome();
    stopAmbience();
    stopVoice();
  }
  if (prefs.sfx && !was.sfx) tick(880, 0.09);
  listeners.forEach((l) => l());
}

// ------------------------------------------------------------------ Web Audio core
let ac: AudioContext | null = null;
function ctx() {
  if (typeof window === "undefined") return null;
  // not before sound may start: the browser would refuse it and log a warning for every attempt
  if (!ac && !soundAllowedNow()) return null;
  if (!ac) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
  }
  if (ac.state === "suspended") void ac.resume().catch(() => {});
  return ac;
}

const buffers = new Map<string, Promise<AudioBuffer | null>>();
function buffer(url: string) {
  let p = buffers.get(url);
  if (!p) {
    const c = ctx();
    // no audio engine yet (before the first tap): try again next time rather than remembering "none"
    if (!c) return Promise.resolve(null);
    p = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((b) => c.decodeAudioData(b))
      .catch(() => null);
    buffers.set(url, p);
  }
  return p;
}

async function playBuffer(url: string, volume: number) {
  const c = ctx();
  const b = await buffer(url);
  if (!c || !b) return;
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = volume;
  src.buffer = b;
  src.connect(g).connect(c.destination);
  src.start();
}

/** Short synthesised blip: taps, countdown ticks. */
function tick(freq = 660, volume = 0.06, length = 0.07, at?: number) {
  const c = ctx();
  if (!c) return;
  const t = at ?? c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.7, t + length);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + length);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + length + 0.02);
}

export function sfx(name: SfxName, volume = 0.55) {
  if (!getSoundPrefs().sfx) return;
  void playBuffer(asset(`/audio/sfx/${name}.mp3`), volume);
}

export function tap() {
  if (!getSoundPrefs().sfx) return;
  tick(720, 0.05, 0.05);
}

/** A short, soft click for each tap on the CPR trainer. */
export function tapClick() {
  tick(1300, 0.07, 0.04);
}

/** A tiny vibration on phones that support it (Android); quiet when sound effects are off. */
export function haptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !getSoundPrefs().sfx) return;
  // browsers refuse (and log an error) before the first tap on the page, e.g. a badge earned on a deep link
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // not supported
  }
}

export function countTick(last = false) {
  if (!getSoundPrefs().sfx) return;
  tick(last ? 1180 : 940, 0.09, last ? 0.16 : 0.08);
}

/** The patient monitor's beep on each heartbeat: higher pitched the better the oxygen saturation. */
export function monitorBeep(spo2 = 97) {
  if (!getSoundPrefs().sfx) return;
  tick(560 + Math.max(0, Math.min(100, spo2) - 70) * 11, 0.045, 0.09);
}

/** A monitor alarm: two falling tones (cardiac arrest rhythm). */
export function monitorAlarm() {
  if (!getSoundPrefs().sfx) return;
  const c = ctx();
  if (!c) return;
  tick(988, 0.05, 0.16, c.currentTime);
  tick(784, 0.05, 0.16, c.currentTime + 0.2);
}

/**
 * A training AED charging: a rising whine, then a "ready" beep every 0.7 s until stopped.
 * Returns the function that stops it (call it when the shock is given or the trainer resets).
 */
export function aedCharge(seconds = 2.4): () => void {
  const c = ctx();
  if (!c || !getSoundPrefs().sfx) return () => {};
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(420, t);
  o.frequency.exponentialRampToValueAtTime(2400, t + seconds);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.03, t + 0.2);
  g.gain.setValueAtTime(0.03, t + seconds - 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + seconds + 0.05);
  let beeps: number | undefined;
  const ready = window.setTimeout(() => {
    beeps = window.setInterval(() => tick(1500, 0.07, 0.14), 700);
  }, seconds * 1000);
  return () => {
    window.clearTimeout(ready);
    window.clearInterval(beeps);
    try {
      o.stop();
    } catch {
      // already stopped
    }
  };
}

// ------------------------------------------------------------------ CPR rhythm, 110 per minute
let metro: number | null = null;
export function startMetronome(bpm = 110, force = false) {
  if ((!force && !getSoundPrefs().sfx) || metro != null) return;
  const c = ctx();
  if (!c) return;
  const gap = 60 / bpm;
  let next = c.currentTime + 0.06;
  const schedule = () => {
    while (next < c.currentTime + 0.15) {
      tick(1250, 0.05, 0.035, next);
      next += gap;
    }
  };
  schedule();
  metro = window.setInterval(schedule, 30);
  duck(1); // the beat must stay clear of the music
}
export function stopMetronome() {
  if (metro == null) return;
  window.clearInterval(metro);
  metro = null;
  duck(-1);
}

// ------------------------------------------------------------------ spoken call-outs
let voiceEl: HTMLAudioElement | null = null;
/**
 * Plays one call-out; resolves when it ends. `force` plays it even with effects off (a direct tap).
 * `pan` (-1 left … 1 right) places the voice where its speaker is in a 3D scene — through the audio
 * engine, so only once it is running; otherwise the voice simply plays straight out.
 */
export function say(id: string, force = false, pan = 0): Promise<void> {
  if (typeof window === "undefined" || (!force && !getSoundPrefs().sfx)) return Promise.resolve();
  stopVoice();
  const el = new Audio(asset(`/audio/voice/${id}.mp3`));
  voiceEl = el;
  if (pan && ac && ac.state === "running") {
    try {
      const panner = ac.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      ac.createMediaElementSource(el).connect(panner).connect(ac.destination);
    } catch {
      // no panning here: the voice plays straight out
    }
  }
  duck(1); // music steps back while someone speaks
  return new Promise((resolve) => {
    let over = false;
    const end = () => {
      if (over) return;
      over = true;
      duck(-1);
      resolve();
    };
    el.onended = end;
    el.onerror = end;
    el.onpause = end;
    el.play().catch(end);
  });
}
export function stopVoice() {
  if (voiceEl) {
    voiceEl.pause();
    voiceEl = null;
  }
}

// ------------------------------------------------------------------ loops: stadium ambience and music
// Loops play through Web Audio gain nodes, because iPhones ignore an audio element's own volume.
type Loop = { el: HTMLAudioElement; gain: GainNode | null; fade: number };

function makeLoop(path: string): Loop {
  const el = new Audio(asset(path));
  el.loop = true;
  el.preload = "auto";
  const loop: Loop = { el, gain: null, fade: 0 };
  const c = ctx();
  try {
    if (c) {
      const gain = c.createGain();
      gain.gain.value = 0;
      c.createMediaElementSource(el).connect(gain).connect(c.destination);
      loop.gain = gain;
    }
  } catch {
    loop.gain = null;
  }
  if (!loop.gain) el.volume = 0;
  return loop;
}

/** Glide a loop to a level; `done` runs only if no newer glide replaced this one. */
function ramp(loop: Loop, to: number, ms: number, done?: () => void) {
  const id = ++loop.fade;
  if (loop.gain && ac) {
    const g = loop.gain.gain;
    g.cancelScheduledValues(ac.currentTime);
    g.setTargetAtTime(to, ac.currentTime, Math.max(0.01, ms / 3000));
  } else {
    const from = loop.el.volume;
    const t0 = performance.now();
    const step = () => {
      if (loop.fade !== id) return;
      const k = Math.min(1, (performance.now() - t0) / ms);
      loop.el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if (done) window.setTimeout(() => loop.fade === id && done(), ms);
}

/** Stop a loop at once (the page went to the background, where timers and frames are slowed). */
function halt(loop: Loop) {
  ++loop.fade;
  loop.el.pause();
  if (loop.gain && ac) {
    loop.gain.gain.cancelScheduledValues(ac.currentTime);
    loop.gain.gain.setValueAtTime(0, ac.currentTime);
  } else loop.el.volume = 0;
}

let amb: Loop | null = null;
let ambienceWanted = false;
export function startAmbience() {
  if (!getSoundPrefs().sfx) return;
  ambienceWanted = true;
  if (!soundAllowedNow()) return; // the first tap starts it
  amb ??= makeLoop("/audio/sfx/crowd.mp3");
  const loop = amb;
  loop.el.play().then(() => ramp(loop, 0.22, 900), () => {});
}
export function stopAmbience() {
  ambienceWanted = false;
  const loop = amb;
  if (loop && !loop.el.paused) ramp(loop, 0, 500, () => loop.el.pause());
}

const TRACKS: Record<Exclude<MusicScene, "none">, string> = {
  theme: "/audio/music/theme.mp3",
  study: "/audio/music/study.mp3",
  drill: "/audio/music/drill.mp3",
  quiz: "/audio/music/quiz.mp3",
};
const MUSIC_VOLUME = 0.28;
let scene: MusicScene = "theme";
let musicReady = false; // set once the page has loaded or the person has tapped
let ducks = 0; // voices and the CPR beat lower the music
let holds = 0; // a playing film pauses it
const players = new Map<string, Loop>();

const musicLevel = () => (ducks > 0 ? MUSIC_VOLUME * 0.25 : MUSIC_VOLUME);

function applyMusic() {
  if (typeof window === "undefined") return;
  const hidden = document.visibilityState !== "visible";
  const want = prefs.music && scene !== "none" && holds === 0 && !hidden;
  for (const [track, loop] of players) {
    if ((!want || track !== scene) && !loop.el.paused) {
      if (hidden) halt(loop);
      else ramp(loop, 0, 700, () => loop.el.pause());
    }
  }
  if (!want || scene === "none" || !musicReady) return;
  let loop = players.get(scene);
  if (!loop) {
    loop = makeLoop(TRACKS[scene]);
    players.set(scene, loop);
  }
  const current = loop;
  if (current.el.paused) current.el.play().then(() => ramp(current, musicLevel(), 1500), () => {});
  else ramp(current, musicLevel(), 400);
}

function duck(change: number) {
  ducks = Math.max(0, ducks + change);
  const loop = scene === "none" ? undefined : players.get(scene);
  if (loop && !loop.el.paused) ramp(loop, musicLevel(), change > 0 ? 250 : 900);
}

/** Switch the music to suit the page (crossfades; each track resumes where it left off). */
export function setMusicScene(next: MusicScene) {
  load();
  if (next === scene) return;
  scene = next;
  applyMusic();
}

/** Pause the music while something else is playing sound (a film); call again with false to resume. */
export function holdMusic(on: boolean) {
  holds = Math.max(0, holds + (on ? 1 : -1));
  applyMusic();
}
