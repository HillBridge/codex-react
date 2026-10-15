import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { restoreHttp } from "./mockHttp";

afterEach(() => {
  cleanup();
  restoreHttp();
});
