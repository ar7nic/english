import React from "react";

/* Стартовий екран: що це, скільки спроб уже пройдено, кнопка старту. */
export default function Intro({
  testLen,
  poolLen,
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
      <h1 className="gd-h1">
        Тест
        <br />
        з англійської граматики
      </h1>
      <p className="gd-lead">
        {testLen} питань — по 4 на кожну з {suitesLen} тем, дібраних з пулу на {poolLen}.
        Структура стала (та сама тема, той самий рівень, той самий тип), а зміст новий: на
        кожен слот припадає 4 варіанти, і додаток бере той, який не показувався найдовше.
        Тому перші чотири спроби поспіль ідуть без жодного повтору. Приблизно половина
        питань — з вибором відповіді, половина — вставити слово. Теми, де ви наберете 2 з 4
        і менше, отримають ще по 3 питання, щоб відрізнити прогалину від випадкової помилки.
        Наприкінці — орієнтовний рівень, розбивка по темах і список того, що варто повторити.
        Тест не обмежений у часі, але не підглядайте — інакше звіт буде безкорисним. Прогрес
        зберігається автоматично на цьому пристрої: можна закрити вкладку і повернутися пізніше.
      </p>
      <div className="gd-tape" aria-hidden="true">
        {Array.from({ length: testLen }, (_, i) => (
          <span key={i} className="gd-tick" />
        ))}
      </div>
      <div className="gd-tapemeta">
        <span>
          {testLen} з {poolLen}
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
