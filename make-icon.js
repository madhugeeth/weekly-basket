// Generates icon PNGs for the home screen. Run: node make-icon.js
const fs = require("fs");
const zlib = require("zlib");

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x + 0.5, y + 0.5);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Basket glyph: green ground, white handle arc + trapezoid body with two slots.
const BG = [47, 107, 58], FG = [255, 255, 255];
function draw(size) {
  const s = size / 180; // design at 180
  const cx = 90;
  const sup = 4; // supersampling
  return (px, py) => {
    let hit = 0;
    for (let i = 0; i < sup; i++) for (let j = 0; j < sup; j++) {
      const x = (px + (i + 0.5) / sup - 0.5) / s, y = (py + (j + 0.5) / sup - 0.5) / s;
      // handle: arc centred (90,88) radius 34, stroke 9, upper half only
      const d = Math.hypot(x - cx, y - 88);
      const handle = y < 88 && Math.abs(d - 34) < 4.5;
      // body: trapezoid from y=82 (width 116) to y=134 (width 92), rounded bottom
      let body = false;
      if (y >= 82 && y <= 134) {
        const t = (y - 82) / 52;
        const half = 58 - 12 * t;
        const r = 10, byb = 134 - r;
        if (Math.abs(x - cx) <= half) {
          body = true;
          if (y > byb) {
            const ex = half - r;
            if (Math.abs(x - cx) > ex) body = Math.hypot(Math.abs(x - cx) - ex, y - byb) <= r;
          }
        }
        // rim band stays solid; below it cut two vertical slots
        if (body && y > 96 && y < 124 && (Math.abs(x - cx - 20) < 4 || Math.abs(x - cx + 20) < 4)) body = false;
      }
      if (handle || body) hit++;
    }
    const a = hit / (sup * sup);
    return BG.map((c, k) => Math.round(c + (FG[k] - c) * a));
  };
}
for (const size of [180, 512]) {
  fs.writeFileSync(`icon-${size}.png`, png(size, draw(size)));
  console.log(`icon-${size}.png`);
}
