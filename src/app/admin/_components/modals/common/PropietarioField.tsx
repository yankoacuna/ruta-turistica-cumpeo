'use client';

import React from 'react';
import { User } from 'lucide-react';
import { Field, inputCls } from '../../Field';

interface PropietarioFieldProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Nombre del dueño o encargado (desde catastro): usado por Restaurante y Alojamiento. */
export function PropietarioField({
  value,
  onChange,
  placeholder = 'Ej: Juan Pérez',
}: PropietarioFieldProps) {
  return (
    <Field label="Propietario" hint="Nombre del dueño o encargado">
      <div className="relative">
        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          className={inputCls + ' pl-8'}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}
