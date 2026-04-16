export type ReclamationProblemType =
  | "BUG_TECHNIQUE"
  | "PROBLEME_JURIDIQUE"
  | "ERREUR_REPONSE_CHATBOT"
  | "AUTRE";

export type ReclamationPriority = "LOW" | "NORMAL" | "HIGH";
export type ReclamationStatus = "PENDING" | "RESOLVED" | "FAILED";

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
  isReplyReadByUser: boolean;
  createdAt: string;
  updatedAt: string;
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
