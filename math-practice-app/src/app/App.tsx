import { useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppProvider } from "./AppProvider";
import { appRoutes } from "./AppRoutes";

export default function App() {
  const [router] = useState(() => createBrowserRouter(appRoutes));
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
