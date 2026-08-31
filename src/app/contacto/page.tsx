'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, CheckCircle2, Send, Loader2 } from 'lucide-react';

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({ nombre: '', email: '', asunto: '', mensaje: '' });

      setTimeout(() => setIsSuccess(false), 5000);
    }, 1200);
  };

  return (
    <div className="bg-[#F4F3EF] min-h-screen pb-20">
      {/* ── HERO SECTION ─────── */}
      <section className="relative h-[35vh] min-h-[260px] flex items-center justify-center text-center bg-[#1E1E24] text-white px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E24] via-[#1E1E24]/80 to-transparent z-10" />
        <div className="relative z-20 max-w-2xl mx-auto pt-6">
          <h1 className="font-display font-black text-3xl md:text-4xl text-sol mb-2">
            Contacto Turístico
          </h1>
          <p className="text-sm md:text-base text-gray-300">
            ¿Tienes dudas sobre cómo llegar, dónde alojar o qué comer? El equipo de turismo de Cumpeo está a tu disposición.
          </p>
        </div>
      </section>

      {/* ── CONTACT CONTENT ─────── */}
      <main className="max-w-[1000px] mx-auto px-4 -mt-10 relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-border">
          {/* Lado Izquierdo: Info de Contacto */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-display font-bold text-2xl text-text-primary mb-2">
                Información del Visitante
              </h2>
              <p className="text-sm text-text-secondary">
                La oficina de turismo municipal de Cumpeo te espera para orientarte en tu recorrido por Pelotillehue.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-3.5 items-start">
                <div className="p-3 rounded-xl bg-surface-soft border border-border text-rojo shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary mb-0.5">Dirección Oficial</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Plaza de Armas S/N, Cumpeo.<br />
                    Comuna de Río Claro, Región del Maule.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="p-3 rounded-xl bg-surface-soft border border-border text-rojo shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary mb-0.5">Teléfono Municipal</h4>
                  <p className="text-xs text-text-secondary">+56 71 254 1200</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="p-3 rounded-xl bg-surface-soft border border-border text-rojo shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary mb-0.5">Correo Electrónico</h4>
                  <p className="text-xs text-text-secondary">turismo@rioclaro.cl</p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-border">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Horario de Atención
              </h4>
              <p className="text-xs text-text-muted">
                Lunes a Viernes de 08:30 a 17:30 hrs. Sábados y Domingos atención en módulos de Plaza de Armas.
              </p>
            </div>
          </div>

          {/* Lado Derecho: Formulario */}
          <div className="bg-surface-soft p-6 sm:p-7 rounded-xl border border-border flex flex-col justify-center">
            <h3 className="font-display font-bold text-lg text-text-primary mb-4">
              Envíanos un Mensaje
            </h3>

            {isSuccess ? (
              <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center flex flex-col items-center gap-2">
                <CheckCircle2 size={36} className="text-green-600 mb-1" />
                <h4 className="text-base font-bold text-green-800">¡Mensaje enviado con éxito!</h4>
                <p className="text-xs text-green-700">
                  Gracias por comunicarte con nosotros. Te responderemos a la brevedad posible.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label htmlFor="nombre" className="text-xs font-bold text-text-secondary">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none transition-all"
                    placeholder="Ej. Condorito Martínez"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-xs font-bold text-text-secondary">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none transition-all"
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="asunto" className="text-xs font-bold text-text-secondary">
                    Asunto
                  </label>
                  <select
                    id="asunto"
                    name="asunto"
                    value={formData.asunto}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Selecciona un motivo…</option>
                    <option value="tours">Información de Rutas y Destinos</option>
                    <option value="alojamiento">Consultas sobre Hospedaje</option>
                    <option value="gastronomia">Gastronomía y Restaurantes</option>
                    <option value="eventos">Eventos y Festividades</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="mensaje" className="text-xs font-bold text-text-secondary">
                    Mensaje
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    rows={4}
                    required
                    value={formData.mensaje}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-rojo focus:ring-2 focus:ring-rojo/10 outline-none transition-all resize-y"
                    placeholder="Escribe tu consulta o requerimiento aquí…"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-rojo text-white py-3 rounded-xl font-bold shadow-[0_4px_12px_rgba(230,57,70,0.3)] hover:bg-rojo-dark transition-all disabled:opacity-60 text-sm mt-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Enviando mensaje…</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Enviar Mensaje</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
