import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("🚀 Приложение запускается...");

try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
        throw new Error("Элемент #root не найден в DOM");
    }

    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
    
    console.log("✅ Приложение успешно загружено");
} catch (error) {
    console.error("❌ Ошибка при загрузке приложения:", error);
    document.body.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif;">
            <h1>Ошибка загрузки приложения</h1>
            <p>${error instanceof Error ? error.message : String(error)}</p>
            <p>Откройте консоль браузера (F12) для подробностей</p>
        </div>
    `;
}
