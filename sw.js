/* global __SHELL__, __MEDIA__ -- filled in by scripts/build-sw.mjs */
/*
 * Pitchside Emergency Care — service worker.
 * Built by scripts/build-sw.mjs from scripts/sw-template.js (edit the template, not the built copy).
 *
 * - Pages: network first (so corrections arrive), falling back to the saved copy when offline.
 * - Code, styles and fonts: saved at install, served from the cache (file names change on every build).
 * - Pictures, audio, video and documents: saved the first time they are viewed, or all at once
 *   when the person taps "Save everything for offline".
 * - Other websites (FIFA, YouTube): never touched; they always go to the network.
 */
const VERSION = "75926bed4338";
const SHELL = ["_shell.html","about/index.html","aed/index.html","ar/index.html","arrest/index.html","assets/about-7B3bcwqt.js","assets/activity-ClyKu9Zt.js","assets/aed-CFQvLU-w.js","assets/aed-scene-3d-DrUMewPX.js","assets/aed-trainer-IvQNRXCk.js","assets/ar-B_sT8AS5.js","assets/ar-LFURuPer.js","assets/ar-button-Bgfwddxn.js","assets/ar-session-qkEg6Cae.js","assets/arrest-C3bJ6cnM.js","assets/bag-OKZkeX6z.js","assets/bag-groups-jiR7vPNv.js","assets/bone-TEmF4_Vc.js","assets/box-DMoGJZhH.js","assets/brain-B9CU5l4g.js","assets/briefcase-CrPeTDV_.js","assets/briefcase-medical-ZB-rX8Wp.js","assets/case._id-BTl8RbRc.js","assets/cases-C7GFlrki.js","assets/cases-nc4YWcTk.js","assets/chevron-left-BKvJfxSy.js","assets/chevron-right-DnvekefY.js","assets/clipboard-check-l-JhjLfe.js","assets/clipboard-pen-DNMZQ0zt.js","assets/clock-DX65d9SQ.js","assets/concussion-scene-3d-D0moFZPY.js","assets/concussion-signs-Eb-U_kMT.js","assets/cspine-Z-pyePn7.js","assets/disclaimer-Dk2lWNyX.js","assets/drill-ClocaosJ.js","assets/external-link-c1wxKenB.js","assets/eye-D14xxf9R.js","assets/fifa-_9_1oXE2.js","assets/fifa-sca-uYrIXqe3.js","assets/fifa-video-BmMpF0Te.js","assets/file-text-BWt-zXpt.js","assets/focus-B32ScESv.js","assets/focus-CtVg4a17.js","assets/footprints-CtBS5AJs.js","assets/guides-C_Y9bZvT.js","assets/hand-CWTMpPxP.js","assets/handover-BoXqvK7U.js","assets/heart-pulse-Cnqs-_bk.js","assets/heat-CHejVmD6.js","assets/heat-D_lkONCD.js","assets/index-DGa3EFS4.js","assets/injuries-ByskVX0m.js","assets/injuries-DpjvrjGb.js","assets/install-BMFXeknK.js","assets/jsx-runtime-B-hcVAMW.js","assets/lazyRouteComponent-pEVvDdUO.js","assets/list-checks-Clm7Kr4o.js","assets/live-HciZlOEW.js","assets/live-quiz-DUxfSovR.js","assets/medical-C26liyVR.js","assets/medical-DI4cBEB1.js","assets/message-circle-CPSylOEA.js","assets/mistakes-3kh-158w.js","assets/module-covers-ryD0_gSp.js","assets/monitor-play-BxUWDDeC.js","assets/phone-DBKty47i.js","assets/pitchside-D20w29bk.js","assets/plan-bv3BbZkO.js","assets/play-Bp9QKny2.js","assets/position-diagram-DXLdKAlM.js","assets/preload-helper-BpQy1Rdt.js","assets/qr-code-CUA-W5e_.js","assets/qr-code-DSOLLRIZ.js","assets/quiz-IR_xb9vp.js","assets/quiz-questions-BCFyIyHU.js","assets/repeat-BjlnTiq6.js","assets/role-icon-B0pgc0mM.js","assets/role._id-oEMDMi2b.js","assets/rotate-ccw-BMfZG0pl.js","assets/routes-D1KJvckX.js","assets/rules-CC_zjShi.js","assets/scan-line-DejaUloS.js","assets/scene-3d-Dg82zWvM.js","assets/scene-images-DDBbXRHO.js","assets/scene-picture-97kNfH-y.js","assets/scorer-CusXw_0k.js","assets/search-dialog-B-x2sPgL.js","assets/set-piece-3d-swvRshnh.js","assets/shield-alert-BhAwTGLP.js","assets/spine-drill-DnWZplWh.js","assets/station._id-CKofn4dl.js","assets/stations-BpAIsDvS.js","assets/stations-BwIzxIQC.js","assets/stethoscope-bXCfeKcx.js","assets/styles-BRa8p7F_.css","assets/survival-chart-BP08YvJb.js","assets/syringe-Bj12Tfnl.js","assets/thermometer-C82LUM6I.js","assets/timer-DBtLdETZ.js","assets/trash-2-DHxN9zUv.js","assets/undo-2-LdXY5WBe.js","assets/use-fullscreen-DSf0gt0v.js","assets/utils-64eEb6LH.js","assets/videos-C8bQ6Uc1.js","assets/voice-Beg57tyO.js","assets/wifi-Dvcxbhvx.js","assets/wind-LvjrDN3t.js","assets/workshop-DMOZEgfs.js","assets/workshop-Dz6m2xxc.js","assets/x-xcDmADxA.js","assets/zoom-image-F-I8Mqgn.js","bag/index.html","brand/logo-mark.svg","case/commotio/index.html","case/heat/index.html","case/vf/index.html","cases/index.html","cspine/index.html","drill/index.html","favicon.svg","fifa/index.html","focus/index.html","fonts/f0.woff2","fonts/f1.woff2","fonts/f10.woff2","fonts/f11.woff2","fonts/f12.woff2","fonts/f13.woff2","fonts/f14.woff2","fonts/f15.woff2","fonts/f16.woff2","fonts/f17.woff2","fonts/f18.woff2","fonts/f19.woff2","fonts/f2.woff2","fonts/f20.woff2","fonts/f21.woff2","fonts/f22.woff2","fonts/f23.woff2","fonts/f24.woff2","fonts/f25.woff2","fonts/f26.woff2","fonts/f27.woff2","fonts/f28.woff2","fonts/f29.woff2","fonts/f3.woff2","fonts/f30.woff2","fonts/f31.woff2","fonts/f32.woff2","fonts/f33.woff2","fonts/f34.woff2","fonts/f35.woff2","fonts/f36.woff2","fonts/f37.woff2","fonts/f38.woff2","fonts/f39.woff2","fonts/f4.woff2","fonts/f40.woff2","fonts/f5.woff2","fonts/f6.woff2","fonts/f7.woff2","fonts/f8.woff2","fonts/f9.woff2","guides/index.html","handover/index.html","heat/index.html","icons/apple-touch-icon.png","icons/favicon-64.png","icons/icon-192.png","icons/icon-512.png","icons/install-qr.svg","icons/maskable-192.png","icons/maskable-512.png","index.html","injuries/index.html","install/index.html","live/index.html","manifest.webmanifest","medical/index.html","pitchside/index.html","plan/index.html","quiz/index.html","role/black/index.html","role/blue/index.html","role/green/index.html","role/orange/index.html","role/red/index.html","role/white/index.html","rules/index.html","scorer/index.html","station/1/index.html","station/2/index.html","station/3/index.html","station/4/index.html","station/5/index.html","station/6/index.html","stations/index.html","timer/index.html"];
const MEDIA = ["ar/arrest-0.webp","ar/arrest-1.webp","ar/arrest-2.webp","ar/arrest-3.webp","ar/arrest-4.webp","ar/arrest-5.webp","ar/arrest-6.webp","ar/arrest-all.webp","ar/spine-0.webp","ar/spine-1.webp","ar/spine-2.webp","ar/spine-3.webp","ar/spine-4.webp","ar/spine-5.webp","ar/spine-6.webp","ar/spine-7.webp","ar/spine-all.webp","audio/music/drill.mp3","audio/music/quiz.mp3","audio/music/study.mp3","audio/music/theme.mp3","audio/sfx/cheer.mp3","audio/sfx/correct.mp3","audio/sfx/crowd.mp3","audio/sfx/shock.mp3","audio/sfx/siren.mp3","audio/sfx/whistle.mp3","audio/sfx/whoosh.mp3","audio/sfx/wrong.mp3","audio/voice/aed-1.mp3","audio/voice/aed-2.mp3","audio/voice/aed-3.mp3","audio/voice/aed-4.mp3","audio/voice/aed-5.mp3","audio/voice/aed-6.mp3","audio/voice/aed-7.mp3","audio/voice/aed-8.mp3","audio/voice/black-1.mp3","audio/voice/black-2.mp3","audio/voice/black-3.mp3","audio/voice/black-4.mp3","audio/voice/black-s1.mp3","audio/voice/black-s2.mp3","audio/voice/black-s3.mp3","audio/voice/blue-1.mp3","audio/voice/blue-2.mp3","audio/voice/blue-3.mp3","audio/voice/green-1.mp3","audio/voice/green-2.mp3","audio/voice/green-3.mp3","audio/voice/orange-1.mp3","audio/voice/orange-2.mp3","audio/voice/orange-3.mp3","audio/voice/orange-s1.mp3","audio/voice/orange-s2.mp3","audio/voice/red-1.mp3","audio/voice/red-2.mp3","audio/voice/red-s1.mp3","audio/voice/red-s2.mp3","audio/voice/red-s3.mp3","audio/voice/white-1.mp3","audio/voice/white-2.mp3","audio/voice/white-3.mp3","brand/app-icon-180.png","brand/logo-horizontal-dark.png","brand/logo-horizontal-light.png","brand/logo-horizontal.svg","brand/logo-mark-1024.png","brand/logo-mark-180.png","brand/logo-mark-512.png","docs/FIFA-FOCUS-Concussion-Lanyard-April-2026.pdf","docs/FIFA-Set-Piece-Protocol-Cervical-Spine.pdf","img/3d/stadium.jpg","img/ar/ar-phone.webp","img/bag/aed.jpg","img/bag/battery-tab.jpg","img/bag/battery.jpg","img/bag/fifa-closed.jpg","img/bag/fifa-open.jpg","img/bag/fifa-trays.jpg","img/bag/pitchside-bag.jpg","img/fifa/aed-travel.jpg","img/fifa/bag-factsheet.jpg","img/fifa/cspine-protocol-v2.jpg","img/fifa/cspine-protocol.jpg","img/fifa/fecb-2.jpg","img/fifa/fecb-3.jpg","img/fifa/focus/cover-full.jpg","img/fifa/focus/cover-lanyard.jpg","img/fifa/focus/cover-pocket.jpg","img/fifa/focus/lanyard-1.jpg","img/fifa/focus/lanyard-2.jpg","img/fifa/focus/video.jpg","img/fifa/heart-heroes.jpg","img/fifa/how-to-help.jpg","img/fifa/managing-sca.jpg","img/fifa/onfield-protocols.jpg","img/fifa/onfield/access-rules.jpg","img/fifa/onfield/bench.jpg","img/fifa/onfield/carry-photo.jpg","img/fifa/onfield/equipment.jpg","img/fifa/onfield/extrication-setup.jpg","img/fifa/onfield/ready-position.jpg","img/fifa/onfield/timeline.jpg","img/fifa/peap.jpg","img/fifa/role-cards.jpg","img/fifa/set-piece.jpg","img/fifa/skill/cspine.jpg","img/fifa/skill/hands-on.jpg","img/fifa/skill/lower-limb.jpg","img/fifa/skill/setup.jpg","img/fifa/skill/sideline.jpg","img/fifa/video-sca.jpg","img/fifa/video-workshop.jpg","img/fifa/youth-screening.jpg","img/intro/intro-poster.jpg","img/modules/module-1-sm.webp","img/modules/module-1.webp","img/modules/module-2-sm.webp","img/modules/module-2.webp","img/modules/module-3-sm.webp","img/modules/module-3.webp","img/modules/module-4-sm.webp","img/modules/module-4.webp","img/modules/module-5-sm.webp","img/modules/module-5.webp","img/modules/module-6-sm.webp","img/modules/module-6.webp","img/roles/role-black-sm.webp","img/roles/role-black.webp","img/roles/role-blue-sm.webp","img/roles/role-blue.webp","img/roles/role-green-sm.webp","img/roles/role-green.webp","img/roles/role-orange-sm.webp","img/roles/role-orange.webp","img/roles/role-red-sm.webp","img/roles/role-red.webp","img/roles/role-white-sm.webp","img/roles/role-white.webp","img/s5/basket.jpg","img/s5/board.jpg","img/s5/collar-sizing.svg","img/s5/collar.jpg","img/s5/head.jpg","img/s5/scoop.jpg","img/s5/sling.jpg","img/s5/splint.jpg","img/s5/tshirt-sling.svg","img/scenes/case-commotio-sm.webp","img/scenes/case-commotio.webp","img/scenes/case-heat-sm.webp","img/scenes/case-heat.webp","img/scenes/case-vf-sm.webp","img/scenes/case-vf.webp","img/scenes/heat-cooling.webp","img/scenes/live-quiz.webp","img/scenes/scorer.webp","img/stations/s3-pathway-v2.png","img/videos/fifa-course.jpg","img/videos/fifa-heroes.jpg","img/videos/fifa-meyer.jpg","img/videos/uefa-sca.jpg","img/videos/ussoccer-cpr.jpg","video/intro.mp4"];

const BASE = self.registration.scope; // the site root, e.g. https://example.org/app/
const PAGES = `pec-pages-${VERSION}`;
const ASSETS = `pec-assets-${VERSION}`;
const MEDIA_CACHE = "pec-media";
const SHELL_KEY = new URL("__shell__", BASE).href;
const META = "pec-meta";
const PREVIOUS_KEY = new URL("__previous-assets__", BASE).href;

const abs = (p) => new URL(p, BASE).href;

/** "drill", "drill/" and "drill/index.html" are one page. */
function pageKey(url) {
  const u = new URL(url);
  let p = u.pathname;
  if (p.endsWith("/index.html")) p = p.slice(0, -"index.html".length);
  if (!p.endsWith("/")) p += "/";
  return u.origin + p;
}

const isPage = (p) => p.endsWith(".html");
const shellKey = (p) => (p === "_shell.html" ? SHELL_KEY : isPage(p) ? pageKey(abs(p)) : abs(p));

/** Save the app shell; a file that fails is tried again (and again on "Save everything"). */
async function ensureShell() {
  const pages = await caches.open(PAGES);
  const assets = await caches.open(ASSETS);
  await Promise.all(
    SHELL.map(async (p) => {
      const cache = isPage(p) ? pages : assets;
      if (await cache.match(shellKey(p))) return;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(abs(p), { cache: "reload" });
          if (res.ok) {
            await cache.put(shellKey(p), res);
            return;
          }
        } catch {
          // network hiccup: try again
        }
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(ensureShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // keep one version back: a page opened before this update may still ask for its old code files
      const meta = await caches.open(META);
      const prevRes = await meta.match(PREVIOUS_KEY);
      const previous = prevRes ? await prevRes.text() : "";
      const keep = new Set([PAGES, ASSETS, MEDIA_CACHE, META, previous === ASSETS ? "" : previous]);
      for (const key of await caches.keys()) {
        if (key.startsWith("pec-") && !keep.has(key)) await caches.delete(key);
      }
      await meta.put(PREVIOUS_KEY, new Response(ASSETS));
      await self.clients.claim();
      ensureShell();
    })(),
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function page(request) {
  const cache = await caches.open(PAGES);
  const key = pageKey(request.url);
  try {
    const res = await withTimeout(fetch(request), 3000);
    if (res.ok && !res.redirected) cache.put(key, res.clone());
    return res;
  } catch {
    return (
      (await cache.match(key)) ||
      (await cache.match(SHELL_KEY)) ||
      (await cache.match(pageKey(BASE))) ||
      new Response("<h1>Offline</h1><p>Open the app once with a connection so it can be saved.</p>", {
        status: 503,
        headers: { "content-type": "text/html; charset=utf-8" },
      })
    );
  }
}

async function cacheFirst(request, name) {
  const cache = await caches.open(name);
  const hit = (await cache.match(request, { ignoreSearch: true })) || (await caches.match(request, { ignoreSearch: true }));
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.status === 200) cache.put(request, res.clone());
  return res;
}

/** Audio and video ask for byte ranges; answer them from a saved full copy when there is one. */
async function fromRange(full, rangeHeader) {
  const buf = await full.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader || "");
  const size = buf.byteLength;
  let start = m && m[1] ? Number(m[1]) : 0;
  let end = m && m[2] ? Number(m[2]) : size - 1;
  if (!m || !m[1]) start = m && m[2] ? size - Number(m[2]) : 0;
  end = Math.min(end, size - 1);
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "content-type": full.headers.get("content-type") || "application/octet-stream",
      "content-range": `bytes ${start}-${end}/${size}`,
      "content-length": String(end - start + 1),
      "accept-ranges": "bytes",
    },
  });
}

/**
 * A sound (the music, a voice) is played in byte ranges, which are not saved: the first time it plays, a whole copy
 * is saved in the background, so next time it starts at once — and plays offline. Not the AR call-outs: Google's
 * AR viewer downloads those itself.
 */
const saving = new Set();
async function saveWhole(url) {
  if (saving.has(url)) return;
  saving.add(url);
  try {
    const res = await fetch(url);
    if (res.ok && res.status === 200) await (await caches.open(MEDIA_CACHE)).put(url, res);
  } catch {
    // no connection: it is saved the next time it plays
  } finally {
    saving.delete(url);
  }
}

async function media(request, event) {
  const cache = await caches.open(MEDIA_CACHE);
  const range = request.headers.get("range");
  const hit = await cache.match(request.url);
  if (range) {
    if (hit) return fromRange(hit, range);
    const path = new URL(request.url).pathname;
    if (/\.mp3$/.test(path) && !/\/ar\/[^/]*$/.test(path)) event.waitUntil(saveWhole(request.url));
    return fetch(request);
  }
  const refresh = fetch(request)
    .then((res) => {
      if (res.ok && res.status === 200) cache.put(request.url, res.clone());
      return res;
    })
    .catch(() => undefined);
  return hit || (await refresh) || new Response("", { status: 504 });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(BASE)) return; // other websites go straight to the network
  const path = new URL(req.url).pathname;
  if (req.mode === "navigate") return event.respondWith(page(req));
  if (/\/assets\/|\.(?:js|css|woff2)$/.test(path)) return event.respondWith(cacheFirst(req, ASSETS));
  if (/\.(?:png|jpe?g|webp|svg|gif|mp3|mp4|pdf|webmanifest|json)$/.test(path)) return event.respondWith(media(req, event));
});

/** "Save everything for offline": fetch every picture, sound, film and document once, reporting progress. */
async function saveAll(client) {
  await ensureShell();
  const cache = await caches.open(MEDIA_CACHE);
  let done = 0;
  for (const p of MEDIA) {
    const url = abs(p);
    if (!(await cache.match(url))) {
      try {
        const res = await fetch(url);
        if (res.ok && res.status === 200) await cache.put(url, res);
      } catch {
        // skipped; tapping again picks it up
      }
    }
    done += 1;
    if (client) client.postMessage({ type: "save-progress", done, total: MEDIA.length });
  }
  if (client) client.postMessage({ type: "save-done", total: MEDIA.length });
}

async function status(client) {
  const cache = await caches.open(MEDIA_CACHE);
  let saved = 0;
  for (const p of MEDIA) if (await cache.match(abs(p))) saved += 1;
  if (client) client.postMessage({ type: "save-status", saved, total: MEDIA.length, version: VERSION });
}

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;
  if (type === "save-all") event.waitUntil(saveAll(event.source));
  if (type === "save-status") event.waitUntil(status(event.source));
});
