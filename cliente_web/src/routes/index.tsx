import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
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
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
    path: "/catalogos",
    element: (
      <ProtectedRoute>
        <Catalogos />
      </ProtectedRoute>
    ),
  },
  {
    path: "/catalogos/proveedores",
    element: (
      <ProtectedRoute>
        <Proveedores />
      </ProtectedRoute>
    ),
  },
  {
    path: "/catalogos/productos",
    element: (
      <ProtectedRoute>
        <Productos />
      </ProtectedRoute>
    ),
  },
  {
    path: "/comercial",
    element: (
      <ProtectedRoute>
        <Comercial />
      </ProtectedRoute>
    ),
  },
  {
    path: "/comercial/vendedores",
    element: (
      <ProtectedRoute>
        <Vendedores />
      </ProtectedRoute>
    ),
  },
  {
    path: "/comercial/planes-venta",
    element: (
      <ProtectedRoute>
        <PlanesVenta />
      </ProtectedRoute>
    ),
  },
  {
    path: "/comercial/informes-comerciales",
    element: (
      <ProtectedRoute>
        <InformesComerciales />
      </ProtectedRoute>
    ),
  },
  {
    path: "/logistica",
    element: (
      <ProtectedRoute>
        <Logistica />
      </ProtectedRoute>
    ),
  },
  { path: "*", element: <NotFound /> },
];
