import { create } from 'zustand';
import {
  BrainstormSession,
  ChatMessage,
  DiscussionRound,
  FinalSummary,
  AIRole,
} from '@/lib/brainstorm/types';
import { DEFAULT_ROLES } from '@/lib/brainstorm/role-config';
import {
  createSession,
  runBrainstormSession,
  getAllMessages,
} from '@/lib/brainstorm/orchestrator';
import { saveSessions, loadSessions } from '@/lib/utils/storage';

interface BrainstormState {
  currentSession: BrainstormSession | null;
  sessions: BrainstormSession[];
  messages: ChatMessage[];
  availableRoles: AIRole[];
  isLoading: boolean;
  isRunning: boolean;
  error: string | null;
  currentRound: DiscussionRound | null;
  currentSpeaker: string | null;
  summarizerName: string | null;
}

interface BrainstormActions {
  initialize: () => void;
  startSession: (question: string, enabledRoleIds: string[]) => Promise<void>;
  stopSession: () => void;
  resetSession: () => void;
  setCurrentSession: (session: BrainstormSession | null) => void;
  updateMessage: (message: ChatMessage) => void;
  addMessage: (message: ChatMessage) => void;
  setCurrentRound: (round: DiscussionRound | null) => void;
  setCurrentSpeaker: (speaker: string | null) => void;
  setSummarizerName: (name: string | null) => void;
  setError: (error: string | null) => void;
  toggleRole: (roleId: string) => void;
  clearHistory: () => void;
}

type BrainstormStore = BrainstormState & BrainstormActions;

export const useBrainstormStore = create<BrainstormStore>((set, get) => ({
  currentSession: null,
  sessions: [],
  messages: [],
  availableRoles: DEFAULT_ROLES,
  isLoading: false,
  isRunning: false,
  error: null,
  currentRound: null,
  currentSpeaker: null,
  summarizerName: null,

  initialize: () => {
    const savedSessions = loadSessions();
    set({ sessions: savedSessions });
  },

  startSession: async (question: string, enabledRoleIds: string[]) => {
    const { sessions, availableRoles } = get();

    const enabledRoles = availableRoles.filter(
      r => enabledRoleIds.includes(r.id)
    );

    if (enabledRoles.length === 0) {
      set({ error: '请至少选择一个 AI 角色' });
      return;
    }

    const session = createSession(question, enabledRoleIds);
    const userMessage: ChatMessage = {
      id: 'user-msg',
      sessionId: session.id,
      round: 0,
      senderType: 'user',
      senderId: 'user',
      senderName: '用户',
      content: question,
      replyToMessageIds: [],
      createdAt: new Date(),
      status: 'done',
      meta: {
        model: '',
        role: 'user',
        roundPurpose: 'user_question',
      },
    };

    set({
      currentSession: session,
      messages: [userMessage],
      isRunning: true,
      isLoading: true,
      error: null,
      currentRound: null,
      currentSpeaker: null,
      summarizerName: null,
    });

    try {
      const finalSession = await runBrainstormSession(session, {
        onRoundStart: (round: DiscussionRound) => {
          set({ currentRound: round });
        },
        onMessageGenerated: (message: ChatMessage) => {
          const { messages } = get();
          const existingIndex = messages.findIndex(m => m.id === message.id);

          if (existingIndex >= 0) {
            const updatedMessages = [...messages];
            updatedMessages[existingIndex] = message;
            set({ messages: updatedMessages });
          } else {
            set({ messages: [...messages, message] });
          }

          if (message.senderType === 'ai') {
            set({ currentSpeaker: message.senderName });
          }
        },
        onRoundComplete: (round: DiscussionRound) => {
          set({ currentSpeaker: null });
        },
        onSummaryStart: (roleId: string, roleName: string) => {
          set({
            currentRound: null,
            currentSpeaker: roleName,
            summarizerName: roleName,
          });
        },
        onSummaryGenerated: (summary: FinalSummary) => {
          set({ currentSpeaker: null });
        },
        onSessionUpdate: (session: BrainstormSession) => {
          set({ currentSession: session });
        },
        onError: (error: Error) => {
          set({ error: error.message });
        },
      });

      const allMsgs = getAllMessages(finalSession);
      const updatedSessions = [finalSession, ...sessions].slice(0, 10);

      saveSessions(updatedSessions);

      set({
        currentSession: finalSession,
        messages: allMsgs,
        sessions: updatedSessions,
        isRunning: false,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isRunning: false,
        isLoading: false,
      });
    }
  },

  stopSession: () => {
    set({ isRunning: false, isLoading: false });
  },

  resetSession: () => {
    set({
      currentSession: null,
      messages: [],
      isRunning: false,
      isLoading: false,
      error: null,
      currentRound: null,
      currentSpeaker: null,
      summarizerName: null,
    });
  },

  setCurrentSession: (session: BrainstormSession | null) => {
    if (session) {
      const messages = getAllMessages(session);
      set({ currentSession: session, messages });
    } else {
      set({ currentSession: null, messages: [] });
    }
  },

  updateMessage: (message: ChatMessage) => {
    const { messages } = get();
    const index = messages.findIndex(m => m.id === message.id);

    if (index >= 0) {
      const updatedMessages = [...messages];
      updatedMessages[index] = message;
      set({ messages: updatedMessages });
    }
  },

  addMessage: (message: ChatMessage) => {
    const { messages } = get();
    set({ messages: [...messages, message] });
  },

  setCurrentRound: (round: DiscussionRound | null) => {
    set({ currentRound: round });
  },

  setCurrentSpeaker: (speaker: string | null) => {
    set({ currentSpeaker: speaker });
  },

  setSummarizerName: (name: string | null) => {
    set({ summarizerName: name });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  toggleRole: (roleId: string) => {
    const { availableRoles } = get();
    const updatedRoles = availableRoles.map(role =>
      role.id === roleId ? { ...role, enabled: !role.enabled } : role
    );
    set({ availableRoles: updatedRoles });
  },

  clearHistory: () => {
    saveSessions([]);
    set({ sessions: [] });
  },
}));
