import React from "react";
import { plural } from "../lib/format.js";

/* Екран питання: стрічка прогресу, картка з питанням, навігація.
   Компонент нічого не рахує — усі рішення приймає App. */
export default function Question({
  q,
  idx,
  items,
  answers,
  answeredCount,
  storeOk,
  selLen,
  probesLen,
  inputRef,
  onAnswer,
  onGo,
  onFinishBase,
  onDone,
}) {
  const cur = answers[idx];
  const last = idx === items.length - 1;
  const inProbe = idx >= selLen;
  const atHalfway = !inProbe && idx === Math.floor(selLen / 2);
  const atBaseEnd = idx === selLen - 1 && probesLen === 0;

  return (
    <div className="gd-wrap">
      <div className="gd-tape">
        {items.map((_, i) => (
          <button
            key={i}
            className={
              "gd-tick clickable " +
              (i === idx ? "here" : answers[i] !== undefined && answers[i] !== "" ? "filled" : "")
            }
            onClick={() => onGo(i)}
            aria-label={`Питання ${i + 1}`}
          />
        ))}
      </div>
      <div className="gd-tapemeta">
        <span>
          {String(idx + 1).padStart(2, "0")} / {items.length}
        </span>
        <span>
          {storeOk === false
            ? "⚠ не зберігається"
            : storeOk === "pending"
            ? "збереження…"
            : storeOk === true
            ? "збережено"
            : `відповідей: ${answeredCount}`}
        </span>
      </div>

      {atHalfway && (
        <div className="gd-card" style={{ borderLeft: "3px solid var(--acc)", paddingBottom: 16 }}>
          <div className="gd-eyebrow">Половина позаду</div>
          <p className="gd-note" style={{ marginTop: 8 }}>
            Тут можна зупинитися і повернутися пізніше — прогрес збережений. Втома
            спотворює результат сильніше, ніж перерва.
          </p>
        </div>
      )}

      {inProbe && (
        <div className="gd-card" style={{ borderLeft: "3px solid var(--acc)", paddingBottom: 16 }}>
          <div className="gd-eyebrow">Уточнення</div>
          <p className="gd-note" style={{ marginTop: 8 }}>
            Кілька тем дали слабкий результат. Ще {probesLen}{" "}
            {plural(probesLen, ["питання", "питання", "питань"])} саме по них — щоб відрізнити реальну
            прогалину від випадкової помилки.
          </p>
        </div>
      )}

      <div className="gd-card" key={idx}>
        <div className="gd-meta">
          <span className="gd-chip">{String(idx + 1).padStart(2, "0")}</span>
          <span className="gd-chip">{q.t === "mc" ? "вибір" : "вписати"}</span>
          {inProbe && <span className="gd-chip lv">уточнення</span>}
        </div>
        <div className="gd-q">{q.q}</div>

        {q.t === "mc" ? (
          q.o.map((opt, i) => (
            <button
              key={i}
              className={"gd-opt " + (Number(cur) === i ? "sel" : "")}
              onClick={() => onAnswer(i)}
            >
              <span className="gd-key">{"ABCD"[i]}</span>
              {opt}
            </button>
          ))
        ) : (
          <>
            <input
              ref={inputRef}
              className="gd-input"
              value={cur ?? ""}
              placeholder="впишіть слово або слова"
              onChange={(e) => onAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !last) onGo(idx + 1);
              }}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <div className="gd-hint">
              Скорочення на кшталт don't теж приймаються. Enter — наступне питання.
            </div>
          </>
        )}

        <div className="gd-nav">
          <button className="gd-btn ghost" onClick={() => onGo(idx - 1)} disabled={idx === 0}>
            Назад
          </button>
          {atBaseEnd ? (
            <button className="gd-btn acc" style={{ flex: 1 }} onClick={onFinishBase}>
              Завершити базову частину
            </button>
          ) : last ? (
            <button className="gd-btn acc" style={{ flex: 1 }} onClick={onDone}>
              Завершити і показати звіт
            </button>
          ) : (
            <button className="gd-btn" style={{ flex: 1 }} onClick={() => onGo(idx + 1)}>
              Далі
            </button>
          )}
        </div>
      </div>

      {answeredCount === items.length && !last && !atBaseEnd && (
        <div className="gd-nav">
          <button className="gd-btn acc wide" onClick={onDone}>
            Усі {items.length} заповнено — показати звіт
          </button>
        </div>
      )}
    </div>
  );
}
