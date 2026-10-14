import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./shared/ui/tokens.css";
import "./app/styles/global.css";

async function startApp() {
  if (import.meta.env.DEV) {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledFrame: "error" });
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void startApp();
