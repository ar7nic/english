/* ------------------------------------------------------------------ */
/*  Буфер обміну                                                       */
/*                                                                     */
/*  Трирівнева спроба: сучасний API, старий execCommand, і врешті      */
/*  здача — UI показує текст, щоб користувач скопіював руками.         */
/*  Виділено з Report.jsx: копіювальних кнопок стало більше однієї.    */
/* ------------------------------------------------------------------ */

/* Тимчасове поле за межами екрана. display:none не годиться —
   execCommand потребує елемента, який реально бере участь у розкладці. */
function copyViaTextarea(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "-1000px";
  ta.style.left = "0";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  try {
    ta.select();
    ta.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(ta);
  }
}

/* Повертає "ok" або "manual". */
export async function copyText(text) {
  // 1) сучасний API — працює не в кожному контексті
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return "ok";
    }
  } catch (e) {
    /* пробуємо запасний шлях */
  }
  // 2) старий execCommand через тимчасове поле
  try {
    if (copyViaTextarea(text)) return "ok";
  } catch (e) {
    /* лишається ручний спосіб */
  }
  // 3) браузер відмовив — далі показуємо текст на екрані
  return "manual";
}
