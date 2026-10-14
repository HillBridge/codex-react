import React from "react";
import ReactDOM from "react-dom/client";
import "./shared/ui/tokens.css";
import "./app/styles/global.css";
import { App } from "./app/App";

function startApp() {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

startApp();
