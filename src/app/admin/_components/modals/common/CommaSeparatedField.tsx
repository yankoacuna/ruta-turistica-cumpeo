'use client';

import React from 'react';
import { Field, inputCls } from '../../Field';

interface CommaSeparatedFieldProps {
  label: string;
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  hint?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

export function CommaSeparatedField({
  label,
  value = [],
  onChange,
  placeholder = 'Ej: valor 1, valor 2',
  hint = 'Separados por coma',
  icon,
  required = false,
}: CommaSeparatedFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    onChange(parsed);
  };

  return (
    <Field label={label} hint={hint} required={required}>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          className={`${inputCls} ${icon ? 'pl-8' : ''}`}
          placeholder={placeholder}
          value={value.join(', ')}
          onChange={handleChange}
        />
      </div>
    </Field>
  );
}
