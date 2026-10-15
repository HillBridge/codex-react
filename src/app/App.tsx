import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { appQueryClient } from "./queryClient";
import { ToastViewport } from "../shared/ui/toast";
import { router } from "./routes";

export function App() {
  return (
    <QueryClientProvider client={appQueryClient}>
      <RouterProvider router={router} />
      <ToastViewport />
    </QueryClientProvider>
  );
}
