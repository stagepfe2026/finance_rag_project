export type ReclamationProblemType =
  | "BUG_TECHNIQUE"
  | "PROBLEME_JURIDIQUE"
  | "ERREUR_REPONSE_CHATBOT"
  | "AUTRE";

export type ReclamationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type ReclamationStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "FAILED";
export type ReclamationReadFilter = "ALL" | "READ" | "UNREAD";

export type ReclamationAttachment = {
  name: string;
  size: number | null;
  contentType: string | null;
  url: string | null;
};

export type ReclamationActivity = {
  id: string;
  description: string;
  actorName: string;
  createdAt: string;
};

export type Reclamation = {
  _id: string;
  ticketNumber: string;
  userId: string;
  userEmail: string;
  subject: string;
  description: string;
  problemType: ReclamationProblemType;
  customProblemType: string | null;
  priority: ReclamationPriority;
  status: ReclamationStatus;
  attachment: ReclamationAttachment | null;
  adminReply: string | null;
  adminReplyAt: string | null;
  adminReplyBy: string | null;
  lastUpdatedByAdminAt: string | null;
  lastUpdatedByAdminName: string | null;
  isReplyReadByUser: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  activityLog: ReclamationActivity[];
};

export type CreateReclamationInput = {
  subject: string;
  description: string;
  problemType: ReclamationProblemType;
  customProblemType?: string;
  priority: ReclamationPriority;
  attachment?: File | null;
};
