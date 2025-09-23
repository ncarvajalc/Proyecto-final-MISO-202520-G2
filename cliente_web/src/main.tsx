import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./routes/index.tsx";

const router = createBrowserRouter(
  [
    {
      element: <App />,
      children: routes,
    },
  ],
  {
    basename: import.meta.env.VITE_BASE,
  }
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
