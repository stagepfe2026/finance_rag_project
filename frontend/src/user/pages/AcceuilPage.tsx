import HelpCard from "../components/acceuil/HelpCard";
import NotificationsPanel from "../components/acceuil/NotificationsPanel";
import QuickAccessPanel from "../components/acceuil/QuickAccessPanel";
import QuickActionsSection from "../components/acceuil/QuickActionsSection";
import RecentDocumentsTable from "../components/acceuil/RecentDocumentsTable";
import SearchBar from "../components/acceuil/SearchBar";
import WelcomeBanner from "../components/acceuil/WelcomeBanner";

import {
  notifications,
  quickAccessItems,
  quickActions,
  recentDocuments,
} from "../components/acceuil/data/accueil.mock";

import buildingImage from "../../assets/building_cimf.png";

export default function AccueilPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-5 py-5">
      <div className="mx-auto w-full space-y-4">
        <WelcomeBanner userName="Ahmed Ben Ali" imageSrc={buildingImage} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <SearchBar />
            <QuickActionsSection actions={quickActions} />
            <RecentDocumentsTable documents={recentDocuments} />
          </div>

          <div className="space-y-4">
            <NotificationsPanel items={notifications} />
            <QuickAccessPanel items={quickAccessItems} />
            <HelpCard />
          </div>
        </div>
      </div>
    </div>
  );
}