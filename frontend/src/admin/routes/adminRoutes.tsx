import { Routes, Route } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";

import DashboardPage from "../pages/DashboardPage";
import AuditPage from "../pages/AuditPage";
import ChatFeedbackPage from "../pages/ChatFeedbackPage";
import ImportDocumentPage from "../pages/ImportDocumentPage";
import ListDocumentPage from "../pages/ListDocumentPage";
import ReclamationPage from "../pages/ReclamationPage";
export default function Router() {
  return (
    <Routes>

      {/* 🔵 LAYOUT ADMIN */}
      <Route path="/admin" element={<AdminLayout />}>

        {/* 🟢 CHILDREN (OUTLET ICI) */}
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="avis-chat" element={<ChatFeedbackPage />} />
        <Route path="documents/import" element={<ImportDocumentPage />} />
        <Route path="documents/list" element={<ListDocumentPage />} />
        <Route path="reclamations" element={<ReclamationPage />} />

      </Route>

    </Routes>
  );
}