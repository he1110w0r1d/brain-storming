'use client';

import { useBrainstormStore } from '@/stores/brainstorm-store';

export default function Header() {
  const { currentSession, isRunning, sessions } = useBrainstormStore();

  const sessionCount = sessions.length;
  const activeCount = isRunning ? 1 : 0;

  return (
    <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4 shadow-deep bg-gradient-to-b from-white/5 to-transparent">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-primary tracking-tighter font-headline">
          Ethereal Intelligence
        </span>
        <div className="hidden md:flex gap-6 ml-8">
          <a
            className="text-primary font-headline font-bold tracking-tight hover:text-primary/80 transition-colors duration-300"
            href="#"
          >
            工作区
          </a>
          <a
            className="text-on-surface/60 font-headline font-bold tracking-tight hover:text-primary transition-colors duration-300"
            href="#"
          >
            模型库
          </a>
          <a
            className="text-on-surface/60 font-headline font-bold tracking-tight hover:text-primary transition-colors duration-300"
            href="#"
          >
            数据分析
          </a>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {sessionCount > 0 && (
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-on-surface-variant font-label uppercase tracking-tight">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            {activeCount > 0 ? '进行中' : sessionCount} 个会话
          </span>
        )}

        <button className="text-on-surface/60 hover:text-primary active:scale-95 duration-200 transition-colors">
          <span className="material-symbols-outlined">history</span>
        </button>
        <button className="text-on-surface/60 hover:text-primary active:scale-95 duration-200 transition-colors">
          <span className="material-symbols-outlined">share</span>
        </button>
        <button className="text-on-surface/60 hover:text-primary active:scale-95 duration-200 transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary p-[1px]">
          <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center overflow-hidden">
            <span className="text-xs font-bold text-primary">U</span>
          </div>
        </div>
      </div>
    </header>
  );
}
