/**
 * Call-outs whose recording was replaced. The id stays the same (the role cards, drills, quiz and AED trainer use
 * it); the file is new, because the service worker keeps media by URL. green-1 and white-3 were levelled to about
 * −16.5 LUFS like the other call-outs (they were 5–7 dB quieter). scripts/build-ar-models.mjs reads this map too.
 */
export const VOICE_FILES: Record<string, string> = {
  "green-1": "green-1-v2",
  "white-3": "white-3-v2",
};

/** The recording behind a call-out id, e.g. "green-1" → "green-1-v2". */
export const voiceFile = (id: string) => VOICE_FILES[id] ?? id;
