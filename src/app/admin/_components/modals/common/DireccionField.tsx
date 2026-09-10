'use client';

import React from 'react';
import { Field, inputCls } from '../../Field';

interface DireccionFieldProps {
  value?: string | null;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}

/** Campo de dirección: usado por Restaurante, Alojamiento, Destino y Evento. */
export function DireccionField({
  value,
  onChange,
  label = 'Dirección',
  placeholder = 'Calle / Localidad',
  icon,
}: DireccionFieldProps) {
  return (
    <Field label={label}>
      {icon ? (
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{icon}</div>
          <input
            className={inputCls + ' pl-8'}
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ) : (
        <input
          className={inputCls}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}
