'use client';

import React, { useState } from 'react';
import { CheckCircle2, Send, Loader2 } from 'lucide-react';
import { Editable } from '@/components/site-text';

export function ContactoForm() {
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
   * a las postulaciones.
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
  );
}
