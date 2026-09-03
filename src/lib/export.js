/* ------------------------------------------------------------------ */
/*  Текстовий експорт звіту                                            */
/*                                                                     */
/*  Дві різні речі, які раніше були однією:                            */
/*                                                                     */
/*    buildResultText — сирі дані для людини: рівень, теми І всі       */
/*      помилки з питаннями та правильними відповідями.                */
/*    buildAiPrompt   — готове завдання для ШІ: тільки прогалини,      */
/*      БЕЗ окремих питань. Питання тут зайві: ШІ має згенерувати      */
/*      новий матеріал по темі, а не переказувати тест.                */
/*                                                                     */
/*  Чиста арифметика і рядки, без React — тестується без рендеру.      */
/* ------------------------------------------------------------------ */

import { pct, status } from "./format.js";
import { LEVELS } from "./scoring.js";

/* Скільки пропущених відповідей тягнути в промпт на одну тему.
   Без обмеження промпт роздувається і перестає влазити в URL. */
const MISSED_PER_SUITE = 4;

/* Опис однієї помилки: питання, правильна і дана відповідь.
   Та сама логіка, що рендерить секцію «Розбір помилок». */
export function mistake(pool, suites, items, answers, i) {
  const item = pool[items[i]];
  const given = answers[i];
  const givenText =
    item.t === "mc"
      ? given !== undefined && given !== ""
        ? item.o[Number(given)]
        : null
      : given || null;
  return {
    n: i + 1,
    s: item.s,
    suite: suites[item.s],
    lvl: item.lvl,
    q: item.q,
    right: item.t === "mc" ? item.o[item.a] : item.show,
    given: givenText,
    note: item.note,
  };
}

/* Теми від слабшої до сильнішої — порядок, у якому їх бачить користувач. */
const weakestFirst = (perSuite) =>
  [...perSuite].sort((a, b) => a.c / a.t - b.c / b.t);

const headLines = (results, items, sel, probes) => [
  `Результат тесту: ${results.level.label} — ${results.total}/${items.length} (${pct(
    results.total / items.length
  )}%)`,
  `Базова частина: ${results.baseTotal}/${sel.length}` +
    (probes.length ? `, уточнення: ${probes.length} питань` : ""),
  `За рівнями: ` +
    LEVELS.map(
      (l) => `${l} ${results.perLevel[l].c}/${results.perLevel[l].t} (${pct(results.rates[l])}%)`
    ).join(", "),
];

/* Повний звіт: те, що раніше копіювала єдина кнопка, плюс розбір помилок. */
export function buildResultText({ pool, suites, results, items, sel, probes, answers }) {
  const sorted = weakestFirst(results.perSuite);
  const lines = [
    ...headLines(results, items, sel, probes),
    ``,
    `Теми від слабшої до сильнішої:`,
    ...sorted.map((s) => `- ${s.name}: ${s.c}/${s.t} — ${status(s.c / s.t).t}`),
    ``,
  ];

  if (results.wrong.length === 0) {
    lines.push(`Помилок немає.`);
  } else {
    lines.push(`Помилки (${results.wrong.length}):`);
    results.wrong.forEach((i, k) => {
      const m = mistake(pool, suites, items, answers, i);
      lines.push(
        `${k + 1}. [${m.suite} · ${m.lvl}] ${m.q}`,
        `   ✓ ${m.right}`,
        `   ✕ ${m.given ?? "без відповіді"}`,
        `   ${m.note}`
      );
    });
  }

  return lines.join("\n");
}

/* Правильні відповіді з провалених питань, згруповані по темі —
   «типи помилок словами» без перекладу note (він українською).
   Форма правильної відповіді і рівень достатньо конкретні для ШІ
   й лишаються латиницею: саме це тримає URL коротким для префілу. */
function missedBySuite({ pool, suites, results, items, answers }) {
  const map = new Map();
  results.wrong.forEach((i) => {
    const m = mistake(pool, suites, items, answers, i);
    const tag = `${m.right} (${m.lvl})`;
    const list = map.get(m.s) ?? [];
    if (!list.includes(tag)) list.push(tag);
    map.set(m.s, list);
  });
  return map;
}

/* Завдання для ШІ, англійською: коротший і надійніший URL для префілу
   (кирилиця в encodeURIComponent важить у 3-4 рази більше), і сама
   мова інструкції природніша для більшості моделей. Пояснення правил
   ШІ просять писати українською окремою вказівкою — учень не володіє
   англійською настільки, щоб читати їх мовою оригіналу.
   Питання не включаються навмисно. */
export function buildAiPrompt({ pool, suites, results, items, sel, probes, answers }) {
  const missed = missedBySuite({ pool, suites, results, items, answers });
  const byName = new Map(suites.map((n, s) => [n, s]));
  const sorted = weakestFirst(results.perSuite);

  const bucket = (label) => sorted.filter((s) => status(s.c / s.t).t === label);
  const weak = bucket("Слабке місце");
  const review = bucket("Повторити");
  const strong = bucket("Впевнено");

  const withMissed = (s) => {
    const head = `- ${s.name} - ${s.c}/${s.t}`;
    const list = missed.get(byName.get(s.name));
    if (!list || list.length === 0) return head;
    return `${head}\n  missed items: ${list.slice(0, MISSED_PER_SUITE).join("; ")}`;
  };

  const lines = [
    `You are an English grammar tutor. Your student is a Ukrainian speaker who has just`,
    `taken a diagnostic grammar test (A2-B2). Here are the results.`,
    ``,
    `Level: ${results.level.label} (` +
      LEVELS.map((l) => `${l} ${pct(results.rates[l])}%`).join(", ") +
      `)`,
    ``,
  ];

  if (weak.length) {
    lines.push(`Weak areas - this is where the work is needed:`, ...weak.map(withMissed), ``);
  }
  if (review.length) {
    lines.push(`Needs review:`, ...review.map(withMissed), ``);
  }
  if (strong.length) {
    lines.push(`Solid, do not spend time on these: ${strong.map((s) => s.name).join(", ")}`, ``);
  }

  const focus = weak.length ? "weak areas" : review.length ? "topics that need review" : "topics with mistakes";
  lines.push(
    `Task: build a two-week study plan that closes the ${focus} listed above.`,
    `For each topic give:`,
    `1) a short explanation of the rule in Ukrainian;`,
    `2) 3-5 example sentences in English with Ukrainian translation;`,
    `3) 8-10 exercises with an answer key at the end;`,
    `4) the typical traps - use the missed items listed above.`,
    `Start with the weakest topic. Write explanations in Ukrainian, examples in English.`
  );

  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Відкриття ШІ                                                       */
/*                                                                     */
/*  Префіл через URL підтримують не всі: ChatGPT і Perplexity — так,   */
/*  Gemini нативно ні, у Claude параметр прибрали через prompt         */
/*  injection. Тому промпт завжди спершу кладеться в буфер, а посилання*/
/*  лише економить вставку там, де це працює.                          */
/* ------------------------------------------------------------------ */

/* Межа довжини URL із промптом. Кириличний текст роздувається у
   encodeURIComponent приблизно втричі-вчетверо (кожна літера → %XX%XX),
   тож 2000 не пропустили б жодного реального промпту. 8000 лишається
   із запасом під типову серверну межу на рядок запиту (16 КБ).
   Не влазить — префілу немає взагалі: обрізаний промпт гірший за
   порожнє поле, бо ШІ відповів би на половину завдання. */
export const MAX_PREFILL_URL = 8000;

export const AI_SERVICES = [
  { id: "chatgpt", name: "ChatGPT", base: "https://chatgpt.com/", param: "q" },
  { id: "gemini", name: "Gemini", base: "https://gemini.google.com/app", param: null },
  { id: "claude", name: "Claude", base: "https://claude.ai/new", param: null },
  { id: "perplexity", name: "Perplexity", base: "https://www.perplexity.ai/search", param: "q" },
];

/* Немає префілу або URL задовгий — віддаємо голу адресу: промпт уже
   в буфері, користувач вставить його сам. */
export function aiLink(svc, prompt) {
  if (!svc.param) return svc.base;
  const url = `${svc.base}?${svc.param}=${encodeURIComponent(prompt)}`;
  return url.length > MAX_PREFILL_URL ? svc.base : url;
}

/* Останній обраний сервіс стає першим у списку. */
export function orderServices(lastId, services = AI_SERVICES) {
  const first = services.filter((s) => s.id === lastId);
  return first.length ? first.concat(services.filter((s) => s.id !== lastId)) : services;
}
