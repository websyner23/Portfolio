import { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { Spin } from "antd";
import MainLayout from "../layouts/MainLayout";
import LoginPage from "../pages/auth/LoginPage";
import { ForbiddenPage, NotFoundPage } from "../pages/ResultPages";
import ProtectedRoute from "./ProtectedRoute";
import { flattenRoutes, routeConfig } from "./routeConfig";

const CenteredSpin = () => (
  <div
    style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Spin size="large" />
  </div>
);

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: flattenRoutes(routeConfig).map((r) => ({
      path: r.path === "/" ? "" : r.path.replace(/^\//, ""),
      index: r.path === "/",
      element: (
        <ProtectedRoute permission={r.permission}>
          <Suspense fallback={<CenteredSpin />}>{r.element}</Suspense>
        </ProtectedRoute>
      ),
    })),
  },
  { path: "/forbidden", element: <ForbiddenPage /> },
  { path: "*", element: <NotFoundPage /> },
]);
