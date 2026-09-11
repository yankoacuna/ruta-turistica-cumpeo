'use client';

import React, { useState, useTransition, useMemo } from 'react';
import {
  BulkEntityType,
  ParsedBulkItem,
  ValidationSummary,
  parseUploadedFile,
  validateBulkDataset,
  downloadEntityTemplate,
  exportDatasetToXLSX,
  TEMPLATE_SCHEMAS,
} from '@/lib/bulkValidator';
import { bulkImportEntitiesAction } from '../actions';
import {
  FileSpreadsheet,
  FileJson,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  RefreshCw,
  Loader2,
  Search,
  Check,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  MapPin,
  Eye,
  FileCheck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { Destination, Restaurant, Accommodation, CumpeoEvent } from '@/lib/types';

interface BulkImportWizardProps {
  destinos: Destination[];
  restaurantes: Restaurant[];
  alojamientos: Accommodation[];
  eventos?: CumpeoEvent[];
  onSuccess?: () => void;
}

export function BulkImportWizard({
  destinos,
  restaurantes,
  alojamientos,
  eventos = [],
  onSuccess,
}: BulkImportWizardProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Entidad seleccionada
  const [entityType, setEntityType] = useState<BulkEntityType>('destinos');

  // Estado del archivo y validación
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedBulkItem[]>([]);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);

  // Filtros de vista previa
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'WARNING' | 'ERROR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [importMode, setImportMode] = useState<'upsert' | 'create_only'>('upsert');
  const [importResult, setImportResult] = useState<{
    success: boolean;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
  } | null>(null);

  // Lista existente para contrastar en la validación
  const existingItems = useMemo(() => {
    switch (entityType) {
      case 'destinos':
        return destinos.map((d) => ({ id: d.id, slug: d.slug, nombre: d.nombre }));
      case 'restaurantes':
        return restaurantes.map((r) => ({ id: r.id, nombre: r.nombre }));
      case 'alojamientos':
        return alojamientos.map((a) => ({ id: a.id, nombre: a.nombre }));
      case 'eventos':
        return eventos.map((e) => ({ id: e.id, nombre: e.nombre }));
    }
  }, [entityType, destinos, restaurantes, alojamientos, eventos]);

  // Manejador de cambio de archivo
  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setParseError(null);
    setImportResult(null);
    setIsParsing(true);

    try {
      const rawRows = await parseUploadedFile(file);
      const { items, summary: newSummary } = validateBulkDataset(entityType, rawRows, existingItems);

      setParsedItems(items);
      setSummary(newSummary);

      if (newSummary.errorRows > 0) {
        showToast(
          `Archivo analizado: ${newSummary.validRows + newSummary.warningRows} registros válidos y ${newSummary.errorRows} con errores críticos.`,
          'warning'
        );
      } else {
        showToast(`¡Archivo analizado! ${newSummary.validRows} registros listos para importar.`, 'success');
      }
    } catch (err: any) {
      setParseError(err.message || 'Error al procesar el archivo');
      setParsedItems([]);
      setSummary(null);
      showToast(`Error al leer archivo: ${err.message}`, 'error');
    } finally {
      setIsParsing(false);
    }
  };

  // Resetear carga de archivo
  const handleResetFile = () => {
    setSelectedFile(null);
    setParsedItems([]);
    setSummary(null);
    setParseError(null);
    setImportResult(null);
  };

  // Cambiar entidad y limpiar archivo cargado
  const handleSelectEntity = (type: BulkEntityType) => {
    setEntityType(type);
    handleResetFile();
  };

  // Exportar catastro actual a Excel
  const handleExportCurrent = () => {
    let dataset: any[] = [];
    if (entityType === 'destinos') dataset = destinos;
    if (entityType === 'restaurantes') dataset = restaurantes;
    if (entityType === 'alojamientos') dataset = alojamientos;
    if (entityType === 'eventos') dataset = eventos;

    exportDatasetToXLSX(entityType, dataset);
    showToast(`Descargando planilla Excel con el catastro de ${entityType}...`, 'success');
  };

  // Ejecución de la importación
  const handleExecuteImport = () => {
    const validItemsToImport = parsedItems
      .filter((item) => item.status !== 'ERROR')
      .map((item) => item.data);

    if (validItemsToImport.length === 0) {
      showToast('No hay registros válidos para importar.', 'error');
      return;
    }

    startTransition(async () => {
      try {
        const res = await bulkImportEntitiesAction(entityType, validItemsToImport, importMode);
        if (res.success) {
          setImportResult({
            success: true,
            createdCount: res.createdCount,
            updatedCount: res.updatedCount,
            skippedCount: res.skippedCount,
          });
          setShowConfirmModal(false);
          showToast(
            `¡Carga masiva completada! ${res.createdCount} creados, ${res.updatedCount} actualizados.`,
            'success'
          );
          if (onSuccess) onSuccess();
        }
      } catch (err: any) {
        showToast(`Error en la carga masiva: ${err.message}`, 'error');
      }
    });
  };

  // Filtrado de registros en la vista previa
  const filteredItems = useMemo(() => {
    return parsedItems.filter((item) => {
      // Filtro por estado
      if (statusFilter === 'VALID' && item.status !== 'VALID') return false;
      if (statusFilter === 'WARNING' && item.status !== 'WARNING') return false;
      if (statusFilter === 'ERROR' && item.status !== 'ERROR') return false;

      // Filtro por búsqueda de texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nombre = (item.data.nombre || item.raw.nombre || '').toLowerCase();
        const categoria = (item.data.categoria || item.data.tipo || '').toLowerCase();
        const issuesText = item.issues.map((i) => i.message).join(' ').toLowerCase();
        return nombre.includes(query) || categoria.includes(query) || issuesText.includes(query);
      }

      return true;
    });
  }, [parsedItems, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── Selector de Entidad con contadores ───────────────────────────────── */}
      <div id="tour-bulk-entity" className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-border">
          <div>
            <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-2">
              <Layers size={18} className="text-rojo" />
              1. Selecciona el Catálogo a Gestionar
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Elige el tipo de entidad que deseas descargar como plantilla o actualizar de manera masiva.
            </p>
          </div>
          <button
            onClick={handleExportCurrent}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-soft border border-border hover:border-rojo text-text-primary hover:text-rojo text-xs font-bold transition-all"
            title="Descargar todos los registros actuales en un archivo Excel"
          >
            <FileSpreadsheet size={15} className="text-green-600" />
            <span>Exportar Catastro Actual (.xlsx)</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'destinos', label: 'Atractivos / Destinos', count: destinos.length, color: 'text-rojo' },
            { id: 'restaurantes', label: 'Restaurantes', count: restaurantes.length, color: 'text-sol-dark' },
            { id: 'alojamientos', label: 'Alojamientos', count: alojamientos.length, color: 'text-cielo-dark' },
            { id: 'eventos', label: 'Eventos / Fiestas', count: eventos.length, color: 'text-verde-dark' },
          ].map((tab) => {
            const isSelected = entityType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectEntity(tab.id as BulkEntityType)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-rojo bg-[#FFF5F5] ring-2 ring-rojo/20 shadow-sm'
                    : 'border-border hover:border-rojo/40 bg-surface-soft/60 hover:bg-surface-soft'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-extrabold ${isSelected ? 'text-rojo' : 'text-text-primary'}`}>
                    {tab.label}
                  </span>
                  {isSelected && <Check size={14} className="text-rojo" />}
                </div>
                <div className="text-[11px] text-text-muted">
                  <span className="font-bold text-text-secondary">{tab.count}</span> registrados en el sistema
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Descarga de Plantillas Oficiales ─────────────────────────────────── */}
      <div id="tour-bulk-template" className="bg-[#FAF8F5] rounded-2xl border border-border p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sol/20 text-sol-dark text-[10px] font-extrabold uppercase">
                Plantilla Oficial
              </span>
              <h4 className="font-display font-bold text-sm text-text-primary">
                {TEMPLATE_SCHEMAS[entityType].label}
              </h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Descarga la planilla oficial pre-diseñada con columnas formateadas, instrucciones de llenado y ejemplos
              reales de Cumpeo para rellenar de forma segura.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => downloadEntityTemplate(entityType, 'xlsx')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-green-600 text-green-700 hover:bg-green-50 text-xs font-bold shadow-xs transition-all"
            >
              <FileSpreadsheet size={15} />
              <span>Descargar Plantilla Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => downloadEntityTemplate(entityType, 'json')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-border text-text-secondary hover:text-text-primary hover:border-text-muted text-xs font-semibold transition-all"
            >
              <FileJson size={14} />
              <span>Formato JSON (.json)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Zona de Arrastre y Subida de Archivo ─────────────────────────────── */}
      {!selectedFile ? (
        <div id="tour-bulk-upload" className="bg-white rounded-2xl border-2 border-dashed border-border hover:border-rojo p-8 text-center transition-all bg-surface-soft/40 hover:bg-[#FFF9F9]/40">
          <label className="cursor-pointer block">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFE0E2] text-rojo flex items-center justify-center mb-3 shadow-inner">
              <UploadCloud size={28} />
            </div>
            <h4 className="font-display font-bold text-base text-text-primary mb-1">
              Sube o arrastra aquí tu planilla de {TEMPLATE_SCHEMAS[entityType].label}
            </h4>
            <p className="text-xs text-text-secondary max-w-md mx-auto mb-4 leading-relaxed">
              Admite archivos en formato <strong>Excel (.xlsx, .xls)</strong>, <strong>JSON (.json)</strong> o CSV.
              El sistema validará automáticamente cada fila antes de guardarla.
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rojo text-white font-bold text-xs shadow-rojo hover:bg-rojo-dark transition-all">
              <FileSpreadsheet size={15} />
              Examinar archivo en tu equipo
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.json,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
              }}
            />
          </label>
        </div>
      ) : (
        /* ── Archivo Cargado + Dashboard de Auditoría ───────────────────────── */
        <div className="space-y-4">
          {/* Barra del archivo cargado */}
          <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center justify-center shrink-0">
                <FileCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-text-primary">{selectedFile.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-soft border border-border text-text-muted">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                  <span>Catálogo de destino:</span>
                  <strong className="text-rojo uppercase">{entityType}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleResetFile}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:text-rojo hover:border-rojo transition-all"
              >
                Cambiar Archivo
              </button>
            </div>
          </div>

          {/* Loader de parseo */}
          {isParsing && (
            <div className="bg-white rounded-2xl border border-border p-8 text-center">
              <Loader2 size={24} className="animate-spin text-rojo mx-auto mb-2" />
              <div className="text-xs font-bold text-text-primary">Auditando y validando esquema del archivo...</div>
              <div className="text-[11px] text-text-muted mt-1">Verificando columnas, coordenadas y tipos de datos</div>
            </div>
          )}

          {/* Mensaje de error de parseo */}
          {parseError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 text-red-900">
              <AlertCircle size={18} className="text-rojo shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold">No se pudo auditar el archivo</div>
                <div className="text-xs mt-0.5 text-red-700">{parseError}</div>
              </div>
            </div>
          )}

          {/* ── Resumen de Auditoría (Cards) ─────────────────────────────────── */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white p-4 rounded-xl border border-border text-center shadow-xs">
                <div className="text-xl font-black text-text-primary">{summary.totalRows}</div>
                <div className="text-[10px] font-bold text-text-muted uppercase mt-0.5">Total Filas</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center shadow-xs">
                <div className="text-xl font-black text-green-700 flex items-center justify-center gap-1">
                  <CheckCircle2 size={18} />
                  {summary.validRows}
                </div>
                <div className="text-[10px] font-bold text-green-800 uppercase mt-0.5">100% Válidos</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center shadow-xs">
                <div className="text-xl font-black text-amber-700 flex items-center justify-center gap-1">
                  <AlertTriangle size={18} />
                  {summary.warningRows}
                </div>
                <div className="text-[10px] font-bold text-amber-800 uppercase mt-0.5">Con Avisos</div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center shadow-xs">
                <div className="text-xl font-black text-rojo flex items-center justify-center gap-1">
                  <XCircle size={18} />
                  {summary.errorRows}
                </div>
                <div className="text-[10px] font-bold text-red-800 uppercase mt-0.5">Con Errores</div>
              </div>
              <div className="bg-surface-soft p-4 rounded-xl border border-border text-center shadow-xs col-span-2 sm:col-span-1">
                <div className="text-sm font-black text-text-primary">
                  <span className="text-green-600">+{summary.itemsToCreate}</span> /{' '}
                  <span className="text-cielo-dark">{summary.itemsToUpdate} upd</span>
                </div>
                <div className="text-[10px] font-bold text-text-muted uppercase mt-0.5">Nuevos / Existentes</div>
              </div>
            </div>
          )}

          {/* ── Filtros y Tabla de Previsualización ───────────────────────────── */}
          {summary && parsedItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Tabs de estado */}
                <div className="flex items-center gap-1.5 bg-surface-soft p-1 rounded-xl border border-border self-start">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === 'ALL'
                        ? 'bg-white text-text-primary shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Todos ({summary.totalRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('VALID')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === 'VALID'
                        ? 'bg-green-600 text-white shadow-xs'
                        : 'text-text-muted hover:text-green-700'
                    }`}
                  >
                    Válidos ({summary.validRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('WARNING')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === 'WARNING'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-text-muted hover:text-amber-700'
                    }`}
                  >
                    Avisos ({summary.warningRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ERROR')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === 'ERROR'
                        ? 'bg-rojo text-white shadow-xs'
                        : 'text-text-muted hover:text-rojo'
                    }`}
                  >
                    Errores ({summary.errorRows})
                  </button>
                </div>

                {/* Buscador interno */}
                <div className="relative w-full md:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar en el archivo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-soft rounded-xl border border-border focus:border-rojo outline-hidden"
                  />
                </div>
              </div>

              {/* Tabla interactiva */}
              <div className="border border-border rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF8F5] text-text-secondary sticky top-0 z-10 border-b border-border text-[11px] uppercase font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-14">Fila</th>
                      <th className="py-2.5 px-3 w-28">Estado</th>
                      <th className="py-2.5 px-3">Nombre</th>
                      <th className="py-2.5 px-3">Categoría / Tipo</th>
                      <th className="py-2.5 px-3">Ubicación GPS</th>
                      <th className="py-2.5 px-3">Acción</th>
                      <th className="py-2.5 px-3">Diagnóstico / Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {filteredItems.map((item) => {
                      const isError = item.status === 'ERROR';
                      const isWarning = item.status === 'WARNING';
                      const isValid = item.status === 'VALID';

                      return (
                        <tr
                          key={item.rowNumber}
                          className={`hover:bg-surface-soft/60 transition-colors ${
                            isError ? 'bg-red-50/40' : isWarning ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono text-text-muted">#{item.rowNumber}</td>
                          <td className="py-2.5 px-3">
                            {isValid && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold">
                                <CheckCircle2 size={11} /> Válido
                              </span>
                            )}
                            {isWarning && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                                <AlertTriangle size={11} /> Advertencia
                              </span>
                            )}
                            {isError && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                                <XCircle size={11} /> Error Crítico
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-text-primary">
                            {item.data.nombre || <span className="text-rojo italic">(Vacío)</span>}
                          </td>
                          <td className="py-2.5 px-3 text-text-secondary">
                            {item.data.categoria || item.data.tipo || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-text-secondary font-mono text-[11px]">
                            {item.data.coordenadas?.lat?.toFixed(3)}, {item.data.coordenadas?.lng?.toFixed(3)}
                          </td>
                          <td className="py-2.5 px-3">
                            {isError ? (
                              <span className="text-text-muted text-[11px]">Omitir</span>
                            ) : item.willUpdate ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cielo-dark">
                                <RefreshCw size={11} /> Actualizar
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700">
                                <span>+ Crear</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.issues.length === 0 ? (
                              <span className="text-text-muted text-[11px]">Listo para importar</span>
                            ) : (
                              <div className="space-y-1">
                                {item.issues.map((iss, iIdx) => (
                                  <div
                                    key={iIdx}
                                    className={`text-[11px] leading-tight ${
                                      iss.severity === 'ERROR' ? 'text-rojo font-bold' : 'text-amber-800'
                                    }`}
                                  >
                                    • {iss.message}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-text-muted text-xs">
                          No hay registros que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Barra de Acción y Estrategia ─────────────────────────────── */}
              <div className="pt-4 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-bold text-text-primary">Estrategia de guardado:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="upsert"
                      checked={importMode === 'upsert'}
                      onChange={() => setImportMode('upsert')}
                      className="text-rojo focus:ring-rojo"
                    />
                    <span>Actualizar existentes y crear nuevos</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="create_only"
                      checked={importMode === 'create_only'}
                      onChange={() => setImportMode('create_only')}
                      className="text-rojo focus:ring-rojo"
                    />
                    <span>Solo crear nuevos (omitir existentes)</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={summary.validRows + summary.warningRows === 0 || isPending}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-rojo text-white font-bold text-xs shadow-rojo hover:bg-rojo-dark transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ArrowRight size={15} />
                  )}
                  <span>
                    Confirmar e Importar ({summary.validRows + summary.warningRows} registros)
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ── Resultado Exitoso de Importación ─────────────────────────────── */}
          {importResult && (
            <div className="bg-green-50 border border-green-200 p-5 rounded-2xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-green-900">
                  ¡Carga masiva completada exitosamente!
                </h4>
                <p className="text-xs text-green-800">
                  Se crearon <strong>{importResult.createdCount}</strong> nuevos registros, se actualizaron{' '}
                  <strong>{importResult.updatedCount}</strong> existentes y se omitieron{' '}
                  <strong>{importResult.skippedCount}</strong>.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleResetFile}
                    className="inline-flex items-center gap-1 text-xs font-bold text-green-900 hover:underline"
                  >
                    <span>Cargar otra planilla</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal de Confirmación de Seguridad ───────────────────────────────── */}
      {showConfirmModal && summary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <ShieldAlert size={26} />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-text-primary">
                Confirmar Carga Masiva
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Estás a punto de aplicar cambios en la base de datos de <strong>{TEMPLATE_SCHEMAS[entityType].label}</strong>.
              </p>
            </div>

            <div className="bg-surface-soft p-4 rounded-xl border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Total a procesar:</span>
                <strong className="text-text-primary">{summary.validRows + summary.warningRows} registros</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Nuevos a crear:</span>
                <strong className="text-green-700">+{summary.itemsToCreate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Existentes a actualizar:</span>
                <strong className="text-cielo-dark">{summary.itemsToUpdate}</strong>
              </div>
              {summary.errorRows > 0 && (
                <div className="flex justify-between text-rojo">
                  <span>Omitidos por errores:</span>
                  <strong>{summary.errorRows}</strong>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-text-secondary hover:bg-surface-soft transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rojo text-white text-xs font-bold shadow-rojo hover:bg-rojo-dark transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Sí, Aplicar Cambios</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
