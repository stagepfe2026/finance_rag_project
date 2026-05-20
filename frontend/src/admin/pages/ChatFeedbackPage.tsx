import { useChatFeedbackViewModel } from "../viewmodels/useChatFeedbackViewModel";
import Snackbar from "../components/Snackbar";
import AvisFilterBar from "../components/avis/AvisFilterBar";
import DistributionCard from "../components/avis/DistributionCard";
import DocumentsTable from "../components/avis/DocumentsTable";
import Header from "../components/avis/Header";
import QualityCard from "../components/avis/QualityCard";
import StatsGrid from "../components/avis/StatsGrid";
import TrendChart from "../components/avis/TrendChart";

export default function ChatFeedbackPage() {
  const vm = useChatFeedbackViewModel();
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Header
        reportedResponsesCount={vm.stats.summary.reportedResponses}
        documentSignalementsCount={vm.distributionTotal}
        onRefresh={() => void vm.loadStats()}
        isLoading={vm.isLoading}
      />

      <main className="space-y-4 px-2 py-1">
        <StatsGrid summary={vm.stats.summary} isLoading={vm.isLoading} />

        <div className="grid gap-4 lg:grid-cols-[1fr_310px] xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-4">
            <TrendChart trend={vm.stats.trend} isLoading={vm.isLoading} />
            <AvisFilterBar
              search={vm.docSearch}
              sortBy={vm.docSortBy}
              onSearchChange={vm.setDocSearch}
              onSortChange={vm.setDocSortBy}
              resultCount={vm.filteredDocuments.length}
            />
            <DocumentsTable documents={vm.filteredDocuments} busyDocumentId={vm.busyDocumentId} onReindex={vm.handleReindex} />
          </div>

          <div className="min-w-0 space-y-4">
            <QualityCard quality={vm.stats.quality} />
            <DistributionCard
              distribution={vm.stats.distribution}
              total={vm.distributionTotal}
              selectedName={vm.selectedDistributionName}
              onSelectedNameChange={vm.setSelectedDistributionName}
            />
          </div>
        </div>
      </main>
      <Snackbar
        open={vm.snackbar.open}
        message={vm.snackbar.message}
        tone={vm.snackbar.tone}
        onClose={vm.closeSnackbar}
      />
    </div>
  );
}
