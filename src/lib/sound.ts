import { asset } from "@/lib/asset";

/**
 * Sound for the guide: effects, spoken call-outs, a CPR rhythm click, stadium ambience and a music loop.
 * Everything is OFF until the person turns it on (choice kept on this device only). Files load only when
 * first needed. Voices tapped directly (a speaker button) play even when effects are off.
 */
export type SfxName = "whistle" | "correct" | "wrong" | "whoosh" | "cheer" | "shock";
export type SoundPrefs = { sfx: boolean; music: boolean };

const KEY = "pec-sound";
const OFF: SoundPrefs = { sfx: false, music: false };
let prefs: SoundPrefs = OFF;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<SoundPrefs>;
    prefs = { sfx: Boolean(v.sfx), music: Boolean(v.music) };
  } catch {
    prefs = OFF;
  }
  // a saved "music on" can only start after the first tap (browsers block autoplay with sound)
  if (prefs.music) {
    const kick = () => {
      applyMusic();
      window.removeEventListener("pointerdown", kick);
    };
    window.addEventListener("pointerdown", kick);
  }
  document.addEventListener("visibilitychange", () => {
    applyMusic();
    if (document.visibilityState !== "visible") {
      stopMetronome();
      stopVoice();
    }
  });
}

export const getSoundPrefs = (): SoundPrefs => {
  load();
  return prefs;
};
export const getServerSoundPrefs = (): SoundPrefs => OFF;

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
  if (!ac) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
  }
  if (ac.state === "suspended") void ac.resume();
  return ac;
}

const buffers = new Map<string, Promise<AudioBuffer | null>>();
function buffer(url: string) {
  let p = buffers.get(url);
  if (!p) {
    const c = ctx();
    p = c
      ? fetch(url)
          .then((r) => r.arrayBuffer())
          .then((b) => c.decodeAudioData(b))
          .catch(() => null)
      : Promise.resolve(null);
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
}
export function stopMetronome() {
  if (metro != null) window.clearInterval(metro);
  metro = null;
}

// ------------------------------------------------------------------ spoken call-outs
let voiceEl: HTMLAudioElement | null = null;
/** Plays one call-out; resolves when it ends. `force` plays it even with effects off (a direct tap). */
export function say(id: string, force = false): Promise<void> {
  if (typeof window === "undefined" || (!force && !getSoundPrefs().sfx)) return Promise.resolve();
  stopVoice();
  const el = new Audio(asset(`/audio/voice/${id}.mp3`));
  voiceEl = el;
  return new Promise((resolve) => {
    el.onended = () => resolve();
    el.onerror = () => resolve();
    el.onpause = () => resolve();
    el.play().catch(() => resolve());
  });
}
export function stopVoice() {
  if (voiceEl) {
    voiceEl.pause();
    voiceEl = null;
  }
}

// ------------------------------------------------------------------ loops: stadium ambience and music
function fade(el: HTMLAudioElement, to: number, ms: number, done?: () => void) {
  const from = el.volume;
  const t0 = performance.now();
  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    el.volume = from + (to - from) * k;
    if (k < 1) requestAnimationFrame(step);
    else done?.();
  };
  requestAnimationFrame(step);
}

let ambEl: HTMLAudioElement | null = null;
export function startAmbience() {
  if (!getSoundPrefs().sfx) return;
  if (!ambEl) {
    ambEl = new Audio(asset("/audio/sfx/crowd.mp3"));
    ambEl.loop = true;
    ambEl.volume = 0;
  }
  ambEl.play().then(() => ambEl && fade(ambEl, 0.22, 900)).catch(() => {});
}
export function stopAmbience() {
  const el = ambEl;
  if (el && !el.paused) fade(el, 0, 500, () => el.pause());
}

let musicEl: HTMLAudioElement | null = null;
function applyMusic() {
  if (typeof window === "undefined") return;
  const want = prefs.music && document.visibilityState === "visible";
  if (want) {
    if (!musicEl) {
      musicEl = new Audio(asset("/audio/music/theme.mp3"));
      musicEl.loop = true;
      musicEl.volume = 0;
    }
    const el = musicEl;
    el.play().then(() => fade(el, 0.3, 1500)).catch(() => {});
  } else if (musicEl && !musicEl.paused) {
    const el = musicEl;
    fade(el, 0, 700, () => el.pause());
  }
}
