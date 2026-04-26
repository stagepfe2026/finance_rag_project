import { createBrowserRouter } from "react-router-dom";
import AdminLayout from "./admin/layouts/AdminLayout";
import { adminRoutes } from "./admin/routes/adminRoutes";
import { PublicOnlyRoute, RequireAuth, RoleHomeRedirect } from "./auth/guards";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import UserLayout from "./user/layouts/UserLayout";
import { userRoutes } from "./user/routes/userRoutes";

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
        element: <UserLayout />,
        children: userRoutes,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
