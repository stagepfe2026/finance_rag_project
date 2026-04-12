import { useAuth } from "../auth/AuthContext";

export default function UserHomePage() {
  const { user, session, logout } = useAuth();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bienvenue {user?.prenom}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Votre espace utilisateur est protege par une session serveur expiree automatiquement en cas d inactivite.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profil courant</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Nom:</span> {user?.nom}</p>
            <p><span className="font-semibold">Prenom:</span> {user?.prenom}</p>
            <p><span className="font-semibold">Email:</span> {user?.email}</p>
            <p><span className="font-semibold">Role:</span> {user?.role}</p>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Expiration</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Access token:</span> {session?.access_expires_at ?? "-"}</p>
            <p><span className="font-semibold">Idle timeout:</span> {session?.idle_expires_at ?? "-"}</p>
            <p><span className="font-semibold">Session max:</span> {session?.absolute_expires_at ?? "-"}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-5 rounded-xl bg-[#DA3D20] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#c73519]"
          >
            Se deconnecter
          </button>
        </article>
      </section>
    </div>
  );
}
