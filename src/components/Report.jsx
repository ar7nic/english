import React, { useEffect, useMemo, useState } from "react";
import { POOL, SUITES } from "../data/questions.js";
import { LEVELS, isRight } from "../lib/scoring.js";
import { formatDate, pct, status } from "../lib/format.js";
import { copyText } from "../lib/clipboard.js";
import { AI_SERVICES, aiLink, buildAiPrompt, buildResultText, orderServices } from "../lib/export.js";
import { KEYS, readJSON, writeJSON } from "../lib/storage.js";

/* Звіт: рівень, розбивка по рівнях і темах, розбір помилок,
   експорт тексту і передача прогалин у ШІ. */
export default function Report({
  results,
  items,
  sel,
  probes,
  answers,
  storeOk,
  prevAttempt,
  attemptsCount,
  onReset,
  onHistory,
}) {
  // "" | "result" | "prompt" — що саме щойно скопіювали
  const [copied, setCopied] = useState("");
  // текст, який не вдалося покласти в буфер: показуємо на екрані
  const [manual, setManual] = useState(null);
  // підказка після відкриття ШІ: чи промпт підставився в URL сам
  const [opened, setOpened] = useState(null);
  const [lastAi, setLastAi] = useState(null);

  const percent = pct(results.total / items.length);
  const sorted = [...results.perSuite].sort((a, b) => a.c / a.t - b.c / b.t);

  const payload = { pool: POOL, suites: SUITES, results, items, sel, probes, answers };
  const resultText = useMemo(
    () => buildResultText(payload),
    [results, items, sel, probes, answers]
  );
  const promptText = useMemo(
    () => buildAiPrompt(payload),
    [results, items, sel, probes, answers]
  );

  useEffect(() => {
    readJSON(KEYS.ai, null).then((v) => setLastAi(v && v.id ? v.id : null));
  }, []);

  const services = orderServices(lastAi, AI_SERVICES);

  const copy = async (kind, text) => {
    setManual(null);
    setOpened(null);
    const res = await copyText(text);
    if (res === "ok") {
      setCopied(kind);
      setTimeout(() => setCopied(""), 2500);
      return;
    }
    // буфер недоступний — лишається виділити текст руками
    setCopied("");
    setManual({ kind, text });
  };

  /* Копіювання запускається в тому ж жесті, а перехід робить сам <a>:
     window.open() після await ріже блокувальник спливаючих вікон. */
  const openAi = (svc) => {
    copyText(promptText);
    setManual(null);
    setCopied("");
    setOpened({ name: svc.name, prefilled: aiLink(svc, promptText) !== svc.base });
    setLastAi(svc.id);
    // збій запису тут нічого не ламає: зміниться лише порядок кнопок
    writeJSON(KEYS.ai, { id: svc.id }).catch(() => {});
  };

  return (
    <div className="gd-wrap">
      <div className="gd-top">
        <div className="gd-eyebrow">Звіт</div>
        {attemptsCount > 0 && (
          <button className="gd-link" onClick={onHistory}>
            Історія ({attemptsCount})
          </button>
        )}
      </div>
      <div className="gd-score">
        <span className="gd-big">{results.level.label}</span>
        <span className="gd-num">
          {results.total}/{items.length} · {percent}%
        </span>
      </div>
      <p className="gd-lead" style={{ marginTop: 10 }}>
        {results.level.text}
      </p>
      {prevAttempt && (
        <p className="gd-note">
          Попередня спроба ({formatDate(prevAttempt.date)}): {prevAttempt.level} —{" "}
          {prevAttempt.total.c}/{prevAttempt.total.t}.
        </p>
      )}

      <div className="gd-tape">
        {items.map((pi, i) => (
          <span
            key={i}
            className={"gd-tick " + (isRight(POOL[pi], answers[i]) ? "pass" : "fail")}
          />
        ))}
      </div>
      <div className="gd-tapemeta">
        <span>зелений — правильно</span>
        <span>червоний — помилка</span>
      </div>

      <div className="gd-sec">
        <h3>За рівнями</h3>
        <p className="gd-note" style={{ marginTop: 0, marginBottom: 6 }}>
          Рахується тільки з базових {sel.length} питань — уточнення навмисно бʼють по слабких
          темах і занижували б рівень.
        </p>
        {LEVELS.map((l) => {
          const r = results.perLevel[l];
          const rate = r.t ? r.c / r.t : 0;
          return (
            <div className="gd-row" key={l}>
              <span className="gd-rowname">{l}</span>
              <span className="gd-rowscore">
                {r.c}/{r.t} · {pct(rate)}%
              </span>
              <span className="gd-bar">
                <i style={{ width: `${rate * 100}%`, background: status(rate).c }} />
              </span>
            </div>
          );
        })}
      </div>

      <div className="gd-sec">
        <h3>За темами — слабші зверху</h3>
        {sorted.map((s) => {
          const rate = s.c / s.t;
          const st = status(rate);
          return (
            <div className="gd-row" key={s.name}>
              <span className="gd-rowname">{s.name}</span>
              <span className="gd-tag" style={{ color: st.c }}>
                {s.c}/{s.t} {st.t}
              </span>
              <span className="gd-bar">
                <i style={{ width: `${rate * 100}%`, background: st.c }} />
              </span>
            </div>
          );
        })}
      </div>

      <div className="gd-sec">
        <h3>Розбір помилок ({results.wrong.length})</h3>
        {results.wrong.length === 0 && (
          <p className="gd-lead">
            Жодної помилки. Тест уже не показує вашу межу — беріть рівень вище.
          </p>
        )}
        {results.wrong.map((i) => {
          const item = POOL[items[i]];
          const given = answers[i];
          const givenText =
            item.t === "mc"
              ? given !== undefined && given !== ""
                ? item.o[Number(given)]
                : null
              : given || null;
          const right = item.t === "mc" ? item.o[item.a] : item.show;
          return (
            <div className="gd-rev" key={i}>
              <div className="gd-meta">
                <span className="gd-chip">
                  {String(i + 1).padStart(2, "0")} · {SUITES[item.s]}
                </span>
                <span className="gd-chip lv">{item.lvl}</span>
              </div>
              <div className="gd-revq">{item.q}</div>
              <div className="gd-ans">
                <span className="y">✓ {right}</span>
                <br />
                {givenText ? (
                  <span className="n">✕ {givenText}</span>
                ) : (
                  <span style={{ color: "var(--mut)" }}>— без відповіді</span>
                )}
              </div>
              <div className="gd-note">{item.note}</div>
            </div>
          );
        })}
      </div>

      <div className="gd-sec">
        <h3>Результати тесту</h3>
        <p className="gd-lead" style={{ marginBottom: 10 }}>
          Рівень, розбивка по темах і всі помилки з питаннями та правильними відповідями.
        </p>
        {storeOk === false && (
          <p className="gd-note" style={{ marginTop: 0, marginBottom: 10, color: "var(--bad)" }}>
            ⚠ Цей звіт зараз не зберігається на пристрої. Скопіюйте результати кнопкою нижче,
            перш ніж закривати вкладку — інакше вони зникнуть.
          </p>
        )}
        <div className="gd-nav" style={{ marginTop: 0 }}>
          <button
            className="gd-btn acc wide"
            onClick={() => copy("result", resultText)}
          >
            {copied === "result" ? "Скопійовано" : "Скопіювати результати тесту"}
          </button>
        </div>
      </div>

      <div className="gd-sec">
        <h3>План навчання від ШІ</h3>
        <p className="gd-lead" style={{ marginBottom: 10 }}>
          Промпт із вашими прогалинами — без окремих питань. Скопіюйте і вставте у ШІ, або
          одразу відкрийте потрібний: промпт при цьому теж лягає в буфер.
        </p>
        <div className="gd-nav" style={{ marginTop: 0 }}>
          <button className="gd-btn wide" onClick={() => copy("prompt", promptText)}>
            {copied === "prompt" ? "Скопійовано" : "Скопіювати промпт"}
          </button>
        </div>
        <p className="gd-note" style={{ marginBottom: 0 }}>
          Відкрити з промптом:
        </p>
        <div className="gd-ai">
          {services.map((svc) => (
            <a
              key={svc.id}
              className="gd-btn ghost sm"
              href={aiLink(svc, promptText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => openAi(svc)}
            >
              {svc.name} ↗
            </a>
          ))}
        </div>
        {opened && (
          <p className="gd-note">
            {opened.prefilled
              ? `${opened.name} відкривається з готовим промптом. Якщо поле порожнє — вставте з буфера (Ctrl+V).`
              : `${opened.name} не приймає промпт через посилання. Промпт уже в буфері — вставте його (Ctrl+V).`}
          </p>
        )}
      </div>

      {/* Аварійний шлях: буфер недоступний, лишається виділити текст руками. */}
      {manual && (
        <div className="gd-sec">
          <h3>{manual.kind === "result" ? "Результати тесту" : "Промпт для ШІ"} — текстом</h3>
          <p className="gd-note" style={{ marginTop: 0, marginBottom: 10, color: "var(--bad)" }}>
            Браузер не дав доступу до буфера обміну. Текст виділено — скопіюйте вручну.
          </p>
          <textarea
            className="gd-input"
            autoFocus
            readOnly
            rows={12}
            value={manual.text}
            style={{ fontSize: 13, lineHeight: 1.6, resize: "vertical" }}
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}

      <div className="gd-nav">
        <button className="gd-btn ghost wide" onClick={onReset}>
          Нова спроба з іншими питаннями
        </button>
      </div>
    </div>
  );
}
