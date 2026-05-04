import { createBrowserRouter } from "react-router-dom";

import AdminLayout from "./admin/layouts/AdminLayout";
import UserLayout from "./user/layouts/UserLayout";

import { PublicOnlyRoute, RequireAuth, RoleHomeRedirect } from "./auth/guards";

import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";

import DashboardPage from "./admin/pages/DashboardPage";
import AuditPage from "./admin/pages/AuditPage";
import ChatFeedbackPage from "./admin/pages/ChatFeedbackPage";
import ImportDocumentPage from "./admin/pages/ImportDocumentPage";
import ListDocumentPage from "./admin/pages/ListDocumentPage";


import { userRoutes } from "./user/routes/userRoutes";
import ReclamationPage from "./admin/pages/ReclamationPage";

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
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "audit", element: <AuditPage /> },
          { path: "avis-chat", element: <ChatFeedbackPage /> },
          { path: "documents/import", element: <ImportDocumentPage /> },
          { path: "documents/list", element: <ListDocumentPage /> },
          { path: "reclamations", element: <ReclamationPage /> },
        ],
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