/**
 * The sound settings saved on this device. Sound has been ON by default since 14 October 2026; before that it was
 * off until switched on, and switching one on saved the other's "off" too — so a save from then can hold a
 * "music off" nobody chose. Saves without this version's mark are therefore read as the defaults (everything on);
 * a choice made now is saved with the mark and kept.
 */
export type SoundPrefs = { sfx: boolean; music: boolean };

export const SOUND_DEFAULTS: SoundPrefs = { sfx: true, music: true };
export const SOUND_SAVE_MARK = 2;

/** The settings in a saved value (null when nothing is saved). */
export function readSoundPrefs(raw: string | null): SoundPrefs {
  try {
    const v = JSON.parse(raw || "{}") as (Partial<SoundPrefs> & { v?: unknown }) | null;
    if (!v || v.v !== SOUND_SAVE_MARK) return SOUND_DEFAULTS;
    return {
      sfx: typeof v.sfx === "boolean" ? v.sfx : SOUND_DEFAULTS.sfx,
      music: typeof v.music === "boolean" ? v.music : SOUND_DEFAULTS.music,
    };
  } catch {
    return SOUND_DEFAULTS;
  }
}

/** The value to save for these settings. */
export function writeSoundPrefs(p: SoundPrefs): string {
  return JSON.stringify({ sfx: p.sfx, music: p.music, v: SOUND_SAVE_MARK });
}
