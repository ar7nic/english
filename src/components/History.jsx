import React, { useMemo, useRef, useState } from "react";
import { LEVELS } from "../lib/scoring.js";
import { recurringMistakes, suiteTrends } from "../lib/history.js";
import { formatDate, formatDateTime, pct, plural, status } from "../lib/format.js";

/* Стовпчики останніх спроб по одній темі. Остання — акцентом,
   щоб напрямок читався без осей і підписів. */
function Spark({ points }) {
  const shown = points.slice(-8);
  return (
    <span className="gd-spark" aria-hidden="true">
      {shown.map((p, i) => (
        <i
          key={i}
          className={i === shown.length - 1 ? "now" : ""}
          style={{ height: `${Math.max(8, p.rate * 100)}%` }}
        />
      ))}
    </span>
  );
}

function Delta({ value }) {
  if (value === null || value === undefined)
    return <span className="gd-delta flat">— перша спроба</span>;
  const p = Math.round(value * 100);
  if (p === 0) return <span className="gd-delta flat">без змін</span>;
  return (
    <span className={"gd-delta " + (p > 0 ? "up" : "down")}>
      {p > 0 ? "▲ +" : "▼ "}
      {p}%
    </span>
  );
}

export default function History({ attempts, onBack, onClear, onImport }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const trends = useMemo(() => suiteTrends(attempts), [attempts]);
  const recurring = useMemo(() => recurringMistakes(attempts), [attempts]);

  const exportJson = () => {
    const payload = {
      app: "grammar-diagnostic",
      version: 1,
      exportedAt: new Date().toISOString(),
      attempts,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grammar-diagnostic-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: `Вивантажено спроб: ${attempts.length}.` });
  };

  const pickFile = () => fileRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // щоб той самий файл можна було вибрати вдруге
    if (!file) return;
    try {
      const res = await onImport(await file.text());
      const parts = [`Додано спроб: ${res.added}`];
      if (res.duplicates) parts.push(`уже було: ${res.duplicates}`);
      if (res.skipped) parts.push(`пропущено битих: ${res.skipped}`);
      setMsg({ ok: true, text: `${parts.join(", ")}.` });
    } catch (err) {
      setMsg({ ok: false, text: `Імпорт не вдався. ${err.message}` });
    }
  };

  /* Прихований input — щоб кнопка імпорту виглядала як решта кнопок. */
  const filePicker = (
    <input
      ref={fileRef}
      type="file"
      accept="application/json,.json"
      onChange={onFile}
      style={{ display: "none" }}
      data-testid="import-input"
    />
  );

  const note = msg && (
    <p className="gd-note" style={msg.ok ? undefined : { color: "var(--bad)" }}>
      {msg.text}
    </p>
  );

  if (attempts.length === 0) {
    return (
      <div className="gd-wrap">
        <div className="gd-top">
          <div className="gd-eyebrow">Історія</div>
          <button className="gd-link" onClick={onBack}>
            Назад
          </button>
        </div>
        <h1 className="gd-h1">Поки що порожньо</h1>
        <p className="gd-empty">
          Історія наповнюється, коли спроба доходить до звіту. Перервана спроба сюди не
          потрапляє — і ротацію питань теж не витрачає.
        </p>
        <div className="gd-nav">
          <button className="gd-btn acc" style={{ flex: 1 }} onClick={onBack}>
            До тесту
          </button>
          <button className="gd-btn ghost sm" onClick={pickFile}>
            Імпорт JSON
          </button>
        </div>
        {filePicker}
        {note}
      </div>
    );
  }

  // теми, які просіли найсильніше — перші в списку динаміки
  const byWeakest = [...trends]
    .filter((t) => t.last)
    .sort((a, b) => a.last.rate - b.last.rate);

  return (
    <div className="gd-wrap">
      <div className="gd-top">
        <div className="gd-eyebrow">Історія · {attempts.length} {plural(attempts.length, ["спроба", "спроби", "спроб"])}</div>
        <button className="gd-link" onClick={onBack}>
          Назад
        </button>
      </div>

      <div className="gd-score">
        <span className="gd-big">{attempts[0].level}</span>
        <span className="gd-num">
          остання: {formatDate(attempts[0].date)} · {attempts[0].total.c}/{attempts[0].total.t}
        </span>
      </div>

      <div className="gd-sec">
        <h3>Динаміка по темах — слабші зверху</h3>
        <p className="gd-note" style={{ marginTop: 0, marginBottom: 6 }}>
          Стовпчики — останні спроби зліва направо, справа — зміна проти попередньої.
        </p>
        {byWeakest.map((t) => {
          const st = status(t.last.rate);
          return (
            <div className="gd-trow" key={t.s}>
              <span className="gd-rowname">{t.name}</span>
              <Spark points={t.points} />
              <span className="gd-rowscore" style={{ textAlign: "right" }}>
                <span style={{ color: st.c }}>
                  {t.last.c}/{t.last.t}
                </span>
                <br />
                <Delta value={t.delta} />
              </span>
            </div>
          );
        })}
      </div>

      {recurring.length > 0 && (
        <div className="gd-sec">
          <h3>Повторювані помилки ({recurring.length})</h3>
          <p className="gd-note" style={{ marginTop: 0, marginBottom: 6 }}>
            Ці питання ви завалили щонайменше двічі — це вже не випадковість.
          </p>
          {recurring.slice(0, 15).map((m) => (
            <div className="gd-mist" key={m.qid}>
              <span className="qq">
                {m.q} <span className="gd-attnum">· {m.times}×</span>
              </span>
              <span className="aa">
                <span className="y">✓ {m.correct}</span>
                {m.given ? (
                  <>
                    {"  "}
                    <span className="n">✕ {m.given}</span>
                  </>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="gd-sec">
        <h3>Спроби</h3>
        {attempts.map((a) => (
          <details className="gd-att" key={a.id}>
            <summary>
              <span className="gd-attlv">{a.level}</span>
              <span className="gd-attdate">{formatDateTime(a.date)}</span>
              <span className="gd-attnum">
                {a.total.c}/{a.total.t} · {pct(a.total.c / a.total.t)}%
              </span>
            </summary>
            <div className="gd-attbody">
              <div className="gd-row">
                <span className="gd-rowname">Базова частина</span>
                <span className="gd-rowscore">
                  {a.base.c}/{a.base.t}
                  {a.probes ? ` · уточнень: ${a.probes}` : ""}
                </span>
              </div>
              {LEVELS.map((l) => (
                <div className="gd-row" key={l}>
                  <span className="gd-rowname">{l}</span>
                  <span className="gd-rowscore">
                    {a.levelCounts?.[l]?.c ?? 0}/{a.levelCounts?.[l]?.t ?? 0} · {a.rates[l]}%
                  </span>
                  <span className="gd-bar">
                    <i
                      style={{
                        width: `${a.rates[l]}%`,
                        background: status(a.rates[l] / 100).c,
                      }}
                    />
                  </span>
                </div>
              ))}

              <h3 style={{ marginTop: 18 }}>Теми</h3>
              {[...a.suites]
                .sort((x, y) => x.c / x.t - y.c / y.t)
                .map((s) => {
                  const st = status(s.c / s.t);
                  return (
                    <div className="gd-row" key={s.s}>
                      <span className="gd-rowname">{s.name}</span>
                      <span className="gd-tag" style={{ color: st.c }}>
                        {s.c}/{s.t} {st.t}
                      </span>
                    </div>
                  );
                })}

              <h3 style={{ marginTop: 18 }}>Помилки ({a.mistakes.length})</h3>
              {a.mistakes.length === 0 && <p className="gd-note">Жодної.</p>}
              {a.mistakes.map((m) => (
                <div className="gd-mist" key={m.qid}>
                  <span className="qq">{m.q}</span>
                  <span className="aa">
                    <span className="y">✓ {m.correct}</span>
                    {m.given ? (
                      <>
                        {"  "}
                        <span className="n">✕ {m.given}</span>
                      </>
                    ) : (
                      <span style={{ color: "var(--mut)" }}> — без відповіді</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      <div className="gd-nav">
        <button className="gd-btn ghost sm" onClick={exportJson}>
          Експорт JSON
        </button>
        <button className="gd-btn ghost sm" onClick={pickFile}>
          Імпорт JSON
        </button>
        <button
          className="gd-btn ghost sm"
          onClick={() => {
            if (!confirmClear) {
              setConfirmClear(true);
              return;
            }
            setConfirmClear(false);
            onClear();
          }}
          style={confirmClear ? { borderColor: "var(--bad)", color: "var(--bad)" } : undefined}
        >
          {confirmClear ? "Точно стерти?" : "Стерти історію"}
        </button>
      </div>
      {filePicker}
      {note}
      <p className="gd-note">
        Стирання торкається лише історії спроб. Ротація питань живе в окремому ключі — тому
        після очищення історії повтори все одно не почнуться. Імпорт не затирає наявні
        записи: спроби з однаковим id зливаються в одну.
      </p>
    </div>
  );
}
