import { createBrowserRouter } from "react-router-dom";

import AdminLayout from "./admin/layouts/AdminLayout";
import AgentLayout from "./agent/layouts/AgentLayout";

import { PublicOnlyRoute, RequireAuth, RoleHomeRedirect } from "./auth/guards";

import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";

import { agentRoutes } from "./agent/routes/agentRoutes";
import { adminRoutes } from "./admin/routes/adminRoutes";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RoleHomeRedirect />,
  },

  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },

  {
    path: "/admin",
    element: <RequireAuth allowedRoles={["ADMIN"]} />,
    children: [
      {
        element: <AdminLayout />,
        children: adminRoutes,
      },
    ],
  },

  {
    path: "/user",
    element: <RequireAuth allowedRoles={["FINANCE_USER", "ADMIN"]} />,
    children: [
      {
        element: <AgentLayout />,
        children: agentRoutes,
      },
    ],
  },

  {
    path: "*",
    element: <NotFoundPage />,
  },
]);