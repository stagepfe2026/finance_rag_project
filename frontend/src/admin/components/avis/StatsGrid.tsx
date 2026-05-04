import { FileWarning, MessageSquareWarning, ThumbsDown, ThumbsUp } from "lucide-react";

import type { ChatFeedbackStats } from "../../../models/chat-feedback";
import StatCard from "./StatCard";

type StatsGridProps = {
  summary: ChatFeedbackStats["summary"];
  isLoading: boolean;
};

export default function StatsGrid({ summary, isLoading }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        icon={<MessageSquareWarning size={16} />}
        label="Réponses signalées"
        value={summary.reportedResponses}
        helper={isLoading ? "Chargement..." : "À vérifier"}
      />
      <StatCard icon={<ThumbsUp size={16} />} label="Likes" value={summary.likes} helper="Réponses utiles" />
      <StatCard
        icon={<ThumbsDown size={16} />}
        label="Dislikes"
        value={summary.dislikes}
        helper={`${summary.dislikesWithoutSource ?? 0} sans source`}
      />
      <StatCard
        icon={<FileWarning size={16} />}
        label="Document signalé"
        value={summary.mostFlaggedDocument?.documentName || "Aucun"}
        helper={`${summary.mostFlaggedDocument?.signalements ?? 0} signalement${
          (summary.mostFlaggedDocument?.signalements ?? 0) !== 1 ? "s" : ""
        }`}
      />
    </div>
  );
}
