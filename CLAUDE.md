# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Offline PWA for self-diagnosing English grammar (A2 → B2). Personal tool: no backend, no
accounts, no network requests — everything lives in the browser's `localStorage`. UI is
Ukrainian, questions are English. React 18 + Vite 6, no TypeScript.

`grammar-diagnostic.jsx` in the repo root is the original single-file artifact this app was
extracted from. It is **dead code, not imported anywhere** — kept only as reference. Never edit
it; edits there have zero effect.

## Commands

```bash
npm install
npm run dev                    # http://localhost:5173
npm run build                  # → dist/
npm run preview                # serve dist/ on :4173 — service worker only registers here, not in dev

npm test                       # unit tests (vitest)
npm run test:watch             # vitest watch mode
npx vitest run tests/unit/scoring.test.js   # single unit file
npx vitest run -t "оцінює рівень"           # single unit test by name

npm run test:e2e               # e2e (playwright; builds + previews automatically)
npx playwright test -g "перервана спроба"   # single e2e test by name
npx playwright install chromium             # required once before first test:e2e run

npm run icons                  # regenerate PWA icons from scripts/gen-icons.mjs
npm run fonts                  # re-fetch Google Fonts subsets into src/fonts (only command needing network)
```

There is no lint script. `npm run fonts` output (`src/fonts/*.woff2`, `src/fonts.css`) is
committed, so build/test/deploy never touch the network.

## Architecture

### Split: pure logic vs. React

`src/lib/*.js` and `src/data/questions.js` import nothing from React — that's *why*
`tests/unit/` can test them with `environment: "node"` and no rendering (see `vite.config.js`
`test.include`). `src/components/*.jsx` and `App.jsx` are the only React layer, driven purely by
props/state derived from `src/lib`. When changing scoring/selection/export logic, put it in
`lib/`, not inline in a component, or it becomes untestable without a DOM.

### The pool → selection → items → answers → results pipeline

This is the part that requires reading multiple files to get right; state shape is easy to
misuse otherwise.

- `src/data/questions.js`: `POOL` is a flat array of ~320 question objects, `SUITES` is the list
  of 20 topic names indexed by each question's `s` field. A slot is "topic + level + type"; there
  are exactly 4 variants per slot (enforced by `tests/unit/questions.test.js` — adding a 5th
  variant fails the test on purpose, since it invalidates the "4 attempts without repeats"
  guarantee documented below).
- `src/lib/selection.js`: `QID` gives every `POOL` index a stable id (`topic-level-type-n`) that
  survives new questions being appended to the pool — **history/usage tracking is keyed by QID,
  never by array index**. `buildSelection(usage)` picks the base test (`TEST_LEN` = one question
  per slot, currently 80): oldest-shown-first, ties broken randomly. `buildProbes(sel, answers,
  usage)` runs after the base test and adds `PROBES_PER_SUITE` (3) extra questions for topics at
  or below `WEAK_THRESHOLD` (0.5), capped at `MAX_WEAK_SUITES` (5) topics.
- `src/App.jsx`: `items = sel.concat(probes)` is the full question sequence for the attempt.
  **`answers` is keyed by position in `items` (0, 1, 2…), not by QID or pool index.** `results =
  scoreAttempt({ pool: POOL, suites: SUITES, items, sel, answers })` is memoized off that.
  `markUsed(usage, items, runNo)` is called exactly once, when `done` first becomes true — an
  interrupted attempt does not consume rotation, which is why this write is gated by the
  `recorded` ref rather than running on every render.
- `src/lib/scoring.js`: `scoreAttempt` returns `{ perSuite, perLevel, rates, wrong, total,
  baseTotal, level }`. `perLevel`/`rates`/`level` are computed from `sel` (base questions) only —
  probes intentionally target weak spots and would drag the estimated level down if counted.
  `perSuite` (topic breakdown) uses base + probes, since more data there is strictly better.
  `wrong` is an array of **indexes into `items`**, not QIDs or pool indexes — components/export
  code index back into `pool[items[i]]` and `answers[i]` together.

### Export / clipboard (Report screen)

`src/lib/export.js` builds two independent texts from the same `{ pool, suites, results, items,
sel, probes, answers }` payload — deliberately different content, don't merge them:
- `buildResultText` — human-readable Ukrainian: level, per-topic breakdown, plus every wrong
  answer with the question text, right answer, and given answer (via `mistake()`).
- `buildAiPrompt` — English, and **must stay English**: it's used as `?q=` URL prefill for
  ChatGPT/Perplexity via `aiLink()`, and Cyrillic inflates `encodeURIComponent` output ~3-4x,
  which was blowing past `MAX_PREFILL_URL` for most real attempts. It never includes question
  text — only topic names, the correct answer + level as a stand-in for "typical mistakes"
  (`missedBySuite`), and a fixed instruction block. Gemini/Claude don't support URL prefill at
  all (`AI_SERVICES[i].param === null`); the prompt is copied to the clipboard regardless, so
  pasting always works as a fallback.

`src/lib/clipboard.js` (`copyText`) is the shared three-tier copy: `navigator.clipboard` →
`document.execCommand('copy')` via a throwaway off-screen textarea → give up and let the caller
show the text for manual selection. Any new copy button should use this, not reimplement the
fallback chain.

### Storage

Three independent `localStorage` keys under `KEYS` in `src/lib/storage.js`, each with a distinct
lifecycle — don't assume "reset" clears all of them:

| key | holds | cleared by |
| --- | --- | --- |
| `progress` | in-flight attempt: `sel`, `probes`, `answers`, `idx`, `started`, `done`, `attemptId` | "Нова спроба" |
| `usage` | `{ run, used: { qid: run } }` rotation history | never automatically |
| `attempts` | up to 50 completed attempts | "Стерти історію" |
| `ai` | last AI service the user opened, for button ordering | never automatically |

`readJSON`/`writeJSON` wrap a `storage` adapter deliberately shaped like the async `get/set/delete`
API from the original Claude-artifact environment, so screens didn't need rewriting when it moved
to `localStorage`. Write failures are **not swallowed** — `App.jsx` surfaces them as `storeOk ===
false`, and the Report screen warns the user to copy their results before closing the tab.

### PWA

`vite-plugin-pwa` (`generateSW`/`autoUpdate`, config in `vite.config.js`) precaches
`js,css,html,svg,png,ico,woff2` — woff2 is deliberately added to the default set, or offline mode
falls back to a different font. No `runtimeCaching` rules exist; the app never makes network
requests, and `e2e/diagnostic.spec.js` has a test asserting exactly that (intercepts all requests,
requires zero foreign origins) plus one that reloads offline and checks fonts/functionality.

`base` in `vite.config.js` comes from `BASE_PATH` env (set by CI to `/${repo-name}/` since Pages
serves from a subpath); locally it's unset and defaults to `/`.

## Testing conventions

- `tests/unit/` mirrors `src/lib/` + `src/data/questions.js` one-to-one, vitest, no DOM.
- `e2e/diagnostic.spec.js` runs Playwright against the **production build** via
  `npm run preview` (see `playwright.config.js` — `webServer.command` runs `build && preview`,
  and `reuseExistingServer: false` is intentional so a stale build never gets silently reused).
  `e2e/helpers.js` has shared flows (`startTest`, `answerCurrent`, `walkToReport`, `collectQuestions`).
- Changing the first line of `buildResultText`'s output or removing/renaming the copy buttons on
  the Report screen breaks e2e assertions in `diagnostic.spec.js` — check that file when touching
  `src/lib/export.js` or the export section of `src/components/Report.jsx`.

## Adding questions

Append objects to any array in `src/data/questions.js`:

```js
{ s: 0, lvl: "A2", t: "mc", q: "...", o: ["a","b","c","d"], a: 1, note: "..." }
{ s: 0, lvl: "A2", t: "gap", q: "...", accept: ["is sleeping"], show: "is sleeping", note: "..." }
```

`npm test` enforces invariants: exactly 4 variants per slot, 16 questions per topic, valid
indexes/fields, `show` present in `accept`, no duplicates.
