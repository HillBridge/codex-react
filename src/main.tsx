import React from "react";
import ReactDOM from "react-dom/client";
import "./shared/ui/tokens.css";
import "./app/styles/global.css";
import { App } from "./app/App";

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
