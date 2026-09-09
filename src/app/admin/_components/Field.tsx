import React from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, required, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1">
        {label}
        {required && <span className="text-rojo">*</span>}
      </label>
      {children}
      {hint && <span className="text-[11px] text-text-muted">{hint}</span>}
    </div>
  );
}

export const inputCls =
  'w-full px-3 py-2.5 rounded-lg border border-border bg-white focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none text-sm transition-all placeholder:text-text-muted/60';
export const textareaCls = `${inputCls} min-h-[80px] resize-y leading-relaxed`;
export const selectCls = `${inputCls} cursor-pointer`;
