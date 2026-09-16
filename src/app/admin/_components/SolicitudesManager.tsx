'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Inbox,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Globe,
  Clock,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  UtensilsCrossed,
  BedDouble,
  CalendarDays,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { SolicitudRecord, SolicitudEstado, SolicitudTipo, AdminSessionUser } from '@/lib/types';
import { TIPO_LABEL, ESTADO_LABEL } from '@/lib/solicitudes';
import {
  getSolicitudes,
  cambiarEstadoSolicitud,
  eliminarSolicitud,
} from '../solicitudActions';
import { ToastFn, ConfirmFn } from '../_types';
import { ResultadoError, esProblemaDeSesion } from '@/lib/resultado';

const TIPO_ICONO: Record<SolicitudTipo, React.ReactNode> = {
  RESTAURANTE: <UtensilsCrossed size={15} />,
  ALOJAMIENTO: <BedDouble size={15} />,
  DESTINO: <MapPin size={15} />,
  EVENTO: <CalendarDays size={15} />,
  CONSULTA: <MessageSquare size={15} />,
};

const ESTADO_CLS: Record<SolicitudEstado, string> = {
  NUEVA: 'bg-rojo/10 text-rojo border-rojo/30',
  EN_REVISION: 'bg-amber-50 text-amber-700 border-amber-200',
  APROBADA: 'bg-sky-50 text-cielo border-sky-200',
  RECHAZADA: 'bg-surface-soft text-text-muted border-border',
  PUBLICADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const FILTROS: Array<{ clave: 'PENDIENTES' | 'TODAS' | SolicitudEstado; label: string }> = [
  { clave: 'PENDIENTES', label: 'Por revisar' },
  { clave: 'TODAS', label: 'Todas' },
  { clave: 'APROBADA', label: 'Aprobadas' },
  { clave: 'PUBLICADA', label: 'Publicadas' },
  { clave: 'RECHAZADA', label: 'Rechazadas' },
];

function fechaLegible(valor: string | Date): string {
  return new Date(valor).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface SolicitudesManagerProps {
  currentUser?: AdminSessionUser | null;
  showToast: ToastFn;
  confirmAction: ConfirmFn;
  /** Abre el formulario de la ficha correspondiente, ya relleno con la solicitud. */
  onCrearFicha: (solicitud: SolicitudRecord) => void;
  /** Se llama cuando la sesión dejó de ser válida. */
  onAuthError?: () => void;
}

/**
 * Bandeja de lo que llega desde el sitio público: postulaciones de
 * emprendedores (/sumate) y consultas del formulario de contacto.
 *
 * Carga sus propios datos en vez de recibirlos del panel: son una lista aparte
 * del contenido publicado, y así abrir el CMS no espera por ellas.
 */
export function SolicitudesManager({
  currentUser,
  showToast,
  confirmAction,
  onCrearFicha,
  onAuthError,
}: SolicitudesManagerProps) {
  const [solicitudes, setSolicitudes] = useState<SolicitudRecord[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<'PENDIENTES' | 'TODAS' | SolicitudEstado>('PENDIENTES');
  const [busqueda, setBusqueda] = useState('');
  const [abierta, setAbierta] = useState<string | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [ocupada, setOcupada] = useState<string | null>(null);

  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'EDITOR';
  const canDelete = currentUser?.role === 'ADMIN';

  /** Fallo previsto por una acción: la sesión caída cambia la pantalla, el resto avisa. */
  const avisarFallo = useCallback(
    (res: ResultadoError) => {
      if (esProblemaDeSesion(res)) onAuthError?.();
      showToast(res.mensaje, 'error');
    },
    [showToast, onAuthError]
  );

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await getSolicitudes();
      if (!res.ok) {
        avisarFallo(res);
        return;
      }
      setSolicitudes(res.data);
    } catch (e) {
      console.error('Error cargando solicitudes:', e);
      showToast('No se pudieron cargar las solicitudes', 'error');
    } finally {
      setCargando(false);
    }
  }, [showToast, avisarFallo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return solicitudes.filter((s) => {
      const pasaFiltro =
        filtro === 'TODAS'
          ? true
          : filtro === 'PENDIENTES'
            ? s.estado === 'NUEVA' || s.estado === 'EN_REVISION'
            : s.estado === filtro;
      if (!pasaFiltro) return false;
      if (!texto) return true;
      return [s.nombre, s.solicitanteNombre, s.solicitanteEmail, s.direccion]
        .filter(Boolean)
        .some((campo) => (campo as string).toLowerCase().includes(texto));
    });
  }, [solicitudes, filtro, busqueda]);

  const pendientes = solicitudes.filter(
    (s) => s.estado === 'NUEVA' || s.estado === 'EN_REVISION'
  ).length;

  const actualizar = async (id: string, estado: SolicitudEstado) => {
    setOcupada(id);
    try {
      const res = await cambiarEstadoSolicitud(id, estado, notas[id]);
      if (!res.ok) {
        avisarFallo(res);
        return;
      }
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? res.data : s)));
      showToast(`Solicitud marcada como "${ESTADO_LABEL[estado].toLowerCase()}"`, 'success');
    } catch (e) {
      console.error('Error inesperado al cambiar el estado de la solicitud:', e);
      showToast('No pudimos actualizar la solicitud. Vuelve a intentarlo.', 'error');
    } finally {
      setOcupada(null);
    }
  };

  const borrar = async (solicitud: SolicitudRecord) => {
    const ok = await confirmAction(
      `¿Eliminar la solicitud de "${solicitud.nombre}"? Esta acción no se puede deshacer.`,
      { title: 'Eliminar solicitud', confirmLabel: 'Eliminar', danger: true }
    );
    if (!ok) return;

    setOcupada(solicitud.id);
    try {
      const res = await eliminarSolicitud(solicitud.id);
      if (!res.ok && res.codigo !== 'NO_ENCONTRADO') {
        avisarFallo(res);
        return;
      }
      setSolicitudes((prev) => prev.filter((s) => s.id !== solicitud.id));
      showToast(res.ok ? 'Solicitud eliminada' : res.mensaje, 'info');
    } catch (e) {
      console.error('Error inesperado al eliminar la solicitud:', e);
      showToast('No pudimos eliminar la solicitud. Vuelve a intentarlo.', 'error');
    } finally {
      setOcupada(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl border border-border shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-50 text-rojo">
              <Inbox size={16} />
            </div>
            <div>
              <h2 className="font-bold text-text-primary text-sm">Solicitudes Recibidas</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Postulaciones de emprendedores y consultas que llegan desde el sitio público.
                {pendientes > 0 && (
                  <strong className="text-rojo">
                    {' '}
                    {pendientes} {pendientes === 1 ? 'sin revisar' : 'sin revisar'}.
                  </strong>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cargar}
            disabled={cargando}
            title="Actualizar listado"
            className="p-2 rounded-xl border border-border text-text-secondary hover:border-rojo hover:text-rojo transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 mt-4 pt-4 border-t border-border/60">
          <div className="flex flex-wrap rounded-xl border border-border overflow-hidden">
            {FILTROS.map((f) => (
              <button
                key={f.clave}
                type="button"
                onClick={() => setFiltro(f.clave)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  filtro === f.clave
                    ? 'bg-rojo text-white'
                    : 'bg-white text-text-secondary hover:bg-surface-soft'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, correo o dirección…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-rojo"
            />
          </div>
        </div>
      </div>

      {/* Listado */}
      {cargando && solicitudes.length === 0 ? (
        <div className="space-y-2 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white border border-border" />
          ))}
        </div>
      ) : visibles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <Inbox size={28} className="text-text-muted mx-auto mb-3" />
          <p className="text-sm font-bold text-text-primary mb-1">
            {solicitudes.length === 0
              ? 'Todavía no llegan solicitudes'
              : 'Nada que mostrar con este filtro'}
          </p>
          <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
            {solicitudes.length === 0
              ? 'Cuando un emprendedor postule desde la página "Súmate a la plataforma", aparecerá aquí.'
              : 'Prueba con otro filtro o limpia la búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibles.map((s) => {
            const expandida = abierta === s.id;
            const esConsulta = s.tipo === 'CONSULTA';
            const trabajando = ocupada === s.id;

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-border shadow-2xs overflow-hidden"
              >
                {/* Cabecera plegable */}
                <button
                  type="button"
                  onClick={() => setAbierta(expandida ? null : s.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#FAF8F5] transition-colors"
                >
                  <span className="p-2 rounded-xl bg-surface-soft text-rojo shrink-0">
                    {TIPO_ICONO[s.tipo]}
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-text-primary truncate">
                        {s.nombre}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${ESTADO_CLS[s.estado]}`}
                      >
                        {ESTADO_LABEL[s.estado]}
                      </span>
                    </span>
                    <span className="block text-xs text-text-muted truncate mt-0.5">
                      {TIPO_LABEL[s.tipo]} · {s.solicitanteNombre} · {fechaLegible(s.createdAt)}
                    </span>
                  </span>

                  {s.fotos && s.fotos.length > 0 && (
                    <span className="text-[10px] font-bold text-text-muted bg-surface-soft border border-border px-2 py-0.5 rounded-full shrink-0 hidden sm:inline">
                      {s.fotos.length} {s.fotos.length === 1 ? 'foto' : 'fotos'}
                    </span>
                  )}

                  {expandida ? (
                    <ChevronUp size={16} className="text-text-muted shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-text-muted shrink-0" />
                  )}
                </button>

                {expandida && (
                  <div className="px-4 pb-4 border-t border-border/60 pt-4 space-y-4">
                    {/* Datos del solicitante */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <Mail size={13} className="text-text-muted shrink-0 mt-0.5" />
                        <a
                          href={`mailto:${s.solicitanteEmail}`}
                          className="text-cielo hover:underline break-all"
                        >
                          {s.solicitanteEmail}
                        </a>
                      </div>
                      {s.solicitanteTelefono && (
                        <div className="flex items-start gap-2">
                          <Phone size={13} className="text-text-muted shrink-0 mt-0.5" />
                          <span className="text-text-secondary">{s.solicitanteTelefono}</span>
                        </div>
                      )}
                      {s.solicitanteRol && (
                        <div className="flex items-start gap-2 sm:col-span-2">
                          <span className="text-text-muted">Relación con el lugar:</span>
                          <span className="text-text-secondary font-semibold">
                            {s.solicitanteRol}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contenido enviado */}
                    <div className="p-3.5 rounded-xl bg-surface-soft/60 border border-border/60 space-y-2.5">
                      {(esConsulta ? s.mensaje : s.descripcion) && (
                        <p className="text-xs text-text-primary leading-relaxed whitespace-pre-line">
                          {esConsulta ? s.mensaje : s.descripcion}
                        </p>
                      )}

                      {!esConsulta && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs pt-1">
                          {s.categoriaSugerida && (
                            <div>
                              <span className="text-text-muted">Tipo: </span>
                              <span className="text-text-secondary font-semibold">
                                {s.categoriaSugerida}
                              </span>
                            </div>
                          )}
                          {s.especialidad && (
                            <div>
                              <span className="text-text-muted">Especialidad: </span>
                              <span className="text-text-secondary font-semibold">
                                {s.especialidad}
                              </span>
                            </div>
                          )}
                          {s.fecha && (
                            <div>
                              <span className="text-text-muted">Cuándo: </span>
                              <span className="text-text-secondary font-semibold">{s.fecha}</span>
                            </div>
                          )}
                          {s.direccion && (
                            <div className="sm:col-span-2 flex items-start gap-1.5">
                              <MapPin size={12} className="text-text-muted shrink-0 mt-0.5" />
                              <span className="text-text-secondary">{s.direccion}</span>
                            </div>
                          )}
                          {s.coordenadas && (
                            <div className="sm:col-span-2">
                              <a
                                href={`https://www.google.com/maps?q=${s.coordenadas.lat},${s.coordenadas.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cielo hover:underline inline-flex items-center gap-1"
                              >
                                Ver punto en el mapa
                                <ExternalLink size={11} />
                              </a>
                            </div>
                          )}
                          {s.horario?.apertura && (
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-text-muted" />
                              <span className="text-text-secondary">
                                {s.horario.apertura} a {s.horario.cierre}
                              </span>
                            </div>
                          )}
                          {(s.servicios?.length ?? 0) > 0 && (
                            <div className="sm:col-span-2">
                              <span className="text-text-muted">Servicios: </span>
                              <span className="text-text-secondary">
                                {s.servicios!.join(', ')}
                              </span>
                            </div>
                          )}
                          {(s.mediosPago?.length ?? 0) > 0 && (
                            <div className="sm:col-span-2">
                              <span className="text-text-muted">Medios de pago: </span>
                              <span className="text-text-secondary">
                                {s.mediosPago!.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Contacto público del negocio */}
                      {(s.telefono || s.whatsapp || s.email || s.web || s.instagram || s.facebook) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs pt-1 border-t border-border/60">
                          {s.telefono && (
                            <span className="flex items-center gap-1 text-text-secondary">
                              <Phone size={11} className="text-text-muted" /> {s.telefono}
                            </span>
                          )}
                          {s.whatsapp && (
                            <span className="flex items-center gap-1 text-text-secondary">
                              WhatsApp: {s.whatsapp}
                            </span>
                          )}
                          {s.email && (
                            <span className="flex items-center gap-1 text-text-secondary">
                              <Mail size={11} className="text-text-muted" /> {s.email}
                            </span>
                          )}
                          {s.instagram && (
                            <span className="flex items-center gap-1 text-text-secondary">
                              <Instagram size={11} className="text-text-muted" /> {s.instagram}
                            </span>
                          )}
                          {s.facebook && (
                            <span className="flex items-center gap-1 text-text-secondary">
                              <Facebook size={11} className="text-text-muted" /> {s.facebook}
                            </span>
                          )}
                          {s.web && (
                            <span className="flex items-center gap-1 text-text-secondary">
                              <Globe size={11} className="text-text-muted" /> {s.web}
                            </span>
                          )}
                        </div>
                      )}

                      {esConsulta && s.mensaje && s.descripcion && (
                        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line pt-1 border-t border-border/60">
                          {s.descripcion}
                        </p>
                      )}
                      {!esConsulta && s.mensaje && (
                        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line pt-2 border-t border-border/60">
                          <span className="text-text-muted">Comentario: </span>
                          {s.mensaje}
                        </p>
                      )}
                    </div>

                    {/* Fotos adjuntas */}
                    {s.fotos && s.fotos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {s.fotos.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-24 h-24 rounded-xl overflow-hidden border border-border bg-surface-soft block hover:border-rojo transition-colors"
                          >
                            <img
                              src={url}
                              alt={`Foto de ${s.nombre}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Quién revisó */}
                    {s.revisadoPorNombre && s.revisadoEn && (
                      <p className="text-xs text-text-muted">
                        Última revisión: {s.revisadoPorNombre} · {fechaLegible(s.revisadoEn)}
                        {s.publicadoComoId && (
                          <>
                            {' '}
                            · Publicada como ficha{' '}
                            <strong className="text-text-secondary">{s.publicadoComoId}</strong>
                          </>
                        )}
                      </p>
                    )}

                    {/* Gestión */}
                    {canEdit ? (
                      <div className="space-y-2.5 pt-1">
                        <textarea
                          value={notas[s.id] ?? s.notaInterna ?? ''}
                          onChange={(e) => setNotas((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          rows={2}
                          placeholder="Nota interna para el equipo (no la ve el solicitante)"
                          className="w-full px-3 py-2 rounded-xl border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-rojo resize-y"
                        />

                        <div className="flex flex-wrap gap-2">
                          {s.estado !== 'EN_REVISION' && s.estado !== 'PUBLICADA' && (
                            <button
                              type="button"
                              onClick={() => actualizar(s.id, 'EN_REVISION')}
                              disabled={trabajando}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/60 text-amber-800 text-xs font-bold hover:bg-amber-100/70 transition-colors disabled:opacity-50"
                            >
                              <Eye size={13} />
                              En revisión
                            </button>
                          )}

                          {!esConsulta && s.estado !== 'PUBLICADA' && (
                            <button
                              type="button"
                              onClick={() => onCrearFicha(s)}
                              disabled={trabajando}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rojo hover:bg-rojo-dark text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                            >
                              <Sparkles size={13} />
                              Crear ficha con estos datos
                            </button>
                          )}

                          {s.estado !== 'APROBADA' && s.estado !== 'PUBLICADA' && (
                            <button
                              type="button"
                              onClick={() => actualizar(s.id, 'APROBADA')}
                              disabled={trabajando}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-sky-200 bg-sky-50/60 text-cielo text-xs font-bold hover:bg-sky-100/70 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 size={13} />
                              {esConsulta ? 'Marcar respondida' : 'Aprobar'}
                            </button>
                          )}

                          {s.estado !== 'RECHAZADA' && (
                            <button
                              type="button"
                              onClick={() => actualizar(s.id, 'RECHAZADA')}
                              disabled={trabajando}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-secondary text-xs font-bold hover:border-rojo hover:text-rojo transition-colors disabled:opacity-50"
                            >
                              <XCircle size={13} />
                              Descartar
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => borrar(s)}
                              disabled={trabajando}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-600 text-xs font-bold hover:bg-red-50 transition-colors ml-auto disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted">
                        Tu cuenta es de solo lectura: puedes revisar las solicitudes, pero no
                        cambiar su estado.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
