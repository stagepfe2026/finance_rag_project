import { Bell, BriefcaseBusiness, Mail, RotateCcw, Save, ShieldCheck, UserRound } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { useAuth } from "../../auth/AuthContext";
import { updateProfileRequest, type AuthUser, type ProfileUpdatePayload } from "../../services/auth.service";

type ProfileFormState = ProfileUpdatePayload;

type TextFieldProps = {
  label: string;
  name: keyof ProfileFormState;
  value: string;
  type?: "text" | "email" | "tel" | "date";
  placeholder?: string;
  onChange: (name: keyof ProfileFormState, value: string) => void;
};

type ToggleFieldProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function buildProfileForm(user: AuthUser | null): ProfileFormState {
  return {
    nom: user?.nom ?? "",
    prenom: user?.prenom ?? "",
    email: user?.email ?? "",
    telephone: user?.telephone ?? "",
    adresse: user?.adresse ?? "",
    dateNaissance: user?.dateNaissance ?? "",
    direction: user?.direction ?? "",
    service: user?.service ?? "",
    poste: user?.poste ?? "",
    matricule: user?.matricule ?? "",
    bureau: user?.bureau ?? "",
    responsable: user?.responsable ?? "",
    membreDepuis: user?.membreDepuis ?? "",
    languePreferee: user?.languePreferee ?? "fr",
    themePrefere: user?.themePrefere ?? "light",
    notificationsEmail: user?.notificationsEmail ?? true,
    notificationsSms: user?.notificationsSms ?? false,
    twoFactorEnabled: user?.twoFactorEnabled ?? false,
  };
}

function TextField({ label, name, value, type = "text", placeholder, onChange }: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-[#eadfdd] bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#b2342c] focus:ring-4 focus:ring-[#b2342c]/10"
      />
    </label>
  );
}

function ToggleField({ label, description, checked, onChange }: ToggleFieldProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#eadfdd] bg-white px-4 py-3 text-left transition hover:border-[#b2342c]"
    >
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="mt-1 block text-xs text-slate-500">{description}</span>
      </span>
      <span
        className={[
          "relative inline-flex h-6 w-11 shrink-0 rounded-full p-0.5 transition",
          checked ? "bg-[#b2342c]" : "bg-slate-200",
        ].join(" ")}
      >
        <span
          className={[
            "h-5 w-5 rounded-full bg-white shadow-sm transition",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

export default function UserProfilePage() {
  const { user, refreshSession } = useAuth();
  const [form, setForm] = useState<ProfileFormState>(() => buildProfileForm(user));
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.title = "Donnees personnelles | CIMF";
  }, []);

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-89px)] bg-slate-50 px-5 py-8 text-sm text-slate-500">
        Chargement du profil...
      </div>
    );
  }

  const initials = `${user.prenom?.charAt(0) ?? ""}${user.nom?.charAt(0) ?? ""}`.toUpperCase() || "U";

  function updateField(name: keyof ProfileFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setStatusMessage("");
    setErrorMessage("");
  }

  function updateToggle(name: "notificationsEmail" | "notificationsSms" | "twoFactorEnabled", value: boolean) {
    setForm((current) => ({ ...current, [name]: value }));
    setStatusMessage("");
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await updateProfileRequest(form);
      await refreshSession();
      const updatedUser = response.user ?? user;
      setForm(buildProfileForm(updatedUser));
      setStatusMessage("Vos donnees personnelles ont ete mises a jour.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de modifier les donnees personnelles.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setForm(buildProfileForm(user));
    setStatusMessage("");
    setErrorMessage("");
  }

  return (
    <div className="min-h-[calc(100vh-89px)] bg-slate-50 px-5 py-6">
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="overflow-hidden rounded-2xl border border-[#eadfdd] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#efe4e1] px-5 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff3f2] text-xl font-semibold text-[#b2342c]">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b2342c]">Profil utilisateur</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Modifier mes donnees personnelles</h1>
                <p className="mt-1 text-sm text-slate-500">{user.role === "ADMIN" ? "Administrateur" : "Utilisateur finance"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#eadfdd] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#b2342c] hover:text-[#b2342c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Reinitialiser
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#b2342c] px-4 text-sm font-semibold text-white transition hover:bg-[#992c25] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>

          {statusMessage ? (
            <div className="mx-5 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {statusMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-[#efe4e1] bg-[#fcf9f8] p-5">
                <div className="mb-5 flex items-center gap-2 text-slate-900">
                  <UserRound size={18} className="text-[#b2342c]" />
                  <h2 className="text-base font-semibold">Identite</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Prenom" name="prenom" value={form.prenom} onChange={updateField} />
                  <TextField label="Nom" name="nom" value={form.nom} onChange={updateField} />
                  <TextField label="Email" name="email" type="email" value={form.email} onChange={updateField} />
                  <TextField label="Telephone" name="telephone" type="tel" value={form.telephone} onChange={updateField} />
                  <TextField label="Date de naissance" name="dateNaissance" type="date" value={form.dateNaissance} onChange={updateField} />
                  <TextField label="Matricule" name="matricule" value={form.matricule} onChange={updateField} />
                </div>
              </section>

              <section className="rounded-2xl border border-[#efe4e1] bg-white p-5">
                <div className="mb-5 flex items-center gap-2 text-slate-900">
                  <BriefcaseBusiness size={18} className="text-[#b2342c]" />
                  <h2 className="text-base font-semibold">Informations professionnelles</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Direction" name="direction" value={form.direction} onChange={updateField} />
                  <TextField label="Service" name="service" value={form.service} onChange={updateField} />
                  <TextField label="Poste" name="poste" value={form.poste} onChange={updateField} />
                  <TextField label="Bureau" name="bureau" value={form.bureau} onChange={updateField} />
                  <TextField label="Responsable" name="responsable" value={form.responsable} onChange={updateField} />
                  <TextField label="Membre depuis" name="membreDepuis" type="date" value={form.membreDepuis} onChange={updateField} />
                </div>
              </section>

              <section className="rounded-2xl border border-[#efe4e1] bg-white p-5">
                <div className="mb-5 flex items-center gap-2 text-slate-900">
                  <Mail size={18} className="text-[#b2342c]" />
                  <h2 className="text-base font-semibold">Coordonnees</h2>
                </div>
                <TextField label="Adresse" name="adresse" value={form.adresse} onChange={updateField} />
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-[#efe4e1] bg-white p-5">
                <div className="mb-5 flex items-center gap-2 text-slate-900">
                  <ShieldCheck size={18} className="text-[#b2342c]" />
                  <h2 className="text-base font-semibold">Preferences</h2>
                </div>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Langue</span>
                    <select
                      value={form.languePreferee}
                      onChange={(event) => updateField("languePreferee", event.target.value)}
                      className="mt-2 h-12 w-full rounded-xl border border-[#eadfdd] bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#b2342c] focus:ring-4 focus:ring-[#b2342c]/10"
                    >
                      <option value="fr">Francais</option>
                      <option value="ar">Arabe</option>
                      <option value="en">Anglais</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Theme prefere</span>
                    <select
                      value={form.themePrefere}
                      onChange={(event) => updateField("themePrefere", event.target.value)}
                      className="mt-2 h-12 w-full rounded-xl border border-[#eadfdd] bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#b2342c] focus:ring-4 focus:ring-[#b2342c]/10"
                    >
                      <option value="light">Clair</option>
                      <option value="dark">Sombre</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-[#efe4e1] bg-[#fcf9f8] p-5">
                <div className="mb-5 flex items-center gap-2 text-slate-900">
                  <Bell size={18} className="text-[#b2342c]" />
                  <h2 className="text-base font-semibold">Notifications et securite</h2>
                </div>
                <div className="space-y-3">
                  <ToggleField
                    label="Notifications email"
                    description="Recevoir les alertes importantes par email."
                    checked={form.notificationsEmail}
                    onChange={(checked) => updateToggle("notificationsEmail", checked)}
                  />
                  <ToggleField
                    label="Notifications SMS"
                    description="Recevoir les alertes urgentes par SMS."
                    checked={form.notificationsSms}
                    onChange={(checked) => updateToggle("notificationsSms", checked)}
                  />
                  <ToggleField
                    label="Double authentification"
                    description="Garder une protection renforcee du compte."
                    checked={form.twoFactorEnabled}
                    onChange={(checked) => updateToggle("twoFactorEnabled", checked)}
                  />
                </div>
              </section>
            </aside>
          </div>
        </section>
      </form>
    </div>
  );
}
