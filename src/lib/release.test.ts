import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { APP_VERSION, RELEASED, WHATS_NEW } from "./release.ts";

describe("release", () => {
  it("shows the version package.json gives", () => {
    const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { version?: string };
    assert.equal(APP_VERSION, pkg.version);
  });

  it("is a major.minor.patch version with a month and year", () => {
    assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/);
    assert.match(RELEASED, /^[A-Z][a-z]+ \d{4}$/);
  });

  it("lists what is new, each with its own id, a title and a full sentence", () => {
    assert.ok(WHATS_NEW.length > 0);
    assert.equal(new Set(WHATS_NEW.map((n) => n.id)).size, WHATS_NEW.length);
    for (const n of WHATS_NEW) {
      assert.ok(n.title.trim() && !n.title.endsWith("."), n.id);
      assert.match(n.text, /\.$/, n.id);
    }
  });
});
