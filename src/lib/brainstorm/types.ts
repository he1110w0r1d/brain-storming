export type SenderType = 'user' | 'ai' | 'system' | 'summarizer';

export type MessageStatus = 'pending' | 'streaming' | 'done' | 'error';

export type SessionStatus = 'idle' | 'running' | 'summarizing' | 'completed' | 'failed';

export type DiscussionRound = 0 | 1 | 2 | 3 | 4;

export type AccentColor = 'primary' | 'secondary' | 'tertiary';

export interface AIRole {
  id: string;
  name: string;
  avatar: string;
  description: string;
  model: string;
  systemPrompt: string;
  persona: string;
  tone: string;
  enabled: boolean;
  accentColor: AccentColor;
  icon: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  round: DiscussionRound;
  senderType: SenderType;
  senderId: string;
  senderName: string;
  content: string;
  replyToMessageIds: string[];
  createdAt: Date;
  status: MessageStatus;
  meta: {
    model: string;
    role: string;
    roundPurpose: string;
  };
}

export interface FinalSummary {
  id: string;
  sessionId: string;
  content: string;
  summarizerRoleId: string;
  summarizerName: string;
  createdAt: Date;
  sections: {
    problemRestatement: string;
    mainViewpoints: string;
    controversies: string;
    consensus: string;
    finalRecommendation: string;
  };
}

export interface DiscussionRoundData {
  round: DiscussionRound;
  status: 'pending' | 'in_progress' | 'completed';
  messages: ChatMessage[];
  startedAt?: Date;
  completedAt?: Date;
}

export interface BrainstormSession {
  id: string;
  userQuestion: string;
  createdAt: Date;
  updatedAt: Date;
  status: SessionStatus;
  rounds: {
    round1: DiscussionRoundData;
    round2: DiscussionRoundData;
    round3: DiscussionRoundData;
  };
  finalSummary: FinalSummary | null;
  selectedSummarizerRoleId: string | null;
  enabledRoleIds: string[];
}

export interface AppState {
  currentSession: BrainstormSession | null;
  sessions: BrainstormSession[];
  availableRoles: AIRole[];
  isLoading: boolean;
  error: string | null;
}

export interface StartSessionRequest {
  question: string;
  enabledRoleIds: string[];
}

export interface StartSessionResponse {
  sessionId: string;
  status: SessionStatus;
}

export interface SessionResponse {
  session: BrainstormSession;
  newMessages: ChatMessage[];
}

export interface LLMCallParams {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
