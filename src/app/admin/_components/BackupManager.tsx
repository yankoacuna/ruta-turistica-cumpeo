'use client';

import React, { useState } from 'react';
import { Destination, Restaurant, Accommodation, CumpeoEvent } from '@/lib/types';
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
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

interface BackupManagerProps {
  destinos: Destination[];
  restaurantes: Restaurant[];
  alojamientos: Accommodation[];
  eventos?: CumpeoEvent[];
  token: string;
}

export function BackupManager({
  destinos,
  restaurantes,
  alojamientos,
  eventos = [],
  token,
}: BackupManagerProps) {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  // ── Export Full JSON Snapshot ──────────────────────────────────────────────
  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const backup = await exportDatabaseBackup(token);

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

  // ── Export CSV for Excel ───────────────────────────────────────────────────
  const handleExportCSV = (type: 'destinos' | 'restaurantes' | 'alojamientos' | 'eventos') => {
    try {
      let csvContent = '';
      const dateStr = new Date().toISOString().split('T')[0];
      let filename = `cumpeo-${type}-${dateStr}.csv`;

      if (type === 'destinos') {
        const headers = ['ID', 'Nombre', 'Categoria', 'Descripcion', 'Direccion', 'Horario', 'Duracion', 'Destacado'];
        const rows = destinos.map((d) => [
          `"${d.id}"`,
          `"${d.nombre.replace(/"/g, '""')}"`,
          `"${d.categoria}"`,
          `"${(d.descripcionCorta || '').replace(/"/g, '""')}"`,
          `"${(d.direccion || '').replace(/"/g, '""')}"`,
          `"${(d.horario || '').replace(/"/g, '""')}"`,
          `"${(d.duracionVisita || '').replace(/"/g, '""')}"`,
          d.destacado ? 'SI' : 'NO',
        ]);
        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      } else if (type === 'restaurantes') {
        const headers = ['ID', 'Nombre', 'Propietario', 'Tipo', 'Especialidad', 'Descripcion', 'Direccion', 'Telefono', 'Medios de Pago'];
        const rows = restaurantes.map((r) => [
          `"${r.id}"`,
          `"${r.nombre.replace(/"/g, '""')}"`,
          `"${(r.propietario || '').replace(/"/g, '""')}"`,
          `"${(r.tipo || '').replace(/"/g, '""')}"`,
          `"${(r.especialidad || '').replace(/"/g, '""')}"`,
          `"${(r.descripcion || '').replace(/"/g, '""')}"`,
          `"${(r.direccion || '').replace(/"/g, '""')}"`,
          `"${(r.contacto?.telefono || '').replace(/"/g, '""')}"`,
          `"${(r.mediosPago || []).join(' / ')}"`,
        ]);
        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      } else if (type === 'alojamientos') {
        const headers = ['ID', 'Nombre', 'Propietario', 'Tipo', 'Descripcion', 'Direccion', 'Telefono', 'Servicios'];
        const rows = alojamientos.map((a) => [
          `"${a.id}"`,
          `"${a.nombre.replace(/"/g, '""')}"`,
          `"${(a.propietario || '').replace(/"/g, '""')}"`,
          `"${(a.tipo || '').replace(/"/g, '""')}"`,
          `"${(a.descripcion || '').replace(/"/g, '""')}"`,
          `"${(a.direccion || '').replace(/"/g, '""')}"`,
          `"${(a.contacto?.telefono || '').replace(/"/g, '""')}"`,
          `"${(a.servicios || []).join('; ')}"`,
        ]);
        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      } else {
        const headers = ['ID', 'Nombre', 'Tipo', 'Fecha', 'Recurrente', 'Descripcion', 'Lugar', 'Activo'];
        const rows = eventos.map((e) => [
          `"${e.id}"`,
          `"${e.nombre.replace(/"/g, '""')}"`,
          `"${e.tipo}"`,
          `"${(e.fecha || '').replace(/"/g, '""')}"`,
          e.recurrente ? 'SI' : 'NO',
          `"${(e.descripcion || '').replace(/"/g, '""')}"`,
          `"${(e.direccion || '').replace(/"/g, '""')}"`,
          e.activo ? 'SI' : 'NO',
        ]);
        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      }

      // Add BOM for Excel UTF-8 support
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Archivo CSV de ${type} exportado con éxito`, 'success');
    } catch (err: any) {
      showToast(`Error al exportar CSV: ${err.message}`, 'error');
    }
  };

  // ── Restore Backup from JSON ───────────────────────────────────────────────
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        setRestoreStatus('Leyendo archivo de respaldo...');
        const json = JSON.parse(event.target?.result as string);

        if (!json.data || (!json.data.destinations && !json.data.restaurants)) {
          throw new Error('El archivo no tiene la estructura de respaldo válida de Cumpeo Turismo.');
        }

        setRestoreStatus('Aplicando datos en la base de datos PostgreSQL...');
        await restoreDatabaseBackup(token, json);

        showToast('¡Copia de seguridad restaurada con éxito!', 'success');
        setRestoreStatus('Restauración completada. Recarga la página para ver los cambios actualizados.');
      } catch (err: any) {
        showToast(`Error en la restauración: ${err.message}`, 'error');
        setRestoreStatus(`Error: ${err.message}`);
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-xl text-text-primary flex items-center gap-2">
              <Database size={22} className="text-rojo" />
              Copias de Seguridad y Exportación de Datos
            </h2>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl">
              Descarga respaldos completos de la base de datos municipal o exporta planillas Excel/CSV con la lista de atractivos, restaurantes y alojamientos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
              <CheckCircle2 size={13} /> Base de Datos Conectada
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Export Options */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-2 mb-2">
              <Download size={18} className="text-rojo" />
              1. Exportar Copia de Seguridad
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              Crea un archivo snapshot que contiene todos los destinos, fichas históricas, coordenadas GPS, horarios, teléfonos y configuraciones del portal.
            </p>

            {/* Current Summary */}
            <div className="grid grid-cols-3 gap-2 bg-surface-soft p-3 rounded-xl border border-border mb-4 text-center">
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
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleExportJSON}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rojo text-white font-bold text-sm shadow-[0_4px_12px_rgba(230,57,70,0.3)] hover:bg-rojo-dark transition-all disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileJson size={16} />}
              <span>{isExporting ? 'Generando backup...' : 'Descargar Backup Completo (JSON)'}</span>
            </button>

            {/* CSV Exports */}
            <div className="pt-2 border-t border-border flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-text-secondary">Exportar a Excel (CSV):</span>
              <button
                onClick={() => handleExportCSV('destinos')}
                className="px-2.5 py-1 rounded-lg bg-surface-soft border border-border text-xs font-semibold hover:border-rojo hover:text-rojo transition-colors"
              >
                Destinos
              </button>
              <button
                onClick={() => handleExportCSV('restaurantes')}
                className="px-2.5 py-1 rounded-lg bg-surface-soft border border-border text-xs font-semibold hover:border-rojo hover:text-rojo transition-colors"
              >
                Restaurantes
              </button>
              <button
                onClick={() => handleExportCSV('alojamientos')}
                className="px-2.5 py-1 rounded-lg bg-surface-soft border border-border text-xs font-semibold hover:border-rojo hover:text-rojo transition-colors"
              >
                Alojamientos
              </button>
              <button
                onClick={() => handleExportCSV('eventos')}
                className="px-2.5 py-1 rounded-lg bg-surface-soft border border-border text-xs font-semibold hover:border-rojo hover:text-rojo transition-colors"
              >
                Eventos
              </button>
            </div>
          </div>
        </div>

        {/* Right Card: Restore from JSON */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-2 mb-2">
              <Upload size={18} className="text-sol-dark" />
              2. Restaurar Copia de Seguridad
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              Carga un archivo de respaldo JSON generado previamente para sincronizar o restaurar la información en caso de emergencia.
            </p>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 flex gap-2.5 items-start mb-4">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Atención:</strong> La restauración actualizará o creará los registros contenidos en el archivo sin eliminar los registros que no estén en el respaldo.
              </div>
            </div>
          </div>

          <div>
            <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl hover:border-rojo bg-surface-soft/60 cursor-pointer transition-all">
              <Upload size={24} className="text-text-muted mb-2" />
              <span className="text-xs font-bold text-text-primary mb-0.5">
                {isRestoring ? 'Restaurando archivo...' : 'Seleccionar archivo .json de respaldo'}
              </span>
              <span className="text-[11px] text-text-muted">Haz clic para buscar en tu equipo</span>
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
  );
}
