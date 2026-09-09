'use client';

import React from 'react';
import { ShieldAlert, X, Phone } from 'lucide-react';
import { AppConfig, EmergencyContact } from '@/lib/types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig | null;
  emergencyContacts: EmergencyContact[];
}

export function EmergencyModal({
  isOpen,
  onClose,
  config,
  emergencyContacts,
}: EmergencyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rojo/10 text-rojo flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-lg text-text-primary">
                Asistencia y Contacto Comunal
              </h3>
              <p className="text-xs text-text-secondary">
                Ilustre Municipalidad de Rio Claro - Cumpeo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-soft transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Informacion Turistica Municipal */}
          <div className="p-4 rounded-2xl bg-[#FFF8F8] border border-[#FFE0E2]">
            <div className="text-xs font-bold text-rojo uppercase tracking-wider mb-2">
              Oficina de Turismo Municipal
            </div>
            <div className="space-y-1.5 text-xs text-text-secondary">
              <p className="font-medium text-text-primary">
                {config?.informacionTuristica?.oficina || 'Oficina de Informaciones Turisticas (OIT)'}
              </p>
              <p>
                <span className="font-semibold text-text-primary">Horario: </span>
                {config?.informacionTuristica?.horario || 'Lunes a Viernes 08:30 - 17:30 hrs'}
              </p>
              {config?.informacionTuristica?.telefono && (
                <p>
                  <span className="font-semibold text-text-primary">Telefono: </span>
                  <a href={`tel:${config.informacionTuristica.telefono}`} className="text-rojo hover:underline font-bold">
                    {config.informacionTuristica.telefono}
                  </a>
                </p>
              )}
              {config?.informacionTuristica?.email && (
                <p>
                  <span className="font-semibold text-text-primary">Email: </span>
                  <a href={`mailto:${config.informacionTuristica.email}`} className="text-rojo hover:underline">
                    {config.informacionTuristica.email}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Telefonos de Emergencia */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
              Numeros de Emergencia
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {emergencyContacts.length > 0 ? (
                emergencyContacts.map((contact) => (
                  <a
                    key={contact.id}
                    href={`tel:${contact.telefono}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-soft border border-border hover:border-rojo text-inherit no-underline transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-text-primary">{contact.institucion}</div>
                      <div className="text-[11px] text-text-muted">{contact.telefono}</div>
                    </div>
                    <Phone size={14} className="text-rojo shrink-0" />
                  </a>
                ))
              ) : (
                <>
                  <a
                    href="tel:133"
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-soft border border-border hover:border-rojo text-inherit no-underline transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-text-primary">Carabineros de Chile</div>
                      <div className="text-[11px] text-text-muted">Reten Cumpeo - 133</div>
                    </div>
                    <Phone size={14} className="text-rojo shrink-0" />
                  </a>
                  <a
                    href="tel:132"
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-soft border border-border hover:border-rojo text-inherit no-underline transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-text-primary">Bomberos</div>
                      <div className="text-[11px] text-text-muted">Cuerpo Bomberos Cumpeo - 132</div>
                    </div>
                    <Phone size={14} className="text-rojo shrink-0" />
                  </a>
                  <a
                    href="tel:131"
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-soft border border-border hover:border-rojo text-inherit no-underline transition-all sm:col-span-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-text-primary">Salud - Cesfam Rio Claro</div>
                      <div className="text-[11px] text-text-muted">SAMU 131 - Urgencias Comunales</div>
                    </div>
                    <Phone size={14} className="text-rojo shrink-0" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#1E1E24] text-white text-xs font-bold hover:bg-black transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
