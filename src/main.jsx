import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

/* Service worker реєструє vite-plugin-pwa (injectRegister: "auto",
   registerType: "autoUpdate") — у проді й лише для власного origin. */
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
