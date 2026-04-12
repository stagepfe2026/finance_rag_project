import ImportDocumentPage from "../pages/ImportDocumentPage";
import ListDocumentPage from "../pages/ListDocumentPage";

export const adminRoutes = [
  {
    path: "documents/import",
    element: <ImportDocumentPage />,
  },
  {
    path: "documents/list",
    element: <ListDocumentPage />,
  },
];
