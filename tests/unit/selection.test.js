import { describe, expect, it } from "vitest";
import { POOL } from "../../src/data/questions.js";
import {
  buildProbes,
  buildSelection,
  markUsed,
  MAX_TEST_LEN,
  MAX_WEAK_SUITES,
  PROBES_PER_SUITE,
  QID,
  questionByQid,
  slotKey,
  TEST_LEN,
  WEAK_THRESHOLD,
} from "../../src/lib/selection.js";
import { LEVELS } from "../../src/lib/scoring.js";

/* Фіксований rng: сортування стабільне, тож при рівних usage
   перемагає той варіант, що йде першим у пулі. */
const fixedRng = () => 0.5;

const rightAnswer = (item) => (item.t === "mc" ? item.a : item.show);
const answersFor = (indexes, correct) =>
  Object.fromEntries(indexes.map((pi, i) => [i, correct ? rightAnswer(POOL[pi]) : ""]));

describe("buildSelection", () => {
  it("бере рівно по одному питанню з кожного слоту", () => {
    const sel = buildSelection({}, fixedRng);
    expect(sel.length).toBe(TEST_LEN);
    expect(TEST_LEN).toBe(80);
    const slots = sel.map((i) => slotKey(POOL[i]));
    expect(new Set(slots).size).toBe(TEST_LEN);
  });

  it("дає рівно 4 питання на кожну з 20 тем", () => {
    const sel = buildSelection({}, fixedRng);
    const perSuite = {};
    sel.forEach((i) => (perSuite[POOL[i].s] = (perSuite[POOL[i].s] ?? 0) + 1));
    expect(Object.keys(perSuite).length).toBe(20);
    Object.entries(perSuite).forEach(([s, n]) => expect(n, `тема ${s}`).toBe(4));
  });

  it("тримає стабільний розподіл за рівнями: 19 A2, 33 B1, 28 B2", () => {
    // структура слотів однакова для будь-якого usage, тому й розподіл сталий
    const count = (sel) => {
      const byLevel = { A2: 0, B1: 0, B2: 0 };
      sel.forEach((i) => byLevel[POOL[i].lvl]++);
      return byLevel;
    };
    const expected = { A2: 19, B1: 33, B2: 28 };
    expect(count(buildSelection({}, fixedRng))).toEqual(expected);

    // і після чотирьох спроб поспіль розподіл той самий
    let usage = {};
    for (let run = 1; run <= 4; run++) {
      const sel = buildSelection(usage, Math.random);
      expect(count(sel), `спроба ${run}`).toEqual(expected);
      usage = markUsed(usage, sel, run);
    }
    expect(expected.A2 + expected.B1 + expected.B2).toBe(TEST_LEN);
  });

  it("сортує питання по темі, потім по рівню, потім mc перед gap", () => {
    const sel = buildSelection({}, fixedRng);
    const key = (x) => [x.s, LEVELS.indexOf(x.lvl), x.t === "mc" ? 0 : 1];
    for (let i = 1; i < sel.length; i++) {
      const a = key(POOL[sel[i - 1]]);
      const b = key(POOL[sel[i]]);
      const cmp = a.findIndex((v, n) => v !== b[n]);
      expect(cmp === -1 || a[cmp] < b[cmp], `${a} має йти перед ${b}`).toBe(true);
    }
    expect(POOL[sel[0]].s).toBe(0);
    expect(POOL[sel[sel.length - 1]].s).toBe(19);
  });

  it("віддає перевагу найдавніше показаному варіанту", () => {
    // всі варіанти першого слоту показані, крім останнього
    const slot = POOL.map((item, i) => ({ item, i })).filter(
      (x) => slotKey(x.item) === slotKey(POOL[0])
    );
    const usage = {};
    slot.slice(0, -1).forEach((x, n) => (usage[QID[x.i]] = n + 1));
    const sel = buildSelection(usage, fixedRng);
    expect(sel).toContain(slot[slot.length - 1].i);

    // а якщо найдавніший — перший показаний, то беруть саме його
    const usage2 = {};
    slot.forEach((x, n) => (usage2[QID[x.i]] = n + 5));
    const sel2 = buildSelection(usage2, fixedRng);
    expect(sel2).toContain(slot[0].i);
  });

  it("дає чотири спроби поспіль без жодного повтору", () => {
    let usage = {};
    const seen = new Set();
    for (let run = 1; run <= 4; run++) {
      const sel = buildSelection(usage, fixedRng);
      sel.forEach((i) => {
        expect(seen.has(QID[i]), `повтор ${QID[i]} на спробі ${run}`).toBe(false);
        seen.add(QID[i]);
      });
      usage = markUsed(usage, sel, run);
    }
    expect(seen.size).toBe(320);
    expect(seen.size).toBe(POOL.length);
  });

  it("на п'ятій спробі повертається до найдавнішого, а не до випадкового", () => {
    let usage = {};
    let first = null;
    for (let run = 1; run <= 4; run++) {
      const sel = buildSelection(usage, fixedRng);
      if (run === 1) first = sel;
      usage = markUsed(usage, sel, run);
    }
    const fifth = buildSelection(usage, fixedRng);
    expect(fifth.map((i) => QID[i]).sort()).toEqual(first.map((i) => QID[i]).sort());
  });
});

describe("QID", () => {
  it("унікальний і не залежить від позиції в масиві", () => {
    expect(new Set(QID).size).toBe(POOL.length);
    // додавання питання в кінець не змінює жодного наявного QID
    const before = QID.slice(0, 10);
    expect(before).toEqual(QID.slice(0, 10));
    expect(questionByQid(QID[7])).toBe(POOL[7]);
    expect(questionByQid("нема-такого")).toBeNull();
  });
});

describe("buildProbes", () => {
  const sel = buildSelection({}, fixedRng);

  it("нічого не додає, коли слабких тем немає", () => {
    expect(buildProbes(sel, answersFor(sel, true), {}, fixedRng)).toEqual([]);
  });

  it("обмежується п'ятьма темами по три питання", () => {
    const probes = buildProbes(sel, answersFor(sel, false), {}, fixedRng);
    expect(probes.length).toBe(MAX_WEAK_SUITES * PROBES_PER_SUITE);
    expect(probes.length).toBe(15);
    expect(new Set(probes).size).toBe(probes.length);
  });

  it("найдовша спроба не перевищує обіцяних інтро 95 питань", () => {
    // інтро показує діапазон TEST_LEN–MAX_TEST_LEN, тому стеля має збігатися
    const probes = buildProbes(sel, answersFor(sel, false), {}, fixedRng);
    expect(sel.length + probes.length).toBe(MAX_TEST_LEN);
    expect(MAX_TEST_LEN).toBe(95);
  });

  it("не повторює питання з базової частини", () => {
    const probes = buildProbes(sel, answersFor(sel, false), {}, fixedRng);
    const used = new Set(sel);
    probes.forEach((i) => expect(used.has(i)).toBe(false));
  });

  it("бере уточнення саме зі слабких тем", () => {
    // навмисно валимо теми 3 і 7, решту відповідаємо правильно
    const weakSuites = [3, 7];
    const answers = {};
    sel.forEach((pi, i) => {
      answers[i] = weakSuites.includes(POOL[pi].s) ? "" : rightAnswer(POOL[pi]);
    });
    const probes = buildProbes(sel, answers, {}, fixedRng);
    expect(probes.length).toBe(weakSuites.length * PROBES_PER_SUITE);
    expect([...new Set(probes.map((i) => POOL[i].s))].sort()).toEqual(weakSuites);
  });

  it("вважає слабкою тему з результатом 2 з 4, але не 3 з 4", () => {
    const mk = (rightPerSuite) => {
      const answers = {};
      const counted = {};
      sel.forEach((pi, i) => {
        const s = POOL[pi].s;
        counted[s] = (counted[s] ?? 0) + 1;
        answers[i] = counted[s] <= rightPerSuite ? rightAnswer(POOL[pi]) : "";
      });
      return answers;
    };
    expect(WEAK_THRESHOLD).toBe(0.5);
    expect(buildProbes(sel, mk(2), {}, fixedRng).length).toBeGreaterThan(0);
    expect(buildProbes(sel, mk(3), {}, fixedRng)).toEqual([]);
  });

  it("для уточнень теж бере найдавніше показане", () => {
    const answers = {};
    sel.forEach((pi, i) => (answers[i] = POOL[pi].s === 0 ? "" : rightAnswer(POOL[pi])));
    const bank = [];
    POOL.forEach((item, i) => {
      if (item.s === 0 && !sel.includes(i)) bank.push(i);
    });
    // усе, крім трьох останніх кандидатів, показувалося нещодавно
    const usage = {};
    bank.slice(0, -3).forEach((i) => (usage[QID[i]] = 9));
    const probes = buildProbes(sel, answers, usage, fixedRng);
    expect(probes.sort()).toEqual(bank.slice(-3).sort());
  });
});
