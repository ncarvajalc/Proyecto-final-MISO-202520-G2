import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Home = lazy(() => import("@/pages/Home"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export const routes: RouteObject[] = [
  { path: "/", element: <Home /> },
  { path: "*", element: <NotFound /> },
];
