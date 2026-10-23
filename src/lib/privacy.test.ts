import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { appKeys } from "./privacy.ts";

const store = (keys: string[]) => ({ length: keys.length, key: (i: number) => keys[i] ?? null });

describe("privacy", () => {
  it("finds only this app's keys", () => {
    const keys = ["pec-progress", "pec-sound", "other-site-setting", "tsr-scroll-restoration-v1_3", "pec-arrest-timer"];
    assert.deepEqual(appKeys(store(keys)), ["pec-progress", "pec-sound", "pec-arrest-timer"]);
  });

  it("finds nothing in an empty store", () => {
    assert.deepEqual(appKeys(store([])), []);
  });
});
