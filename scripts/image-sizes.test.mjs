import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { sizeOf } from "./image-sizes.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("sizeOf reads PNG, JPEG, WebP and SVG headers", () => {
  const png = Buffer.alloc(24);
  png.writeUInt32BE(0x89504e47, 0);
  png.writeUInt32BE(640, 16);
  png.writeUInt32BE(480, 20);
  assert.deepEqual(sizeOf(png), [640, 480]);

  // SOI, an APP0 segment to skip, then SOF0 (height before width)
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0xe0, 0x02, 0x80, 0x03]);
  assert.deepEqual(sizeOf(jpeg), [640, 480]);

  const webp = Buffer.alloc(30);
  webp.write("RIFF", 0, "ascii");
  webp.write("WEBP", 8, "ascii");
  webp.write("VP8X", 12, "ascii");
  webp.writeUIntLE(1199, 24, 3);
  webp.writeUIntLE(799, 27, 3);
  assert.deepEqual(sizeOf(webp), [1200, 800]);

  assert.deepEqual(sizeOf(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">')), [640, 400]);
  assert.deepEqual(sizeOf(Buffer.from('<svg width="120" height="90px" viewBox="0 0 12 9">')), [120, 90]);
});

test("src/lib/image-sizes.ts matches the pictures in public/img (run npm run image-sizes)", () => {
  const listed = readFileSync(join(ROOT, "src/lib/image-sizes.ts"), "utf8");
  const pub = join(ROOT, "public");
  const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
  for (const p of walk(join(pub, "img")).filter((f) => /\.(png|jpe?g|webp|svg)$/i.test(f))) {
    const key = `/${relative(pub, p).split(sep).join("/")}`;
    const size = sizeOf(readFileSync(p));
    assert.ok(listed.includes(`"${key}": [${size[0]}, ${size[1]}]`), `${key} is missing or out of date`);
  }
});
