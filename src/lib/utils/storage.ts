import { BrainstormSession } from '@/lib/brainstorm/types';

const STORAGE_KEY = 'brainstorm_sessions';
const MAX_CACHED_SESSIONS = 10;

export function saveSessions(sessions: BrainstormSession[]): void {
  if (typeof window === 'undefined') return;

  try {
    const sessionsToSave = sessions.slice(0, MAX_CACHED_SESSIONS).map(session => ({
      ...session,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      finalSummary: session.finalSummary
        ? {
            ...session.finalSummary,
            createdAt: session.finalSummary.createdAt.toISOString(),
          }
        : null,
      rounds: {
        round1: {
          ...session.rounds.round1,
          startedAt: session.rounds.round1.startedAt?.toISOString(),
          completedAt: session.rounds.round1.completedAt?.toISOString(),
        },
        round2: {
          ...session.rounds.round2,
          startedAt: session.rounds.round2.startedAt?.toISOString(),
          completedAt: session.rounds.round2.completedAt?.toISOString(),
        },
        round3: {
          ...session.rounds.round3,
          startedAt: session.rounds.round3.startedAt?.toISOString(),
          completedAt: session.rounds.round3.completedAt?.toISOString(),
        },
      },
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsToSave));
  } catch (error) {
    console.error('Failed to save sessions:', error);
  }
}

export function loadSessions(): BrainstormSession[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as BrainstormSession[];

    return parsed.map(session => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      finalSummary: session.finalSummary
        ? {
            ...session.finalSummary,
            createdAt: new Date(session.finalSummary.createdAt),
          }
        : null,
      rounds: {
        round1: {
          ...session.rounds.round1,
          startedAt: session.rounds.round1.startedAt
            ? new Date(session.rounds.round1.startedAt)
            : undefined,
          completedAt: session.rounds.round1.completedAt
            ? new Date(session.rounds.round1.completedAt)
            : undefined,
        },
        round2: {
          ...session.rounds.round2,
          startedAt: session.rounds.round2.startedAt
            ? new Date(session.rounds.round2.startedAt)
            : undefined,
          completedAt: session.rounds.round2.completedAt
            ? new Date(session.rounds.round2.completedAt)
            : undefined,
        },
        round3: {
          ...session.rounds.round3,
          startedAt: session.rounds.round3.startedAt
            ? new Date(session.rounds.round3.startedAt)
            : undefined,
          completedAt: session.rounds.round3.completedAt
            ? new Date(session.rounds.round3.completedAt)
            : undefined,
        },
      },
    }));
  } catch (error) {
    console.error('Failed to load sessions:', error);
    return [];
  }
}

export function clearSessions(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear sessions:', error);
  }
}
