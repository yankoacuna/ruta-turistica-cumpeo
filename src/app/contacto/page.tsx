'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, CheckCircle2, Send, Loader2, Store } from 'lucide-react';
import { Editable, useSiteText } from '@/components/site-text';

export default function ContactoPage() {
  const { get } = useSiteText();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Envia la consulta al panel, donde queda en la bandeja de Solicitudes junto
   * a las postulaciones. Antes esto era un setTimeout que simulaba el envio:
   * la persona veia "mensaje enviado" y el mensaje no llegaba a nadie.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    try {
      const respuesta = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'CONSULTA',
          solicitanteNombre: formData.nombre,
          solicitanteEmail: formData.email,
          nombre: formData.asunto || 'Consulta desde el sitio',
          descripcion: '',
          mensaje: formData.mensaje,
        }),
      });
      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.ok) {
        const errores: Record<string, string> = resultado.errores || {};
        setError(
          Object.values(errores)[0] ||
            resultado.error ||
            'No pudimos enviar tu mensaje. Intentalo de nuevo.'
        );
        return;
      }

      setIsSuccess(true);
      setFormData({ nombre: '', email: '', asunto: '', mensaje: '' });
      setTimeout(() => setIsSuccess(false), 8000);
    } catch {
      setError('No pudimos enviar tu mensaje. Revisa tu conexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="bg-surface-soft p-6 sm:p-7 rounded-xl border border-border flex flex-col justify-center">
            <Editable
              k="contacto.form.titulo"
              as="h3"
              className="font-display font-bold text-lg text-text-primary mb-4"
            />

            {isSuccess ? (
              <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center flex flex-col items-center gap-2">
                <CheckCircle2 size={36} className="text-green-600 mb-1" />
                <Editable
                  k="contacto.form.exitoTitulo"
                  as="h4"
                  className="text-base font-bold text-green-800"
                />
                <Editable
                  k="contacto.form.exitoTexto"
                  as="p"
                  className="text-xs text-green-700"
                  multiline
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                {error && (
                  <p className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-rojo">
                    {error}
                  </p>
                )}

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
                      <Editable k="contacto.form.enviando" />
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <Editable k="contacto.form.boton" />
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
