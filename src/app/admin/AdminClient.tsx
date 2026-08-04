'use client';

import React, { useState, useTransition } from 'react';
import { Destination, Accommodation, Restaurant } from '@/lib/types';
import { useToast } from '@/components/Toast';
import {
  saveDestination, deleteDestination,
  saveRestaurant, deleteRestaurant,
  saveAccommodation, deleteAccommodation
} from './actions';
import {
  Settings, LayoutDashboard, MapPin, UtensilsCrossed, BedDouble,
  Save, Plus, Pencil, Trash2, LogOut, X, ShieldCheck, Loader2, RefreshCw
} from 'lucide-react';

type AdminSection = 'dashboard' | 'destinos' | 'restaurantes' | 'alojamientos';

interface Props {
  initialDestinos: Destination[];
  initialRestaurantes: Restaurant[];
  initialAlojamientos: Accommodation[];
}

// ─── FORM FIELD ────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full p-2.5 rounded-lg border border-border focus:border-rojo outline-none text-sm transition-colors";
const textareaCls = `${inputCls} min-h-[80px] resize-y`;

export default function AdminClient({ initialDestinos, initialRestaurantes, initialAlojamientos }: Props) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

  const [destinos, setDestinos] = useState<Destination[]>(initialDestinos);
  const [restaurantes, setRestaurantes] = useState<Restaurant[]>(initialRestaurantes);
  const [alojamientos, setAlojamientos] = useState<Accommodation[]>(initialAlojamientos);

  // Modal state
  const [editingDest, setEditingDest] = useState<Partial<Destination> | null>(null);
  const [editingRest, setEditingRest] = useState<Partial<Restaurant> | null>(null);
  const [editingAcc, setEditingAcc] = useState<Partial<Accommodation> | null>(null);

  const closeModals = () => { setEditingDest(null); setEditingRest(null); setEditingAcc(null); };

  const handleLogin = () => {
    if (password.trim().length > 0) {
      setIsAuthenticated(true);
      setLoginError(false);
      showToast('Bienvenido al Panel de Administración', 'success');
    } else {
      setLoginError(true);
    }
  };

  // ─── DESTINOS ─────────────────────────────────────────────────────────────
  const emptyDest = (): Partial<Destination> => ({
    nombre: '', categoria: 'cultural', descripcionCorta: '', descripcionLarga: '', historia: '',
    coordenadas: { lat: -35.267, lng: -71.250 }, direccion: '', horario: '', precio: '',
    duracionVisita: '', comoLlegar: '', tags: [], destacado: false, imagenPrincipal: '', galeria: [],
  });

  const handleSaveDest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDest?.nombre) return;
    startTransition(async () => {
      try {
        const saved = await saveDestination(password, editingDest);
        setDestinos(prev => {
          const idx = prev.findIndex(d => d.id === saved.id);
          const updated = { ...saved, coordenadas: saved.coordenadas as any } as Destination;
          return idx >= 0 ? prev.map(d => d.id === saved.id ? updated : d) : [...prev, updated];
        });
        showToast(`"${saved.nombre}" guardado en Supabase`, 'success');
        closeModals();
      } catch (err: any) {
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  const handleDeleteDest = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    startTransition(async () => {
      try {
        await deleteDestination(password, id);
        setDestinos(prev => prev.filter(d => d.id !== id));
        showToast('Destino eliminado', 'info');
      } catch (err: any) {
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  // ─── RESTAURANTES ─────────────────────────────────────────────────────────
  const emptyRest = (): Partial<Restaurant> => ({
    nombre: '', descripcion: '', coordenadas: { lat: -35.267, lng: -71.250 },
    direccion: '', precio: { rango: '$$', promedioPersona: 0 }, imagenPrincipal: '', horario: {}, contacto: {}
  });

  const handleSaveRest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRest?.nombre) return;
    startTransition(async () => {
      try {
        const saved = await saveRestaurant(password, editingRest);
        setRestaurantes(prev => {
          const idx = prev.findIndex(r => r.id === saved.id);
          const updated = { ...saved, coordenadas: saved.coordenadas as any, horario: saved.horario as any, precio: saved.precio as any, contacto: saved.contacto as any } as Restaurant;
          return idx >= 0 ? prev.map(r => r.id === saved.id ? updated : r) : [...prev, updated];
        });
        showToast(`"${saved.nombre}" guardado en Supabase`, 'success');
        closeModals();
      } catch (err: any) {
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  const handleDeleteRest = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    startTransition(async () => {
      try {
        await deleteRestaurant(password, id);
        setRestaurantes(prev => prev.filter(r => r.id !== id));
        showToast('Restaurante eliminado', 'info');
      } catch (err: any) {
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  // ─── ALOJAMIENTOS ─────────────────────────────────────────────────────────
  const emptyAcc = (): Partial<Accommodation> => ({
    nombre: '', descripcion: '', coordenadas: { lat: -35.267, lng: -71.250 },
    direccion: '', precio: { min: 0, max: 0, moneda: 'CLP' }, servicios: [], imagenPrincipal: '', contacto: {}
  });

  const handleSaveAcc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAcc?.nombre) return;
    startTransition(async () => {
      try {
        const saved = await saveAccommodation(password, editingAcc);
        setAlojamientos(prev => {
          const idx = prev.findIndex(a => a.id === saved.id);
          const updated = { ...saved, coordenadas: saved.coordenadas as any, precio: saved.precio as any, contacto: saved.contacto as any } as Accommodation;
          return idx >= 0 ? prev.map(a => a.id === saved.id ? updated : a) : [...prev, updated];
        });
        showToast(`"${saved.nombre}" guardado en Supabase`, 'success');
        closeModals();
      } catch (err: any) {
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  const handleDeleteAcc = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    startTransition(async () => {
      try {
        await deleteAccommodation(password, id);
        setAlojamientos(prev => prev.filter(a => a.id !== id));
        showToast('Alojamiento eliminado', 'info');
      } catch (err: any) {
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-border w-full max-w-[380px] text-center">
          <img src="/assets/images/condorito-oficial.png" alt="Logo" className="w-16 h-16 mx-auto mb-4 rounded-full" />
          <h1 className="font-display font-black text-2xl mb-1 text-text-primary">Panel Admin</h1>
          <p className="text-text-muted text-sm mb-6">CMS · Supabase PostgreSQL</p>

          <div className="text-left mb-4">
            <label className="block text-xs font-bold mb-1.5 text-text-secondary uppercase tracking-wide">Contraseña de administración</label>
            <input
              type="password"
              className={inputCls}
              placeholder="Ingresa la contraseña…"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <button
            className="w-full flex gap-2 items-center justify-center bg-rojo text-white py-3 rounded-xl font-bold shadow-rojo hover:bg-rojo-dark transition-all"
            onClick={handleLogin}
          >
            <ShieldCheck size={18} /> Ingresar
          </button>

          {loginError && (
            <p className="text-rojo text-sm mt-3">Contraseña incorrecta. Intenta nuevamente.</p>
          )}
        </div>
      </div>
    );
  }

  const navTabs: { id: AdminSection; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} />, count: 0 },
    { id: 'destinos', label: 'Destinos', icon: <MapPin size={15} />, count: destinos.length },
    { id: 'restaurantes', label: 'Restaurantes', icon: <UtensilsCrossed size={15} />, count: restaurantes.length },
    { id: 'alojamientos', label: 'Alojamientos', icon: <BedDouble size={15} />, count: alojamientos.length },
  ];

  return (
    <div className="max-w-[1100px] mx-auto p-4 md:p-6 pb-24">

      {/* Header */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-black text-2xl flex items-center gap-2 text-text-primary">
            <Settings size={26} /> CMS · Cumpeo Turismo
          </h1>
          <p className="text-sm text-text-muted">Gestión de contenidos turísticos via Supabase</p>
        </div>
        <button
          className="flex items-center gap-1.5 px-4 py-2 border-2 border-border rounded-full text-sm font-bold text-text-secondary hover:text-rojo hover:border-rojo transition-all"
          onClick={() => setIsAuthenticated(false)}
        >
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all border ${
              activeSection === tab.id
                ? 'bg-rojo text-white border-rojo shadow-rojo'
                : 'bg-white text-text-secondary border-border hover:border-rojo hover:text-rojo'
            }`}
            onClick={() => setActiveSection(tab.id)}
          >
            {tab.icon} {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] font-extrabold rounded-full px-1.5 py-0.5 ${activeSection === tab.id ? 'bg-white/30' : 'bg-surface-soft text-text-muted'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white p-5 rounded-2xl shadow-xl flex items-center gap-3">
            <Loader2 size={22} className="animate-spin text-rojo" />
            <span className="font-bold text-text-primary">Guardando en Supabase…</span>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Destinos', value: destinos.length, icon: <MapPin size={28} />, color: 'text-sol', bg: 'bg-[#FFF3C4]' },
              { label: 'Restaurantes', value: restaurantes.length, icon: <UtensilsCrossed size={28} />, color: 'text-rojo', bg: 'bg-[#FFE0E2]' },
              { label: 'Alojamientos', value: alojamientos.length, icon: <BedDouble size={28} />, color: 'text-cielo', bg: 'bg-[#E0F2FE]' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                <div className={`${stat.bg} ${stat.color} p-4 rounded-xl`}>{stat.icon}</div>
                <div>
                  <div className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs font-bold text-text-muted uppercase tracking-wide mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
            <h3 className="font-bold text-text-primary mb-1">Estado de la Base de Datos</h3>
            <p className="text-sm text-text-muted">
              Conectado a <span className="font-bold text-verde">Supabase PostgreSQL</span> (São Paulo).
              Todos los cambios se guardan en tiempo real y se reflejan en el sitio inmediatamente.
            </p>
          </div>
        </div>
      )}

      {/* TABLA REUTILIZABLE */}
      {activeSection !== 'dashboard' && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Panel header */}
          <div className="flex justify-between items-center p-5 border-b border-border">
            <h3 className="font-display font-bold text-lg text-text-primary">
              {activeSection === 'destinos' && `Destinos Turísticos (${destinos.length})`}
              {activeSection === 'restaurantes' && `Restaurantes (${restaurantes.length})`}
              {activeSection === 'alojamientos' && `Alojamientos (${alojamientos.length})`}
            </h3>
            <button
              className="flex items-center gap-1.5 bg-rojo text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-rojo-dark transition-all shadow-rojo"
              onClick={() => {
                if (activeSection === 'destinos') setEditingDest(emptyDest());
                if (activeSection === 'restaurantes') setEditingRest(emptyRest());
                if (activeSection === 'alojamientos') setEditingAcc(emptyAcc());
              }}
            >
              <Plus size={15} /> Nuevo
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-soft text-text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-bold">Nombre</th>
                  {activeSection === 'destinos' && <th className="px-5 py-3 text-left font-bold">Categoría</th>}
                  {activeSection === 'destinos' && <th className="px-5 py-3 text-left font-bold">Precio</th>}
                  {activeSection === 'destinos' && <th className="px-5 py-3 text-left font-bold">Destacado</th>}
                  {activeSection !== 'destinos' && <th className="px-5 py-3 text-left font-bold">Dirección</th>}
                  <th className="px-5 py-3 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activeSection === 'destinos' && destinos.map((d) => (
                  <tr key={d.id} className="border-t border-border hover:bg-surface-soft/50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-text-primary">{d.nombre}</td>
                    <td className="px-5 py-3 capitalize text-text-secondary">{d.categoria}</td>
                    <td className="px-5 py-3 text-text-secondary">{d.precio || 'Gratuito'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${d.destacado ? 'bg-[#FFF3C4] text-[#B47900]' : 'bg-surface-soft text-text-muted'}`}>
                        {d.destacado ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditingDest(d)} className="p-2 text-cielo hover:bg-[#E0F2FE] rounded-lg transition-colors" title="Editar"><Pencil size={15} /></button>
                        <button onClick={() => handleDeleteDest(d.id, d.nombre)} className="p-2 text-rojo hover:bg-[#FFE0E2] rounded-lg transition-colors" title="Eliminar"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeSection === 'restaurantes' && restaurantes.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-surface-soft/50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-text-primary">{r.nombre}</td>
                    <td className="px-5 py-3 text-text-secondary text-xs">{r.direccion || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditingRest(r)} className="p-2 text-cielo hover:bg-[#E0F2FE] rounded-lg transition-colors" title="Editar"><Pencil size={15} /></button>
                        <button onClick={() => handleDeleteRest(r.id, r.nombre)} className="p-2 text-rojo hover:bg-[#FFE0E2] rounded-lg transition-colors" title="Eliminar"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeSection === 'alojamientos' && alojamientos.map((a) => (
                  <tr key={a.id} className="border-t border-border hover:bg-surface-soft/50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-text-primary">{a.nombre}</td>
                    <td className="px-5 py-3 text-text-secondary text-xs">{a.direccion || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditingAcc(a)} className="p-2 text-cielo hover:bg-[#E0F2FE] rounded-lg transition-colors" title="Editar"><Pencil size={15} /></button>
                        <button onClick={() => handleDeleteAcc(a.id, a.nombre)} className="p-2 text-rojo hover:bg-[#FFE0E2] rounded-lg transition-colors" title="Eliminar"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL DESTINO ─────────────────────────────────────────────────────── */}
      {editingDest && (
        <Modal title={editingDest.id ? 'Editar Destino' : 'Nuevo Destino'} onClose={closeModals}>
          <form onSubmit={handleSaveDest} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nombre *">
                <input required className={inputCls} value={editingDest.nombre || ''} onChange={e => setEditingDest({ ...editingDest, nombre: e.target.value })} />
              </Field>
              <Field label="Categoría *">
                <select className={inputCls} value={editingDest.categoria} onChange={e => setEditingDest({ ...editingDest, categoria: e.target.value as any })}>
                  <option value="cultural">Cultural</option>
                  <option value="historico">Histórico</option>
                  <option value="naturaleza">Naturaleza</option>
                  <option value="gastronomia">Gastronomía</option>
                  <option value="patrimonio">Patrimonio</option>
                  <option value="entretencion">Entretención</option>
                </select>
              </Field>
            </div>

            <Field label="Descripción Corta *">
              <textarea required className={textareaCls} value={editingDest.descripcionCorta || ''} onChange={e => setEditingDest({ ...editingDest, descripcionCorta: e.target.value })} />
            </Field>

            <Field label="Descripción Larga">
              <textarea className={textareaCls} style={{ minHeight: '120px' }} value={editingDest.descripcionLarga || ''} onChange={e => setEditingDest({ ...editingDest, descripcionLarga: e.target.value })} />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Dirección">
                <input className={inputCls} value={editingDest.direccion || ''} onChange={e => setEditingDest({ ...editingDest, direccion: e.target.value })} />
              </Field>
              <Field label="Horario">
                <input className={inputCls} placeholder="Ej: Lun-Dom 9:00 - 18:00" value={editingDest.horario || ''} onChange={e => setEditingDest({ ...editingDest, horario: e.target.value })} />
              </Field>
              <Field label="Precio">
                <input className={inputCls} placeholder="Ej: Gratuito o $2.000" value={editingDest.precio || ''} onChange={e => setEditingDest({ ...editingDest, precio: e.target.value })} />
              </Field>
              <Field label="Duración Sugerida">
                <input className={inputCls} placeholder="Ej: 45 minutos" value={editingDest.duracionVisita || ''} onChange={e => setEditingDest({ ...editingDest, duracionVisita: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitud">
                <input type="number" step="0.000001" className={inputCls} value={editingDest.coordenadas?.lat ?? -35.267} onChange={e => setEditingDest({ ...editingDest, coordenadas: { ...editingDest.coordenadas!, lat: parseFloat(e.target.value) } })} />
              </Field>
              <Field label="Longitud">
                <input type="number" step="0.000001" className={inputCls} value={editingDest.coordenadas?.lng ?? -71.250} onChange={e => setEditingDest({ ...editingDest, coordenadas: { ...editingDest.coordenadas!, lng: parseFloat(e.target.value) } })} />
              </Field>
            </div>

            <Field label="URL Imagen Principal">
              <input className={inputCls} placeholder="/assets/images/..." value={editingDest.imagenPrincipal || ''} onChange={e => setEditingDest({ ...editingDest, imagenPrincipal: e.target.value })} />
            </Field>

            <Field label="Tags (separados por coma)">
              <input className={inputCls} placeholder="Ej: historia, arte, familia" value={(editingDest.tags || []).join(', ')} onChange={e => setEditingDest({ ...editingDest, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} />
            </Field>

            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" id="destacado" className="w-4 h-4 accent-rojo" checked={editingDest.destacado || false} onChange={e => setEditingDest({ ...editingDest, destacado: e.target.checked })} />
              <label htmlFor="destacado" className="text-sm font-semibold text-text-primary cursor-pointer">Marcar como Destacado</label>
            </div>

            <ModalActions onClose={closeModals} isPending={isPending} />
          </form>
        </Modal>
      )}

      {/* ─── MODAL RESTAURANTE ─────────────────────────────────────────────────── */}
      {editingRest && (
        <Modal title={editingRest.id ? 'Editar Restaurante' : 'Nuevo Restaurante'} onClose={closeModals}>
          <form onSubmit={handleSaveRest} className="flex flex-col gap-4">
            <Field label="Nombre *">
              <input required className={inputCls} value={editingRest.nombre || ''} onChange={e => setEditingRest({ ...editingRest, nombre: e.target.value })} />
            </Field>

            <Field label="Descripción *">
              <textarea required className={textareaCls} value={editingRest.descripcion || ''} onChange={e => setEditingRest({ ...editingRest, descripcion: e.target.value })} />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Dirección">
                <input className={inputCls} value={editingRest.direccion || ''} onChange={e => setEditingRest({ ...editingRest, direccion: e.target.value })} />
              </Field>
              <Field label="Especialidad">
                <input className={inputCls} value={editingRest.especialidad || ''} onChange={e => setEditingRest({ ...editingRest, especialidad: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitud">
                <input type="number" step="0.000001" className={inputCls} value={editingRest.coordenadas?.lat ?? -35.267} onChange={e => setEditingRest({ ...editingRest, coordenadas: { ...editingRest.coordenadas!, lat: parseFloat(e.target.value) } })} />
              </Field>
              <Field label="Longitud">
                <input type="number" step="0.000001" className={inputCls} value={editingRest.coordenadas?.lng ?? -71.250} onChange={e => setEditingRest({ ...editingRest, coordenadas: { ...editingRest.coordenadas!, lng: parseFloat(e.target.value) } })} />
              </Field>
            </div>

            <Field label="URL Imagen Principal">
              <input className={inputCls} placeholder="/assets/images/..." value={editingRest.imagenPrincipal || ''} onChange={e => setEditingRest({ ...editingRest, imagenPrincipal: e.target.value })} />
            </Field>

            <ModalActions onClose={closeModals} isPending={isPending} />
          </form>
        </Modal>
      )}

      {/* ─── MODAL ALOJAMIENTO ─────────────────────────────────────────────────── */}
      {editingAcc && (
        <Modal title={editingAcc.id ? 'Editar Alojamiento' : 'Nuevo Alojamiento'} onClose={closeModals}>
          <form onSubmit={handleSaveAcc} className="flex flex-col gap-4">
            <Field label="Nombre *">
              <input required className={inputCls} value={editingAcc.nombre || ''} onChange={e => setEditingAcc({ ...editingAcc, nombre: e.target.value })} />
            </Field>

            <Field label="Descripción *">
              <textarea required className={textareaCls} value={editingAcc.descripcion || ''} onChange={e => setEditingAcc({ ...editingAcc, descripcion: e.target.value })} />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Dirección">
                <input className={inputCls} value={editingAcc.direccion || ''} onChange={e => setEditingAcc({ ...editingAcc, direccion: e.target.value })} />
              </Field>
              <Field label="Servicios (separados por coma)">
                <input className={inputCls} placeholder="WiFi, Estacionamiento, ..." value={(editingAcc.servicios || []).join(', ')} onChange={e => setEditingAcc({ ...editingAcc, servicios: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitud">
                <input type="number" step="0.000001" className={inputCls} value={editingAcc.coordenadas?.lat ?? -35.267} onChange={e => setEditingAcc({ ...editingAcc, coordenadas: { ...editingAcc.coordenadas!, lat: parseFloat(e.target.value) } })} />
              </Field>
              <Field label="Longitud">
                <input type="number" step="0.000001" className={inputCls} value={editingAcc.coordenadas?.lng ?? -71.250} onChange={e => setEditingAcc({ ...editingAcc, coordenadas: { ...editingAcc.coordenadas!, lng: parseFloat(e.target.value) } })} />
              </Field>
            </div>

            <Field label="Precio Desde (CLP)">
              <input type="number" className={inputCls} placeholder="25000" value={(editingAcc.precio as any)?.min || ''} onChange={e => setEditingAcc({ ...editingAcc, precio: { ...(editingAcc.precio as any), min: parseInt(e.target.value) } as any })} />
            </Field>

            <Field label="URL Imagen Principal">
              <input className={inputCls} placeholder="/assets/images/..." value={editingAcc.imagenPrincipal || ''} onChange={e => setEditingAcc({ ...editingAcc, imagenPrincipal: e.target.value })} />
            </Field>

            <ModalActions onClose={closeModals} isPending={isPending} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── MODAL WRAPPER ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-[640px] rounded-2xl shadow-2xl my-8">
        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <h2 className="font-display font-bold text-xl text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-rojo transition-colors p-1">
            <X size={22} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── MODAL ACTIONS ─────────────────────────────────────────────────────────────
function ModalActions({ onClose, isPending }: { onClose: () => void; isPending: boolean }) {
  return (
    <div className="flex gap-3 pt-4 border-t border-border">
      <button
        type="submit"
        disabled={isPending}
        className="flex-1 flex items-center justify-center gap-2 bg-rojo text-white py-2.5 rounded-xl font-bold shadow-rojo hover:bg-rojo-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
        {isPending ? 'Guardando…' : 'Guardar en Supabase'}
      </button>
      <button
        type="button"
        disabled={isPending}
        className="px-6 py-2.5 rounded-xl border-2 border-border font-bold text-text-secondary hover:bg-surface-soft transition-all disabled:opacity-50"
        onClick={onClose}
      >
        Cancelar
      </button>
    </div>
  );
}
