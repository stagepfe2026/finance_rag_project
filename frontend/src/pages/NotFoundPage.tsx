import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import ErrorImage from "../components/notFoundPage/404Image";
import ErrorContent from "../components/notFoundPage/ErrorContent";
import Header from "../components/notFoundPage/Header";

function getHomePath(role?: "ADMIN" | "FINANCE_USER") {
  return role === "ADMIN" ? "/admin/dashboard" : "/user/accueil";
}

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const homePath = isAuthenticated ? getHomePath(user?.role) : "/login";

  useEffect(() => {
    document.title = "Page introuvable | CIMF";
  }, []);

  return (
    <main className="min-h-screen bg-white text-[#1f2937]">
      <Header />
      <div className="mx-auto grid min-h-[calc(100vh-89px)] w-full max-w-4xl items-center gap-10 px-8 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-16">
        <ErrorContent
          homePath={homePath}
          homeLabel={isAuthenticated ? "Retour a l'accueil" : "Aller a la connexion"}
          onBack={() => navigate(-1)}
        />
        <ErrorImage />
      </div>
    </main>
  );
}
