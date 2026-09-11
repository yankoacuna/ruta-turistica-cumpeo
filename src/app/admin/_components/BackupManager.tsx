'use client';

import React, { useState } from 'react';
import { Destination, Restaurant, Accommodation, CumpeoEvent, TourRoute } from '@/lib/types';
import { exportDatabaseBackup, restoreDatabaseBackup } from '../actions';
import {
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Server,
  FileUp,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { UserRole } from '@/lib/types';
import { BulkImportWizard } from './BulkImportWizard';
import { exportDatasetToXLSX } from '@/lib/bulkValidator';

interface BackupManagerProps {
  destinos: Destination[];
  restaurantes: Restaurant[];
  alojamientos: Accommodation[];
  eventos?: CumpeoEvent[];
  rutas?: TourRoute[];
  token?: string;
  userRole?: UserRole;
}

export function BackupManager({
  destinos,
  restaurantes,
  alojamientos,
  eventos = [],
  rutas = [],
  userRole = 'ADMIN',
}: BackupManagerProps) {
  const isAdmin = userRole === 'ADMIN';
  const { showToast } = useToast();

  // Pestaña activa principal: 'bulk' (Carga masiva / Excel) vs 'tech' (Respaldo del sistema)
  const [activeTab, setActiveTab] = useState<'bulk' | 'tech'>('bulk');

  // Estados de exportación / restauración técnica
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  // Modal y diagnóstico de respaldo técnico previo a restaurar
  const [pendingBackupData, setPendingBackupData] = useState<any | null>(null);
  const [confirmKeyword, setConfirmKeyword] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // ── Export Full JSON Snapshot ──────────────────────────────────────────────
  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const backup = await exportDatabaseBackup();

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `backup-cumpeo-turismo-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Copia de seguridad JSON descargada correctamente', 'success');
    } catch (err: any) {
      showToast(`Error al exportar copia de seguridad: ${err.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Pre-Lectura y Diagnóstico de Snapshot JSON ─────────────────────────────
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        if (!json.data || (!json.data.destinations && !json.data.restaurants)) {
          throw new Error('El archivo no tiene la estructura de respaldo válida de Turismo Cumpeo.');
        }

        setPendingBackupData(json);
        setConfirmKeyword('');
        setShowRestoreModal(true);
      } catch (err: any) {
        showToast(`Error al leer archivo: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    // Limpiar input para permitir re-seleccionar el mismo archivo si se desea
    e.target.value = '';
  };

  // ── Confirmar y Ejecutar Restauración en base de datos ─────────────────────────
  const handleExecuteRestore = async () => {
    if (!pendingBackupData) return;

    try {
      setIsRestoring(true);
      setRestoreStatus('Aplicando datos en la base de datos...');
      await restoreDatabaseBackup(pendingBackupData);

      showToast('¡Copia de seguridad restaurada con éxito!', 'success');
      setRestoreStatus('Restauración completada. Recarga la página para ver los cambios actualizados.');
      setShowRestoreModal(false);
      setPendingBackupData(null);
    } catch (err: any) {
      showToast(`Error en la restauración: ${err.message}`, 'error');
      setRestoreStatus(`Error: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Encabezado Principal y Pestañas de Modo ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#FFE0E2] text-rojo">
                <Database size={22} />
              </span>
              <h2 className="font-display font-bold text-xl text-text-primary">
                Gestión de Datos, Carga Masiva y Respaldos
              </h2>
            </div>
            <p className="text-xs text-text-secondary mt-1.5 max-w-2xl leading-relaxed">
              Importa o exporta planillas en Excel (.xlsx) con validación automática antes de guardar,
              descarga plantillas oficiales o genera respaldos técnicos del sistema completo.
            </p>
          </div>
        </div>

        {/* ── Sub-Pestañas de Navegación ─────────────────────────────────────── */}
        {isAdmin && (
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'bulk'
                  ? 'bg-rojo text-white shadow-rojo'
                  : 'bg-surface-soft text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <FileSpreadsheet size={15} />
              <span>Carga Masiva e Importación / Exportación (Excel & JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tech')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tech'
                  ? 'bg-rojo text-white shadow-rojo'
                  : 'bg-surface-soft text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <Server size={15} />
              <span>Respaldo Técnico del Sistema (Snapshot)</span>
            </button>
          </div>
        )}
      </div>

      {/* ── MODO 1: Carga Masiva e Importación / Exportación ─────────────────── */}
      {(activeTab === 'bulk' || !isAdmin) && (
        <BulkImportWizard
          destinos={destinos}
          restaurantes={restaurantes}
          alojamientos={alojamientos}
          eventos={eventos}
          onSuccess={() => {
            // Callback opcional de refresco
          }}
        />
      )}

      {/* ── MODO 2: Respaldo Técnico del Sistema (Snapshot) ──────────── */}
      {activeTab === 'tech' && isAdmin && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tarjeta Izquierda: Exportar Snapshot */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-2 mb-2">
                  <Download size={18} className="text-rojo" />
                  1. Exportar Snapshot Completo de la Base de Datos
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Genera una copia de seguridad técnica estructurada en JSON que incluye todas las tablas:
                  atractivos turísticos, restaurantes, hospedajes, eventos, rutas turísticas, contactos de emergencia y configuraciones del portal.
                </p>

                {/* Resumen de contenido actual en BD */}
                <div className="grid grid-cols-4 gap-2 bg-surface-soft p-3.5 rounded-xl border border-border mb-4 text-center">
                  <div>
                    <div className="font-extrabold text-base text-text-primary">{destinos.length}</div>
                    <div className="text-[10px] text-text-muted font-bold uppercase">Destinos</div>
                  </div>
                  <div>
                    <div className="font-extrabold text-base text-text-primary">{restaurantes.length}</div>
                    <div className="text-[10px] text-text-muted font-bold uppercase">Restaurantes</div>
                  </div>
                  <div>
                    <div className="font-extrabold text-base text-text-primary">{alojamientos.length}</div>
                    <div className="text-[10px] text-text-muted font-bold uppercase">Alojamientos</div>
                  </div>
                  <div>
                    <div className="font-extrabold text-base text-text-primary">{rutas.length}</div>
                    <div className="text-[10px] text-text-muted font-bold uppercase">Rutas</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleExportJSON}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rojo text-white font-bold text-xs shadow-rojo hover:bg-rojo-dark transition-all disabled:opacity-50"
                >
                  {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileJson size={16} />}
                  <span>{isExporting ? 'Generando backup...' : 'Descargar Snapshot Completo (.JSON)'}</span>
                </button>
              </div>
            </div>

            {/* Tarjeta Derecha: Restaurar Snapshot con Diagnóstico */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-2 mb-2">
                  <Upload size={18} className="text-sol-dark" />
                  2. Restaurar Snapshot con Inspección Previa
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Carga un archivo de respaldo JSON generado previamente. El sistema auditará la estructura y
                  te mostrará un desglose detallado para confirmar antes de aplicar cambios en la base de datos.
                </p>

                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 flex gap-2.5 items-start mb-4">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Atención:</strong> La restauración actualizará o creará los registros contenidos en el archivo sin eliminar registros adicionales existentes.
                  </div>
                </div>
              </div>

              <div>
                <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl hover:border-rojo bg-surface-soft/60 cursor-pointer transition-all">
                  <FileUp size={24} className="text-text-muted mb-2" />
                  <span className="text-xs font-bold text-text-primary mb-0.5">
                    {isRestoring ? 'Restaurando archivo...' : 'Seleccionar archivo .json para inspeccionar'}
                  </span>
                  <span className="text-[11px] text-text-muted">El sistema validará su contenido antes de aplicar</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileRestore}
                    disabled={isRestoring}
                  />
                </label>

                {restoreStatus && (
                  <div className="mt-3 p-3 rounded-xl bg-surface-soft border border-border text-xs font-medium text-text-secondary text-center">
                    {restoreStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Confirmación y Diagnóstico de Respaldo Técnico ─────────── */}
      {showRestoreModal && pendingBackupData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-text-primary">
                  Inspección de Respaldo Técnico
                </h3>
                <p className="text-xs text-text-secondary">
                  Auditoría de integridad del archivo antes de aplicar a la base de datos.
                </p>
              </div>
            </div>

            <div className="bg-surface-soft p-4 rounded-xl border border-border space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-text-muted">Versión del Snapshot:</span>
                <span className="font-mono font-bold text-text-primary">v{pendingBackupData.version || '1.0'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-text-muted">Fecha de Creación:</span>
                <span className="font-mono text-text-primary">
                  {pendingBackupData.exportDate
                    ? new Date(pendingBackupData.exportDate).toLocaleString('es-CL')
                    : 'Desconocida'}
                </span>
              </div>

              <div className="pt-1">
                <div className="font-bold text-text-primary mb-1.5">Tablas y registros detectados:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white border border-border flex justify-between">
                    <span>Destinos:</span>
                    <strong>{pendingBackupData.data?.destinations?.length || 0}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-border flex justify-between">
                    <span>Restaurantes:</span>
                    <strong>{pendingBackupData.data?.restaurants?.length || 0}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-border flex justify-between">
                    <span>Alojamientos:</span>
                    <strong>{pendingBackupData.data?.accommodations?.length || 0}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-border flex justify-between">
                    <span>Eventos:</span>
                    <strong>{pendingBackupData.data?.events?.length || 0}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-border flex justify-between">
                    <span>Rutas Turísticas:</span>
                    <strong>{pendingBackupData.data?.tourRoutes?.length || 0}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-border flex justify-between">
                    <span>Emergencias:</span>
                    <strong>{pendingBackupData.data?.emergencyContacts?.length || 0}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Confirmación de seguridad:</strong> Los registros serán actualizados o insertados directamente en la base de datos. Para confirmar, escribe <strong>RESTAURAR</strong> a continuación:
              </div>
            </div>

            <input
              type="text"
              placeholder="Escribe RESTAURAR"
              value={confirmKeyword}
              onChange={(e) => setConfirmKeyword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border focus:border-rojo font-mono outline-hidden"
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRestoreModal(false);
                  setPendingBackupData(null);
                }}
                disabled={isRestoring}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-text-secondary hover:bg-surface-soft transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={confirmKeyword !== 'RESTAURAR' || isRestoring}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rojo text-white text-xs font-bold shadow-rojo hover:bg-rojo-dark transition-all disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Restaurando...</span>
                  </>
                ) : (
                  <span>Ejecutar Restauración</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
