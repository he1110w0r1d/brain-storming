'use client';

import { useEffect } from 'react';
import { useBrainstormStore } from '@/stores/brainstorm-store';
import Header from '@/components/layout/Header';
import RoleSidebar from '@/components/roles/RoleSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import InputBar from '@/components/chat/InputBar';

export default function Home() {
  const { initialize, currentSession, messages } = useBrainstormStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="flex h-screen pt-16">
      <Header />
      <RoleSidebar />

      <main className="flex-1 ml-0 lg:ml-72 flex flex-col relative bg-surface overflow-hidden">
        {messages.length > 0 && <ChatHeader />}
        <MessageList />
        <InputBar />
      </main>

      <aside className="w-80 bg-surface-container-low border-l border-white/5 p-6 overflow-y-auto hidden xl:block">
        <h3 className="font-headline font-bold text-on-surface mb-6">会话洞察</h3>

        <div className="space-y-6">
          {currentSession && (
            <>
              <div className="p-4 rounded-xl bg-surface-container-highest border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">
                    参与者
                  </span>
                  <span className="material-symbols-outlined text-primary text-sm">group</span>
                </div>
                <div className="flex -space-x-2 mb-3">
                  {currentSession.enabledRoleIds.map((roleId) => {
                    const role = useBrainstormStore.getState().availableRoles.find((r) => r.id === roleId);
                    if (!role) return null;
                    return (
                      <div
                        key={roleId}
                        className={`w-8 h-8 rounded-full border-2 border-surface-container-high flex items-center justify-center ${
                          role.accentColor === 'primary'
                            ? 'bg-primary/20'
                            : role.accentColor === 'secondary'
                            ? 'bg-secondary/20'
                            : 'bg-tertiary/20'
                        }`}
                      >
                        <span
                          className={`text-xs font-bold ${
                            role.accentColor === 'primary'
                              ? 'text-primary'
                              : role.accentColor === 'secondary'
                              ? 'text-secondary'
                              : 'text-tertiary'
                          }`}
                        >
                          {role.avatar}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-on-surface/50 leading-tight">
                  共有 {currentSession.enabledRoleIds.length} 个 AI 模型参与讨论
                </p>
              </div>

              {currentSession.finalSummary && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-label text-secondary uppercase tracking-widest">
                      总结者
                    </span>
                    <span className="material-symbols-outlined text-secondary text-sm">auto_awesome</span>
                  </div>
                  <p className="text-sm text-on-surface font-medium mb-2">
                    {currentSession.finalSummary.summarizerName}
                  </p>
                  <p className="text-[11px] text-on-surface/60 leading-tight">
                    已被选为本次会话的最终总结者
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-surface-container-highest border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">
                    讨论进度
                  </span>
                  <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface/60">第一轮</span>
                    <span
                      className={
                        currentSession.rounds.round1.status === 'completed'
                          ? 'text-primary'
                          : 'text-on-surface/40'
                      }
                    >
                      {currentSession.rounds.round1.status === 'completed' ? '已完成' : '待处理'}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        currentSession.rounds.round1.status === 'completed'
                          ? 'bg-primary w-full'
                          : 'w-0'
                      }`}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface/60">第二轮</span>
                    <span
                      className={
                        currentSession.rounds.round2.status === 'completed'
                          ? 'text-primary'
                          : 'text-on-surface/40'
                      }
                    >
                      {currentSession.rounds.round2.status === 'completed' ? '已完成' : '待处理'}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        currentSession.rounds.round2.status === 'completed'
                          ? 'bg-primary w-full'
                          : currentSession.rounds.round1.status === 'completed'
                          ? 'bg-primary/50 animate-pulse-soft'
                          : 'w-0'
                      }`}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface/60">第三轮</span>
                    <span
                      className={
                        currentSession.rounds.round3.status === 'completed'
                          ? 'text-primary'
                          : 'text-on-surface/40'
                      }
                    >
                      {currentSession.rounds.round3.status === 'completed' ? '已完成' : '待处理'}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        currentSession.rounds.round3.status === 'completed'
                          ? 'bg-primary w-full'
                          : currentSession.rounds.round2.status === 'completed'
                          ? 'bg-primary/50 animate-pulse-soft'
                          : 'w-0'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {!currentSession && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-primary">tips_and_updates</span>
              </div>
              <p className="text-sm text-on-surface/60">
                选择 AI 角色并输入问题以开始头脑风暴
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
