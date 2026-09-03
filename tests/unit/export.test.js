import { describe, expect, it } from "vitest";
import {
  AI_SERVICES,
  MAX_PREFILL_URL,
  aiLink,
  buildAiPrompt,
  buildResultText,
  orderServices,
} from "../../src/lib/export.js";
import { scoreAttempt } from "../../src/lib/scoring.js";

/* Міні-набір: три теми по два питання, щоб на виході були
   і слабка тема, і тема на повторення, і сильна. */
const suites = ["Passive voice", "Articles & quantifiers", "Present tenses"];

const pool = [
  // 0 — Passive voice: обидва завалені → «Слабке місце»
  { s: 0, lvl: "B2", t: "mc", q: "The bridge ______ next year.", o: ["will complete", "will be completed"], a: 1, note: "Майбутній пасив: will be + V3." },
  { s: 0, lvl: "B2", t: "gap", q: "The room ______ (clean) every day.", accept: ["is cleaned"], show: "is cleaned", note: "Present Simple Passive: is + V3." },
  // 2 — Articles: одна помилка з двох → «Повторити»
  { s: 1, lvl: "B1", t: "mc", q: "I need ______ information.", o: ["some", "a"], a: 0, note: "information — незлічуване." },
  { s: 1, lvl: "A2", t: "mc", q: "She is ______ engineer.", o: ["a", "an"], a: 1, note: "Перед голосним звуком — an." },
  // 4 — Present tenses: обидва правильні → «Впевнено»
  { s: 2, lvl: "A2", t: "mc", q: "Water ______ at 100 degrees.", o: ["boil", "boils"], a: 1, note: "Present Simple, 3-тя особа." },
  { s: 2, lvl: "A2", t: "gap", q: "The baby ______ (sleep) now.", accept: ["is sleeping"], show: "is sleeping", note: "Дія зараз — Present Continuous." },
];

const items = [0, 1, 2, 3, 4, 5];
const sel = items;
const probes = [];
// 0 і 1 — помилки, 2 — без відповіді, решта — правильно
const answers = { 0: "0", 1: "will be cleaned", 2: "", 3: "1", 4: "1", 5: "is sleeping" };

const results = scoreAttempt({ pool, suites, items, sel, answers });
const payload = { pool, suites, results, items, sel, probes, answers };

describe("buildResultText", () => {
  const text = buildResultText(payload);

  it("починається з рядка, на який спирається e2e", () => {
    expect(text.startsWith("Результат тесту:")).toBe(true);
  });

  it("містить розбивку по темах зі статусом", () => {
    expect(text).toContain("Теми від слабшої до сильнішої:");
    expect(text).toContain("- Passive voice: 0/2 — Слабке місце");
    expect(text).toContain("- Present tenses: 2/2 — Впевнено");
  });

  it("містить питання з помилками, правильні та дані відповіді", () => {
    expect(text).toContain("Помилки (3):");
    expect(text).toContain("[Passive voice · B2] The bridge ______ next year.");
    expect(text).toContain("✓ will be completed");
    expect(text).toContain("✕ will complete");
    expect(text).toContain("Майбутній пасив: will be + V3.");
  });

  it("для питання без відповіді пише «без відповіді», а не undefined", () => {
    expect(text).toContain("✕ без відповіді");
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
  });

  it("без помилок пише про це прямо", () => {
    const perfect = { 0: "1", 1: "is cleaned", 2: "0", 3: "1", 4: "1", 5: "is sleeping" };
    const r = scoreAttempt({ pool, suites, items, sel, answers: perfect });
    const t = buildResultText({ ...payload, results: r, answers: perfect });
    expect(t).toContain("Помилок немає.");
    expect(t).not.toContain("Помилки (");
  });
});

describe("buildAiPrompt", () => {
  const prompt = buildAiPrompt(payload);

  it("написаний англійською — коротший URL для префілу і природніший для ШІ", () => {
    expect(prompt).toContain("You are an English grammar tutor.");
    expect(prompt).toContain("build a two-week study plan");
    expect(prompt).toContain("explanation of the rule in Ukrainian");
  });

  it("окремо просить пояснення українською — учень нею читає, не англійською", () => {
    expect(prompt).toContain("Write explanations in Ukrainian, examples in English.");
  });

  it("називає рівень і відсотки", () => {
    expect(prompt).toContain(`Level: ${results.level.label}`);
    expect(prompt).toMatch(/A2 \d+%, B1 \d+%, B2 \d+%/);
  });

  it("розкладає теми по трьох групах", () => {
    expect(prompt).toContain("Weak areas - this is where the work is needed:");
    expect(prompt).toContain("- Passive voice - 0/2");
    expect(prompt).toContain("Needs review:");
    expect(prompt).toContain("- Articles & quantifiers - 1/2");
    expect(prompt).toContain("Solid, do not spend time on these: Present tenses");
  });

  it("описує типи помилок правильними відповідями — не перекладає українські note", () => {
    expect(prompt).toContain("missed items:");
    expect(prompt).toContain("will be completed (B2)");
    expect(prompt).toContain("some (B1)");
    expect(prompt).not.toContain("Майбутній пасив");
    expect(prompt).not.toContain("незлічуване");
  });

  it("НЕ містить текстів питань — це головна відмінність від звіту", () => {
    expect(prompt).not.toContain("The bridge ______ next year.");
    expect(prompt).not.toContain("I need ______ information.");
    expect(prompt).not.toContain("✓");
    expect(prompt).not.toContain("✕");
  });

  it("не згадує групи, які виявилися порожніми", () => {
    const perfect = { 0: "1", 1: "is cleaned", 2: "0", 3: "1", 4: "1", 5: "is sleeping" };
    const r = scoreAttempt({ pool, suites, items, sel, answers: perfect });
    const t = buildAiPrompt({ ...payload, results: r, answers: perfect });
    expect(t).not.toContain("Weak areas");
    expect(t).not.toContain("Needs review");
    expect(t).toContain("Solid, do not spend time on these");
  });
});

describe("aiLink", () => {
  const svc = (id) => AI_SERVICES.find((s) => s.id === id);

  it("підставляє промпт там, де префіл працює", () => {
    const url = aiLink(svc("chatgpt"), "hello world");
    expect(url).toBe("https://chatgpt.com/?q=hello%20world");
    expect(aiLink(svc("perplexity"), "hi")).toBe("https://www.perplexity.ai/search?q=hi");
  });

  it("віддає голу адресу там, де префілу немає", () => {
    expect(aiLink(svc("gemini"), "hello")).toBe("https://gemini.google.com/app");
    expect(aiLink(svc("claude"), "hello")).toBe("https://claude.ai/new");
  });

  it("не будує задовгий URL — обрізаний промпт гірший за порожнє поле", () => {
    const long = "a".repeat(MAX_PREFILL_URL + 1);
    expect(aiLink(svc("chatgpt"), long)).toBe("https://chatgpt.com/");
  });
});

describe("orderServices", () => {
  it("ставить останній обраний сервіс першим", () => {
    expect(orderServices("gemini").map((s) => s.id)).toEqual([
      "gemini",
      "chatgpt",
      "claude",
      "perplexity",
    ]);
  });

  it("без вибору і з невідомим id лишає типовий порядок", () => {
    const base = AI_SERVICES.map((s) => s.id);
    expect(orderServices(null).map((s) => s.id)).toEqual(base);
    expect(orderServices("copilot").map((s) => s.id)).toEqual(base);
  });
});
