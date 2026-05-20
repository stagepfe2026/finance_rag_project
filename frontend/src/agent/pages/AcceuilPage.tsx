import { useAcceuilViewModel } from "../viewmodels/useAcceuilViewModel";
import NotificationsPanel from "../components/acceuil/NotificationsPanel";
import QuickActionsSection from "../components/acceuil/QuickActionsSection";
import RecentDocumentsTable from "../components/acceuil/RecentDocumentsTable";
import SearchBar from "../components/acceuil/SearchBar";
import WelcomeBanner from "../components/acceuil/WelcomeBanner";

export default function AccueilPage() {
  const vm = useAcceuilViewModel();
  return (
    <div className="min-h-[calc(100vh-89px)] bg-slate-50 px-5 py-5">
      <div className="mx-auto flex min-h-[calc(100vh-129px)] w-full flex-col space-y-4">
        <WelcomeBanner userName={vm.userName} imageSrc={vm.buildingImage} />

        {vm.pageError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {vm.pageError}
          </div>
        ) : null}

        <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="flex min-h-0 flex-col space-y-4">
            <SearchBar onSearch={vm.handleSearch} />
            <QuickActionsSection actions={vm.quickActions} />
            <RecentDocumentsTable documents={vm.recentDocuments} />
          </div>

          <div className="flex min-h-0 flex-col space-y-4">
            <NotificationsPanel items={vm.notifications} onDismiss={vm.handleDismissNotification} />
          </div>
        </div>
      </div>
    </div>
  );
}
