import { expect, test } from "@playwright/test";
import {
  answerCurrent,
  collectQuestions,
  KEYS,
  questionCard,
  questionText,
  readKey,
  startTest,
  walkToReport,
} from "./helpers.js";

test.describe("проходження", () => {
  test("від інтро до звіту", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("English test");
    await expect(page.locator(".gd-lead")).toContainText("80–95 питань");

    await page.getByRole("button", { name: "Почати тест" }).click();
    await expect(page.locator(".gd-tapemeta").first()).toContainText("01 / 80");

    await walkToReport(page);

    // рівень, розбивка по темах і розбір помилок
    await expect(page.locator(".gd-big")).toHaveText(/A2\+?|B1\+?|B2\+?/);
    await expect(page.getByRole("heading", { name: /За темами/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Розбір помилок/ })).toBeVisible();
    await expect(page.locator(".gd-row .gd-rowname").first()).toBeVisible();
    // експорт розділено на дві дії: сирі результати і промпт для ШІ
    await expect(page.getByRole("button", { name: "Скопіювати результати тесту" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Скопіювати промпт" })).toBeVisible();
    await expect(page.getByRole("link", { name: /ChatGPT/ })).toHaveAttribute(
      "href",
      /^https:\/\/chatgpt\.com\//
    );
    await expect(page.getByRole("link", { name: /Gemini/ })).toHaveAttribute(
      "href",
      "https://gemini.google.com/app"
    );
  });

  test("слабкі теми отримують фазу уточнень", async ({ page }) => {
    await startTest(page);
    // відповідаємо навмання: 80 питань поспіль першим варіантом
    for (let i = 0; i < 80; i++) {
      await answerCurrent(page, "нісенітниця");
      const finishBase = page.getByRole("button", { name: "Завершити базову частину" });
      if (await finishBase.isVisible()) {
        await finishBase.click();
        break;
      }
      await page.getByRole("button", { name: "Далі", exact: true }).click();
    }
    // такі відповіді гарантовано дають слабкі теми
    await expect(page.getByText("Уточнення").first()).toBeVisible();
    await expect(page.locator(".gd-tapemeta").first()).toContainText("/ 95");
  });
});

test.describe("клавіатура", () => {
  const counter = (page) => page.locator(".gd-tapemeta").first();

  test("Enter гортає питання з вибором відповіді", async ({ page }) => {
    await startTest(page);
    // перше питання завжди mc: вибірка сортує mc перед gap у межах слоту
    expect(await questionCard(page).locator(".gd-opt").count()).toBe(4);

    await expect(counter(page)).toContainText("01 / 80");
    await questionCard(page).locator(".gd-opt").first().click();
    await page.keyboard.press("Enter");
    await expect(counter(page)).toContainText("02 / 80");

    // друге питання — вже «вписати», тож відповідаємо нейтрально до типу
    await answerCurrent(page);
    await page.keyboard.press("Enter");
    await expect(counter(page)).toContainText("03 / 80");
  });

  test("без відповіді ні Enter, ні «Далі» нікуди не ведуть", async ({ page }) => {
    await startTest(page);
    await expect(questionCard(page).locator(".gd-hint")).toHaveText("Оберіть варіант, далі Enter.");

    // жодного вибору не зроблено — гортання з клавіатури має стояти на місці
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await expect(counter(page)).toContainText("01 / 80");

    // «Далі» без відповіді заблокована — питання не можна пропустити
    await expect(page.getByRole("button", { name: "Далі", exact: true })).toBeDisabled();

    await answerCurrent(page);
    await page.getByRole("button", { name: "Далі", exact: true }).click();
    await expect(counter(page)).toContainText("02 / 80");
  });

  test("на варіанті під фокусом перший Enter вибирає, другий гортає", async ({ page }) => {
    await startTest(page);
    await questionCard(page).locator(".gd-opt").nth(2).focus();

    await page.keyboard.press("Enter");
    await expect(questionCard(page).locator(".gd-opt").nth(2)).toHaveClass(/sel/);
    await expect(counter(page)).toContainText("01 / 80");
    await expect(questionCard(page).locator(".gd-hint")).toHaveText("Enter — наступне питання.");

    await page.keyboard.press("Enter");
    await expect(counter(page)).toContainText("02 / 80");
  });

  test("Enter після кліку по варіанту робить рівно один крок і не чіпає відповідей", async ({
    page,
  }) => {
    await startTest(page);
    const first = await questionText(page);
    // клік лишає фокус на кнопці варіанта — саме тут раніше Enter не працював
    await questionCard(page).locator(".gd-opt").nth(1).click();
    await page.keyboard.press("Enter");

    await expect(counter(page)).toContainText("02 / 80");
    expect(await questionText(page)).not.toBe(first);
    // на новому питанні нічого не вибрано: Enter не протягнув відповідь уперед
    await expect(questionCard(page).locator(".gd-opt.sel")).toHaveCount(0);

    // а вибір на попередньому питанні лишився тим самим
    await page.getByRole("button", { name: "Назад" }).click();
    await expect(questionCard(page).locator(".gd-opt.sel")).toHaveCount(1);
    await expect(questionCard(page).locator(".gd-opt").nth(1)).toHaveClass(/sel/);
  });

  test("Enter гортає і питання з полем вводу", async ({ page }) => {
    await startTest(page);
    for (let i = 0; i < 10; i++) {
      if ((await questionCard(page).locator("input.gd-input").count()) > 0) break;
      await answerCurrent(page);
      await page.getByRole("button", { name: "Далі", exact: true }).click();
    }
    const input = questionCard(page).locator("input.gd-input");
    await input.fill("is sleeping");
    const before = await counter(page).innerText();

    await page.keyboard.press("Enter");
    await expect(counter(page)).not.toHaveText(before);
    await expect(questionCard(page).locator(".gd-q")).toBeVisible();
  });

  test("Enter на кнопці «Далі» не перестрибує через питання", async ({ page }) => {
    await startTest(page);
    // відповідаємо, щоб крок не блокувався перевіркою на відповідь:
    // тут перевіряється саме те, що кнопка не спрацьовує двічі
    await answerCurrent(page);
    await page.getByRole("button", { name: "Далі", exact: true }).focus();
    await page.keyboard.press("Enter");
    // один крок, а не два: слухач window має пропустити подію кнопці
    await expect(counter(page)).toContainText("02 / 80");
  });

  test("на останньому питанні Enter нічого не завершує", async ({ page }) => {
    await startTest(page);
    // позначки стрічки клікабельні — стрибаємо на останнє питання
    await page.locator(".gd-tick.clickable").nth(79).click();
    await expect(counter(page)).toContainText("80 / 80");

    // теж із відповіддю: інакше тест пройшов би через перевірку на відповідь,
    // а не через те, що з останнього питання Enter нікуди не веде
    await answerCurrent(page);
    await page.keyboard.press("Enter");
    await expect(counter(page)).toContainText("80 / 80");
    await expect(page.locator(".gd-big")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Завершити базову частину" })
    ).toBeVisible();
  });
});

test.describe("збереження на пристрої", () => {
  test("прогрес переживає перезавантаження вкладки", async ({ page }) => {
    await startTest(page);
    const first = await questionText(page);
    await answerCurrent(page);
    await page.getByRole("button", { name: "Далі", exact: true }).click();
    const second = await questionText(page);
    await answerCurrent(page, "мій варіант");

    // чекаємо на debounce: статус перемикається на «збережено»
    await expect(page.locator(".gd-tapemeta").first()).toContainText("збережено");

    await page.reload();
    await expect(page.locator(".gd-tapemeta").first()).toContainText("02 / 80");
    expect(await questionText(page)).toBe(second);

    await page.getByRole("button", { name: "Назад" }).click();
    expect(await questionText(page)).toBe(first);
  });

  test("запис іде з паузою, а не на кожну натиснуту клавішу", async ({ page }) => {
    // рахуємо реальні звернення до localStorage по ключу прогресу
    await page.addInitScript(() => {
      window.__writes = 0;
      const orig = localStorage.setItem.bind(localStorage);
      localStorage.setItem = (k, v) => {
        if (k.includes("progress")) window.__writes++;
        return orig(k, v);
      };
    });
    await startTest(page);
    // шукаємо перше питання з полем вводу
    for (let i = 0; i < 10; i++) {
      if ((await questionCard(page).locator("input.gd-input").count()) > 0) break;
      await answerCurrent(page);
      await page.getByRole("button", { name: "Далі", exact: true }).click();
    }
    const input = questionCard(page).locator("input.gd-input");
    const before = await page.evaluate(() => window.__writes);

    await input.pressSequentially("is sleeping", { delay: 30 });
    // до кінця паузи свіжої відповіді в сховищі ще немає
    const early = await readKey(page, KEYS.progress);
    expect(JSON.stringify(early ?? {})).not.toContain("is sleeping");

    await expect(page.locator(".gd-tapemeta").first()).toContainText("збережено");
    const saved = await readKey(page, KEYS.progress);
    expect(JSON.stringify(saved)).toContain("is sleeping");

    // 11 натискань — не 11 записів
    const writes = (await page.evaluate(() => window.__writes)) - before;
    expect(writes).toBeLessThanOrEqual(2);
  });

  test("три ключі живуть окремо, «Нова спроба» стирає лише прогрес", async ({ page }) => {
    await startTest(page);
    await walkToReport(page);

    expect(await readKey(page, KEYS.usage)).not.toBeNull();
    expect(await readKey(page, KEYS.attempts)).not.toBeNull();

    await page.getByRole("button", { name: /Нова спроба/ }).click();
    await expect(page.getByRole("button", { name: /Почати нову спробу/ })).toBeVisible();

    // прогрес зник, ротація й історія лишилися
    const usage = await readKey(page, KEYS.usage);
    expect(usage.run).toBe(1);
    expect(Object.keys(usage.used).length).toBeGreaterThanOrEqual(80);
    expect((await readKey(page, KEYS.attempts)).length).toBe(1);
  });
});

test.describe("ротація питань", () => {
  test("друга спроба не повторює питань першої", async ({ page }) => {
    await startTest(page);
    // структура спроби стала, тож позиція i — це той самий слот в обох спробах
    const firstRun = await collectQuestions(page, 12);
    await walkToReport(page);
    const usage = await readKey(page, KEYS.usage);
    expect(Object.keys(usage.used).length).toBeGreaterThanOrEqual(80);

    await page.getByRole("button", { name: /Нова спроба/ }).click();
    await page.getByRole("button", { name: /Почати нову спробу/ }).click();
    const secondRun = await collectQuestions(page, 12);

    expect(secondRun).toHaveLength(firstRun.length);
    secondRun.forEach((q, i) => expect(q, `слот ${i + 1}`).not.toBe(firstRun[i]));
    expect(firstRun.some((q) => secondRun.includes(q))).toBe(false);
  });

  test("перезавантаження після звіту не витрачає ротацію вдруге", async ({ page }) => {
    await startTest(page);
    await walkToReport(page);

    const level = await page.locator(".gd-big").innerText();
    const usageBefore = await readKey(page, KEYS.usage);
    expect(usageBefore.run).toBe(1);

    await page.reload();

    // звіт на місці
    await expect(page.locator(".gd-big")).toHaveText(level);
    await expect(page.getByRole("heading", { name: /Розбір помилок/ })).toBeVisible();

    // recorded не спрацював удруге: ні run, ні набір показаних не змінилися
    const usageAfter = await readKey(page, KEYS.usage);
    expect(usageAfter.run).toBe(1);
    expect(usageAfter.used).toEqual(usageBefore.used);
    expect((await readKey(page, KEYS.attempts)).length).toBe(1);

    // і ще раз, щоб виключити накопичення
    await page.reload();
    await expect(page.locator(".gd-big")).toHaveText(level);
    expect((await readKey(page, KEYS.usage)).run).toBe(1);
    expect((await readKey(page, KEYS.attempts)).length).toBe(1);
  });

  test("перервана спроба ротацію не витрачає", async ({ page }) => {
    await startTest(page);
    await answerCurrent(page);
    await expect(page.locator(".gd-tapemeta").first()).toContainText("збережено");
    // до звіту не дійшли — історії показів ще немає
    expect(await readKey(page, KEYS.usage)).toBeNull();
    expect(await readKey(page, KEYS.attempts)).toBeNull();
  });
});

test.describe("історія спроб", () => {
  test("завершена спроба потрапляє в історію з розбивкою і помилками", async ({ page }) => {
    await startTest(page);
    await walkToReport(page);

    const level = await page.locator(".gd-big").innerText();
    await page.getByRole("button", { name: /Історія/ }).click();

    await expect(page.locator(".gd-eyebrow").first()).toContainText("Історія · 1 спроба");
    await expect(page.locator(".gd-big")).toHaveText(level);
    await expect(page.getByRole("heading", { name: /Динаміка по темах/ })).toBeVisible();

    // у записі спроби — всі 20 тем і список помилок
    await page.locator(".gd-att summary").first().click();
    await expect(page.locator(".gd-att .gd-attbody .gd-rowname")).toHaveCount(1 + 3 + 20);
    await expect(page.getByRole("heading", { name: /Помилки/ })).toBeVisible();

    const attempts = await readKey(page, KEYS.attempts);
    expect(attempts).toHaveLength(1);
    expect(attempts[0].suites).toHaveLength(20);
    expect(Object.keys(attempts[0].rates)).toEqual(["A2", "B1", "B2"]);
    expect(attempts[0].mistakes[0]).toHaveProperty("qid");
    expect(attempts[0].mistakes[0]).toHaveProperty("given");
    expect(attempts[0].mistakes[0]).toHaveProperty("correct");
  });

  test("експорт JSON → скидання → імпорт → історія відновилася", async ({ page }) => {
    await startTest(page);
    await walkToReport(page);
    await page.getByRole("button", { name: /Історія/ }).click();

    const before = await readKey(page, KEYS.attempts);
    expect(before).toHaveLength(1);

    // 1) експорт у файл
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Експорт JSON" }).click();
    const download = await downloadPromise;
    const file = await download.path();
    expect(download.suggestedFilename()).toMatch(/^grammar-diagnostic-\d{4}-\d{2}-\d{2}\.json$/);

    // 2) скидання історії
    await page.getByRole("button", { name: "Стерти історію" }).click();
    await page.getByRole("button", { name: "Точно стерти?" }).click();
    await expect(page.getByRole("heading", { name: "Поки що порожньо" })).toBeVisible();
    expect(await readKey(page, KEYS.attempts)).toBeNull();

    // 3) імпорт того самого файлу
    await page.locator('[data-testid="import-input"]').setInputFiles(file);
    await expect(page.getByText("Додано спроб: 1")).toBeVisible();

    const after = await readKey(page, KEYS.attempts);
    expect(after).toEqual(before);
    await expect(page.getByRole("heading", { name: /Динаміка по темах/ })).toBeVisible();

    // повторний імпорт нічого не дублює
    await page.locator('[data-testid="import-input"]').setInputFiles(file);
    await expect(page.getByText("Додано спроб: 0, уже було: 1")).toBeVisible();
    expect((await readKey(page, KEYS.attempts)).length).toBe(1);
  });

  test("битий файл імпорту не ламає екран", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Історія/ }).click();
    await page.locator('[data-testid="import-input"]').setInputFiles({
      name: "broken.json",
      mimeType: "application/json",
      buffer: Buffer.from("це точно не json"),
    });
    await expect(page.getByText(/Імпорт не вдався/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Поки що порожньо" })).toBeVisible();
  });

  test("очищення історії не чіпає ротацію", async ({ page }) => {
    await startTest(page);
    await walkToReport(page);
    await page.getByRole("button", { name: /Історія/ }).click();

    await page.getByRole("button", { name: "Стерти історію" }).click();
    await page.getByRole("button", { name: "Точно стерти?" }).click();

    await expect(page.getByRole("heading", { name: "Поки що порожньо" })).toBeVisible();
    expect(await readKey(page, KEYS.attempts)).toBeNull();
    expect((await readKey(page, KEYS.usage)).run).toBe(1);
  });
});

test.describe("PWA", () => {
  test("маніфест, іконки і service worker на місці", async ({ page, request }) => {
    await page.goto("/");
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest.name).toBe("English test");
    expect(manifest.display).toBe("standalone");
    expect(manifest.lang).toBe("uk");
    // start_url і scope відносні — однаково працюють з кореня і з /<репо>/
    expect(manifest.start_url).toBe(".");
    expect(manifest.scope).toBe(".");
    expect(manifest.icons.map((i) => i.sizes)).toEqual(
      expect.arrayContaining(["192x192", "512x512"])
    );
    expect(manifest.icons.some((i) => i.purpose === "maskable")).toBe(true);

    // іконки не просто віддаються, а є справжніми PNG заявленого розміру
    for (const icon of manifest.icons) {
      const res = await request.get(icon.src.replace(/^\.?\//, "/"));
      expect(res.status(), icon.src).toBe(200);
      const buf = await res.body();
      expect(buf.subarray(1, 4).toString(), `${icon.src}: не PNG`).toBe("PNG");
      const [w, h] = [buf.readUInt32BE(16), buf.readUInt32BE(20)];
      expect(`${w}x${h}`, icon.src).toBe(icon.sizes);
    }

    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
      timeout: 20_000,
    });
  });

  test("додаток відкривається без мережі", async ({ page, context }) => {
    await page.goto("/");
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
      timeout: 20_000,
    });
    // прогріваємо кеш ассетів
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("English test");

    // шрифти теж у кеші — офлайн виглядає так само, як онлайн
    await page.waitForFunction(() => document.fonts.status === "loaded");
    expect(await page.evaluate(() => document.fonts.check('400 16px "IBM Plex Sans"'))).toBe(true);
    expect(await page.evaluate(() => document.fonts.check('400 12px "IBM Plex Mono"'))).toBe(true);

    // і тест офлайн проходиться, а не тільки відкривається
    await page.getByRole("button", { name: /Почати/ }).click();
    await expect(page.locator(".gd-card .gd-q")).toBeVisible();
    await context.setOffline(false);
  });

  test("жодних зовнішніх запитів у рантаймі", async ({ page }) => {
    const external = [];
    page.on("request", (r) => {
      const url = new URL(r.url());
      if (url.origin !== "http://localhost:4173") external.push(r.url());
    });
    await page.goto("/");
    await page.getByRole("button", { name: /Почати/ }).click();
    await answerCurrent(page);
    await page.waitForTimeout(1500);
    expect(external).toEqual([]);
  });
});
