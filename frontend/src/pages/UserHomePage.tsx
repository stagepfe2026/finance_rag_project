import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function UserHomePage() {
  const { user, session, logout } = useAuth();

  return (
    // <div className="space-y-6">
    //   <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    //     <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    //       <div>
    //         <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bienvenue {user?.prenom}</h1>
    //         <p className="mt-2 max-w-2xl text-sm text-slate-600">
    //           Votre espace utilisateur est protege par une session serveur expiree automatiquement en cas d inactivite.
    //         </p>
    //       </div>
    //       <Link
    //         to="/user/chat"
    //         className="inline-flex items-center justify-center rounded-xl bg-[#cb3a32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b7312a]"
    //       >
    //         Ouvrir le chat
    //       </Link>
    //     </div>
    //   </section>

    //   <section className="grid gap-4 md:grid-cols-2">
    //     <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    //       <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profil courant</h2>
    //       <div className="mt-4 space-y-2 text-sm text-slate-700">
    //         <p><span className="font-semibold">Nom:</span> {user?.nom}</p>
    //         <p><span className="font-semibold">Prenom:</span> {user?.prenom}</p>
    //         <p><span className="font-semibold">Email:</span> {user?.email}</p>
    //         <p><span className="font-semibold">Role:</span> {user?.role}</p>
    //       </div>
    //     </article>

    //     <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    //       <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Expiration</h2>
    //       <div className="mt-4 space-y-2 text-sm text-slate-700">
    //         <p><span className="font-semibold">Access token:</span> {formatDate(session?.access_expires_at)}</p>
    //         <p><span className="font-semibold">Idle timeout:</span> {formatDate(session?.idle_expires_at)}</p>
    //         <p><span className="font-semibold">Session max:</span> {formatDate(session?.absolute_expires_at)}</p>
    //       </div>
    //       <button
    //         type="button"
    //         onClick={() => void logout()}
    //         className="mt-5 rounded-xl bg-[#DA3D20] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#c73519]"
    //       >
    //         Se deconnecter
    //       </button>
    //     </article>
    //   </section>
    // </div>
    <div>
      <h1>page a ajouter</h1>
    </div>
  );
}
