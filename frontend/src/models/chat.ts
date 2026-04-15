export type ChatRole = "user" | "assistant";
export type ResponseMode = "short" | "detailed";

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
  pending?: boolean;
};

export type AskChatResult = {
  conversation: Conversation;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  sources: ChatSource[];
};
