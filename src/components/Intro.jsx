import React from "react";

/* Стартовий екран: що це, скільки спроб уже пройдено, кнопка старту. */
export default function Intro({
  testLen,
  maxLen,
  suitesLen,
  runNo,
  attemptsCount,
  onStart,
  onHistory,
}) {
  return (
    <div className="gd-wrap">
      <div className="gd-top">
        <div className="gd-eyebrow">
          Діагностика · A2 → B2 · {suitesLen} тем
        </div>
        {/* показуємо завжди: порожня історія — це ще й вхід для імпорту бекапу */}
        <button className="gd-link" onClick={onHistory}>
          {attemptsCount > 0 ? `Історія (${attemptsCount})` : "Історія"}
        </button>
      </div>
      <h1 className="gd-h1">English test</h1>
      <p className="gd-lead">
        {testLen}–{maxLen} питань, залежно від результату. За результатами — орієнтовний
        рівень, розбивка по темах і список того, що варто повторити. Тест не обмежений у
        часі. Прогрес зберігається автоматично на цьому пристрої: можна закрити вкладку і
        повернутися пізніше.
      </p>
      <div className="gd-tape" aria-hidden="true">
        {Array.from({ length: testLen }, (_, i) => (
          <span key={i} className="gd-tick" />
        ))}
      </div>
      <div className="gd-tapemeta">
        <span>
          {testLen}–{maxLen} питань
        </span>
        <span>{runNo > 0 ? `спроб пройдено: ${runNo}` : "~30–35 min"}</span>
      </div>
      <div className="gd-nav">
        <button className="gd-btn acc wide" onClick={onStart}>
          {runNo > 0 ? "Почати нову спробу" : "Почати тест"}
        </button>
      </div>
      {attemptsCount === 0 && runNo > 0 && (
        <p className="gd-note">
          Історія спроб порожня: вона починає наповнюватися з першого завершеного звіту.
        </p>
      )}
    </div>
  );
}
