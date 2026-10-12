import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { appQueryClient } from "./queryClient";
import { router } from "./routes";

export function App() {
  return (
    <QueryClientProvider client={appQueryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
