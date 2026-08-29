import { beforeEach, describe, expect, it } from "vitest";
import { POOL, SUITES } from "../../src/data/questions.js";
import { scoreAttempt } from "../../src/lib/scoring.js";
import { buildSelection, QID } from "../../src/lib/selection.js";
import { createStorage, KEYS } from "../../src/lib/storage.js";
import {
  appendAttempt,
  buildAttemptRecord,
  clearAttempts,
  importAttempts,
  mergeAttempts,
  parseAttemptsFile,
  MAX_ATTEMPTS,
  readAttempts,
  recurringMistakes,
  suiteTrends,
} from "../../src/lib/history.js";

function fakeStore() {
  const map = new Map();
  return createStorage(() => ({
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }));
}

const fixedRng = () => 0.5;
const rightAnswer = (item) => (item.t === "mc" ? item.a : item.show);

/* Спроба, у якій правильно все, крім тем із wrongSuites. */
function makeAttempt(wrongSuites = [], run = 1, date = new Date("2026-01-15T10:00:00Z")) {
  const sel = buildSelection({}, fixedRng);
  const answers = {};
  sel.forEach((pi, i) => {
    answers[i] = wrongSuites.includes(POOL[pi].s) ? "" : rightAnswer(POOL[pi]);
  });
  const items = sel;
  const results = scoreAttempt({ pool: POOL, suites: SUITES, items, sel, answers });
  return { record: buildAttemptRecord({ items, sel, answers, results, run, date }), sel, results };
}

describe("buildAttemptRecord", () => {
  it("зберігає дату, рівень, відсотки по рівнях і всі 20 тем", () => {
    const { record } = makeAttempt([]);
    expect(record.date).toBe("2026-01-15T10:00:00.000Z");
    expect(record.level).toBe("B2+");
    expect(record.rates).toEqual({ A2: 100, B1: 100, B2: 100 });
    expect(record.levelCounts.A2.t).toBeGreaterThan(0);
    expect(record.suites.length).toBe(20);
    expect(record.suites[0]).toEqual({ s: 0, name: SUITES[0], c: 4, t: 4 });
    expect(record.base).toEqual({ c: 80, t: 80 });
    expect(record.total).toEqual({ c: 80, t: 80 });
    expect(record.mistakes).toEqual([]);
  });

  it("для кожної помилки пише qid, дану і правильну відповідь", () => {
    const { record } = makeAttempt([2]);
    expect(record.mistakes.length).toBe(4);
    record.mistakes.forEach((m) => {
      expect(QID).toContain(m.qid);
      expect(m.s).toBe(2);
      expect(m.given).toBeNull(); // без відповіді
      expect(m.correct).toBeTruthy();
      expect(m.q).toBeTruthy();
    });
  });

  it("дану відповідь на mc зберігає текстом, а не індексом", () => {
    const sel = buildSelection({}, fixedRng);
    const first = POOL[sel[0]];
    const answers = {};
    sel.forEach((pi, i) => (answers[i] = rightAnswer(POOL[pi])));
    // навмисно неправильний варіант для першого питання
    answers[0] = first.a === 0 ? 1 : 0;
    const results = scoreAttempt({ pool: POOL, suites: SUITES, items: sel, sel, answers });
    const record = buildAttemptRecord({ items: sel, sel, answers, results, run: 1 });
    expect(record.mistakes[0].given).toBe(first.o[answers[0]]);
    expect(record.mistakes[0].correct).toBe(first.o[first.a]);
  });

  it("рахує кількість уточнень окремо від базової частини", () => {
    const sel = buildSelection({}, fixedRng);
    const items = sel.concat([sel[0] === 0 ? 1 : 0]);
    const answers = {};
    sel.forEach((pi, i) => (answers[i] = rightAnswer(POOL[pi])));
    const results = scoreAttempt({ pool: POOL, suites: SUITES, items, sel, answers });
    const record = buildAttemptRecord({ items, sel, answers, results, run: 2 });
    expect(record.probes).toBe(1);
    expect(record.base.t).toBe(80);
    expect(record.total.t).toBe(81);
  });
});

describe("сховище історії", () => {
  let store;
  beforeEach(() => {
    store = fakeStore();
  });

  it("додає спроби найновішою вперед", async () => {
    const a = makeAttempt([], 1, new Date("2026-01-01T10:00:00Z")).record;
    const b = makeAttempt([], 2, new Date("2026-02-01T10:00:00Z")).record;
    await appendAttempt(a, store);
    const all = await appendAttempt(b, store);
    expect(all.map((x) => x.run)).toEqual([2, 1]);
    expect((await readAttempts(store)).length).toBe(2);
  });

  it("не дублює той самий запис при повторному виклику", async () => {
    const a = makeAttempt([], 1).record;
    await appendAttempt(a, store);
    const all = await appendAttempt(a, store);
    expect(all.length).toBe(1);
  });

  it("тримає не більше MAX_ATTEMPTS записів", async () => {
    for (let i = 1; i <= MAX_ATTEMPTS + 3; i++) {
      await appendAttempt(
        makeAttempt([], i, new Date(Date.UTC(2026, 0, 1, i))).record,
        store
      );
    }
    const all = await readAttempts(store);
    expect(all.length).toBe(MAX_ATTEMPTS);
    expect(all[0].run).toBe(MAX_ATTEMPTS + 3);
  });

  it("чистить лише свій ключ", async () => {
    await store.set(KEYS.usage, JSON.stringify({ run: 4, used: { x: 1 } }));
    await appendAttempt(makeAttempt([], 1).record, store);
    await clearAttempts(store);
    expect(await readAttempts(store)).toEqual([]);
    expect(await store.get(KEYS.usage)).not.toBeNull();
  });

  it("на битих даних повертає порожній список", async () => {
    await store.set(KEYS.attempts, "{зламано");
    expect(await readAttempts(store)).toEqual([]);
  });
});

describe("імпорт історії", () => {
  let store;
  beforeEach(() => {
    store = fakeStore();
  });

  const exported = (records) =>
    JSON.stringify({ app: "grammar-diagnostic", version: 1, attempts: records });

  it("приймає і обгортку { attempts }, і голий масив", () => {
    const a = makeAttempt([], 1).record;
    expect(parseAttemptsFile(exported([a])).records).toHaveLength(1);
    expect(parseAttemptsFile(JSON.stringify([a])).records).toHaveLength(1);
  });

  it("пояснює, що не так із файлом", () => {
    expect(() => parseAttemptsFile("не json")).toThrow(/не JSON/);
    expect(() => parseAttemptsFile(JSON.stringify({ хтозна: 1 }))).toThrow(/списку спроб/);
    expect(() => parseAttemptsFile(JSON.stringify([{ id: "x" }]))).toThrow(/придатної/);
  });

  it("відкидає биті записи, але бере решту", () => {
    const good = makeAttempt([], 1).record;
    const { records, skipped } = parseAttemptsFile(exported([good, { id: "сміття" }, null]));
    expect(records).toHaveLength(1);
    expect(skipped).toBe(2);
  });

  it("зливає з наявними: збіги за id не дублюються", () => {
    const a = makeAttempt([], 1, new Date("2026-01-01T10:00:00Z")).record;
    const b = makeAttempt([], 2, new Date("2026-02-01T10:00:00Z")).record;
    const { merged, added, duplicates } = mergeAttempts([b], [a, b]);
    expect(added).toBe(1);
    expect(duplicates).toBe(1);
    expect(merged.map((x) => x.run)).toEqual([2, 1]); // найновіша перша
  });

  it("повний круг: експорт → чистка → імпорт повертає історію", async () => {
    const a = makeAttempt([], 1, new Date("2026-01-01T10:00:00Z")).record;
    const b = makeAttempt([3], 2, new Date("2026-02-01T10:00:00Z")).record;
    await appendAttempt(a, store);
    await appendAttempt(b, store);
    const dump = exported(await readAttempts(store));

    await clearAttempts(store);
    expect(await readAttempts(store)).toEqual([]);

    const res = await importAttempts(dump, store);
    expect(res.added).toBe(2);
    expect(res.duplicates).toBe(0);
    expect(await readAttempts(store)).toHaveLength(2);
    // помилки та розбивка по темах пережили круг без втрат
    const restored = (await readAttempts(store)).find((x) => x.id === b.id);
    expect(restored.mistakes).toEqual(b.mistakes);
    expect(restored.suites).toEqual(b.suites);
    expect(restored.rates).toEqual(b.rates);
  });

  it("повторний імпорт того самого файлу нічого не дублює", async () => {
    const a = makeAttempt([], 1).record;
    const dump = exported([a]);
    await importAttempts(dump, store);
    const second = await importAttempts(dump, store);
    expect(second.added).toBe(0);
    expect(second.duplicates).toBe(1);
    expect(await readAttempts(store)).toHaveLength(1);
  });

  it("не тримає більше за MAX_ATTEMPTS після злиття", async () => {
    const many = [];
    for (let i = 1; i <= MAX_ATTEMPTS + 5; i++) {
      many.push(makeAttempt([], i, new Date(Date.UTC(2026, 0, 1, i))).record);
    }
    const res = await importAttempts(exported(many), store);
    expect(res.attempts).toHaveLength(MAX_ATTEMPTS);
  });
});

describe("suiteTrends", () => {
  it("вибудовує точки від старішої спроби до новішої", () => {
    const older = makeAttempt([0], 1, new Date("2026-01-01T10:00:00Z")).record;
    const newer = makeAttempt([], 2, new Date("2026-02-01T10:00:00Z")).record;
    const trends = suiteTrends([newer, older]); // сховище віддає найновішу першою
    const t0 = trends[0];
    expect(t0.points.map((p) => p.rate)).toEqual([0, 1]);
    expect(t0.last.rate).toBe(1);
    expect(t0.delta).toBe(1);
    expect(trends[1].delta).toBe(0);
  });

  it("для першої спроби різниці немає", () => {
    const only = makeAttempt([], 1).record;
    const trends = suiteTrends([only]);
    expect(trends[0].delta).toBeNull();
    expect(trends[0].points.length).toBe(1);
  });

  it("покриває всі теми навіть на порожній історії", () => {
    const trends = suiteTrends([]);
    expect(trends.length).toBe(20);
    expect(trends[0].last).toBeNull();
    expect(trends[0].delta).toBeNull();
  });
});

describe("recurringMistakes", () => {
  it("показує питання, завалені двічі й більше", () => {
    const a = makeAttempt([5], 1, new Date("2026-01-01T10:00:00Z")).record;
    const b = makeAttempt([5], 2, new Date("2026-02-01T10:00:00Z")).record;
    // та сама вибірка при фіксованому rng — отже, ті самі qid
    const rec = recurringMistakes([b, a]);
    expect(rec.length).toBe(4);
    rec.forEach((m) => expect(m.times).toBe(2));
  });

  it("одноразову помилку не показує", () => {
    const a = makeAttempt([5], 1).record;
    expect(recurringMistakes([a])).toEqual([]);
  });
});
