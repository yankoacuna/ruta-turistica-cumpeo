import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Store } from 'lucide-react';
import { Editable } from '@/components/site-text';
import { ContactoForm } from './ContactoForm';

export const metadata: Metadata = {
  title: 'Contacto — Turismo Cumpeo',
  description: 'Escríbenos tus consultas sobre rutas, alojamiento, gastronomía o eventos en Cumpeo, Región del Maule.',
};

export default function ContactoPage() {
  return (
    <div className="bg-[#F4F3EF] min-h-screen pb-20">
      {/* ── HERO SECTION ─────── */}
      <section className="relative h-[35vh] min-h-[260px] flex items-center justify-center text-center bg-[#1E1E24] text-white px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E24] via-[#1E1E24]/80 to-transparent z-10" />
        <div className="relative z-20 max-w-2xl mx-auto pt-6">
          <Editable
            k="contacto.hero.titulo"
            as="h1"
            className="font-display font-black text-3xl md:text-4xl text-sol mb-2"
          />
          <Editable
            k="contacto.hero.bajada"
            as="p"
            className="text-sm md:text-base text-gray-300"
            multiline
          />
        </div>
      </section>

      {/* ── CONTACT CONTENT ─────── */}
      <main className="max-w-[1000px] mx-auto px-4 -mt-10 relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-border">
          {/* Lado Izquierdo: Info de Contacto */}
          <div className="flex flex-col gap-6">
            <div>
              <Editable
                k="contacto.info.titulo"
                as="h2"
                className="font-display font-bold text-2xl text-text-primary mb-2"
              />
              <Editable
                k="contacto.info.texto"
                as="p"
                className="text-sm text-text-secondary"
                multiline
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-3.5 items-start">
                <div className="p-3 rounded-xl bg-surface-soft border border-border text-rojo shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <Editable
                    k="contacto.info.direccionTitulo"
                    as="h4"
                    className="text-sm font-bold text-text-primary mb-0.5"
                  />
                  <Editable
                    k="contacto.info.direccionTexto"
                    as="p"
                    className="text-xs text-text-secondary leading-relaxed"
                    multiline
                  />
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="p-3 rounded-xl bg-surface-soft border border-border text-rojo shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <Editable
                    k="contacto.info.telefonoTitulo"
                    as="h4"
                    className="text-sm font-bold text-text-primary mb-0.5"
                  />
                  <Editable
                    k="contacto.info.telefonoValor"
                    as="p"
                    className="text-xs text-text-secondary"
                  />
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="p-3 rounded-xl bg-surface-soft border border-border text-rojo shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <Editable
                    k="contacto.info.emailTitulo"
                    as="h4"
                    className="text-sm font-bold text-text-primary mb-0.5"
                  />
                  <Editable
                    k="contacto.info.emailValor"
                    as="p"
                    className="text-xs text-text-secondary"
                  />
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-border">
              <Editable
                k="contacto.info.horarioTitulo"
                as="h4"
                className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2"
              />
              <Editable
                k="contacto.info.horarioTexto"
                as="p"
                className="text-xs text-text-muted"
                multiline
              />
            </div>
          </div>

          {/* Aviso para emprendedores: llegan a contacto buscando como sumarse,
              y el formulario de consultas no recoge los datos que hacen falta */}
          <div className="md:col-span-2 order-first flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-sol/10 border border-sol/40">
            <Store size={22} className="text-rojo shrink-0" />
            <p className="text-sm text-text-secondary flex-1 leading-relaxed">
              <strong className="text-text-primary">¿Tienes un negocio turístico en Cumpeo?</strong>{' '}
              Postula para aparecer en la plataforma con tu ficha, fotos y datos de contacto.
            </p>
            <Link
              href="/sumate"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rojo hover:bg-rojo-dark text-white text-sm font-bold no-underline transition-colors shrink-0"
            >
              Súmate a la plataforma
            </Link>
          </div>

          {/* Lado Derecho: Formulario */}
          <ContactoForm />
        </div>
      </main>
    </div>
  );
}
