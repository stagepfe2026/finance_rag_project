import { Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function UserLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#111827]">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">rag_finance</p>
            <p className="text-xs text-slate-500">Espace utilisateur</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.prenom} {user?.nom}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#DA3D20] hover:text-[#DA3D20]"
            >
              Deconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
