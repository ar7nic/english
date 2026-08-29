/* Дрібниці для показу: спільні між звітом і історією. */

export const status = (r) =>
  r >= 0.75
    ? { t: "Впевнено", c: "var(--good)" }
    : r >= 0.5
    ? { t: "Повторити", c: "#B8860B" }
    : { t: "Слабке місце", c: "var(--bad)" };

export const pct = (r) => Math.round(r * 100);

export const formatDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const formatDateTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatDate(iso)}, ${d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
};

/* Українська множина: 1 спроба, 2 спроби, 5 спроб. */
export function plural(n, [one, few, many]) {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
