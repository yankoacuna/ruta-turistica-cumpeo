'use client';

import React from 'react';
import { Phone, MessageCircle, Instagram, Globe } from 'lucide-react';
import { Field, inputCls } from '../../Field';

interface ContactoData {
  telefono?: string;
  whatsapp?: string;
  instagram?: string;
  web?: string;
  email?: string;
}

interface ContactoSectionProps {
  contacto?: ContactoData | null;
  telefono?: string | null;
  whatsapp?: string | null;
  onChange: (updated: {
    contacto: ContactoData;
    telefono?: string;
    whatsapp?: string;
  }) => void;
  instagramPlaceholder?: string;
}

export function ContactoSection({
  contacto = {},
  telefono = '',
  whatsapp = '',
  onChange,
  instagramPlaceholder = '@nombre_local',
}: ContactoSectionProps) {
  const currentContacto: ContactoData = (contacto as ContactoData) || {};
  const currentTelefono = telefono || currentContacto.telefono || '';
  const currentWhatsapp = whatsapp || currentContacto.whatsapp || '';

  const handleTelefonoChange = (value: string) => {
    onChange({
      telefono: value,
      contacto: { ...currentContacto, telefono: value },
    });
  };

  const handleWhatsappChange = (value: string) => {
    onChange({
      whatsapp: value,
      contacto: { ...currentContacto, whatsapp: value },
    });
  };

  const handleInstagramChange = (value: string) => {
    onChange({
      telefono: currentTelefono,
      whatsapp: currentWhatsapp,
      contacto: { ...currentContacto, instagram: value },
    });
  };

  const handleWebChange = (value: string) => {
    onChange({
      telefono: currentTelefono,
      whatsapp: currentWhatsapp,
      contacto: { ...currentContacto, web: value },
    });
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-white">
      <div className="bg-surface-soft px-4 py-2.5 text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5 border-b border-border">
        <Phone size={13} className="text-rojo" /> Información de Contacto
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Teléfono (Llamadas)">
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className={`${inputCls} pl-8`}
              placeholder="+56 9 XXXX XXXX"
              value={currentTelefono}
              onChange={(e) => handleTelefonoChange(e.target.value)}
            />
          </div>
        </Field>

        <Field label="WhatsApp">
          <div className="relative">
            <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className={`${inputCls} pl-8`}
              placeholder="+56 9 XXXX XXXX"
              value={currentWhatsapp}
              onChange={(e) => handleWhatsappChange(e.target.value)}
            />
          </div>
        </Field>

        <Field label="Instagram">
          <div className="relative">
            <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className={`${inputCls} pl-8`}
              placeholder={instagramPlaceholder}
              value={currentContacto.instagram || ''}
              onChange={(e) => handleInstagramChange(e.target.value)}
            />
          </div>
        </Field>

        <Field label="Sitio Web">
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className={`${inputCls} pl-8`}
              placeholder="https://..."
              value={currentContacto.web || ''}
              onChange={(e) => handleWebChange(e.target.value)}
            />
          </div>
        </Field>
      </div>
    </div>
  );
}
