'use client';

import { useEffect, useRef } from 'react';
import { useBrainstormStore } from '@/stores/brainstorm-store';
import MessageBubble from './MessageBubble';
import { ChatMessage } from '@/lib/brainstorm/types';

const roundLabels: Record<number, string> = {
  1: '第一轮：初始观点',
  2: '第二轮：交锋讨论',
  3: '第三轮：收敛判断',
};

export default function MessageList() {
  const { messages, currentSession, currentRound, isRunning, summarizerName } = useBrainstormStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-primary">psychology</span>
          </div>
          <h3 className="text-lg font-headline text-on-surface mb-2">开始头脑风暴</h3>
          <p className="text-sm text-on-surface/60 max-w-md">
            在下方输入您的问题，让 AI 模型展开多轮讨论。
          </p>
        </div>
      </div>
    );
  }

  const getRoundForMessage = (msg: ChatMessage): number => {
    if (msg.senderType === 'user') return 0;
    if (msg.senderType === 'summarizer') return -1;
    return msg.round;
  };

  let lastRound = -2;

  const processedMessages: (ChatMessage | { content: string; senderType: 'system'; id: string })[] = [];

  for (const msg of messages) {
    const currentRoundForMsg = getRoundForMessage(msg);

    if (currentRoundForMsg !== lastRound) {
      if (currentRoundForMsg === -1) {
        processedMessages.push({
          id: `system-summary-${msg.id}`,
          content: `${summarizerName || '总结者'} 正在整理最终结论`,
          senderType: 'system',
        });
      } else if (currentRoundForMsg > 0) {
        processedMessages.push({
          id: `system-round-${currentRoundForMsg}`,
          content: roundLabels[currentRoundForMsg],
          senderType: 'system',
        });
      }
      lastRound = currentRoundForMsg;
    }

    processedMessages.push(msg);
  }

  if (isRunning && currentRound) {
    processedMessages.push({
      id: `system-running`,
      content: `${currentRound} 轮进行中...`,
      senderType: 'system',
    });
  }

  if (isRunning && summarizerName) {
    processedMessages.push({
      id: `system-summarizing`,
      content: `${summarizerName} 正在整理最终结论...`,
      senderType: 'system',
    });
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-8 py-10 space-y-12 pb-32 custom-scrollbar"
    >
      {processedMessages.map((msg) => {
        const msgId = 'id' in msg ? msg.id : (msg as ChatMessage).id;
        return (
          <MessageBubble
            key={msgId}
            message={msg as ChatMessage | { content: string; senderType: 'system' }}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
