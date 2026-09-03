import React, { useEffect } from "react";
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
  /* Нуль — це валідний індекс варіанта, тому порівнюємо саме так,
     а не через істинність значення. */
  const isAnswered = (v) => v !== undefined && v !== "";

  const cur = answers[idx];
  const answered = isAnswered(cur);
  const last = idx === items.length - 1;
  const inProbe = idx >= selLen;
  const atHalfway = !inProbe && idx === Math.floor(selLen / 2);
  const atBaseEnd = idx === selLen - 1 && probesLen === 0;

  /* Enter гортає далі — однаково на питаннях з вибором і з полем вводу.
     Слухач саме на window, а не на обгортці: на свіжому питанні з варіантами
     фокус часто ні на чому, подія йде в <body> і до React-обробника на
     обгортці не дійшла б. Компонент живий лише поки триває тест, тож на
     Intro, Report і History це не діє. */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Enter" || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      if (last) return; // з останнього питання Enter нікуди не веде і нічого не завершує

      const target = e.target;
      const onOption = target instanceof HTMLButtonElement && target.classList.contains("gd-opt");
      // «Далі», «Назад» і позначки стрічки обробляють Enter самі —
      // інакше вийшов би подвійний перехід
      if (target instanceof HTMLButtonElement && !onOption) return;

      // Enter — це «відповів і далі», без відповіді він нікуди не веде,
      // так само як і сама кнопка «Далі» (вона disabled, поки немає
      // відповіді) — питання не можна пропустити взагалі.
      // Дефолт тут навмисно не гасимо: якщо фокус стоїть на варіанті,
      // цей самий Enter його вибере, і наступний уже погортає.
      if (!answered) return;

      // відповідь є — на варіанті гасимо синтетичний click, щоб Enter
      // тільки гортав і не переписував уже зроблений вибір
      if (onOption) e.preventDefault();
      onGo(idx + 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [idx, last, answered, onGo]);

  return (
    <div className="gd-wrap">
      <div className="gd-tape">
        {items.map((_, i) => (
          <button
            key={i}
            className={"gd-tick clickable " + (i === idx ? "here" : isAnswered(answers[i]) ? "filled" : "")}
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
          <>
            {q.o.map((opt, i) => (
              <button
                key={i}
                className={"gd-opt " + (Number(cur) === i ? "sel" : "")}
                onClick={() => onAnswer(i)}
              >
                <span className="gd-key">{"ABCD"[i]}</span>
                {opt}
              </button>
            ))}
            <div className="gd-hint">
              {answered ? "Enter — наступне питання." : "Оберіть варіант, далі Enter."}
            </div>
          </>
        ) : (
          <>
            <input
              ref={inputRef}
              className="gd-input"
              value={cur ?? ""}
              placeholder="впишіть слово або слова"
              onChange={(e) => onAnswer(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <div className="gd-hint">
              Скорочення на кшталт don't теж приймаються.{" "}
              {answered ? "Enter — наступне питання." : "Впишіть відповідь, далі Enter."}
            </div>
          </>
        )}

        <div className="gd-nav">
          <button className="gd-btn ghost" onClick={() => onGo(idx - 1)} disabled={idx === 0}>
            Назад
          </button>
          {atBaseEnd ? (
            <button
              className="gd-btn acc"
              style={{ flex: 1 }}
              onClick={onFinishBase}
              disabled={!answered}
            >
              Завершити базову частину
            </button>
          ) : last ? (
            <button className="gd-btn acc" style={{ flex: 1 }} onClick={onDone} disabled={!answered}>
              Завершити і показати звіт
            </button>
          ) : (
            <button
              className="gd-btn"
              style={{ flex: 1 }}
              onClick={() => onGo(idx + 1)}
              disabled={!answered}
            >
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
