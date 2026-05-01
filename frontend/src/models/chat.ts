export type ChatRole = "user" | "assistant";
export type ResponseMode = "short" | "detailed";
export type ChatFeedback = "like" | "dislike";

export type Conversation = {
  _id: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isArchived: boolean;
  archivedAt: string | null;
};

export type ChatSource = {
  document_id: string;
  category: string;
  document_name: string;
  document_type: string;
  legal_status: string;
  date_publication?: string | null;
  date_entree_vigueur?: string | null;
  version: string;
  relation_type: string;
  related_document_id?: string | null;
  related_document_title?: string;
  chunk_index?: number;
  vector_score: number;
  lexical_score: number;
  final_score: number;
};

export type ChatMessage = {
  _id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  sources?: ChatSource[];
  feedback?: ChatFeedback | null;
  feedbackAt?: string | null;
  pending?: boolean;
};

export type AskChatResult = {
  conversation: Conversation;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  sources: ChatSource[];
};
