import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Home = lazy(() => import("@/pages/Home"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Catalogos = lazy(() => import("@/pages/Catalogos"));
const Proveedores = lazy(() => import("@/pages/Proveedores"));
const Productos = lazy(() => import("@/pages/Productos"));
const Comercial = lazy(() => import("@/pages/Comercial"));
const Vendedores = lazy(() => import("@/pages/Vendedores"));
const PlanesVenta = lazy(() => import("@/pages/PlanesVenta"));
const InformesComerciales = lazy(() => import("@/pages/InformesComerciales"));
const Logistica = lazy(() => import("@/pages/Logistica"));

export const routes: RouteObject[] = [
  { path: "/", element: <Home /> },
  { path: "/catalogos", element: <Catalogos /> },
  { path: "/catalogos/proveedores", element: <Proveedores /> },
  { path: "/catalogos/productos", element: <Productos /> },
  { path: "/comercial", element: <Comercial /> },
  { path: "/comercial/vendedores", element: <Vendedores /> },
  { path: "/comercial/planes-venta", element: <PlanesVenta /> },
  { path: "/comercial/informes-comerciales", element: <InformesComerciales /> },
  { path: "/logistica", element: <Logistica /> },
  { path: "*", element: <NotFound /> },
];
