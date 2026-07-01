"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  Layers, 
  Tags, 
  Loader2, 
  PlusCircle, 
  ChevronRight,
  Sparkles,
  Info
} from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { 
  createSizeChart, 
  deleteSizeChart, 
  addSizeChartRow, 
  updateSizeChartRow, 
  deleteSizeChartRow,
  createClothingBrand,
  deleteClothingBrand,
  createClothingType,
  deleteClothingType,
  type SizeChartWithRows,
  type ClothingBrandItem,
  type ClothingTypeItem
} from "@/app/actions/sizeChart";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface SizeChartManagementProps {
  tenant: Tenant;
  sizeCharts: SizeChartWithRows[];
  clothingBrands: ClothingBrandItem[];
  clothingTypes: ClothingTypeItem[];
  onRefresh: () => void;
}

// Preset templates for size charts
const PRESETS = [
  {
    name: "Remeras / Buzos",
    columns: ["Talle", "Pecho (cm)", "Largo (cm)", "Manga (cm)"],
    rows: [
      ["S", "90-94", "68", "60"],
      ["M", "94-98", "70", "61"],
      ["L", "98-102", "72", "62"],
      ["XL", "102-106", "74", "63"]
    ]
  },
  {
    name: "Pantalones / Jeans",
    columns: ["Talle", "Cintura (cm)", "Cadera (cm)", "Largo (cm)"],
    rows: [
      ["38", "76", "94", "102"],
      ["40", "80", "98", "103"],
      ["42", "84", "102", "104"],
      ["44", "88", "106", "105"]
    ]
  },
  {
    name: "Calzado",
    columns: ["ARG", "EUR", "US", "Largo Pie (cm)"],
    rows: [
      ["39", "40", "7.5", "25.5"],
      ["40", "41", "8", "26.0"],
      ["41", "42", "9", "26.5"],
      ["42", "43", "9.5", "27.0"],
      ["43", "44", "10.5", "28.0"]
    ]
  }
];

export default function SizeChartManagement({
  tenant,
  sizeCharts,
  clothingBrands,
  clothingTypes,
  onRefresh
}: SizeChartManagementProps) {
  // Panel view: 'charts' (list of tables) or 'config' (brands/types settings)
  const [panelView, setPanelView] = useState<"charts" | "config">("charts");
  const [activeBrandId, setActiveBrandId] = useState<string>(clothingBrands[0]?.id || "");

  // Create Table Form States
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState(clothingBrands[0]?.id || "");
  const [selectedTypeId, setSelectedTypeId] = useState(clothingTypes[0]?.id || "");
  const [scColumns, setScColumns] = useState<string[]>(["Talle", "Pecho (cm)", "Largo (cm)"]);
  const [scSaving, setScSaving] = useState(false);
  const [scError, setScError] = useState("");

  // Excel-like Spreadsheet Grid Editor state
  const [editingChartId, setEditingChartId] = useState<string | null>(null);
  const [editingRows, setEditingRows] = useState<{ id: string; values: string[]; order: number }[]>([]);
  const [savingRows, setSavingRows] = useState(false);

  // Brands / Types config states
  const [newBrandName, setNewBrandName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [configSubmitting, setConfigSubmitting] = useState(false);
  const [configError, setConfigError] = useState("");

  // Preset loading helper
  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setScColumns(preset.columns);
    setScError("");
  };

  // Create table handler
  const handleCreateChart = async () => {
    if (!selectedBrandId || !selectedTypeId || scColumns.length === 0) {
      setScError("Completa la marca, tipo e ingresa columnas válidas.");
      return;
    }
    setScSaving(true);
    setScError("");
    const res = await createSizeChart(
      tenant.id,
      selectedBrandId,
      selectedTypeId,
      scColumns.filter(c => c.trim() !== "")
    );
    setScSaving(false);

    if (res.ok && res.id) {
      // Find preset details to auto-populate rows if available
      const matchedPreset = PRESETS.find(p => p.columns.join(",") === scColumns.join(","));
      if (matchedPreset) {
        for (const rowVals of matchedPreset.rows) {
          await addSizeChartRow(res.id, rowVals);
        }
      } else {
        // Add one empty row by default
        await addSizeChartRow(res.id, Array(scColumns.length).fill(""));
      }

      setShowNewForm(false);
      onRefresh();
    } else {
      setScError(res.error || "Error al crear la tabla.");
    }
  };

  // Inline rows management
  const handleStartEditing = (chart: SizeChartWithRows) => {
    setEditingChartId(chart.id);
    setEditingRows(JSON.parse(JSON.stringify(chart.rows))); // Deep copy
  };

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    setEditingRows(prev => prev.map((r, idx) => {
      if (idx !== rowIndex) return r;
      const newVals = [...r.values];
      newVals[colIndex] = val;
      return { ...r, values: newVals };
    }));
  };

  const handleAddInlineRow = (numColumns: number) => {
    const newRow = {
      id: `temp-${Date.now()}-${Math.random()}`,
      values: Array(numColumns).fill(""),
      order: editingRows.length
    };
    setEditingRows(prev => [...prev, newRow]);
  };

  const handleRemoveInlineRow = (rowIndex: number) => {
    setEditingRows(prev => prev.filter((_, idx) => idx !== rowIndex));
  };

  const handleSaveRows = async (chartId: string) => {
    setSavingRows(true);
    
    // Fetch original chart
    const originalChart = sizeCharts.find(c => c.id === chartId);
    if (!originalChart) {
      setSavingRows(false);
      return;
    }

    // 1. Delete rows that are not in editingRows
    const originalRowIds = originalChart.rows.map(r => r.id);
    const editingRowIds = editingRows.map(r => r.id).filter(id => !id.startsWith("temp-"));
    const idsToDelete = originalRowIds.filter(id => !editingRowIds.includes(id));
    
    for (const deleteId of idsToDelete) {
      await deleteSizeChartRow(deleteId);
    }

    // 2. Add or Update rows
    for (const row of editingRows) {
      if (row.id.startsWith("temp-")) {
        // Add new row
        await addSizeChartRow(chartId, row.values);
      } else {
        // Update existing row if values changed
        const origRow = originalChart.rows.find(r => r.id === row.id);
        if (origRow && JSON.stringify(origRow.values) !== JSON.stringify(row.values)) {
          await updateSizeChartRow(row.id, row.values);
        }
      }
    }

    setSavingRows(false);
    setEditingChartId(null);
    onRefresh();
  };

  // Brands / Types Creation Helpers
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setConfigSubmitting(true);
    setConfigError("");
    const res = await createClothingBrand(tenant.id, newBrandName);
    setConfigSubmitting(false);
    if (res.ok) {
      setNewBrandName("");
      if (res.id) setActiveBrandId(res.id);
      onRefresh();
    } else {
      setConfigError(res.error || "Error al añadir la marca.");
    }
  };

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    setConfigSubmitting(true);
    setConfigError("");
    const res = await createClothingType(tenant.id, newTypeName);
    setConfigSubmitting(false);
    if (res.ok) {
      setNewTypeName("");
      onRefresh();
    } else {
      setConfigError(res.error || "Error al añadir el tipo.");
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!confirm("¿Eliminar marca? Se borrarán todas las tablas asociadas.")) return;
    const res = await deleteClothingBrand(id);
    if (res.ok) {
      onRefresh();
    } else {
      alert(res.error || "Error al eliminar la marca.");
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("¿Eliminar tipo de indumentaria? Se borrarán todas las tablas asociadas.")) return;
    const res = await deleteClothingType(id);
    if (res.ok) {
      onRefresh();
    } else {
      alert(res.error || "Error al eliminar el tipo.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER TAB SEGMENTS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-950 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Guías de Talles</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Administra las medidas de prendas que verán los clientes en la tienda.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-1 text-xs">
          <button
            onClick={() => setPanelView("charts")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              panelView === "charts" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Tablas de Talles
          </button>
          <button
            onClick={() => setPanelView("config")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              panelView === "config" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Configuración (Marcas/Prendas)
          </button>
        </div>
      </div>

      {/* PANEL 1: CONFIGURATION (BRANDS & TYPES) */}
      {panelView === "config" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* MARCAS (BRANDS) PANEL */}
          <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Marcas de Indumentaria
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Agrega marcas de ropa propias o de revendedores.</p>
            </div>

            <form onSubmit={handleAddBrand} className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. Levis, Adidas, Propia..."
                required
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
              />
              <PremiumButton type="submit" variant="primary" size="sm" disabled={configSubmitting}>
                Añadir
              </PremiumButton>
            </form>

            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {clothingBrands.length === 0 ? (
                <p className="text-center py-6 text-zinc-600 text-xs">No hay marcas configuradas.</p>
              ) : (
                clothingBrands.map((b) => (
                  <div key={b.id} className="bg-zinc-950/40 border border-zinc-900/50 rounded-xl p-3 flex items-center justify-between text-xs">
                    <span className="text-white font-semibold">{b.name}</span>
                    <button
                      onClick={() => handleDeleteBrand(b.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TIPOS DE INDUMENTARIA (TYPES) PANEL */}
          <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Tags className="w-4 h-4 text-amber-500" />
                Tipos de Prenda
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Define categorías físicas de prendas (ej: Remeras, Pantalones, Camperas).</p>
            </div>

            <form onSubmit={handleAddType} className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. Remeras, Buzos, Calzas..."
                required
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
              />
              <PremiumButton type="submit" variant="primary" size="sm" disabled={configSubmitting}>
                Añadir
              </PremiumButton>
            </form>

            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {clothingTypes.length === 0 ? (
                <p className="text-center py-6 text-zinc-600 text-xs">No hay tipos configurados.</p>
              ) : (
                clothingTypes.map((t) => (
                  <div key={t.id} className="bg-zinc-950/40 border border-zinc-900/50 rounded-xl p-3 flex items-center justify-between text-xs">
                    <span className="text-white font-semibold">{t.name}</span>
                    <button
                      onClick={() => handleDeleteType(t.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* PANEL 2: SIZE CHARTS GRID & SPREADSHEET EDITOR */}
      {panelView === "charts" && (
        <div className="flex flex-col gap-6">
          
          {/* BRAND TABS HORIZONTAL FILTERS */}
          {clothingBrands.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-900/60">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider shrink-0 mr-2">Filtrar Marca:</span>
              {clothingBrands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveBrandId(b.id);
                    setEditingChartId(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-all shrink-0 ${
                    activeBrandId === b.id
                      ? "bg-amber-500/10 border-amber-500 text-amber-400 font-bold"
                      : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {b.name}
                </button>
              ))}
              
              <PremiumButton 
                variant="primary" 
                size="sm" 
                className="ml-auto shrink-0" 
                onClick={() => setShowNewForm(true)}
              >
                <Plus className="w-4 h-4" /> Crear Tabla
              </PremiumButton>
            </div>
          )}

          {/* CREATE SIZE CHART FORM MODAL / DRAWER */}
          {showNewForm && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-zinc-900 border border-zinc-900 w-full max-w-lg rounded-3xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
                <div>
                  <h3 className="text-base font-black text-white">Nueva Tabla de Talles</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Selecciona el rubro y define la plantilla inicial.</p>
                </div>

                <div className="flex flex-col gap-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase">Marca</label>
                      <select
                        value={selectedBrandId}
                        onChange={(e) => setSelectedBrandId(e.target.value)}
                        className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                      >
                        {clothingBrands.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase">Tipo de prenda</label>
                      <select
                        value={selectedTypeId}
                        onChange={(e) => setSelectedTypeId(e.target.value)}
                        className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                      >
                        {clothingTypes.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* PRESET SUGGESTIONS */}
                  <div className="flex flex-col gap-2 bg-zinc-950/40 p-3 rounded-2xl border border-zinc-900">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Carga Rápida por Plantilla:</span>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleApplyPreset(p)}
                          className="px-2.5 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold border border-zinc-900 rounded-lg transition-colors cursor-pointer"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">Columnas de la tabla (Separadas por comas)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Talle, Pecho (cm), Largo (cm)"
                      value={scColumns.join(", ")}
                      onChange={(e) => setScColumns(e.target.value.split(",").map(c => c.trim()))}
                      className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                    />
                  </div>

                  {scError && <p className="text-xs text-red-400 font-bold">{scError}</p>}

                  <div className="flex justify-end gap-2 border-t border-zinc-900 pt-3">
                    <PremiumButton variant="outline" size="sm" onClick={() => setShowNewForm(false)}>
                      Cancelar
                    </PremiumButton>
                    <PremiumButton variant="primary" size="sm" onClick={handleCreateChart} disabled={scSaving}>
                      {scSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear Tabla"}
                    </PremiumButton>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {sizeCharts.length === 0 && !showNewForm && (
            <div className="glass-panel p-10 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col items-center justify-center gap-3">
              <Layers className="w-8 h-8 text-zinc-700" />
              <p className="text-zinc-500 text-sm">No hay tablas creadas aún.</p>
              {clothingBrands.length === 0 || clothingTypes.length === 0 ? (
                <PremiumButton variant="outline" size="sm" onClick={() => setPanelView("config")}>
                  Primero configurá marcas y prendas →
                </PremiumButton>
              ) : (
                <PremiumButton variant="outline" size="sm" onClick={() => setShowNewForm(true)}>
                  Crear primera tabla
                </PremiumButton>
              )}
            </div>
          )}

          {/* SIZE CHARTS GRID CARDS */}
          <div className="grid grid-cols-1 gap-6">
            {sizeCharts
              .filter((c) => c.brandId === activeBrandId)
              .map((chart) => {
                const isEditing = editingChartId === chart.id;
                
                return (
                  <div key={chart.id} className="glass-panel p-5 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                    
                    {/* CARD HEADER */}
                    <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
                      <div>
                        <h3 className="text-sm font-black text-amber-500 uppercase tracking-wider">{chart.brandName} — {chart.clothingTypeName}</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{chart.columns.length} columnas · {chart.rows.length} talles</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <PremiumButton 
                              variant="primary" 
                              size="sm" 
                              disabled={savingRows} 
                              onClick={() => handleSaveRows(chart.id)}
                            >
                              {savingRows ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Guardar Cambios</span>
                            </PremiumButton>
                            <PremiumButton 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setEditingChartId(null)}
                            >
                              Cancelar
                            </PremiumButton>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEditing(chart)}
                              className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 bg-zinc-950 hover:bg-zinc-900 hover:text-white border border-zinc-900 rounded-lg transition-colors cursor-pointer"
                            >
                              Editar Talles
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`¿Eliminar la tabla "${chart.brandName} - ${chart.clothingTypeName}"?`)) return;
                                await deleteSizeChart(chart.id);
                                onRefresh();
                              }}
                              className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* SPREADSHEET TABLE GRID */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-900">
                            {chart.columns.map((col, idx) => (
                              <th key={idx} className="py-2 px-2">{col}</th>
                            ))}
                            {isEditing && <th className="py-2 px-2 text-center w-16">Acción</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {isEditing ? (
                            editingRows.map((row, rIdx) => (
                              <tr key={row.id} className="border-b border-zinc-900/40">
                                {chart.columns.map((_, cIdx) => (
                                  <td key={cIdx} className="py-1 px-1">
                                    <input
                                      type="text"
                                      value={row.values[cIdx] || ""}
                                      onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                      className="w-full bg-zinc-950 border border-zinc-900 text-xs text-white p-2 rounded-lg outline-none focus:border-zinc-700 font-medium font-mono"
                                    />
                                  </td>
                                ))}
                                <td className="py-1 px-1 text-center">
                                  <button
                                    onClick={() => handleRemoveInlineRow(rIdx)}
                                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            chart.rows.map((row) => (
                              <tr key={row.id} className="border-b border-zinc-900/40 hover:bg-zinc-900/5 transition-colors">
                                {row.values.map((val, cIdx) => (
                                  <td key={cIdx} className="py-2.5 px-2 font-mono text-zinc-300 font-semibold">{val}</td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* SPREADSHEET FOOTER BUTTONS */}
                    {isEditing && (
                      <div className="flex justify-start border-t border-zinc-900/40 pt-3">
                        <button
                          type="button"
                          onClick={() => handleAddInlineRow(chart.columns.length)}
                          className="px-2.5 py-1 text-[10px] font-bold text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> Añadir Talle
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}
          </div>

        </div>
      )}

    </div>
  );
}
