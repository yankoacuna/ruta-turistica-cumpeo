import React from 'react';
import { ChevronRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  sub?: string;
  onClick?: () => void;
}

export function StatCard({ label, value, icon, color, bg, sub, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group bg-white p-4 rounded-2xl border border-border shadow-xs hover:shadow-md hover:border-rojo/40 transition-all duration-200 flex flex-col justify-between w-full h-full text-left relative ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'
      }`}
    >
      <div className="flex items-center justify-between w-full mb-3">
        <div className={`${bg} ${color} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        {onClick && (
          <div className="w-6 h-6 rounded-lg bg-surface-soft group-hover:bg-rojo/10 flex items-center justify-center text-text-muted group-hover:text-rojo group-hover:translate-x-0.5 transition-all">
            <ChevronRight size={14} />
          </div>
        )}
      </div>

      <div className="w-full">
        <div className={`text-2xl sm:text-3xl font-black tracking-tight ${color} leading-none`}>
          {value}
        </div>
        <div className="text-xs font-bold text-text-primary uppercase tracking-wide mt-1.5 truncate" title={label}>
          {label}
        </div>
        {sub && (
          <div className="text-[11px] text-text-muted mt-1 leading-snug line-clamp-2" title={sub}>
            {sub}
          </div>
        )}
      </div>
    </button>
  );
}
