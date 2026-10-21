import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AR_FALLBACK, AR_STEPS, arSupportFrom, clampStep, fallbackUrl, modelFile, quickLookHref, sceneViewerIntent } from "./ar.ts";

describe("augmented reality", () => {
  it("names one model per drill step, and keeps the step in range", () => {
    assert.equal(modelFile("arrest", 4, "glb"), "/ar/arrest-4.glb");
    assert.equal(modelFile("spine", 0, "usdz"), "/ar/spine-0.usdz");
    assert.equal(modelFile("arrest", 99, "webp"), `/ar/arrest-${AR_STEPS.arrest}.webp`);
    assert.equal(clampStep("spine", -3), 0);
    assert.equal(clampStep("spine", Number.NaN), 0);
  });

  it("opens Google's AR viewer in AR where it can, with the model's address encoded and a way back", () => {
    const url = sceneViewerIntent("https://example.org/app/ar/arrest-4.glb", { title: "Step 4: Airway", fallback: "https://example.org/app/ar#ar-unavailable" });
    assert.match(url, /^intent:\/\/arvr\.google\.com\/scene-viewer\/1\.0\?/);
    assert.match(url, /mode=ar_preferred/);
    assert.match(url, /title=Step\+4%3A\+Airway/);
    assert.match(url, /&file=https%3A%2F%2Fexample\.org%2Fapp%2Far%2Farrest-4\.glb#Intent;/);
    assert.match(url, /package=com\.google\.android\.googlequicksearchbox;/);
    assert.match(url, /S\.browser_fallback_url=https%3A%2F%2Fexample\.org%2Fapp%2Far%23ar-unavailable;end;$/);
  });

  it("lets Quick Look resize the model, and marks the way back when the viewer cannot open", () => {
    assert.equal(quickLookHref("https://example.org/ar/spine-7.usdz"), "https://example.org/ar/spine-7.usdz#allowsContentScaling=1");
    assert.equal(fallbackUrl("https://example.org/app/drill?case=neck#top"), `https://example.org/app/drill?case=neck#${AR_FALLBACK}`);
  });

  it("knows Android from the browser's own description", () => {
    const pixel = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";
    assert.deepEqual(arSupportFrom(pixel, false, true), { android: true, quicklook: false, webxr: true });
    assert.equal(arSupportFrom("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", false, false).android, false);
  });
});
