'use client';

import React, { useRef, useState } from 'react';
import {
  UtensilsCrossed,
  BedDouble,
  MapPin,
  CalendarDays,
  ArrowRight,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  ImagePlus,
  X,
  AlertCircle,
} from 'lucide-react';
import { SolicitudTipo, Coordinates } from '@/lib/types';
import { LocationField } from '@/app/admin/_components/modals/common';

const MAX_FOTOS = 3;

const TIPOS: Array<{
  tipo: SolicitudTipo;
  titulo: string;
  detalle: string;
  icono: React.ReactNode;
}> = [
  {
    tipo: 'RESTAURANTE',
    titulo: 'Local de comida',
    detalle: 'Restaurante, picada, café, bar o cocinería',
    icono: <UtensilsCrossed size={22} />,
  },
  {
    tipo: 'ALOJAMIENTO',
    titulo: 'Alojamiento',
    detalle: 'Cabañas, hostal, camping o habitaciones',
    icono: <BedDouble size={22} />,
  },
  {
    tipo: 'DESTINO',
    titulo: 'Atractivo turístico',
    detalle: 'Un lugar para visitar: natural, histórico o cultural',
    icono: <MapPin size={22} />,
  },
  {
    tipo: 'EVENTO',
    titulo: 'Evento o feria',
    detalle: 'Fiesta, feria costumbrista o actividad recurrente',
    icono: <CalendarDays size={22} />,
  },
];

const CATEGORIAS: Partial<Record<SolicitudTipo, string[]>> = {
  RESTAURANTE: ['Restaurante', 'Picada', 'Cafetería', 'Bar', 'Cocinería', 'Food truck'],
  ALOJAMIENTO: ['Cabañas', 'Hostal', 'Camping', 'Hotel', 'Habitaciones', 'Casa completa'],
  DESTINO: ['Naturaleza', 'Histórico', 'Cultural', 'Patrimonio', 'Entretención'],
  EVENTO: ['Fiesta religiosa', 'Feria costumbrista', 'Actividad cultural', 'Deportivo'],
};

const MEDIOS_PAGO = ['Efectivo', 'Débito', 'Crédito', 'Transferencia'];

const SERVICIOS = [
  'Wi-Fi',
  'Estacionamiento',
  'Desayuno',
  'Cocina equipada',
  'Piscina',
  'Tinaja',
  'Se admiten mascotas',
  'Calefacción',
];

/** En qué paso vive cada campo, para saltar al error que devuelve el servidor. */
const PASO_DEL_CAMPO: Record<string, number> = {
  tipo: 1,
  nombre: 2,
  descripcion: 2,
  direccion: 2,
  solicitanteNombre: 3,
  solicitanteEmail: 3,
  mensaje: 3,
};

interface Formulario {
  tipo: SolicitudTipo | null;
  nombre: string;
  categoriaSugerida: string;
  especialidad: string;
  descripcion: string;
  direccion: string;
  coordenadas: Coordinates | null;
  horarioApertura: string;
  horarioCierre: string;
  horarioDescripcion: string;
  fecha: string;
  mediosPago: string[];
  servicios: string[];
  telefono: string;
  whatsapp: string;
  email: string;
  web: string;
  instagram: string;
  facebook: string;
  fotos: string[];
  solicitanteNombre: string;
  solicitanteEmail: string;
  solicitanteTelefono: string;
  solicitanteRol: string;
  mensaje: string;
}

const INICIAL: Formulario = {
  tipo: null,
  nombre: '',
  categoriaSugerida: '',
  especialidad: '',
  descripcion: '',
  direccion: '',
  coordenadas: null,
  horarioApertura: '',
  horarioCierre: '',
  horarioDescripcion: '',
  fecha: '',
  mediosPago: [],
  servicios: [],
  telefono: '',
  whatsapp: '',
  email: '',
  web: '',
  instagram: '',
  facebook: '',
  fotos: [],
  solicitanteNombre: '',
  solicitanteEmail: '',
  solicitanteTelefono: '',
  solicitanteRol: '',
  mensaje: '',
};

const campoCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-rojo transition-colors';

const etiquetaCls = 'block text-xs font-bold text-text-secondary mb-1.5';

function Etiqueta({
  children,
  obligatorio,
}: {
  children: React.ReactNode;
  obligatorio?: boolean;
}) {
  return (
    <span className={etiquetaCls}>
      {children}
      {obligatorio && <span className="text-rojo ml-0.5">*</span>}
    </span>
  );
}

function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p className="text-xs text-rojo font-semibold mt-1 flex items-center gap-1">
      <AlertCircle size={12} />
      {mensaje}
    </p>
  );
}

/**
 * Postulación de un emprendedor para entrar a la plataforma turística.
 *
 * Va por pasos y no en una sola pantalla larga porque los campos cambian según
 * lo que se postula: un alojamiento necesita servicios, un evento una fecha, y
 * mostrarlo todo junto obliga a la persona a descartar la mitad del formulario.
 *
 * Los campos son los mismos que usa una ficha publicada: así el municipio puede
 * crear la ficha desde el panel con los datos ya cargados, en vez de transcribir
 * un correo a mano.
 */
export function SumateForm() {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState<Formulario>(INICIAL);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState('');
  const [enviado, setEnviado] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);
  // Campo trampa para robots: invisible para una persona.
  const [website, setWebsite] = useState('');

  const set = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => {
      if (!prev[campo as string]) return prev;
      const { [campo as string]: _, ...resto } = prev;
      return resto;
    });
  };

  const alternar = (campo: 'mediosPago' | 'servicios', valor: string) => {
    setForm((prev) => ({
      ...prev,
      [campo]: prev[campo].includes(valor)
        ? prev[campo].filter((v) => v !== valor)
        : [...prev[campo], valor],
    }));
  };

  const subirFotos = async (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return;
    setErrorFoto('');
    const disponibles = MAX_FOTOS - form.fotos.length;
    if (disponibles <= 0) {
      setErrorFoto(`Puedes adjuntar hasta ${MAX_FOTOS} fotos.`);
      return;
    }

    setSubiendoFoto(true);
    try {
      for (const archivo of Array.from(archivos).slice(0, disponibles)) {
        const datos = new FormData();
        datos.append('file', archivo);
        const respuesta = await fetch('/api/solicitudes/foto', { method: 'POST', body: datos });
        const resultado = await respuesta.json();
        if (!respuesta.ok) {
          setErrorFoto(resultado.error || 'No pudimos subir la foto.');
          break;
        }
        setForm((prev) => ({ ...prev, fotos: [...prev.fotos, resultado.url] }));
      }
    } catch {
      setErrorFoto('No pudimos subir la foto. Revisa tu conexión.');
    } finally {
      setSubiendoFoto(false);
      if (inputFoto.current) inputFoto.current.value = '';
    }
  };

  /**
   * Validación mínima antes de avanzar de paso: evita que alguien llegue al
   * final para recién enterarse de que faltaba el nombre. La validación que
   * manda es la del servidor.
   */
  const validarPaso2 = (): boolean => {
    const nuevos: Record<string, string> = {};
    if (form.nombre.trim().length < 2) nuevos.nombre = 'Falta el nombre del lugar o negocio.';
    if (form.descripcion.trim().length < 30) {
      nuevos.descripcion = 'Cuéntanos un poco más: al menos 30 caracteres.';
    }
    if (!form.direccion.trim() && !form.coordenadas) {
      nuevos.direccion = 'Indica dónde queda: una dirección o un punto en el mapa.';
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;

    setEnviando(true);
    setErrores({});
    try {
      const respuesta = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website, // trampa
          tipo: form.tipo,
          nombre: form.nombre,
          categoriaSugerida: form.categoriaSugerida,
          especialidad: form.especialidad,
          descripcion: form.descripcion,
          direccion: form.direccion,
          coordenadas: form.coordenadas,
          horario: {
            apertura: form.horarioApertura,
            cierre: form.horarioCierre,
            descripcion: form.horarioDescripcion,
          },
          fecha: form.fecha,
          mediosPago: form.mediosPago,
          servicios: form.servicios,
          telefono: form.telefono,
          whatsapp: form.whatsapp,
          email: form.email,
          web: form.web,
          instagram: form.instagram,
          facebook: form.facebook,
          fotos: form.fotos,
          solicitanteNombre: form.solicitanteNombre,
          solicitanteEmail: form.solicitanteEmail,
          solicitanteTelefono: form.solicitanteTelefono,
          solicitanteRol: form.solicitanteRol,
          mensaje: form.mensaje,
        }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.ok) {
        const devueltos: Record<string, string> = resultado.errores || {
          general: resultado.error || 'No pudimos enviar tu solicitud.',
        };
        setErrores(devueltos);
        // Volver al paso donde está el primer campo con problema: dejar a la
        // persona en el paso 3 viendo un error del paso 2 no ayuda en nada.
        const primerPaso = Math.min(
          ...Object.keys(devueltos).map((campo) => PASO_DEL_CAMPO[campo] ?? 3)
        );
        if (Number.isFinite(primerPaso)) setPaso(primerPaso);
        return;
      }

      setEnviado(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrores({ general: 'No pudimos enviar tu solicitud. Revisa tu conexión.' });
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} />
        </div>
        <h2 className="font-display font-bold text-xl text-text-primary mb-2">
          ¡Recibimos tu solicitud!
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
          El equipo de turismo de la Municipalidad de Río Claro va a revisar los datos de{' '}
          <strong>{form.nombre}</strong>. Si necesitan algo más, te escriben a{' '}
          <strong>{form.solicitanteEmail}</strong>.
        </p>
        <button
          type="button"
          onClick={() => {
            setForm(INICIAL);
            setEnviado(false);
            setPaso(1);
          }}
          className="mt-6 px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-text-secondary hover:border-rojo hover:text-rojo transition-colors"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  const categorias = form.tipo ? CATEGORIAS[form.tipo] ?? [] : [];

  return (
    <form onSubmit={enviar} className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-8">
      {/* Progreso */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((n) => (
          <React.Fragment key={n}>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                paso >= n ? 'bg-rojo text-white' : 'bg-surface-soft text-text-muted border border-border'
              }`}
            >
              {n}
            </div>
            {n < 3 && (
              <div
                className={`flex-1 h-0.5 rounded transition-colors ${
                  paso > n ? 'bg-rojo' : 'bg-border'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {errores.general && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-rojo font-semibold flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {errores.general}
        </div>
      )}

      {/* ── Paso 1: qué quiere sumar ── */}
      {paso === 1 && (
        <div>
          <h2 className="font-display font-bold text-lg text-text-primary mb-1">
            ¿Qué quieres sumar a la plataforma?
          </h2>
          <p className="text-sm text-text-secondary mb-5">
            Según lo que elijas te pedimos los datos que corresponden. No toma más de cinco minutos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TIPOS.map((opcion) => (
              <button
                key={opcion.tipo}
                type="button"
                onClick={() => {
                  set('tipo', opcion.tipo);
                  setPaso(2);
                }}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-white hover:border-rojo hover:bg-red-50/30 transition-all text-left group"
              >
                <span className="p-2.5 rounded-xl bg-surface-soft text-rojo shrink-0 group-hover:bg-white transition-colors">
                  {opcion.icono}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-text-primary">{opcion.titulo}</span>
                  <span className="block text-xs text-text-secondary leading-relaxed mt-0.5">
                    {opcion.detalle}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <ErrorCampo mensaje={errores.tipo} />
        </div>
      )}

      {/* ── Paso 2: datos del lugar ── */}
      {paso === 2 && form.tipo && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display font-bold text-lg text-text-primary mb-1">
              Cuéntanos del lugar
            </h2>
            <p className="text-sm text-text-secondary">
              Esto es lo que verá el turista en la plataforma, así que mientras más claro, mejor.
            </p>
          </div>

          <label className="block">
            <Etiqueta obligatorio>Nombre del lugar o negocio</Etiqueta>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Ej: Cabañas Los Robles"
              className={campoCls}
            />
            <ErrorCampo mensaje={errores.nombre} />
          </label>

          {categorias.length > 0 && (
            <label className="block">
              <Etiqueta>Tipo</Etiqueta>
              <select
                value={form.categoriaSugerida}
                onChange={(e) => set('categoriaSugerida', e.target.value)}
                className={campoCls}
              >
                <option value="">Selecciona una opción…</option>
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </label>
          )}

          {form.tipo === 'RESTAURANTE' && (
            <label className="block">
              <Etiqueta>Especialidad de la casa</Etiqueta>
              <input
                type="text"
                value={form.especialidad}
                onChange={(e) => set('especialidad', e.target.value)}
                placeholder="Ej: Cazuela de vacuno y empanadas de horno"
                className={campoCls}
              />
            </label>
          )}

          {form.tipo === 'EVENTO' && (
            <label className="block">
              <Etiqueta>¿Cuándo se realiza?</Etiqueta>
              <input
                type="text"
                value={form.fecha}
                onChange={(e) => set('fecha', e.target.value)}
                placeholder="Ej: 20 de enero, o todos los domingos"
                className={campoCls}
              />
            </label>
          )}

          <label className="block">
            <Etiqueta obligatorio>Descripción</Etiqueta>
            <textarea
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              rows={4}
              placeholder="¿Qué ofreces? ¿Qué lo hace especial? Escribe como se lo contarías a un visitante."
              className={`${campoCls} resize-y`}
            />
            <div className="flex justify-between items-start gap-2">
              <ErrorCampo mensaje={errores.descripcion} />
              <span className="text-xs text-text-muted shrink-0 ml-auto mt-1">
                {form.descripcion.length} caracteres
              </span>
            </div>
          </label>

          <div>
            <Etiqueta obligatorio>Dónde queda</Etiqueta>
            <LocationField
              direccion={form.direccion}
              coordinates={form.coordenadas}
              onChange={({ direccion, coordenadas }) => {
                setForm((prev) => ({ ...prev, direccion, coordenadas }));
                setErrores((prev) => {
                  const { direccion: _, ...resto } = prev;
                  return resto;
                });
              }}
              modalTitle="Busca la dirección o marca el punto exacto en el mapa"
            />
            <ErrorCampo mensaje={errores.direccion} />
          </div>

          {(form.tipo === 'RESTAURANTE' || form.tipo === 'DESTINO') && (
            <div>
              <Etiqueta>Horario de atención</Etiqueta>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  value={form.horarioApertura}
                  onChange={(e) => set('horarioApertura', e.target.value)}
                  className={campoCls}
                  aria-label="Hora de apertura"
                />
                <input
                  type="time"
                  value={form.horarioCierre}
                  onChange={(e) => set('horarioCierre', e.target.value)}
                  className={campoCls}
                  aria-label="Hora de cierre"
                />
              </div>
              <input
                type="text"
                value={form.horarioDescripcion}
                onChange={(e) => set('horarioDescripcion', e.target.value)}
                placeholder="Detalles: días de cierre, temporada, etc."
                className={`${campoCls} mt-3`}
              />
            </div>
          )}

          {form.tipo === 'RESTAURANTE' && (
            <div>
              <Etiqueta>Medios de pago</Etiqueta>
              <div className="flex flex-wrap gap-2">
                {MEDIOS_PAGO.map((medio) => (
                  <button
                    key={medio}
                    type="button"
                    onClick={() => alternar('mediosPago', medio)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      form.mediosPago.includes(medio)
                        ? 'bg-rojo text-white border-rojo'
                        : 'bg-white text-text-secondary border-border hover:border-rojo'
                    }`}
                  >
                    {medio}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.tipo === 'ALOJAMIENTO' && (
            <div>
              <Etiqueta>Servicios que ofreces</Etiqueta>
              <div className="flex flex-wrap gap-2">
                {SERVICIOS.map((servicio) => (
                  <button
                    key={servicio}
                    type="button"
                    onClick={() => alternar('servicios', servicio)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      form.servicios.includes(servicio)
                        ? 'bg-rojo text-white border-rojo'
                        : 'bg-white text-text-secondary border-border hover:border-rojo'
                    }`}
                  >
                    {servicio}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fotos */}
          <div>
            <Etiqueta>Fotos (hasta {MAX_FOTOS})</Etiqueta>
            <div className="flex flex-wrap gap-3">
              {form.fotos.map((url) => (
                <div
                  key={url}
                  className="relative w-24 h-24 rounded-xl overflow-hidden border border-border bg-surface-soft"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Foto adjunta" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => set('fotos', form.fotos.filter((f) => f !== url))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    aria-label="Quitar foto"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}

              {form.fotos.length < MAX_FOTOS && (
                <button
                  type="button"
                  onClick={() => inputFoto.current?.click()}
                  disabled={subiendoFoto}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-rojo text-text-muted hover:text-rojo flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  {subiendoFoto ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <ImagePlus size={20} />
                      <span className="text-xs font-bold">Agregar</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={inputFoto}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={(e) => subirFotos(e.target.files)}
              className="hidden"
            />
            <ErrorCampo mensaje={errorFoto} />
            <p className="text-xs text-text-muted mt-1.5">
              Fotos propias, horizontales y con buena luz. Si no tienes ahora, puedes enviarlas
              después.
            </p>
          </div>

          {/* Contacto público del negocio */}
          <div className="pt-4 border-t border-border/60">
            <Etiqueta>Contacto que verá el turista</Etiqueta>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => set('telefono', e.target.value)}
                placeholder="Teléfono"
                className={campoCls}
              />
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
                placeholder="WhatsApp"
                className={campoCls}
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="Correo del negocio"
                className={campoCls}
              />
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => set('instagram', e.target.value)}
                placeholder="Instagram"
                className={campoCls}
              />
              <input
                type="text"
                value={form.facebook}
                onChange={(e) => set('facebook', e.target.value)}
                placeholder="Facebook"
                className={campoCls}
              />
              <input
                type="text"
                value={form.web}
                onChange={(e) => set('web', e.target.value)}
                placeholder="Sitio web"
                className={campoCls}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPaso(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-text-secondary hover:border-rojo hover:text-rojo transition-colors"
            >
              <ArrowLeft size={15} />
              Volver
            </button>
            <button
              type="button"
              onClick={() => {
                if (validarPaso2()) setPaso(3);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rojo hover:bg-rojo-dark text-white text-sm font-bold transition-colors shadow-sm"
            >
              Continuar
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 3: quién solicita ── */}
      {paso === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display font-bold text-lg text-text-primary mb-1">Tus datos</h2>
            <p className="text-sm text-text-secondary">
              Para poder contactarte si falta información. No se publican en el sitio.
            </p>
          </div>

          <label className="block">
            <Etiqueta obligatorio>Tu nombre</Etiqueta>
            <input
              type="text"
              value={form.solicitanteNombre}
              onChange={(e) => set('solicitanteNombre', e.target.value)}
              className={campoCls}
            />
            <ErrorCampo mensaje={errores.solicitanteNombre} />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <Etiqueta obligatorio>Tu correo</Etiqueta>
              <input
                type="email"
                value={form.solicitanteEmail}
                onChange={(e) => set('solicitanteEmail', e.target.value)}
                className={campoCls}
              />
              <ErrorCampo mensaje={errores.solicitanteEmail} />
            </label>

            <label className="block">
              <Etiqueta>Tu teléfono</Etiqueta>
              <input
                type="tel"
                value={form.solicitanteTelefono}
                onChange={(e) => set('solicitanteTelefono', e.target.value)}
                className={campoCls}
              />
            </label>
          </div>

          <label className="block">
            <Etiqueta>¿Qué eres del lugar?</Etiqueta>
            <select
              value={form.solicitanteRol}
              onChange={(e) => set('solicitanteRol', e.target.value)}
              className={campoCls}
            >
              <option value="">Selecciona una opción…</option>
              <option value="Dueño o dueña">Dueño o dueña</option>
              <option value="Administrador">Administrador</option>
              <option value="Familiar o socio">Familiar o socio</option>
              <option value="Vecino que lo recomienda">Vecino que lo recomienda</option>
            </select>
          </label>

          <label className="block">
            <Etiqueta>¿Algo más que debamos saber?</Etiqueta>
            <textarea
              value={form.mensaje}
              onChange={(e) => set('mensaje', e.target.value)}
              rows={3}
              placeholder="Opcional"
              className={`${campoCls} resize-y`}
            />
          </label>

          {/* Trampa para robots: oculta a la vista y fuera del recorrido por teclado */}
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          <p className="text-xs text-text-muted leading-relaxed">
            Al enviar, autorizas a la Municipalidad de Río Claro a publicar la información del lugar
            y sus fotos en la plataforma de turismo. Tus datos de contacto personales no se publican.
          </p>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPaso(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-text-secondary hover:border-rojo hover:text-rojo transition-colors"
            >
              <ArrowLeft size={15} />
              Volver
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rojo hover:bg-rojo-dark text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-60"
            >
              {enviando ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Send size={15} />
                  Enviar solicitud
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
