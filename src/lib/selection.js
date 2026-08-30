/* ------------------------------------------------------------------ */
/*  Добір питань і ротація                                             */
/*                                                                     */
/*  Теж без React. rng виноситься параметром, щоб тести могли          */
/*  зафіксувати випадковість, а не ловити її статистично.              */
/* ------------------------------------------------------------------ */

import { POOL } from "../data/questions.js";
import { LEVELS, isRight } from "./scoring.js";

/* Стабільний ідентифікатор питання: не залежить від позиції в масиві,
   тому історію показів не зіб'є додавання нових питань у кінець. */
export const QID = (() => {
  const seen = {};
  return POOL.map((item) => {
    const k = `${item.s}-${item.lvl}-${item.t}`;
    seen[k] = (seen[k] || 0) + 1;
    return `${k}-${seen[k]}`;
  });
})();

/* Зворотний зв'язок qid → індекс у пулі: історія помилок зберігає qid,
   а звіт має показати текст питання. */
export const INDEX_BY_QID = QID.reduce((acc, qid, i) => {
  acc[qid] = i;
  return acc;
}, {});

export const questionByQid = (qid) => POOL[INDEX_BY_QID[qid]] ?? null;

/* Слот = "тема + рівень + тип". Базовий тест бере рівно по одному
   питанню з кожного слоту. */
export const slotKey = (item) => `${item.s}|${item.lvl}|${item.t}`;

export const TEST_LEN = new Set(POOL.map(slotKey)).size;

export const PROBES_PER_SUITE = 3;
export const MAX_WEAK_SUITES = 5;
export const WEAK_THRESHOLD = 0.5; // 2 з 4 і гірше

/* Стеля спроби: базові плюс уточнення в найгіршому випадку.
   Інтро обіцяє саме цей діапазон, тому число має рахуватися,
   а не бути вписаним у текст руками. */
export const MAX_TEST_LEN = TEST_LEN + MAX_WEAK_SUITES * PROBES_PER_SUITE;

/* Найдавніше показане — першим; серед однаково давніх — випадково.
   usage[qid] — номер спроби, у якій питання востаннє показувалося;
   0 (відсутнє) означає «ще жодного разу». */
const byOldest = (indexes, usage, rng) =>
  indexes
    .map((i) => ({ i, u: usage[QID[i]] ?? 0, r: rng() }))
    .sort((a, b) => a.u - b.u || a.r - b.r);

/* Базовий тест: 4 питання на кожну з 20 тем (тема + рівень + тип).
   На кожен слот припадає 4 варіанти — структура стала, зміст щоразу
   новий, а невикористане лишається для уточнень. */
export function buildSelection(usage = {}, rng = Math.random) {
  const groups = new Map();
  POOL.forEach((item, i) => {
    const k = slotKey(item);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(i);
  });
  const picked = [];
  groups.forEach((arr) => picked.push(byOldest(arr, usage, rng)[0].i));
  return picked.sort(
    (a, b) =>
      POOL[a].s - POOL[b].s ||
      LEVELS.indexOf(POOL[a].lvl) - LEVELS.indexOf(POOL[b].lvl) ||
      (POOL[a].t === POOL[b].t ? 0 : POOL[a].t === "mc" ? -1 : 1)
  );
}

/* Після базової частини: слабкі теми отримують ще по 3 питання.
   Разом виходить 7 питань на тему — цього вже досить, щоб відрізнити
   реальну прогалину від двох випадкових помилок. */
export function buildProbes(sel, answers, usage = {}, rng = Math.random) {
  const used = new Set(sel);
  const stat = {};
  sel.forEach((pi, i) => {
    const s = POOL[pi].s;
    if (!stat[s]) stat[s] = { c: 0, t: 0 };
    stat[s].t++;
    if (isRight(POOL[pi], answers[i])) stat[s].c++;
  });
  const weak = Object.keys(stat)
    .filter((s) => stat[s].c / stat[s].t <= WEAK_THRESHOLD)
    .sort((a, b) => stat[a].c / stat[a].t - stat[b].c / stat[b].t)
    .slice(0, MAX_WEAK_SUITES)
    .sort((a, b) => Number(a) - Number(b));

  const out = [];
  weak.forEach((s) => {
    // уточнення беруться з невикористаного в цій спробі й теж через ротацію
    const bank = [];
    POOL.forEach((item, i) => {
      if (item.s === Number(s) && !used.has(i)) bank.push(i);
    });
    byOldest(bank, usage, rng)
      .slice(0, PROBES_PER_SUITE)
      .forEach((x) => out.push(x.i));
  });
  return out;
}

/* Показані питання фіксуються один раз — коли з'явився звіт.
   Перервана спроба ротацію не витрачає. */
export function markUsed(usage, items, run) {
  const next = { ...usage };
  items.forEach((pi) => (next[QID[pi]] = run));
  return next;
}
