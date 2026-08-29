/* ------------------------------------------------------------------ */
/*  Локальні шрифти                                                    */
/*                                                                     */
/*  Оригінал тягнув Archivo та IBM Plex з fonts.googleapis.com. Для    */
/*  офлайнового PWA це зовнішній запит у рантаймі, тому шрифти треба   */
/*  покласти поруч із додатком.                                        */
/*                                                                     */
/*  Скрипт іде в мережу ОДИН раз — на етапі підготовки, не в рантаймі: */
/*  забирає css2, лишає підмножини latin і cyrillic (українська        */
/*  вкладається в U+0400-045F та U+0490-0491), качає woff2 у           */
/*  src/fonts і генерує src/fonts.css з локальними шляхами.         */
/*                                                                     */
/*    npm run fonts                                                    */
/*                                                                     */
/*  Файли woff2 комітяться в репозиторій: збірка й деплой мережі не    */
/*  потребують.                                                        */
/* ------------------------------------------------------------------ */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FONT_DIR = join(ROOT, "src", "fonts");

const CSS_URL =
  "https://fonts.googleapis.com/css2" +
  "?family=Archivo:wght@500..800" +
  "&family=IBM+Plex+Mono:wght@400;500;600" +
  "&family=IBM+Plex+Sans:wght@400..600" +
  "&display=swap";

// без сучасного UA Google віддає ttf замість woff2
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const KEEP = new Set(["latin", "cyrillic"]);

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const css = await (await fetch(CSS_URL, { headers: { "User-Agent": UA } })).text();

/* Кожен блок у css2 позначений коментарем із назвою підмножини. */
const blocks = [];
const re = /\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
let m;
while ((m = re.exec(css))) blocks.push({ subset: m[1], body: m[2] });

const field = (body, name) => {
  const hit = body.match(new RegExp(`${name}:\\s*([^;]+);`));
  return hit ? hit[1].trim().replace(/^['"]|['"]$/g, "") : null;
};

mkdirSync(FONT_DIR, { recursive: true });

const faces = [];
for (const { subset, body } of blocks) {
  if (!KEEP.has(subset)) continue;
  const family = field(body, "font-family");
  const weight = field(body, "font-weight");
  const style = field(body, "font-style");
  const range = field(body, "unicode-range");
  const url = body.match(/url\((https:[^)]+)\)/)?.[1];
  if (!family || !url) continue;

  const name = `${slug(family)}-${slug(weight)}-${subset}.woff2`;
  const bytes = Buffer.from(await (await fetch(url, { headers: { "User-Agent": UA } })).arrayBuffer());
  writeFileSync(join(FONT_DIR, name), bytes);
  faces.push({ family, weight, style, range, name, size: bytes.length });
  console.log(`${name} — ${(bytes.length / 1024).toFixed(1)} КБ`);
}

const out = [
  "/* ------------------------------------------------------------------ */",
  "/*  Згенеровано scripts/fetch-fonts.mjs — руками не правити.           */",
  "/*  Шрифти лежать локально в src/fonts: у рантаймі жодного          */",
  "/*  звернення до fonts.googleapis.com чи fonts.gstatic.com.            */",
  "/* ------------------------------------------------------------------ */",
  "",
  ...faces.map((f) =>
    [
      "@font-face {",
      `  font-family: '${f.family}';`,
      `  font-style: ${f.style};`,
      `  font-weight: ${f.weight};`,
      "  font-display: swap;",
      `  src: url('./fonts/${f.name}') format('woff2');`,
      `  unicode-range: ${f.range};`,
      "}",
    ].join("\n")
  ),
  "",
].join("\n");

writeFileSync(join(ROOT, "src", "fonts.css"), out);
console.log(
  `\n${faces.length} накреслень, ${(faces.reduce((s, f) => s + f.size, 0) / 1024).toFixed(0)} КБ → src/fonts.css`
);
