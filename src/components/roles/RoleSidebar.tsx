'use client';

import { useBrainstormStore } from '@/stores/brainstorm-store';
import { AIRole, AccentColor } from '@/lib/brainstorm/types';

const accentColorClasses: Record<AccentColor, { border: string; text: string; bg: string; icon: string }> = {
  primary: {
    border: 'border-l-primary',
    text: 'text-primary',
    bg: 'bg-primary/10',
    icon: 'text-primary',
  },
  secondary: {
    border: 'border-l-secondary',
    text: 'text-secondary',
    bg: 'bg-secondary/10',
    icon: 'text-secondary',
  },
  tertiary: {
    border: 'border-l-tertiary',
    text: 'text-tertiary',
    bg: 'bg-tertiary/10',
    icon: 'text-tertiary',
  },
};

function RoleItem({
  role,
  isActive,
  isSpeaking,
  onToggle,
}: {
  role: AIRole;
  isActive: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
}) {
  const colors = accentColorClasses[role.accentColor];

  return (
    <button
      onClick={onToggle}
      className={`
        group flex items-center gap-3 py-3 px-4 rounded-lg
        transition-all duration-300 hover:translate-x-1 w-full text-left
        ${isActive ? colors.border + ' border-l-2 ' + colors.text + ' bg-white/5' : 'text-on-surface/40 border-l-2 border-transparent hover:bg-white/5 hover:text-on-surface'}
      `}
    >
      <span
        className={`
          material-symbols-outlined
          ${isSpeaking ? colors.icon + ' thinking-pulse' : ''}
        `}
        style={{ fontVariationSettings: isSpeaking ? "'FILL' 1" : "'FILL' 0" }}
      >
        {role.icon}
      </span>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm truncate block">
          {role.name}
        </span>
        <span className="text-[10px] text-on-surface/40 block truncate">
          {role.persona}
        </span>
      </div>
      {!role.enabled && (
        <span className="text-[10px] text-on-surface/20">已禁用</span>
      )}
    </button>
  );
}

export default function RoleSidebar() {
  const {
    availableRoles,
    toggleRole,
    isRunning,
    currentSpeaker,
    currentSession,
  } = useBrainstormStore();

  const activeRoles = availableRoles.filter((r) => r.enabled);

  return (
    <aside className="fixed left-0 h-full w-72 bg-surface-container-low shadow-2xl shadow-black/50 flex flex-col py-8 px-4 gap-y-6 hidden lg:flex">
      <div>
        <h2 className="text-lg font-headline text-on-surface mb-1">
          活跃模型
        </h2>
        <p className="text-xs text-on-surface/40 uppercase tracking-widest font-label">
          头脑风暴会话
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        {availableRoles.map((role) => (
          <RoleItem
            key={role.id}
            role={role}
            isActive={role.enabled}
            isSpeaking={
              !!(isRunning &&
              currentSpeaker === role.name &&
              currentSession?.enabledRoleIds.includes(role.id))
            }
            onToggle={() => !isRunning && toggleRole(role.id)}
          />
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-2">
        <div className="text-[10px] text-on-surface/40 uppercase tracking-widest font-label mb-1">
          {activeRoles.length} 个已启用
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-1 border-t border-white/5 pt-4">
        <button className="flex items-center gap-3 py-2 px-4 text-on-surface/40 hover:text-on-surface transition-colors text-sm font-label">
          <span className="material-symbols-outlined">description</span>
          文档
        </button>
        <button className="flex items-center gap-3 py-2 px-4 text-on-surface/40 hover:text-on-surface transition-colors text-sm font-label">
          <span className="material-symbols-outlined">help_outline</span>
          帮助
        </button>
      </div>
    </aside>
  );
}
