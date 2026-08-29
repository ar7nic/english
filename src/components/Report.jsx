import React, { useRef, useState } from "react";
import { POOL, SUITES } from "../data/questions.js";
import { LEVELS, isRight } from "../lib/scoring.js";
import { formatDate, pct, status } from "../lib/format.js";

/* Звіт: рівень, розбивка по рівнях і темах, розбір помилок,
   текстова версія для копіювання. */
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
  const summaryRef = useRef(null);
  const [copied, setCopied] = useState("");

  const percent = pct(results.total / items.length);
  const sorted = [...results.perSuite].sort((a, b) => a.c / a.t - b.c / b.t);

  const summaryText = [
    `Результат тесту: ${results.level.label} — ${results.total}/${items.length} (${percent}%)`,
    `Базова частина: ${results.baseTotal}/${sel.length}` +
      (probes.length ? `, уточнення: ${probes.length} питань` : ""),
    `За рівнями: ` +
      LEVELS.map(
        (l) => `${l} ${results.perLevel[l].c}/${results.perLevel[l].t} (${pct(results.rates[l])}%)`
      ).join(", "),
    ``,
    `Теми від слабшої до сильнішої:`,
    ...sorted.map((s) => `- ${s.name}: ${s.c}/${s.t} — ${status(s.c / s.t).t}`),
  ].join("\n");

  const copy = async () => {
    // 1) сучасний API — працює не в кожному контексті
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(summaryText);
        setCopied("ok");
        setTimeout(() => setCopied(""), 2500);
        return;
      }
    } catch (e) {
      /* пробуємо запасний шлях */
    }
    // 2) старий execCommand через виділення поля
    try {
      const ta = summaryRef.current;
      if (ta) {
        ta.readOnly = false;
        ta.contentEditable = "true";
        const range = document.createRange();
        range.selectNodeContents(ta);
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(range);
        ta.setSelectionRange(0, 999999);
        const ok = document.execCommand("copy");
        ta.readOnly = true;
        ta.contentEditable = "false";
        if (ok) {
          setCopied("ok");
          setTimeout(() => setCopied(""), 2500);
          return;
        }
      }
    } catch (e) {
      /* лишається ручний спосіб */
    }
    // 3) текст уже виділено — користувач копіює сам
    setCopied("manual");
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
        <h3>Звіт текстом</h3>
        <p className="gd-lead" style={{ marginBottom: 10 }}>
          Скопіюйте і надішліть у чат — за цими даними я зберу уроки саме по ваших прогалинах.
        </p>
        {storeOk === false && (
          <p className="gd-note" style={{ marginTop: 0, marginBottom: 10, color: "var(--bad)" }}>
            ⚠ Цей звіт зараз не зберігається на пристрої. Скопіюйте текст нижче, перш ніж
            закривати вкладку — інакше результати зникнуть.
          </p>
        )}
        <textarea
          ref={summaryRef}
          className="gd-input"
          readOnly
          rows={10}
          value={summaryText}
          style={{ fontSize: 13, lineHeight: 1.6, resize: "vertical" }}
          onFocus={(e) => e.target.select()}
        />
        <div className="gd-nav">
          <button className="gd-btn acc" style={{ flex: 1 }} onClick={copy}>
            {copied === "ok" ? "Скопійовано" : "Скопіювати звіт"}
          </button>
        </div>
        {copied === "manual" && (
          <p className="gd-note" style={{ marginTop: 4 }}>
            Браузер не дав доступу до буфера обміну. Текст уже виділено — натисніть і утримуйте
            поле вище, далі «Копіювати».
          </p>
        )}
      </div>

      <div className="gd-nav">
        <button className="gd-btn ghost wide" onClick={onReset}>
          Нова спроба з іншими питаннями
        </button>
      </div>
    </div>
  );
}
