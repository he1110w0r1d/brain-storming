'use client';

import { ChatMessage, AccentColor } from '@/lib/brainstorm/types';
import { DEFAULT_ROLES } from '@/lib/brainstorm/role-config';

const accentColorClasses: Record<AccentColor, { border: string; text: string; bg: string; icon: string; glow: string }> = {
  primary: {
    border: 'border-l-primary',
    text: 'text-primary',
    bg: 'bg-primary/10',
    icon: 'text-primary',
    glow: 'shadow-[0_0_15px_rgba(129,236,255,0.15)]',
  },
  secondary: {
    border: 'border-l-secondary',
    text: 'text-secondary',
    bg: 'bg-secondary/10',
    icon: 'text-secondary',
    glow: 'shadow-[0_0_15px_rgba(166,138,255,0.15)]',
  },
  tertiary: {
    border: 'border-l-tertiary',
    text: 'text-tertiary',
    bg: 'bg-tertiary/10',
    icon: 'text-tertiary',
    glow: 'shadow-[0_0_15px_rgba(110,155,255,0.15)]',
  },
};

const roundPurposeLabels: Record<string, string> = {
  user_question: '',
  initial_viewpoint: '第一轮：初始观点',
  response_discussion: '第二轮：交锋讨论',
  convergence_position: '第三轮：收敛判断',
  final_summary: '最终总结',
};

function getRoleInfo(senderId: string) {
  const role = DEFAULT_ROLES.find((r) => r.id === senderId);
  if (role) {
    return {
      name: role.name,
      persona: role.persona,
      icon: role.icon,
      accentColor: role.accentColor,
    };
  }
  return null;
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-col items-end gap-2 max-w-2xl ml-auto animate-fade-in">
      <div className="bg-surface-container-low text-on-surface p-4 rounded-lg rounded-tr-sm border border-white/5 shadow-lg">
        <p className="text-on-surface leading-relaxed">{message.content}</p>
      </div>
      <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mr-1">
        用户 • {new Date(message.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

function AIMessage({ message }: { message: ChatMessage }) {
  const roleInfo = getRoleInfo(message.senderId);

  if (!roleInfo) {
    return null;
  }

  const colors = accentColorClasses[roleInfo.accentColor];
  const isPending = message.status === 'pending';
  const hasError = message.status === 'error';

  return (
    <div className="flex flex-col items-start gap-3 max-w-2xl group animate-fade-in">
      <div className="flex items-center gap-3">
        <div
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${colors.bg} ${colors.text} border ${colors.text}/20 ${colors.glow}
            ${isPending ? 'thinking-pulse' : ''}
          `}
        >
          <span
            className="material-symbols-outlined text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {roleInfo.icon}
          </span>
        </div>
        <div className="flex flex-col">
          <span className={`text-[11px] font-label font-bold ${colors.text} uppercase tracking-[0.15em]`}>
            {roleInfo.name}
          </span>
          {message.meta.roundPurpose && (
            <span className="text-[10px] text-on-surface/40">
              {roundPurposeLabels[message.meta.roundPurpose] || message.meta.roundPurpose}
            </span>
          )}
        </div>
      </div>

      <div
        className={`
          bg-surface-container-highest/80 backdrop-blur-md p-5 rounded-xl rounded-tl-sm
          border-l-4 ${colors.border} shadow-xl
          ${hasError ? 'border border-error/50' : ''}
          transition-shadow
        `}
      >
        {isPending ? (
          <div className="flex items-center gap-2">
            <span className="text-on-surface/60">思考中...</span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        ) : hasError ? (
          <p className="text-error leading-relaxed">{message.content}</p>
        ) : (
          <p className="text-on-surface leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  );
}

function SummarizerMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-col items-start gap-3 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary border border-secondary/20 shadow-[0_0_15px_rgba(166,138,255,0.15)]">
          <span
            className="material-symbols-outlined text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            summarize
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-label font-bold text-secondary uppercase tracking-[0.15em]">
            {message.senderName}
          </span>
          <span className="text-[10px] text-on-surface/40">
            总结者
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-secondary/20 to-transparent border border-secondary/20 p-5 rounded-xl rounded-tl-sm shadow-xl w-full">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
          <span className="material-symbols-outlined text-secondary text-sm">auto_awesome</span>
          <span className="text-[10px] text-secondary uppercase tracking-widest font-label">
            最终总结
          </span>
        </div>
        <p className="text-on-surface leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

function SystemMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-center py-4 animate-fade-in">
      <span className="text-[10px] text-on-surface/40 uppercase tracking-widest font-label px-4 py-2 bg-surface-container-low rounded-full">
        {content}
      </span>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage | { content: string; senderType: 'system' };
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  if (message.senderType === 'system') {
    return <SystemMessage content={message.content} />;
  }

  const typedMessage = message as ChatMessage;

  switch (typedMessage.senderType) {
    case 'user':
      return <UserMessage message={typedMessage} />;
    case 'summarizer':
      return <SummarizerMessage message={typedMessage} />;
    case 'ai':
    default:
      return <AIMessage message={typedMessage} />;
  }
}
