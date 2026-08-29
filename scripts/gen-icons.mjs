/* ------------------------------------------------------------------ */
/*  Генерація іконок PWA                                               */
/*                                                                     */
/*  Малюємо ту саму «стрічку», що й у самому тесті: кілька стовпчиків, */
/*  останній — акцентом. Растеризація ручна (прямокутники + zlib із    */
/*  стандартної бібліотеки), щоб не тягнути sharp чи canvas заради     */
/*  трьох статичних файлів.                                            */
/*                                                                     */
/*    npm run icons                                                    */
/* ------------------------------------------------------------------ */

import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const BG = [0xed, 0xf0, 0xf4];
const BAR = [0xc3, 0xca, 0xd4];
const ACC = [0x3b, 0x34, 0xd6];

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // біт на канал
  ihdr[9] = 2; // truecolor RGB
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    const off = y * (size * 3 + 1);
    raw[off] = 0; // фільтр рядка: none
    pixels.copy(raw, off + 1, y * size * 3, (y + 1) * size * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* Полотно з примітивом «залити прямокутник» — більшого тут не треба. */
function canvas(size, bg) {
  const px = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    px[i * 3] = bg[0];
    px[i * 3 + 1] = bg[1];
    px[i * 3 + 2] = bg[2];
  }
  const rect = (x, y, w, h, color) => {
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(size, Math.round(x + w));
    const y1 = Math.min(size, Math.round(y + h));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const i = (yy * size + xx) * 3;
        px[i] = color[0];
        px[i + 1] = color[1];
        px[i + 2] = color[2];
      }
    }
  };
  return { px, rect };
}

/* inset — частка розміру, на яку підтискається малюнок.
   Для maskable це і є safe zone: кути іконки можуть бути обрізані. */
function icon(size, inset = 0.18) {
  const { px, rect } = canvas(size, BG);
  const area = size * (1 - inset * 2);
  const left = size * inset;
  const bottom = size * (1 - inset);
  const bars = 5;
  const gap = area * 0.07;
  const w = (area - gap * (bars - 1)) / bars;
  const heights = [0.34, 0.52, 0.68, 0.84, 1];
  for (let i = 0; i < bars; i++) {
    const h = area * heights[i];
    rect(left + i * (w + gap), bottom - h, w, h, i === bars - 1 ? ACC : BAR);
  }
  return png(size, px);
}

const files = [
  ["icon-192.png", icon(192, 0.18)],
  ["icon-512.png", icon(512, 0.18)],
  ["icon-maskable-512.png", icon(512, 0.26)],
];

for (const [name, buf] of files) {
  writeFileSync(join(OUT, name), buf);
  console.log(`${name} — ${buf.length} B`);
}

/* favicon у SVG: та сама стрічка, тільки векторна */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#EDF0F4"/>
  <rect x="12" y="34" width="6" height="18" fill="#C3CAD4"/>
  <rect x="21" y="28" width="6" height="24" fill="#C3CAD4"/>
  <rect x="30" y="22" width="6" height="30" fill="#C3CAD4"/>
  <rect x="39" y="17" width="6" height="35" fill="#C3CAD4"/>
  <rect x="48" y="12" width="6" height="40" fill="#3B34D6"/>
</svg>
`;
writeFileSync(join(OUT, "favicon.svg"), svg);
console.log("favicon.svg");
