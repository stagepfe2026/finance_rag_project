import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import cimfLogo from "../../assets/cimf-logo.png";
import { BellRing, LogOut, UserPen } from "lucide-react";
function navClassName(isActive: boolean) {
  return [
    "group relative px-1 py-2 text-[13px] font-medium transition-colors duration-300",
    isActive ? "text-[#b2342c]" : "text-slate-600 hover:text-[#b2342c]",
  ].join(" ");
}

export default function UserLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const isChatPage = location.pathname.startsWith("/user/chat");
  return (
    <div className="min-h-screen bg-[#f8f4f3] text-[#111827]">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <img
              src={cimfLogo}
              alt="Logo CIMF"
              className="h-10 w-auto object-contain"
            />

            <nav className="flex items-center gap-6">
              <NavLink to="/user/accueil" className={({ isActive }) => navClassName(isActive)}>
                {({ isActive }) => (
                  <span className="relative inline-block">
                    Accueil
                    <span
                      className={[
                        "absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#b2342c] transition-transform duration-300",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      ].join(" ")}
                    />
                  </span>
                )}
              </NavLink>

              <NavLink to="/user/chat" className={({ isActive }) => navClassName(isActive)}>
                {({ isActive }) => (
                  <span className="relative inline-block">
                    Chat
                    <span
                      className={[
                        "absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#b2342c] transition-transform duration-300",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      ].join(" ")}
                    />
                  </span>
                )}
              </NavLink>

              <NavLink to="/user/documents/recherche" className={({ isActive }) => navClassName(isActive)}>
                {({ isActive }) => (
                  <span className="relative inline-block">
                    Recherche documents
                    <span
                      className={[
                        "absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#b2342c] transition-transform duration-300",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      ].join(" ")}
                    />
                  </span>
                )}
              </NavLink>

              <NavLink to="/user/reclamations" className={({ isActive }) => navClassName(isActive)}>
                {({ isActive }) => (
                  <span className="relative inline-block">
                    Reclamations
                    <span
                      className={[
                        "absolute left-0 -bottom-1 h-[2px] w-full origin-left rounded-full bg-[#b2342c] transition-transform duration-300",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                      ].join(" ")}
                    />
                  </span>
                )}
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-900">
                {user?.prenom} {user?.nom}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="cursor-pointer px-4 py-2 text-xs font-semibold text-slate-700 transition duration-300 hover:text-[#b2342c]"
            >
              <UserPen size={14} />
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="cursor-pointer text-xs font-semibold text-slate-700 transition duration-300 hover:text-[#b2342c]"
            >
              <BellRing size={16} />
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="cursor-pointer px-4 py-2 text-xs font-semibold text-slate-700 transition duration-300 hover:border-[#b2342c] hover:text-[#b2342c]"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      <main className={isChatPage ? "px-0 py-0" : "w-full "}>
        <Outlet />
      </main>
    </div>
  );
}
