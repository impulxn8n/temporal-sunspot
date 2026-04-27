import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Globe, User, Briefcase, Sparkles } from 'lucide-react';
import type { SpaceView } from '../types';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  User,
  Briefcase,
  Sparkles,
};

export const SpaceSelector: React.FC = () => {
  const { spaces, selectedView, setSelectedView } = useFinance();

  const baseViews: { id: SpaceView; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'global', label: 'Global', Icon: Globe },
    { id: 'personal', label: 'Personal', Icon: User },
    { id: 'business', label: 'Negocio', Icon: Briefcase },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {baseViews.map(v => {
        const isActive = selectedView === v.id;
        return (
          <button
            key={v.id}
            onClick={() => setSelectedView(v.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              isActive
                ? 'bg-brand-primary/15 border-brand-primary/40 text-brand-primary shadow-lg shadow-brand-primary/10'
                : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white hover:border-white/10'
            }`}
          >
            <v.Icon size={14} />
            {v.label}
          </button>
        );
      })}

      <div className="w-px bg-white/5 mx-1" />

      {spaces.filter(s => !s.archived).map(s => {
        const isActive = selectedView === s.id;
        const Icon = ICONS[s.icon] ?? Briefcase;
        return (
          <button
            key={s.id}
            onClick={() => setSelectedView(s.id)}
            style={isActive ? { borderColor: `${s.color}55`, color: s.color, backgroundColor: `${s.color}15` } : undefined}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              isActive ? '' : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white hover:border-white/10'
            }`}
          >
            <Icon size={14} />
            {s.name}
          </button>
        );
      })}
    </div>
  );
};
