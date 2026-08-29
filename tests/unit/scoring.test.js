import { describe, expect, it } from "vitest";
import { POOL } from "../../src/data/questions.js";
import { estimateLevel, isRight, LEVELS, norm, scoreAttempt } from "../../src/lib/scoring.js";

describe("norm", () => {
  it("зрівнює різні апострофи, регістр, пробіли й кінцеву крапку", () => {
    expect(norm("Don’t Work.")).toBe("don't work");
    expect(norm("  has   been  ")).toBe("has been");
    expect(norm("Yes!")).toBe("yes");
    expect(norm(undefined)).toBe("");
  });
});

describe("isRight", () => {
  const mc = { t: "mc", o: ["a", "b", "c", "d"], a: 2 };
  const gap = { t: "gap", accept: ["is sleeping", "'s sleeping"], show: "is sleeping" };

  it("порожня відповідь ніколи не правильна", () => {
    expect(isRight(mc, "")).toBe(false);
    expect(isRight(mc, undefined)).toBe(false);
    expect(isRight(mc, null)).toBe(false);
    expect(isRight(gap, "")).toBe(false);
  });

  it("нуль як індекс варіанта не плутається з порожньою відповіддю", () => {
    expect(isRight({ t: "mc", o: ["a", "b"], a: 0 }, 0)).toBe(true);
  });

  it("порівнює mc за індексом, зокрема рядковим", () => {
    expect(isRight(mc, 2)).toBe(true);
    expect(isRight(mc, "2")).toBe(true);
    expect(isRight(mc, 1)).toBe(false);
  });

  it("приймає будь-яке зі списку accept з поправкою на написання", () => {
    expect(isRight(gap, "is sleeping")).toBe(true);
    expect(isRight(gap, "  IS   Sleeping. ")).toBe(true);
    expect(isRight(gap, "’s sleeping")).toBe(true);
    expect(isRight(gap, "sleeps")).toBe(false);
  });

  it("зараховує і скорочення, і повну форму — так, як їх записано в пулі", () => {
    const q = POOL.find((i) => i.accept?.includes("don't understand"));
    expect(q, "у пулі має бути питання з don't understand").toBeTruthy();
    ["don't understand", "do not understand", "dont understand"].forEach((v) =>
      expect(isRight(q, v), v).toBe(true)
    );
    // різні типи апострофів, регістр і зайві пробіли
    expect(isRight(q, "Don’t  understand")).toBe(true);
    expect(isRight(q, "DON`T UNDERSTAND")).toBe(true);
    expect(isRight(q, "  don't understand.  ")).toBe(true);
    expect(isRight(q, "doesn't understand")).toBe(false);
  });

  it("кожне gap-питання пулу зараховує свою ж канонічну відповідь", () => {
    POOL.filter((i) => i.t === "gap").forEach((q) => {
      expect(isRight(q, q.show), q.q).toBe(true);
      expect(isRight(q, ` ${q.show.toUpperCase()}. `), q.q).toBe(true);
    });
  });
});

describe("estimateLevel", () => {
  const at = (A2, B1, B2) => estimateLevel({ A2, B1, B2 }).label;

  it("послідовно застосовує пороги — спрацьовує перше правило", () => {
    expect(at(0.85, 0.8, 0.75)).toBe("B2+");
    expect(at(0.8, 0.75, 0.55)).toBe("B2");
    expect(at(0.8, 0.6, 0)).toBe("B1+");
    expect(at(0.7, 0.45, 0)).toBe("B1");
    expect(at(0.55, 0, 0)).toBe("A2+");
    expect(at(0.54, 1, 1)).toBe("A2");
  });

  it("не піднімає рівень, коли не дотягує хоч один поріг", () => {
    expect(at(0.85, 0.8, 0.74)).toBe("B2"); // c нижче 0.75
    expect(at(0.79, 0.9, 0.9)).toBe("B1"); // a нижче 0.8
    expect(at(0.8, 0.59, 0.9)).toBe("B1"); // b нижче 0.6
  });

  it("на нулях повертає A2, а не падає", () => {
    expect(at(0, 0, 0)).toBe("A2");
    expect(estimateLevel({ A2: 0, B1: 0, B2: 0 }).text).toBeTruthy();
  });
});

describe("scoreAttempt", () => {
  const suites = ["Тема 0", "Тема 1"];
  // 4 базових питання: по два на тему, рівні A2/B1
  const pool = [
    { s: 0, lvl: "A2", t: "mc", o: ["a", "b"], a: 0, q: "q0" },
    { s: 0, lvl: "B1", t: "mc", o: ["a", "b"], a: 0, q: "q1" },
    { s: 1, lvl: "A2", t: "mc", o: ["a", "b"], a: 0, q: "q2" },
    { s: 1, lvl: "B2", t: "mc", o: ["a", "b"], a: 0, q: "q3" },
    // уточнення по темі 0
    { s: 0, lvl: "B2", t: "mc", o: ["a", "b"], a: 0, q: "p0" },
    { s: 0, lvl: "B2", t: "mc", o: ["a", "b"], a: 0, q: "p1" },
  ];
  const sel = [0, 1, 2, 3];
  const items = [0, 1, 2, 3, 4, 5];

  it("рахує рівень тільки з базової частини", () => {
    // базові — усі правильно, уточнення — усі неправильно
    const answers = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 };
    const r = scoreAttempt({ pool, suites, items, sel, answers });
    LEVELS.forEach((l) => expect(r.rates[l]).toBe(1));
    expect(r.perLevel.B2.t).toBe(1); // уточнення в знаменник не пішли
    expect(r.level.label).toBe("B2+");
    expect(r.baseTotal).toBe(4);
    expect(r.total).toBe(4);
  });

  it("розбивку по темах рахує з базових плюс уточнення", () => {
    const answers = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 };
    const r = scoreAttempt({ pool, suites, items, sel, answers });
    expect(r.perSuite[0]).toEqual({ name: "Тема 0", c: 2, t: 4 });
    expect(r.perSuite[1]).toEqual({ name: "Тема 1", c: 2, t: 2 });
  });

  it("збирає індекси помилок у порядку показу", () => {
    const answers = { 0: 1, 1: 0, 2: 1, 3: 0, 4: 0, 5: 0 };
    const r = scoreAttempt({ pool, suites, items, sel, answers });
    expect(r.wrong).toEqual([0, 2]);
    expect(r.total).toBe(4);
    expect(r.baseTotal).toBe(2);
  });

  it("не ділить на нуль, коли рівня немає в базовій частині", () => {
    const r = scoreAttempt({ pool, suites, items: [0], sel: [0], answers: { 0: 0 } });
    expect(r.rates.B2).toBe(0);
    expect(r.level.label).toBeTruthy();
  });
});
