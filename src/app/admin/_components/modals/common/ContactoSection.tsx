'use client';

import React from 'react';
import { Phone, MessageCircle, Instagram, Facebook, Globe } from 'lucide-react';
import { Field, inputCls } from '../../Field';

interface ContactoData {
  telefono?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
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
  facebookPlaceholder?: string;
}

export function ContactoSection({
  contacto = {},
  telefono = '',
  whatsapp = '',
  onChange,
  instagramPlaceholder = 'nombre_local',
  facebookPlaceholder = 'NombreDelLocal',
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

  /**
   * Acepta lo que sea que peguen (usuario con o sin "@", link completo de
   * Instagram) y siempre deja guardado solo el nombre de usuario limpio.
   */
  const sanitizeInstagram = (raw: string): string =>
    raw
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/^(www\.)?instagram\.com\//i, '')
      .replace(/^@/, '')
      .split(/[/?#]/)[0];

  const handleInstagramChange = (value: string) => {
    onChange({
      telefono: currentTelefono,
      whatsapp: currentWhatsapp,
      contacto: { ...currentContacto, instagram: sanitizeInstagram(value) },
    });
  };

  /** Igual que Instagram, pero Facebook no usa "@": solo se limpia el link o dominio. */
  const sanitizeFacebook = (raw: string): string =>
    raw
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/^(www\.|m\.)?facebook\.com\//i, '')
      .replace(/^@/, '')
      .split(/[/?#]/)[0];

  const handleFacebookChange = (value: string) => {
    onChange({
      telefono: currentTelefono,
      whatsapp: currentWhatsapp,
      contacto: { ...currentContacto, facebook: sanitizeFacebook(value) },
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

        <Field label="Instagram" hint="Solo el nombre de usuario, la @ se agrega sola">
          <div className="relative">
            <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <span className="absolute left-8 top-1/2 -translate-y-1/2 text-text-muted select-none">@</span>
            <input
              className={`${inputCls} pl-11`}
              placeholder={instagramPlaceholder}
              value={currentContacto.instagram || ''}
              onChange={(e) => handleInstagramChange(e.target.value)}
            />
          </div>
        </Field>

        <Field label="Facebook" hint="Nombre de usuario o de la página, sin el link completo">
          <div className="relative">
            <Facebook size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className={`${inputCls} pl-8`}
              placeholder={facebookPlaceholder}
              value={currentContacto.facebook || ''}
              onChange={(e) => handleFacebookChange(e.target.value)}
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
