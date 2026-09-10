'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { Horario, HorarioModo, DiaSemana } from '@/lib/types';
import { Field, inputCls } from '../../Field';
import { DIAS_SEMANA, formatHorario } from '@/lib/openingHours';

interface HorarioFieldProps {
  value?: Horario | string | null;
  onChange: (horario: Horario) => void;
}

const MODOS: { key: HorarioModo; label: string }[] = [
  { key: 'fijo', label: 'Horario fijo' },
  { key: 'siempre-abierto', label: 'Siempre abierto' },
  { key: 'consultar', label: 'Consultar / Variable' },
];

/** Normaliza un horario legado en texto plano a la forma estructurada, preservándolo como nota. */
function toHorarioObject(value?: Horario | string | null): Horario {
  if (!value) return {};
  if (typeof value === 'string') return { modo: 'consultar', descripcion: value };
  return value;
}

export function HorarioField({ value, onChange }: HorarioFieldProps) {
  const horario = toHorarioObject(value);
  const modo: HorarioModo = horario.modo || (horario.apertura && horario.cierre ? 'fijo' : 'consultar');
  const diasCierre = horario.diasCierre || [];
  const set = (patch: Partial<Horario>) => onChange({ ...horario, ...patch });

  const toggleDia = (dia: DiaSemana) => {
    set({
      diasCierre: diasCierre.includes(dia)
        ? diasCierre.filter((d) => d !== dia)
        : [...diasCierre, dia],
    });
  };

  const preview = formatHorario({ ...horario, modo });

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="bg-surface-soft px-4 py-2.5 text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5 border-b border-border">
        <Clock size={13} className="text-rojo" /> Horario de Atención
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div>
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">
            ¿Cómo funciona el horario?
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {MODOS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => set({ modo: m.key })}
                aria-pressed={modo === m.key}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  modo === m.key
                    ? 'bg-[#1E1E24] text-white border-[#1E1E24]'
                    : 'bg-white text-text-secondary border-border hover:border-text-muted'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {modo === 'fijo' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Apertura">
                <input
                  type="time"
                  className={inputCls}
                  value={horario.apertura || ''}
                  onChange={(e) => set({ apertura: e.target.value })}
                />
              </Field>
              <Field label="Cierre">
                <input
                  type="time"
                  className={inputCls}
                  value={horario.cierre || ''}
                  onChange={(e) => set({ cierre: e.target.value })}
                />
              </Field>
            </div>

            <div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">
                Cierra los
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {DIAS_SEMANA.map((dia) => {
                  const active = diasCierre.includes(dia.key);
                  return (
                    <button
                      key={dia.key}
                      type="button"
                      onClick={() => toggleDia(dia.key)}
                      aria-pressed={active}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-rojo text-white border-rojo'
                          : 'bg-white text-text-secondary border-border hover:border-text-muted'
                      }`}
                    >
                      {dia.short}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-text-muted mt-1 block">
                Sin días marcados = abre todos los días.
              </span>
            </div>
          </>
        )}

        <Field
          label="Nota Adicional"
          hint={
            modo === 'fijo'
              ? 'Solo para excepciones puntuales (ej: cerrado en invierno, solo con reserva)'
              : modo === 'siempre-abierto'
                ? 'Opcional: detalle del acceso (ej: Acceso libre, plaza pública)'
                : 'Ej: Consultar disponibilidad, o fecha del evento'
          }
        >
          <input
            className={inputCls}
            placeholder={
              modo === 'fijo'
                ? 'Ej: Cerrado los feriados'
                : modo === 'siempre-abierto'
                  ? 'Ej: Abierto todo el día'
                  : 'Ej: Según disponibilidad, consultar directamente'
            }
            value={horario.descripcion || ''}
            onChange={(e) => set({ descripcion: e.target.value })}
          />
        </Field>

        {preview && (
          <div className="text-xs text-text-secondary bg-surface-soft rounded-lg px-3 py-2">
            <strong className="font-bold">Vista previa: </strong>
            {preview}
          </div>
        )}
      </div>
    </div>
  );
}
