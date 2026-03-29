import { v4 as uuidv4 } from 'uuid';
import {
  BrainstormSession,
  ChatMessage,
  DiscussionRound,
  DiscussionRoundData,
  FinalSummary,
  SessionStatus,
} from './types';
import { DEFAULT_ROLES, getEnabledRolesByIds, getRandomSummarizer } from './role-config';
import {
  buildRoundOnePrompt,
  buildRoundTwoPrompt,
  buildRoundThreePrompt,
  buildSummaryPrompt,
} from './prompt-builder';
import { callModel, mockCallModel } from '@/lib/llm/client';

const IS_SERVER = typeof window === 'undefined';
const USE_MOCK = IS_SERVER 
  ? (process.env.USE_MOCK_LLM === 'true' || !process.env.LLM_API_KEY)
  : false; // 在客户端默认不强制 mock，让 callModel 尝试调用 API Route

if (IS_SERVER) {
  console.log('--- LLM 模式检测 (Server) ---');
  console.log('USE_MOCK_LLM 环境变量:', process.env.USE_MOCK_LLM);
  console.log('LLM_API_KEY 是否存在:', !!process.env.LLM_API_KEY);
  console.log('当前运行模式:', USE_MOCK ? 'MOCK (模拟模式)' : 'REAL (真实 API 模式)');
  console.log('---------------------------');
}

interface OrchestratorCallbacks {
  onRoundStart?: (round: DiscussionRound) => void;
  onMessageGenerated?: (message: ChatMessage) => void;
  onRoundComplete?: (round: DiscussionRound) => void;
  onSummaryStart?: (roleId: string, roleName: string) => void;
  onSummaryGenerated?: (summary: FinalSummary) => void;
  onError?: (error: Error) => void;
  onSessionUpdate?: (session: BrainstormSession) => void;
}

export function createSession(
  question: string,
  enabledRoleIds: string[]
): BrainstormSession {
  const now = new Date();

  return {
    id: uuidv4(),
    userQuestion: question,
    createdAt: now,
    updatedAt: now,
    status: 'idle',
    rounds: {
      round1: createEmptyRound(1),
      round2: createEmptyRound(2),
      round3: createEmptyRound(3),
    },
    finalSummary: null,
    selectedSummarizerRoleId: null,
    enabledRoleIds,
  };
}

function createEmptyRound(round: DiscussionRound): DiscussionRoundData {
  return {
    round,
    status: 'pending',
    messages: [],
  };
}

export function addUserMessage(session: BrainstormSession): BrainstormSession {
  const userMessage: ChatMessage = {
    id: uuidv4(),
    sessionId: session.id,
    round: 0,
    senderType: 'user',
    senderId: 'user',
    senderName: '用户',
    content: session.userQuestion,
    replyToMessageIds: [],
    createdAt: new Date(),
    status: 'done',
    meta: {
      model: '',
      role: 'user',
      roundPurpose: 'user_question',
    },
  };

  const updatedSession = { ...session, updatedAt: new Date() };

  return updatedSession;
}

export async function runBrainstormSession(
  session: BrainstormSession,
  callbacks?: OrchestratorCallbacks
): Promise<BrainstormSession> {
  let currentSession = { ...session, status: 'running' as SessionStatus };

  try {
    currentSession = await runRoundOne(currentSession, callbacks);
    currentSession = await runRoundTwo(currentSession, callbacks);
    currentSession = await runRoundThree(currentSession, callbacks);
    currentSession = await generateFinalSummary(currentSession, callbacks);

    currentSession.status = 'completed';
    callbacks?.onSessionUpdate?.(currentSession);

    return currentSession;
  } catch (error) {
    currentSession.status = 'failed';
    callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
    return currentSession;
  }
}

async function runRoundOne(
  session: BrainstormSession,
  callbacks?: OrchestratorCallbacks
): Promise<BrainstormSession> {
  callbacks?.onRoundStart?.(1);

  const roles = getEnabledRolesByIds(session.enabledRoleIds);
  const updatedRounds = { ...session.rounds };

  updatedRounds.round1 = {
    ...updatedRounds.round1,
    status: 'in_progress',
    startedAt: new Date(),
  };

  let currentSession = { ...session, rounds: updatedRounds };
  callbacks?.onSessionUpdate?.(currentSession);

  for (const role of roles) {
    const { systemPrompt, userPrompt } = buildRoundOnePrompt(role, session.userQuestion);

    const messageId = uuidv4();
    let messageContent = '';

    const pendingMessage: ChatMessage = {
      id: messageId,
      sessionId: session.id,
      round: 1,
      senderType: 'ai',
      senderId: role.id,
      senderName: role.name,
      content: '',
      replyToMessageIds: [],
      createdAt: new Date(),
      status: 'pending',
      meta: {
        model: role.model,
        role: role.id,
        roundPurpose: 'initial_viewpoint',
      },
    };

    callbacks?.onMessageGenerated?.(pendingMessage);

    try {
      const response = USE_MOCK
        ? await mockCallModel({ model: role.model, systemPrompt, userPrompt })
        : await callModel({ model: role.model, systemPrompt, userPrompt });

      messageContent = response.content;

      const completedMessage: ChatMessage = {
        ...pendingMessage,
        content: messageContent,
        status: 'done',
      };

      updatedRounds.round1.messages.push(completedMessage);
      currentSession = {
        ...currentSession,
        rounds: updatedRounds,
        updatedAt: new Date(),
      };
      callbacks?.onMessageGenerated?.(completedMessage);
      callbacks?.onSessionUpdate?.(currentSession);
    } catch (error) {
      const errorMessage: ChatMessage = {
        ...pendingMessage,
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error',
      };

      updatedRounds.round1.messages.push(errorMessage);
      currentSession = { ...currentSession, rounds: updatedRounds };
    }
  }

  updatedRounds.round1.status = 'completed';
  updatedRounds.round1.completedAt = new Date();
  currentSession = { ...currentSession, rounds: updatedRounds };
  callbacks?.onRoundComplete?.(1);

  return currentSession;
}

async function runRoundTwo(
  session: BrainstormSession,
  callbacks?: OrchestratorCallbacks
): Promise<BrainstormSession> {
  callbacks?.onRoundStart?.(2);

  const roles = getEnabledRolesByIds(session.enabledRoleIds);
  const updatedRounds = { ...session.rounds };

  updatedRounds.round2 = {
    ...updatedRounds.round2,
    status: 'in_progress',
    startedAt: new Date(),
  };

  let currentSession = { ...session, rounds: updatedRounds };
  callbacks?.onSessionUpdate?.(currentSession);

  for (const role of roles) {
    const { systemPrompt, userPrompt } = buildRoundTwoPrompt(
      role,
      session.userQuestion,
      session.rounds.round1.messages
    );

    const messageId = uuidv4();

    const pendingMessage: ChatMessage = {
      id: messageId,
      sessionId: session.id,
      round: 2,
      senderType: 'ai',
      senderId: role.id,
      senderName: role.name,
      content: '',
      replyToMessageIds: session.rounds.round1.messages.map(m => m.id),
      createdAt: new Date(),
      status: 'pending',
      meta: {
        model: role.model,
        role: role.id,
        roundPurpose: 'response_discussion',
      },
    };

    callbacks?.onMessageGenerated?.(pendingMessage);

    try {
      const response = USE_MOCK
        ? await mockCallModel({ model: role.model, systemPrompt, userPrompt })
        : await callModel({ model: role.model, systemPrompt, userPrompt });

      const completedMessage: ChatMessage = {
        ...pendingMessage,
        content: response.content,
        status: 'done',
      };

      updatedRounds.round2.messages.push(completedMessage);
      currentSession = {
        ...currentSession,
        rounds: updatedRounds,
        updatedAt: new Date(),
      };
      callbacks?.onMessageGenerated?.(completedMessage);
      callbacks?.onSessionUpdate?.(currentSession);
    } catch (error) {
      const errorMessage: ChatMessage = {
        ...pendingMessage,
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error',
      };

      updatedRounds.round2.messages.push(errorMessage);
      currentSession = { ...currentSession, rounds: updatedRounds };
    }
  }

  updatedRounds.round2.status = 'completed';
  updatedRounds.round2.completedAt = new Date();
  currentSession = { ...currentSession, rounds: updatedRounds };
  callbacks?.onRoundComplete?.(2);

  return currentSession;
}

async function runRoundThree(
  session: BrainstormSession,
  callbacks?: OrchestratorCallbacks
): Promise<BrainstormSession> {
  callbacks?.onRoundStart?.(3);

  const roles = getEnabledRolesByIds(session.enabledRoleIds);
  const updatedRounds = { ...session.rounds };

  updatedRounds.round3 = {
    ...updatedRounds.round3,
    status: 'in_progress',
    startedAt: new Date(),
  };

  let currentSession = { ...session, rounds: updatedRounds };
  callbacks?.onSessionUpdate?.(currentSession);

  for (const role of roles) {
    const { systemPrompt, userPrompt } = buildRoundThreePrompt(
      role,
      session.userQuestion,
      session.rounds.round1.messages,
      session.rounds.round2.messages
    );

    const messageId = uuidv4();

    const pendingMessage: ChatMessage = {
      id: messageId,
      sessionId: session.id,
      round: 3,
      senderType: 'ai',
      senderId: role.id,
      senderName: role.name,
      content: '',
      replyToMessageIds: [
        ...session.rounds.round1.messages.map(m => m.id),
        ...session.rounds.round2.messages.map(m => m.id),
      ],
      createdAt: new Date(),
      status: 'pending',
      meta: {
        model: role.model,
        role: role.id,
        roundPurpose: 'convergence_position',
      },
    };

    callbacks?.onMessageGenerated?.(pendingMessage);

    try {
      const response = USE_MOCK
        ? await mockCallModel({ model: role.model, systemPrompt, userPrompt })
        : await callModel({ model: role.model, systemPrompt, userPrompt });

      const completedMessage: ChatMessage = {
        ...pendingMessage,
        content: response.content,
        status: 'done',
      };

      updatedRounds.round3.messages.push(completedMessage);
      currentSession = {
        ...currentSession,
        rounds: updatedRounds,
        updatedAt: new Date(),
      };
      callbacks?.onMessageGenerated?.(completedMessage);
      callbacks?.onSessionUpdate?.(currentSession);
    } catch (error) {
      const errorMessage: ChatMessage = {
        ...pendingMessage,
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error',
      };

      updatedRounds.round3.messages.push(errorMessage);
      currentSession = { ...currentSession, rounds: updatedRounds };
    }
  }

  updatedRounds.round3.status = 'completed';
  updatedRounds.round3.completedAt = new Date();
  currentSession = { ...currentSession, rounds: updatedRounds };
  callbacks?.onRoundComplete?.(3);

  return currentSession;
}

async function generateFinalSummary(
  session: BrainstormSession,
  callbacks?: OrchestratorCallbacks
): Promise<BrainstormSession> {
  const summarizerRole = getRandomSummarizer(session.enabledRoleIds);

  if (!summarizerRole) {
    throw new Error('No available summarizer');
  }

  session.selectedSummarizerRoleId = summarizerRole.id;

  callbacks?.onSummaryStart?.(summarizerRole.id, summarizerRole.name);

  const allMessages: ChatMessage[] = [
    ...session.rounds.round1.messages,
    ...session.rounds.round2.messages,
    ...session.rounds.round3.messages,
  ];

  const { systemPrompt, userPrompt } = buildSummaryPrompt(
    summarizerRole,
    session.userQuestion,
    allMessages
  );

  const summaryId = uuidv4();

  let summaryContent = '';

  try {
    const response = USE_MOCK
      ? await mockCallModel({
          model: summarizerRole.model,
          systemPrompt,
          userPrompt,
          maxTokens: 2000,
        })
      : await callModel({
          model: summarizerRole.model,
          systemPrompt,
          userPrompt,
          maxTokens: 2000,
        });

    summaryContent = response.content;

    const finalSummary: FinalSummary = {
      id: summaryId,
      sessionId: session.id,
      content: summaryContent,
      summarizerRoleId: summarizerRole.id,
      summarizerName: summarizerRole.name,
      createdAt: new Date(),
      sections: parseSummarySections(summaryContent),
    };

    callbacks?.onSummaryGenerated?.(finalSummary);

    return {
      ...session,
      finalSummary,
      status: 'completed',
      updatedAt: new Date(),
    };
  } catch (error) {
    throw error;
  }
}

function parseSummarySections(content: string): FinalSummary['sections'] {
  const sections: FinalSummary['sections'] = {
    problemRestatement: '',
    mainViewpoints: '',
    controversies: '',
    consensus: '',
    finalRecommendation: '',
  };

  type SectionKey = keyof typeof sections;

  const patterns: Array<{ key: SectionKey; patterns: RegExp[] }> = [
    { key: 'problemRestatement', patterns: [/问题重述[:：]?\s*([\s\S]*?)(?=###|$)/i, /问题[:：]?\s*([\s\S]*?)(?=###|$)/i] },
    { key: 'mainViewpoints', patterns: [/各方主要观点[:：]?\s*([\s\S]*?)(?=###|$)/i, /主要观点[:：]?\s*([\s\S]*?)(?=###|$)/i] },
    { key: 'controversies', patterns: [/争议焦点[:：]?\s*([\s\S]*?)(?=###|$)/i, /争议[:：]?\s*([\s\S]*?)(?=###|$)/i] },
    { key: 'consensus', patterns: [/共识要点[:：]?\s*([\s\S]*?)(?=###|$)/i, /共识[:：]?\s*([\s\S]*?)(?=###|$)/i] },
    { key: 'finalRecommendation', patterns: [/最终建议[:：]?\s*([\s\S]*?)$/i, /建议[:：]?\s*([\s\S]*?)$/i] },
  ];

  for (const { key, patterns: regexPatterns } of patterns) {
    for (const pattern of regexPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        sections[key] = match[1].trim();
        break;
      }
    }
  }

  if (!sections.problemRestatement && !sections.mainViewpoints) {
    sections.mainViewpoints = content;
  }

  return sections;
}

export function getAllMessages(session: BrainstormSession): ChatMessage[] {
  const messages: ChatMessage[] = [];

  messages.push({
    id: 'user-msg',
    sessionId: session.id,
    round: 0,
    senderType: 'user',
    senderId: 'user',
    senderName: '用户',
    content: session.userQuestion,
    replyToMessageIds: [],
    createdAt: session.createdAt,
    status: 'done',
    meta: {
      model: '',
      role: 'user',
      roundPurpose: 'user_question',
    },
  });

  messages.push(...session.rounds.round1.messages);
  messages.push(...session.rounds.round2.messages);
  messages.push(...session.rounds.round3.messages);

  if (session.finalSummary) {
    const allAIMessageIds = [
      ...session.rounds.round1.messages,
      ...session.rounds.round2.messages,
      ...session.rounds.round3.messages,
    ].map(m => m.id);

    messages.push({
      id: `summary-${session.finalSummary.id}`,
      sessionId: session.id,
      round: 4,
      senderType: 'summarizer',
      senderId: session.finalSummary.summarizerRoleId,
      senderName: session.finalSummary.summarizerName,
      content: session.finalSummary.content,
      replyToMessageIds: allAIMessageIds,
      createdAt: session.finalSummary.createdAt,
      status: 'done',
      meta: {
        model: '',
        role: 'summarizer',
        roundPurpose: 'final_summary',
      },
    });
  }

  return messages;
}
