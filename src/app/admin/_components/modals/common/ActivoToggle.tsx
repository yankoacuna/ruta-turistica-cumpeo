'use client';

import React from 'react';

interface ActivoToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  labelActive?: string;
  labelInactive?: string;
}

export function ActivoToggle({
  checked,
  onChange,
  id = 'modal-activo-toggle',
  labelActive = 'Visible en el portal',
  labelInactive = 'Oculto (En Pausa)',
}: ActivoToggleProps) {
  return (
    <div className="flex items-center gap-2 px-3 rounded-xl border border-border bg-surface-soft h-[42px] transition-colors">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-rojo rounded border-border focus:ring-rojo cursor-pointer accent-rojo"
      />
      <label
        htmlFor={id}
        className="text-xs font-bold text-text-primary cursor-pointer select-none truncate"
      >
        {checked ? labelActive : labelInactive}
      </label>
    </div>
  );
}
