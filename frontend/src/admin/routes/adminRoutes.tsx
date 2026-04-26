import AuditPage from "../pages/AuditPage";
import DashboardPage from "../pages/DashboardPage";
import ImportDocumentPage from "../pages/ImportDocumentPage";
import ListDocumentPage from "../pages/ListDocumentPage";
import ReclamationPage from "../pages/ReclamationPage";

export const adminRoutes = [
  {
    index: true,
    element: <DashboardPage />,
  },
  {
    path: "dashboard",
    element: <DashboardPage />,
  },
  {
    path: "audit",
    element: <AuditPage />,
  },
  {
    path: "documents/import",
    element: <ImportDocumentPage />,
  },
  {
    path: "documents/list",
    element: <ListDocumentPage />,
  },
  {
    path: "reclamations",
    element: <ReclamationPage />,
  },
];
