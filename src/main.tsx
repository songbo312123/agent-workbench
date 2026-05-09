import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./app/app.css";

function formatBootError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? `\n\n${error.stack}` : ""}`;
  }
  return String(error);
}

function showBootError(error: unknown) {
  const root = document.getElementById("root");
  if (!root) return;

  const escapedError = formatBootError(error)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  root.innerHTML = `
    <div style="
      min-height: 100vh;
      padding: 24px;
      background: #0b1020;
      color: #e5e7eb;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      white-space: pre-wrap;
    ">
      <h1 style="font: 600 18px system-ui; margin: 0 0 12px;">Agent Workbench 启动失败</h1>
      <pre style="margin: 0; color: #fca5a5;">${escapedError}</pre>
    </div>
  `;
}

window.addEventListener("error", (event) => {
  showBootError(event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  showBootError(event.reason);
});

try {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Missing #root element");
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  showBootError(error);
}
