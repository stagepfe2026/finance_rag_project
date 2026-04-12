import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f6f4] text-sm text-[#6b7280]">
      Chargement de la session...
    </div>
  );
}

export function RequireAuth({ allowedRoles }: { allowedRoles: Array<"ADMIN" | "FINANCE_USER"> }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "ADMIN" ? "/admin/documents/import" : "/user/accueil"} replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={user.role === "ADMIN" ? "/admin/documents/import" : "/user/accueil"} replace />;
  }

  return <Outlet />;
}

export function RoleHomeRedirect() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === "ADMIN" ? "/admin/documents/import" : "/user/accueil"} replace />;
}
