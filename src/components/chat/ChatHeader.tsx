'use client';

import { useBrainstormStore } from '@/stores/brainstorm-store';

export default function ChatHeader() {
  const { currentSession, isRunning, availableRoles, resetSession } = useBrainstormStore();

  const activeRoles = availableRoles.filter((r) => r.enabled);
  const question = currentSession?.userQuestion || '开始一个新的头脑风暴会话';

  const duration = currentSession
    ? Math.floor((Date.now() - new Date(currentSession.createdAt).getTime()) / 60000)
    : 0;

  return (
    <div className="px-8 py-6 flex flex-col gap-1 border-b border-white/5">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface truncate flex-1 pr-4">
          {question.length > 50 ? question.substring(0, 50) + '...' : question}
        </h1>
        {currentSession && !isRunning && (
          <button
            onClick={resetSession}
            className="px-4 py-2 rounded-full text-xs font-label text-primary border border-primary/20 hover:bg-primary/10 transition-colors"
          >
            开启新会话
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <span className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-label uppercase tracking-tight">
          <span className="w-2 h-2 rounded-full bg-secondary"></span>
          {activeRoles.length} 个 AI 活跃
        </span>
        {currentSession && (
          <span className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-label uppercase tracking-tight">
            <span className="material-symbols-outlined text-xs">timer</span>
            {isRunning ? '进行中' : `持续 ${duration} 分钟`}
          </span>
        )}
        {isRunning && (
          <span className="flex items-center gap-1.5 text-[10px] text-primary font-label uppercase tracking-tight">
            <span className="w-2 h-2 rounded-full bg-primary thinking-pulse"></span>
            讨论中
          </span>
        )}
      </div>
    </div>
  );
}
