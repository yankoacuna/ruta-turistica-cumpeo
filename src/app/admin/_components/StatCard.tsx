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
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4 w-full text-left hover:border-rojo hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className={`${bg} ${color} p-3.5 rounded-xl shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
        <div className="text-xs font-bold text-text-muted uppercase tracking-wide mt-0.5">
          {label}
        </div>
        {sub && <div className="text-[11px] text-text-muted mt-0.5">{sub}</div>}
      </div>
      {onClick && <ChevronRight size={16} className="text-text-muted shrink-0" />}
    </button>
  );
}
