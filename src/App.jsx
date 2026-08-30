import React, { useEffect, useMemo, useRef, useState } from "react";
import { POOL, SUITES } from "./data/questions.js";
import {
  buildProbes,
  buildSelection,
  markUsed,
  MAX_TEST_LEN,
  TEST_LEN,
} from "./lib/selection.js";
import { scoreAttempt } from "./lib/scoring.js";
import { KEYS, readJSON, storage, writeJSON } from "./lib/storage.js";
import {
  appendAttempt,
  buildAttemptRecord,
  clearAttempts,
  importAttempts,
  readAttempts,
} from "./lib/history.js";
import Intro from "./components/Intro.jsx";
import Question from "./components/Question.jsx";
import Report from "./components/Report.jsx";
import History from "./components/History.jsx";

/* Пауза перед записом: інакше кожна натиснута літера — окремий запис. */
const SAVE_DELAY = 800;

export default function App() {
  const [view, setView] = useState("test"); // "test" | "history"
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [sel, setSel] = useState([]);
  const [probes, setProbes] = useState([]);
  const [usage, setUsage] = useState({});
  const [runNo, setRunNo] = useState(0);
  const [attempts, setAttempts] = useState([]);
  // null — ще нічого не змінювали, "pending" — чекаємо на паузу,
  // true — записано, false — сховище відмовило
  const [storeOk, setStoreOk] = useState(null);

  const attemptId = useRef(null); // id запису історії для поточної спроби
  const recorded = useRef(false); // ротація і історія записуються рівно один раз
  const inputRef = useRef(null);
  const saveTimer = useRef(null);
  const skipSave = useRef(true); // відновлений стан не треба одразу писати назад

  const items = useMemo(() => sel.concat(probes), [sel, probes]);
  const q = POOL[items[idx]];

  /* ---------------- відновлення стану ---------------- */
  useEffect(() => {
    (async () => {
      // усі три ключі незалежні: збій одного не має валити решту
      const u = await readJSON(KEYS.usage, null);
      if (u) {
        setUsage(u.used || {});
        setRunNo(u.run || 0);
      }
      setAttempts(await readAttempts());

      const s = await readJSON(KEYS.progress, null);
      if (s) {
        if (Array.isArray(s.sel) && s.sel.length === TEST_LEN) setSel(s.sel);
        if (Array.isArray(s.probes)) setProbes(s.probes);
        if (s.answers) setAnswers(s.answers);
        if (typeof s.idx === "number") setIdx(s.idx);
        if (s.started) setStarted(true);
        if (s.done) {
          setDone(true);
          // спроба вже дійшла до звіту в минулій сесії — ротація витрачена
          recorded.current = true;
          attemptId.current = s.attemptId ?? null;
        }
      }
      setHydrated(true);
      setLoading(false);
    })();
  }, []);

  /* ---------------- збереження прогресу ---------------- */
  useEffect(() => {
    if (!hydrated) return;
    // перший прохід після відновлення — це ще не зміна стану
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    const payload = { answers, idx, started, done, sel, probes, attemptId: attemptId.current };
    const delay = done ? 0 : SAVE_DELAY;
    setStoreOk("pending");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await writeJSON(KEYS.progress, payload);
        setStoreOk(true);
      } catch (e) {
        // не глушимо: користувач має побачити, що прогрес не лягає на диск
        setStoreOk(false);
      }
    }, delay);
    return () => clearTimeout(saveTimer.current);
  }, [answers, idx, started, done, sel, probes, hydrated]);

  useEffect(() => {
    if (started && !done && q && q.t === "gap" && inputRef.current) inputRef.current.focus();
  }, [idx, started, done, q]);

  const results = useMemo(
    () => scoreAttempt({ pool: POOL, suites: SUITES, items, sel, answers }),
    [items, sel, answers]
  );

  /* ---------------- фіксація спроби ----------------
     Показані питання і запис історії фіксуються один раз — у момент
     появи звіту. Перервана спроба ротацію не витрачає. */
  useEffect(() => {
    if (!hydrated || !done || recorded.current || items.length === 0) return;
    recorded.current = true;
    const nextRun = runNo + 1;
    const nextUsage = markUsed(usage, items, nextRun);
    setUsage(nextUsage);
    setRunNo(nextRun);

    const record = buildAttemptRecord({ items, sel, answers, results, run: nextRun });
    attemptId.current = record.id;

    (async () => {
      try {
        await writeJSON(KEYS.usage, { run: nextRun, used: nextUsage });
      } catch (e) {
        setStoreOk(false); // ротація не збереглася — наступна спроба повторить питання
      }
      try {
        setAttempts(await appendAttempt(record));
      } catch (e) {
        setStoreOk(false);
      }
    })();
  }, [done, hydrated, items, runNo, usage, sel, answers, results]);

  /* ---------------- дії ---------------- */
  const setAns = (v) => setAnswers((p) => ({ ...p, [idx]: v }));
  const go = (n) => setIdx(Math.min(items.length - 1, Math.max(0, n)));

  const finishBase = () => {
    const p = buildProbes(sel, answers, usage);
    if (p.length === 0) {
      setDone(true);
      return;
    }
    setProbes(p);
    setIdx(sel.length);
  };

  /* Нова спроба чистить лише progress. usage і attempts лишаються:
     інакше зламається ротація і зникне динаміка по темах. */
  const reset = async () => {
    setAnswers({});
    setIdx(0);
    setDone(false);
    setStarted(false);
    setProbes([]);
    setSel(buildSelection(usage));
    setStoreOk(null);
    recorded.current = false;
    attemptId.current = null;
    try {
      await storage.delete(KEYS.progress);
    } catch (e) {
      /* нічого було видаляти */
    }
  };

  const dropHistory = async () => {
    try {
      await clearAttempts();
      setAttempts([]);
    } catch (e) {
      setStoreOk(false);
    }
  };

  /* Помилку розбору файлу навмисно віддаємо нагору: екран історії
     покаже користувачу, що саме не так із файлом. */
  const importHistory = async (text) => {
    const res = await importAttempts(text);
    setAttempts(res.attempts);
    return res;
  };

  const prevAttempt = useMemo(
    () => attempts.find((a) => a.id !== attemptId.current) ?? null,
    [attempts, done]
  );

  /* ---------------- екрани ---------------- */
  if (loading) {
    return (
      <div className="gd">
        <div className="gd-wrap">
          <div className="gd-eyebrow">Завантаження збереженого прогресу…</div>
        </div>
      </div>
    );
  }

  if (view === "history") {
    return (
      <div className="gd">
        <History
          attempts={attempts}
          onBack={() => setView("test")}
          onClear={dropHistory}
          onImport={importHistory}
        />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="gd">
        <Intro
          testLen={TEST_LEN}
          maxLen={MAX_TEST_LEN}
          suitesLen={SUITES.length}
          runNo={runNo}
          attemptsCount={attempts.length}
          onHistory={() => setView("history")}
          onStart={() => {
            if (sel.length === 0) setSel(buildSelection(usage));
            setStarted(true);
          }}
        />
      </div>
    );
  }

  if (done) {
    return (
      <div className="gd">
        <Report
          results={results}
          items={items}
          sel={sel}
          probes={probes}
          answers={answers}
          storeOk={storeOk}
          prevAttempt={prevAttempt}
          attemptsCount={attempts.length}
          onReset={reset}
          onHistory={() => setView("history")}
        />
      </div>
    );
  }

  return (
    <div className="gd">
      <Question
        q={q}
        idx={idx}
        items={items}
        answers={answers}
        answeredCount={Object.keys(answers).filter((k) => answers[k] !== "").length}
        storeOk={storeOk}
        selLen={sel.length}
        probesLen={probes.length}
        inputRef={inputRef}
        onAnswer={setAns}
        onGo={go}
        onFinishBase={finishBase}
        onDone={() => setDone(true)}
      />
    </div>
  );
}
