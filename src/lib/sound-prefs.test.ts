import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readSoundPrefs, SOUND_DEFAULTS, writeSoundPrefs } from "./sound-prefs.ts";

describe("sound settings", () => {
  it("are all on when nothing is saved", () => {
    assert.deepEqual(readSoundPrefs(null), { sfx: true, music: true });
    assert.deepEqual(readSoundPrefs(""), SOUND_DEFAULTS);
  });

  it("read a save from before sound was on by default as the defaults", () => {
    // turning effects on in the old app also saved its default "music off"
    assert.deepEqual(readSoundPrefs(JSON.stringify({ sfx: true, music: false })), { sfx: true, music: true });
    assert.deepEqual(readSoundPrefs(JSON.stringify({ sfx: false, music: false })), { sfx: true, music: true });
  });

  it("keep a choice saved now", () => {
    assert.deepEqual(readSoundPrefs(writeSoundPrefs({ sfx: true, music: false })), { sfx: true, music: false });
    assert.deepEqual(readSoundPrefs(writeSoundPrefs({ sfx: false, music: true })), { sfx: false, music: true });
    assert.deepEqual(readSoundPrefs(writeSoundPrefs({ sfx: false, music: false })), { sfx: false, music: false });
  });

  it("fall back to the defaults for anything unreadable", () => {
    for (const raw of ["not json", "null", "[]", "42", JSON.stringify({ v: 2, sfx: "yes", music: 0 })]) {
      const p = readSoundPrefs(raw);
      assert.equal(typeof p.sfx, "boolean", raw);
      assert.equal(typeof p.music, "boolean", raw);
    }
    assert.deepEqual(readSoundPrefs(JSON.stringify({ v: 2, sfx: "yes", music: 0 })), SOUND_DEFAULTS);
  });
});
