import { FileWarning, ThumbsDown, ThumbsUp } from "lucide-react";

import type { ChatFeedbackStats } from "../../../models/chat-feedback";
import StatCard from "./StatCard";

type StatsGridProps = {
  summary: ChatFeedbackStats["summary"];
  isLoading: boolean;
};

export default function StatsGrid({ summary }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
      <StatCard icon={<ThumbsUp size={16} />} label="Retours positifs" value={summary.likes} helper="" />
      <StatCard
        icon={<ThumbsDown size={16} />}
        label="Retours négatifs"
        value={summary.dislikes}
        helper=""
      />
      <StatCard
        icon={<FileWarning size={16} />}
        label="Document le plus signalé"
        value={summary.mostFlaggedDocument?.documentName || "Aucun"}
        helper=""
      />
    </div>
  );
}
