import { defineConfig, devices } from "@playwright/test";

/* e2e ганяємо по зібраному додатку, а не по dev-серверу: у dev
   service worker навмисно не реєструється, а перевірити треба саме
   офлайнову збірку. */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : [["list"]],
  timeout: 90_000,
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    // навмисно НЕ перевикористовуємо чужий сервер: інакше playwright пропускає
    // build і мовчки ганяє тести по старій збірці — двічі спіймався на цьому
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
