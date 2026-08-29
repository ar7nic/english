import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/* GitHub Pages віддає проєкт із підпапки /<назва-репо>/, і без правильного
   base виходить біла сторінка з 404 на асетах. Воркфлоу підставляє реальну
   назву репозиторію через BASE_PATH; локально лишається "/". */
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png", "icon-maskable-512.png"],
      manifest: {
        name: "Тест з англійської граматики",
        short_name: "Граматика",
        description:
          "Офлайн-діагностика англійської граматики A2 → B2. Усі дані лишаються на пристрої.",
        lang: "uk",
        start_url: ".",
        scope: ".",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#EDF0F4",
        theme_color: "#EDF0F4",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // woff2 немає в наборі за замовчуванням, а без шрифтів офлайн виглядає інакше
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
      // жодних зовнішніх runtimeCaching-правил: додаток нікуди не ходить
    }),
  ],
  server: { port: 5173 },
  preview: { port: 4173 },
  build: { outDir: "dist", sourcemap: true },
  test: {
    // юніт-тести чіпають лише lib/ і data/ — DOM тут не потрібен
    environment: "node",
    include: ["tests/unit/**/*.test.js"],
  },
});
