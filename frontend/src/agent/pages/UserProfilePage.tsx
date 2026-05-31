import { useProfileViewModel } from "../viewmodels/useProfileViewModel";
import ProfileInformationGrid from "../components/profile/ProfileInformationGrid";
import ProfileSummaryCard from "../components/profile/ProfileSummaryCard";

export default function UserProfilePage() {
  const { user } = useProfileViewModel();

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-89px)] bg-slate-50 px-4 py-5 text-xs text-slate-500">
        Chargement du profil...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-89px)] bg-slate-50 px-4 py-4">
      <div className="mx-auto grid w-full gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <ProfileSummaryCard user={user} />

        <div className="min-w-0 space-y-4">
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-lg font-semibold tracking-tight text-[#273043]">Mes informations personnelles</h1>
          </div>
          <ProfileInformationGrid user={user} />
        </div>
      </div>
    </div>
  );
}
