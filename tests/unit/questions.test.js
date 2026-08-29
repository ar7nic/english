import { describe, expect, it } from "vitest";
import { POOL, Q, Q2, Q3, Q4, SUITES } from "../../src/data/questions.js";
import { LEVELS, norm } from "../../src/lib/scoring.js";
import { slotKey } from "../../src/lib/selection.js";

/* Інваріанти пулу. Це той тест, який має впасти, коли до data/questions.js
   дописали новий блок і десь помилилися — а не e2e через півгодини. */
describe("пул питань", () => {
  it("складається з чотирьох частин і має 320 питань", () => {
    expect(POOL.length).toBe(Q.length + Q2.length + Q3.length + Q4.length);
    expect(POOL.length).toBe(320);
  });

  it("описує 20 тем", () => {
    expect(SUITES.length).toBe(20);
    expect(new Set(SUITES).size).toBe(20);
  });

  it("дає рівно 4 варіанти на кожен слот «тема + рівень + тип»", () => {
    const bySlot = new Map();
    POOL.forEach((item) => {
      const k = slotKey(item);
      bySlot.set(k, (bySlot.get(k) ?? 0) + 1);
    });
    expect(bySlot.size).toBe(80);
    const wrong = [...bySlot.entries()].filter(([, n]) => n !== 4);
    expect(wrong).toEqual([]);
  });

  it("дає по 16 питань на тему", () => {
    SUITES.forEach((_, s) => {
      expect(POOL.filter((i) => i.s === s).length).toBe(16);
    });
  });

  it("не має битих полів", () => {
    POOL.forEach((item, i) => {
      const where = `питання #${i} (${slotKey(item)})`;
      expect(SUITES[item.s], where).toBeTypeOf("string");
      expect(LEVELS, where).toContain(item.lvl);
      expect(item.q.length, where).toBeGreaterThan(5);
      expect(item.note, where).toBeTruthy();
      if (item.t === "mc") {
        expect(item.o.length, where).toBe(4);
        expect(new Set(item.o).size, where).toBe(4);
        expect(item.a, where).toBeGreaterThanOrEqual(0);
        expect(item.a, where).toBeLessThan(4);
      } else {
        expect(item.t, where).toBe("gap");
        expect(Array.isArray(item.accept), where).toBe(true);
        expect(item.accept.length, where).toBeGreaterThan(0);
        // те, що показує звіт, має саме зараховуватися перевіркою
        expect(item.accept.map(norm), where).toContain(norm(item.show));
      }
    });
  });

  it("не містить дублікатів тексту питань", () => {
    const seen = new Map();
    POOL.forEach((item, i) => {
      const k = norm(item.q);
      if (seen.has(k)) throw new Error(`дубль питання #${i} та #${seen.get(k)}: ${item.q}`);
      seen.set(k, i);
    });
    expect(seen.size).toBe(POOL.length);
  });
});
