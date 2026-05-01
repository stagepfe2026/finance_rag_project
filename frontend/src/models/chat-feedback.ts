export type ChatFeedbackTrendPoint = {
  date: string;
  label: string;
  likes: number;
  dislikes: number;
  signalements: number;
};

export type ChatFeedbackDocumentStat = {
  documentId: string;
  documentName: string;
  documentType: string;
  category: string;
  likes: number;
  dislikes: number;
  signalements: number;
  reportRate: number;
};

export type ChatFeedbackDistributionItem = {
  documentName: string;
  count: number;
  percentage: number;
};

export type ChatFeedbackRecentDislike = {
  messageId: string;
  conversationId: string;
  content: string;
  feedbackAt: string;
  sources: Array<{
    documentId: string;
    documentName: string;
  }>;
};

export type ChatFeedbackStats = {
  summary: {
    reportedResponses: number;
    likes: number;
    dislikes: number;
    satisfactionRate: number;
    mostFlaggedDocument: {
      documentId: string;
      documentName: string;
      signalements: number;
    } | null;
  };
  trend: ChatFeedbackTrendPoint[];
  quality: {
    likes: number;
    dislikes: number;
    signalements: number;
    satisfactionRate: number;
  };
  documents: ChatFeedbackDocumentStat[];
  distribution: ChatFeedbackDistributionItem[];
  recentDislikes: ChatFeedbackRecentDislike[];
};
