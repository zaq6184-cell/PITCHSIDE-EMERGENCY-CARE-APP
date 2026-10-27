import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AR_FALLBACK, AR_STEPS, arPath, arSupportFrom, cardClip, cardPicture, clampClip, clampStep, closedAtOnce, fallbackUrl, hasNarration, modelFile, quickLookHref, sceneViewerIntent, VIEWER_GONE_MS } from "./ar.ts";

describe("augmented reality", () => {
  it("names one model per drill step, and keeps the step in range", () => {
    assert.equal(modelFile("arrest", 4, "glb"), "/ar/arrest-4.glb");
    assert.equal(modelFile("spine", 0, "usdz"), "/ar/spine-0.usdz");
    assert.equal(modelFile("arrest", 99, "glb"), `/ar/arrest-${AR_STEPS.arrest}.glb`);
    assert.equal(clampStep("spine", -3), 0);
    assert.equal(clampStep("spine", Number.NaN), 0);
  });

  it("gives every clip a moving picture, big and small, over its first frame", () => {
    assert.equal(cardClip("arrest", 3), "/video/ar-arrest-3.mp4");
    assert.equal(cardClip("spine", "all", true), "/video/ar-spine-all-sm.mp4");
    assert.equal(cardClip("spine", 99, true), `/video/ar-spine-${AR_STEPS.spine}-sm.mp4`);
    assert.equal(cardPicture("arrest", 0), "/img/ar-cards/arrest-0.webp");
    assert.equal(cardPicture("spine", "all"), "/img/ar-cards/spine-all.webp");
  });

  it("has the whole drill as a clip, and narration for every clip that moves", () => {
    assert.equal(modelFile("spine", "all", "glb"), "/ar/spine-all.glb");
    assert.equal(modelFile("arrest", 3, "mp3"), "/ar/arrest-3.mp3");
    assert.equal(clampClip("arrest", "all"), "all");
    assert.equal(clampClip("arrest", 42), AR_STEPS.arrest);
    assert.equal(hasNarration(0), false);
    assert.equal(hasNarration(2), true);
    assert.equal(hasNarration("all"), true);
  });

  it("opens Google's AR viewer in AR where it can, with the model's address encoded and a way back", () => {
    const url = sceneViewerIntent("https://example.org/app/ar/arrest-4.glb", { title: "Step 4: Airway", fallback: "https://example.org/app/ar#ar-unavailable" });
    assert.match(url, /^intent:\/\/arvr\.google\.com\/scene-viewer\/1\.0\?/);
    assert.match(url, /mode=ar_preferred/);
    assert.match(url, /title=Step\+4%3A\+Airway/);
    assert.match(url, /&file=https%3A%2F%2Fexample\.org%2Fapp%2Far%2Farrest-4\.glb#Intent;/);
    assert.match(url, /package=com\.google\.android\.googlequicksearchbox;/);
    assert.match(url, /S\.browser_fallback_url=https%3A%2F%2Fexample\.org%2Fapp%2Far%23ar-unavailable;end;$/);
    assert.doesNotMatch(url, /sound=/);
  });

  it("gives Google's AR viewer the narration to loop with the animation", () => {
    const url = sceneViewerIntent("https://example.org/ar/arrest-all.glb", { title: "Whole drill", fallback: "https://example.org/ar", sound: "https://example.org/ar/arrest-all.mp3" });
    assert.match(url, /sound=https%3A%2F%2Fexample\.org%2Far%2Farrest-all\.mp3/);
    assert.ok(url.indexOf("sound=") < url.indexOf("&file="));
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

  it("runs Live AR in the app wherever the browser can, and Google's AR viewer only on Android phones that cannot", () => {
    assert.equal(arPath({ android: true, quicklook: false, webxr: true }), "live");
    assert.equal(arPath({ android: true, quicklook: false, webxr: false }), "viewer");
    assert.equal(arPath({ android: false, quicklook: true, webxr: false }), "quicklook");
    assert.equal(arPath({ android: false, quicklook: false, webxr: false }), "phone");
  });

  it("takes a quick return from Google's AR viewer as the viewer closing by itself", () => {
    assert.equal(closedAtOnce(120), true);
    assert.equal(closedAtOnce(VIEWER_GONE_MS - 1), true);
    assert.equal(closedAtOnce(VIEWER_GONE_MS), false);
    assert.equal(closedAtOnce(45_000), false);
  });
});
