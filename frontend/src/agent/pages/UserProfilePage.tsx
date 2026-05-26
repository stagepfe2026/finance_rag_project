import { RotateCcw, Save } from "lucide-react";
import { useProfileViewModel } from "../viewmodels/useProfileViewModel";
import ProfileInformationGrid from "../components/profile/ProfileInformationGrid";
import ProfileSnackbar from "../components/profile/ProfileSnackbar";
import ProfileSummaryCard from "../components/profile/ProfileSummaryCard";

export default function UserProfilePage() {
  const vm = useProfileViewModel();

  if (!vm.user) {
    return (
      <div className="min-h-[calc(100vh-89px)] bg-slate-50 px-4 py-5 text-xs text-slate-500">
        Chargement du profil...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-89px)] bg-slate-50 px-4 py-4">
      <form onSubmit={vm.handleSubmit} className="mx-auto grid w-full gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <ProfileSummaryCard
          user={vm.user}
          imageUrl={vm.form.avatarUrl}
          onImageChange={(file) => void vm.handleImageChange(file)}
        />

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-[#273043]">Mes informations personnelles</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Reinitialiser les informations personnelles"
                onClick={vm.handleReset}
                disabled={vm.isSaving}
                className="inline-flex h-8 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#273043] transition hover:border-[#273043] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={15} />
                Reinitialiser
              </button>
              <button
                type="submit"
                aria-label={vm.isSaving ? "Enregistrement du profil en cours" : "Enregistrer les informations personnelles"}
                disabled={vm.isSaving}
                className="inline-flex h-8 items-center justify-center gap-2 rounded-xl bg-[#9d0208] px-4 text-sm font-semibold text-white transition hover:bg-[#7f0207] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={15} />
                {vm.isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>

          <ProfileInformationGrid form={vm.form} onFieldChange={vm.updateField} />
        </div>
      </form>
      <ProfileSnackbar open={vm.snackbar.open} message={vm.snackbar.message} tone={vm.snackbar.tone} />
    </div>
  );
}
