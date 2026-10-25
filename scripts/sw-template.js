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
const VERSION = "__VERSION__";
const SHELL = __SHELL__;
const MEDIA = __MEDIA__;

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
 * A sound (the music, a voice) or a film (the home page's intro) is played in byte ranges, which are not saved: the
 * first time it plays, a whole copy is saved in the background, so next time it starts at once — and plays offline.
 * Not the AR call-outs: Google's AR viewer downloads those itself.
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
    if (/\.(?:mp3|mp4)$/.test(path) && !/\/ar\/[^/]*$/.test(path)) event.waitUntil(saveWhole(request.url));
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
