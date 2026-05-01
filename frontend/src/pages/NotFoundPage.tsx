import { Home, SearchX } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

import buildingImage from "../assets/building_cimf.png";

export default function NotFoundPage() {
  useEffect(() => {
    document.title = "404 | CIMF";
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f4f3] px-6 py-10">
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: "radial-gradient(rgba(178,52,44,0.18) 0.7px, transparent 0.7px)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="absolute inset-x-0 top-0 h-[280px] bg-[radial-gradient(circle_at_top,rgba(178,52,44,0.16),transparent_58%)]" />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-10 rounded-[36px] border border-[#eadfdb] bg-white/90 p-8 shadow-[0_30px_80px_rgba(17,24,39,0.10)] backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1f1] px-4 py-2 text-sm font-semibold text-[#9d0208]">
            <SearchX size={16} />
            404
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[#1f2937] md:text-5xl">
            Page introuvable
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            La route que vous avez demandee n existe pas ou n est pas encore definie.
            Utilisez la navigation principale pour revenir vers Accueil, Reclamations ou Recherche documents.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/user/accueil"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#9d0208] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#972b24]"
            >
              <Home size={16} />
              Retour a l accueil
            </Link>
            <Link
              to="/user/reclamations"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#e3d9d6] bg-[#faf7f6] px-5 py-3 text-sm font-semibold text-[#7b312b] transition hover:bg-[#f5efed]"
            >
              Reclamations
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle,rgba(178,52,44,0.12),transparent_70%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-[32px] border border-[#f0e5e2] bg-[#fcf8f7] p-5">
            <img
              src={buildingImage}
              alt="Illustration CIMF"
              className="h-[320px] w-full rounded-[24px] object-cover"
            />
            <div className="mt-4 rounded-[24px] bg-white px-4 py-3 shadow-sm">
              <p className="text-sm font-semibold text-[#9d0208]">Navigation disponible</p>
              <p className="mt-1 text-sm text-slate-600">Accueil, Chat, Recherche documents, Reclamations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
