/* ------------------------------------------------------------------ */
/*  Історія спроб                                                      */
/*                                                                     */
/*  Окремий ключ від progress і usage: «Нова спроба» чистить прогрес,  */
/*  але не історію й не ротацію.                                       */
/* ------------------------------------------------------------------ */

import { POOL, SUITES } from "../data/questions.js";
import { LEVELS } from "./scoring.js";
import { QID } from "./selection.js";
import { KEYS, readJSON, storage, writeJSON } from "./storage.js";

/* Скільки спроб тримаємо. Одна спроба — це ~2 КБ JSON, тож ліміт тут
   не про місце, а про те, щоб екран історії лишався читабельним. */
export const MAX_ATTEMPTS = 50;

const pct = (r) => Math.round(r * 100);

/* Текст відповіді, а не її індекс: запис має лишитися читабельним
   навіть якщо варіанти питання колись поміняються. */
function answerText(item, given) {
  if (given === undefined || given === null || given === "") return null;
  return item.t === "mc" ? item.o[Number(given)] ?? null : String(given);
}

const correctText = (item) => (item.t === "mc" ? item.o[item.a] : item.show);

/* Один запис історії з результатів завершеної спроби. Чиста функція —
   те саме, що показує звіт, тільки у придатному для зберігання вигляді. */
export function buildAttemptRecord({ items, sel, answers, results, run, date = new Date() }) {
  return {
    id: `${date.toISOString()}-${run}`,
    date: date.toISOString(),
    run,
    level: results.level.label,
    // відсотки по рівнях — рахуються тільки з базової частини
    rates: LEVELS.reduce((acc, l) => {
      acc[l] = pct(results.rates[l]);
      return acc;
    }, {}),
    levelCounts: LEVELS.reduce((acc, l) => {
      acc[l] = { c: results.perLevel[l].c, t: results.perLevel[l].t };
      return acc;
    }, {}),
    base: { c: results.baseTotal, t: sel.length },
    total: { c: results.total, t: items.length },
    probes: items.length - sel.length,
    // по темах — базові плюс уточнення
    suites: results.perSuite.map((s, i) => ({ s: i, name: s.name, c: s.c, t: s.t })),
    mistakes: results.wrong.map((i) => {
      const item = POOL[items[i]];
      return {
        qid: QID[items[i]],
        s: item.s,
        lvl: item.lvl,
        q: item.q,
        given: answerText(item, answers[i]),
        correct: correctText(item),
      };
    }),
  };
}

export async function readAttempts(store = storage) {
  const data = await readJSON(KEYS.attempts, [], store);
  return Array.isArray(data) ? data : [];
}

/* Найновіша спроба — першою; список підрізається до MAX_ATTEMPTS. */
export async function appendAttempt(record, store = storage) {
  const all = await readAttempts(store);
  if (all.some((a) => a.id === record.id)) return all;
  const next = [record, ...all].slice(0, MAX_ATTEMPTS);
  await writeJSON(KEYS.attempts, next, store);
  return next;
}

export async function clearAttempts(store = storage) {
  return store.delete(KEYS.attempts);
}

/* Мінімальна перевірка запису з файлу: підсовувати сюди можна що завгодно,
   а екран історії потім читає ці поля без жодних if. */
export function isAttemptRecord(a) {
  return Boolean(
    a &&
      typeof a === "object" &&
      typeof a.id === "string" &&
      typeof a.date === "string" &&
      !Number.isNaN(new Date(a.date).getTime()) &&
      typeof a.level === "string" &&
      a.rates &&
      LEVELS.every((l) => typeof a.rates[l] === "number") &&
      Array.isArray(a.suites) &&
      Array.isArray(a.mistakes) &&
      a.total &&
      typeof a.total.c === "number" &&
      typeof a.total.t === "number" &&
      a.base &&
      typeof a.base.c === "number"
  );
}

/* Розбір експортованого файлу: приймає і масив, і обгортку { attempts: [] }.
   Кидає помилку з людським текстом — її показує екран історії. */
export function parseAttemptsFile(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error("Це не JSON-файл.");
  }
  const list = Array.isArray(data) ? data : data && Array.isArray(data.attempts) ? data.attempts : null;
  if (!list) throw new Error("У файлі немає списку спроб.");
  const good = list.filter(isAttemptRecord);
  if (good.length === 0) throw new Error("У файлі немає жодної придатної спроби.");
  return { records: good, skipped: list.length - good.length };
}

/* Злиття імпорту з тим, що вже на пристрої: збіги за id не дублюються,
   решта підмішується і сортується за датою (найновіша перша). */
export function mergeAttempts(current, incoming) {
  const byId = new Map(current.map((a) => [a.id, a]));
  let added = 0;
  incoming.forEach((a) => {
    if (byId.has(a.id)) return;
    byId.set(a.id, a);
    added++;
  });
  const merged = [...byId.values()]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, MAX_ATTEMPTS);
  return { merged, added, duplicates: incoming.length - added };
}

export async function importAttempts(text, store = storage) {
  const { records, skipped } = parseAttemptsFile(text);
  const current = await readAttempts(store);
  const { merged, added, duplicates } = mergeAttempts(current, records);
  await writeJSON(KEYS.attempts, merged, store);
  return { attempts: merged, added, duplicates, skipped };
}

/* Динаміка по темах: для кожної теми — частка правильних у кожній
   спробі (від старішої до новішої) і різниця між двома останніми.
   attempts очікується у порядку «найновіша перша». */
export function suiteTrends(attempts) {
  const chrono = [...attempts].reverse();
  return SUITES.map((name, s) => {
    const points = chrono
      .map((a) => {
        const row = (a.suites || []).find((x) => x.s === s) ?? null;
        return row && row.t ? { date: a.date, rate: row.c / row.t, c: row.c, t: row.t } : null;
      })
      .filter(Boolean);
    const last = points[points.length - 1] ?? null;
    const prev = points[points.length - 2] ?? null;
    return {
      s,
      name,
      points,
      last,
      delta: last && prev ? last.rate - prev.rate : null,
    };
  });
}

/* Питання, які падають раз за разом: якщо той самий qid у помилках
   двох і більше спроб — це вже не випадковість. */
export function recurringMistakes(attempts, minTimes = 2) {
  const byQid = new Map();
  attempts.forEach((a) => {
    (a.mistakes || []).forEach((m) => {
      const cur = byQid.get(m.qid) ?? { ...m, times: 0, lastDate: a.date };
      cur.times++;
      byQid.set(m.qid, cur);
    });
  });
  return [...byQid.values()]
    .filter((m) => m.times >= minTimes)
    .sort((a, b) => b.times - a.times);
}
