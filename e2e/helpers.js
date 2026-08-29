import { expect } from "@playwright/test";

export const KEYS = {
  progress: "grammar-diagnostic:progress:v1",
  usage: "grammar-diagnostic:usage:v1",
  attempts: "grammar-diagnostic:attempts:v1",
};

export const readKey = (page, key) =>
  page.evaluate((k) => {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  }, key);

/* Картка питання — завжди остання: перед нею можуть стояти плашки
   «Половина позаду» та «Уточнення». */
export const questionCard = (page) => page.locator(".gd-card").last();

export const questionText = (page) => questionCard(page).locator(".gd-q").innerText();

export async function startTest(page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Почати/ }).click();
  await expect(questionCard(page)).toBeVisible();
}

/* Відповідає на поточне питання: перший варіант або текст у поле. */
export async function answerCurrent(page, text = "answer") {
  const card = questionCard(page);
  const opts = card.locator(".gd-opt");
  if ((await opts.count()) > 0) {
    await opts.first().click();
  } else {
    await card.locator("input.gd-input").fill(text);
  }
}

/* Проходить тест до кінця — разом з фазою уточнень, якщо вона з'явиться. */
export async function walkToReport(page) {
  for (let guard = 0; guard < 200; guard++) {
    await answerCurrent(page);
    const finishAll = page.getByRole("button", { name: "Завершити і показати звіт" });
    if (await finishAll.isVisible()) {
      await finishAll.click();
      break;
    }
    const finishBase = page.getByRole("button", { name: "Завершити базову частину" });
    if (await finishBase.isVisible()) {
      await finishBase.click();
      continue;
    }
    await page.getByRole("button", { name: "Далі", exact: true }).click();
  }
  await expect(page.locator(".gd-big")).toBeVisible();
}

/* Тексти питань поточної спроби — щоб перевірити ротацію між спробами. */
export async function collectQuestions(page, count) {
  const seen = [];
  for (let i = 0; i < count; i++) {
    seen.push(await questionText(page));
    await answerCurrent(page);
    await page.getByRole("button", { name: "Далі", exact: true }).click();
  }
  return seen;
}
