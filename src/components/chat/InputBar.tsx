'use client';

import { useState, FormEvent } from 'react';
import { useBrainstormStore } from '@/stores/brainstorm-store';

export default function InputBar() {
  const [question, setQuestion] = useState('');
  const { startSession, isRunning, isLoading, availableRoles, error } = useBrainstormStore();

  const enabledRoles = availableRoles.filter((r) => r.enabled);
  const canSubmit = question.trim().length > 0 && enabledRoles.length > 0 && !isRunning;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const enabledRoleIds = enabledRoles.map((r) => r.id);
    await startSession(question.trim(), enabledRoleIds);
    setQuestion('');
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+144px)] lg:-translate-x-1/2 w-[90%] max-w-3xl glassmorphism rounded-[2rem] flex items-center h-16 px-4 z-50">
      <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface/50 hover:text-primary transition-all duration-300">
        <span className="material-symbols-outlined">construction</span>
      </button>

      <form onSubmit={handleSubmit} className="flex-1 px-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="向头脑风暴室提问..."
          disabled={isRunning}
          className="w-full bg-transparent border-none text-on-surface placeholder:text-on-surface/30 focus:ring-0 font-body text-sm"
        />
      </form>

      <div className="flex items-center gap-2">
        <span className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-on-surface/50 font-label text-[10px] uppercase tracking-widest font-semibold">
          <span className="w-2 h-2 rounded-full bg-secondary"></span>
          {enabledRoles.length} 个 AI
        </span>

        <button
          type="submit"
          disabled={!canSubmit || isLoading}
          onClick={handleSubmit}
          className={`
            flex items-center justify-center gap-2 px-5 py-2 rounded-full
            font-label text-xs font-bold active:scale-95 duration-200
            transition-all shadow-glass
            ${
              canSubmit && !isLoading
                ? 'bg-primary text-on-primary hover:bg-primary/90 cursor-pointer'
                : 'bg-primary/30 text-on-primary/50 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? (
            <>
              <span className="animate-pulse">思考中...</span>
            </>
          ) : (
            <>
              <span>发起讨论</span>
              <span className="material-symbols-outlined text-sm">send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
