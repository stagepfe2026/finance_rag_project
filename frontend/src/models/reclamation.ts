export type ReclamationProblemType =
  | "BUG_TECHNIQUE"
  | "PROBLEME_JURIDIQUE"
  | "ERREUR_REPONSE_CHATBOT"
  | "AUTRE";

export type ReclamationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type ReclamationStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "FAILED";
export type ReclamationReadFilter = "ALL" | "READ" | "UNREAD";

type ReclamationAttachment = {
  name: string;
  size: number | null;
  contentType: string | null;
  url: string | null;
};

type ReclamationActivity = {
  id: string;
  description: string;
  actorName: string;
  createdAt: string;
};

export type ReclamationSlaStatus =
  | "ON_TIME"
  | "DUE_SOON"
  | "OVERDUE"
  | "COMPLETED_ON_TIME"
  | "COMPLETED_LATE";

export type Reclamation = {
  _id: string;
  referenceNumber: string;
  userId: string;
  userEmail: string;
  subject: string;
  description: string;
  issueCategory: ReclamationProblemType;
  customIssueCategory: string | null;
  priority: ReclamationPriority;
  status: ReclamationStatus;
  attachment: ReclamationAttachment | null;
  adminReply: string | null;
  adminReplyAt: string | null;
  repliedByAdminId: string | null;
  lastAdminActionAt: string | null;
  lastAdminActorName: string | null;
  replyAcknowledged: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  history: ReclamationActivity[];
  takenAt: string | null;
  takenByAdminName: string | null;
  slaDeadlineAt: string | null;
  slaStatus: ReclamationSlaStatus;
  slaRemainingMinutes: number | null;
  slaDelayMinutes: number | null;
  isSlaOverdue: boolean;
};

export type CreateReclamationInput = {
  subject: string;
  description: string;
  problemType: ReclamationProblemType;
  customProblemType?: string;
  priority: ReclamationPriority;
  attachment?: File | null;
};

export type UpdateReclamationInput = CreateReclamationInput;

export const reclamationProblemTypeLabels: Record<ReclamationProblemType, string> = {
  BUG_TECHNIQUE: "Bug technique",
  PROBLEME_JURIDIQUE: "Probleme juridique",
  ERREUR_REPONSE_CHATBOT: "Erreur reponse chatbot",
  AUTRE: "Autre",
};

export const reclamationPriorityLabels: Record<ReclamationPriority, string> = {
  LOW: "Faible",
  NORMAL: "Normale",
  HIGH: "Elevee",
  URGENT: "Urgente",
};
