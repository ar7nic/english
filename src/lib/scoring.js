/* ------------------------------------------------------------------ */
/*  Підрахунок                                                         */
/*                                                                     */
/*  Чиста арифметика без React: усе тут тестується без рендеру.        */
/* ------------------------------------------------------------------ */

export const LEVELS = ["A2", "B1", "B2"];

/* Нормалізація вписаної відповіді: різні апострофи, зайві пробіли
   і кінцева крапка не мають рахуватися за помилку.
   trim() стоїть ДО зняття пунктуації: інакше "is sleeping. " з хвостовим
   пробілом (звична річ на мобільній клавіатурі) лишалася б із крапкою
   і зараховувалася як помилка. */
export const norm = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/[’‘‛`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/g, "")
    .trim();

export const isRight = (q, ans) => {
  if (ans === undefined || ans === null || ans === "") return false;
  if (q.t === "mc") return Number(ans) === q.a;
  return q.accept.some((v) => norm(v) === norm(ans));
};

/* Пороги йдуть послідовно: спрацьовує перше правило, яке збіглося.
   rates — частки правильних (0..1) по A2, B1, B2. */
export function estimateLevel(rates) {
  const { A2: a, B1: b, B2: c } = rates;
  if (a >= 0.85 && b >= 0.8 && c >= 0.75)
    return { label: "B2+", text: "Впевнений B2, місцями вже підходите до C1. Граматика не буде вузьким місцем на співбесіді." };
  if (a >= 0.8 && b >= 0.75 && c >= 0.55)
    return { label: "B2", text: "Робочий B2. База тримається, лишилося дотягнути складніші конструкції нижче." };
  if (a >= 0.8 && b >= 0.6)
    return { label: "B1+", text: "Сильний B1 з виходом на B2. Основне — перфектні часи, пасив і умовні речення." };
  if (a >= 0.7 && b >= 0.45)
    return { label: "B1", text: "Стабільний B1. База впевнена, складніші теми ще плавають." };
  if (a >= 0.55)
    return { label: "A2+", text: "Міцний A2 з переходом на B1. Варто закріпити базові часи перед складнішим." };
  return { label: "A2", text: "Рівень A2. Почніть з базових часів, питань і артиклів — решта стане на місце пізніше." };
}

/* Підсумок спроби.
   Ключова асиметрія: РІВЕНЬ рахується тільки з базових питань (sel),
   бо уточнення навмисно бʼють по слабких темах і занижували б оцінку.
   Розбивка ПО ТЕМАХ — з базових плюс уточнення, там більше даних краще. */
export function scoreAttempt({ pool, suites, items, sel, answers }) {
  const perSuite = suites.map((n) => ({ name: n, c: 0, t: 0 }));
  const perLevel = { A2: { c: 0, t: 0 }, B1: { c: 0, t: 0 }, B2: { c: 0, t: 0 } };
  const wrong = [];
  items.forEach((pi, i) => {
    const item = pool[pi];
    const ok = isRight(item, answers[i]);
    perSuite[item.s].t++;
    if (i < sel.length) perLevel[item.lvl].t++;
    if (ok) {
      perSuite[item.s].c++;
      if (i < sel.length) perLevel[item.lvl].c++;
    } else {
      wrong.push(i);
    }
  });
  const rates = {};
  LEVELS.forEach((l) => (rates[l] = perLevel[l].t ? perLevel[l].c / perLevel[l].t : 0));
  const baseTotal = sel.filter((pi, i) => isRight(pool[pi], answers[i])).length;
  const total = items.length - wrong.length;
  return { perSuite, perLevel, rates, wrong, total, baseTotal, level: estimateLevel(rates) };
}
