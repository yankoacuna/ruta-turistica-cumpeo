'use client';

import React, { useState, useEffect } from 'react';
import { getDestinations, getAccommodations, getRestaurants, getConfig } from '@/lib/data';
import { Destination, Accommodation, Restaurant, AppConfig } from '@/lib/types';
import { useToast } from '@/components/Toast';

export default function AdminPage() {
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [activeSection, setActiveSection] = useState<'dashboard' | 'destinos' | 'restaurantes' | 'alojamientos' | 'config'>('dashboard');

  const [destinos, setDestinos] = useState<Destination[]>([]);
  const [restaurantes, setRestaurantes] = useState<Restaurant[]>([]);
  const [alojamientos, setAlojamientos] = useState<Accommodation[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);

  // Modal State for Destinations
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDest, setEditingDest] = useState<Partial<Destination> | null>(null);

  const handleLogin = () => {
    if (password === 'cumpeo2024') {
      setIsAuthenticated(true);
      setLoginError(false);
      showToast('Bienvenido al Panel de Administración', 'success');
    } else {
      setLoginError(true);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllAdminData();
    }
  }, [isAuthenticated]);

  async function loadAllAdminData() {
    try {
      const [d, r, a, c] = await Promise.all([
        getDestinations(),
        getRestaurants(),
        getAccommodations(),
        getConfig(),
      ]);
      setDestinos(d);
      setRestaurantes(r);
      setAlojamientos(a);
      setConfig(c);
    } catch (err) {
      console.error('Error cargando datos admin:', err);
    }
  }

  const saveToServer = async (type: string, data: any) => {
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, token: 'cumpeo2024' }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al guardar');
      showToast('✅ Cambios guardados correctamente en el servidor', 'success');
      return true;
    } catch (err: any) {
      showToast(`Error al guardar: ${err.message}`, 'error');
      return false;
    }
  };

  const handleOpenDestModal = (dest?: Destination) => {
    if (dest) {
      setEditingDest(dest);
    } else {
      setEditingDest({
        nombre: '',
        categoria: 'cultural',
        descripcionCorta: '',
        descripcionLarga: '',
        historia: '',
        coordenadas: { lat: -35.267, lng: -71.250 },
        direccion: '',
        horario: '',
        precio: '',
        duracionVisita: '',
        comoLlegar: '',
        tags: [],
        destacado: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveDestino = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDest || !editingDest.nombre) return;

    const slug = editingDest.slug || editingDest.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const updatedItem: Destination = {
      id: editingDest.id || slug,
      slug,
      nombre: editingDest.nombre || '',
      categoria: (editingDest.categoria as any) || 'cultural',
      descripcionCorta: editingDest.descripcionCorta || '',
      descripcionLarga: editingDest.descripcionLarga || '',
      historia: editingDest.historia || '',
      coordenadas: {
        lat: Number(editingDest.coordenadas?.lat) || -35.267,
        lng: Number(editingDest.coordenadas?.lng) || -71.250,
      },
      direccion: editingDest.direccion || '',
      horario: editingDest.horario || '',
      precio: editingDest.precio || '',
      duracionVisita: editingDest.duracionVisita || '',
      comoLlegar: editingDest.comoLlegar || '',
      tags: editingDest.tags || [],
      destacado: Boolean(editingDest.destacado),
    };

    let newDestinos: Destination[];
    if (editingDest.id) {
      newDestinos = destinos.map((d) => (d.id === editingDest.id ? updatedItem : d));
    } else {
      newDestinos = [...destinos, updatedItem];
    }

    setDestinos(newDestinos);
    await saveToServer('destinations', { destinos: newDestinos });
    setIsModalOpen(false);
  };

  const handleDeleteDestino = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este destino?')) return;
    const newDestinos = destinos.filter((d) => d.id !== id);
    setDestinos(newDestinos);
    await saveToServer('destinations', { destinos: newDestinos });
    showToast('Destino eliminado', 'info');
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card p-8" style={{ width: '100%', maxWidth: '380px', textAlign: 'center' }}>
          <div className="condorito-avatar-badge" style={{ width: '64px', height: '64px', margin: '0 auto 16px auto' }}>
            <img src="/assets/images/condorito-oficial.png" alt="Condorito Logo" />
          </div>
          <h1 className="h2 mb-2">Panel Admin</h1>
          <p className="text-muted text-sm mb-6">Cumpeo Turismo — Pueblo de Condorito</p>

          <div className="form-group mb-4" style={{ textAlign: 'left' }}>
            <label className="form-label mb-1" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>
              Contraseña de Administración
            </label>
            <input
              type="password"
              className="form-input"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
              placeholder="Ingresa la contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <button className="btn btn-primary btn-block btn-lg" style={{ width: '100%' }} onClick={handleLogin}>
            Ingresar
          </button>

          {loginError && (
            <div style={{ color: 'var(--color-rojo)', fontSize: '0.85rem', marginTop: '12px' }}>
              Contraseña incorrecta. Intenta con `cumpeo2024`.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="h2">⚙️ Panel de Administración</h1>
          <p className="text-sm text-muted">Gestión de contenidos y base de datos turística de Cumpeo</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setIsAuthenticated(false)}>
          Cerrar Sesión
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'destinos', label: '🎯 Destinos' },
          { id: 'restaurantes', label: '🍽️ Restaurantes' },
          { id: 'alojamientos', label: '🛏️ Alojamientos' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`btn ${activeSection === tab.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveSection(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD SECTION */}
      {activeSection === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="card p-6" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-sol)' }}>{destinos.length}</div>
            <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Destinos Turísticos
            </div>
          </div>
          <div className="card p-6" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-rojo)' }}>{restaurantes.length}</div>
            <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Restaurantes
            </div>
          </div>
          <div className="card p-6" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-cielo)' }}>{alojamientos.length}</div>
            <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Alojamientos
            </div>
          </div>
        </div>
      )}

      {/* DESTINOS SECTION */}
      {activeSection === 'destinos' && (
        <div className="card p-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="h3">Destinos Turísticos registrados</h3>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenDestModal()}>
              + Agregar Destino
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Nombre</th>
                  <th style={{ padding: '12px' }}>Categoría</th>
                  <th style={{ padding: '12px' }}>Precio</th>
                  <th style={{ padding: '12px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {destinos.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{d.nombre}</td>
                    <td style={{ padding: '12px' }}>{d.categoria}</td>
                    <td style={{ padding: '12px' }}>{d.precio || 'Gratuito'}</td>
                    <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenDestModal(d)}>
                        Editar
                      </button>
                      <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--color-rojo)', color: 'var(--color-rojo)' }} onClick={() => handleDeleteDestino(d.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESTAURANTES SECTION */}
      {activeSection === 'restaurantes' && (
        <div className="card p-6">
          <h3 className="h3 mb-4">🍽️ Gastronomía y Locales</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Nombre</th>
                <th style={{ padding: '12px' }}>Dirección</th>
              </tr>
            </thead>
            <tbody>
              {restaurantes.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{r.nombre}</td>
                  <td style={{ padding: '12px' }}>{r.direccion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ALOJAMIENTOS SECTION */}
      {activeSection === 'alojamientos' && (
        <div className="card p-6">
          <h3 className="h3 mb-4">🛏️ Alojamientos</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Nombre</th>
                <th style={{ padding: '12px' }}>Dirección</th>
              </tr>
            </thead>
            <tbody>
              {alojamientos.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{a.nombre}</td>
                  <td style={{ padding: '12px' }}>{a.direccion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL EDIT DESTINO */}
      {isModalOpen && editingDest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="card p-6" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="h2 mb-4">{editingDest.id ? 'Editar Destino' : 'Nuevo Destino'}</h2>
            <form onSubmit={handleSaveDestino} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Nombre *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                  value={editingDest.nombre || ''}
                  onChange={(e) => setEditingDest({ ...editingDest, nombre: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Categoría *</label>
                <select
                  className="form-select"
                  style={{ width: '100%', padding: '8px 12px' }}
                  value={editingDest.categoria || 'cultural'}
                  onChange={(e) => setEditingDest({ ...editingDest, categoria: e.target.value as any })}
                >
                  <option value="cultural">🎨 Cultural</option>
                  <option value="historico">🏛️ Histórico</option>
                  <option value="naturaleza">🌿 Naturaleza</option>
                  <option value="gastronomia">🍽️ Gastronomía</option>
                  <option value="patrimonio">🏺 Patrimonio</option>
                  <option value="entretencion">🎉 Entretención</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Descripción corta *</label>
                <textarea
                  required
                  className="form-textarea"
                  style={{ width: '100%', padding: '8px 12px', minHeight: '60px' }}
                  value={editingDest.descripcionCorta || ''}
                  onChange={(e) => setEditingDest({ ...editingDest, descripcionCorta: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Latitud</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px' }}
                    value={editingDest.coordenadas?.lat || -35.267}
                    onChange={(e) =>
                      setEditingDest({
                        ...editingDest,
                        coordenadas: { lat: parseFloat(e.target.value), lng: editingDest.coordenadas?.lng || -71.25 },
                      })
                    }
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Longitud</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px' }}
                    value={editingDest.coordenadas?.lng || -71.25}
                    onChange={(e) =>
                      setEditingDest({
                        ...editingDest,
                        coordenadas: { lat: editingDest.coordenadas?.lat || -35.267, lng: parseFloat(e.target.value) },
                      })
                    }
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary flex-1">
                  💾 Guardar
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
