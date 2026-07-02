"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  ChefHat, 
  Plus, 
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  User,
  ShoppingBag,
  Loader2,
  RefreshCw
} from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { getKitchenConsolidated, assignProductionStock } from "@/app/actions/kitchen";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface KitchenProductionManagementProps {
  tenant: Tenant;
}

export default function KitchenProductionManagement({ tenant }: KitchenProductionManagementProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Custom manual allocation modal state
  const [selectedProductDetails, setSelectedProductDetails] = useState<any | null>(null);
  const [inputQuantities, setInputQuantities] = useState<Record<string, number>>({});

  const fetchConsolidatedData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getKitchenConsolidated(tenant.id, selectedDate);
      if (response.success && response.data) {
        setItems(response.data);
      } else {
        setError(response.error || "Ocurrió un error al cargar el consolidado.");
      }
    } catch (err: any) {
      setError(err.message || "Error de red al cargar el consolidado.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsolidatedData();
  }, [selectedDate]);

  const handleRegisterProduction = async (productId: string, customQty?: number) => {
    const qtyToRegister = customQty || inputQuantities[productId] || 0;
    if (qtyToRegister <= 0) return;

    setActionLoading(productId);
    try {
      const response = await assignProductionStock(tenant.id, productId, qtyToRegister, selectedDate);
      if (response.success) {
        // Clear input quantity
        setInputQuantities(prev => ({ ...prev, [productId]: 0 }));
        // Refresh consolidated view
        await fetchConsolidatedData();
      } else {
        alert(response.error || "Error al asignar producción.");
      }
    } catch (err: any) {
      alert(err.message || "Error al registrar producción.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuantityInputChange = (productId: string, val: string) => {
    const num = parseInt(val) || 0;
    setInputQuantities(prev => ({ ...prev, [productId]: num }));
  };

  const filteredItems = items.filter(item => 
    item.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/30 backdrop-blur-md border border-white/[0.06] p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-600/20 border border-violet-500/30 rounded-2xl text-violet-400">
            <ChefHat className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Consolidado de Cocina y Producción
              <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-normal">
                Batch Mode
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Registra stock recién hecho y distribúyelo automáticamente a los pedidos pendientes de tus clientes.
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3 bg-zinc-950/40 border border-white/[0.08] p-2.5 rounded-2xl">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-sm text-white focus:outline-none cursor-pointer [color-scheme:dark]"
          />
          <button 
            onClick={fetchConsolidatedData}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-violet-600/10 to-violet-900/5 border border-white/[0.06] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400">Productos Demandados</p>
            <h3 className="text-2xl font-bold text-white mt-1">{items.length}</h3>
          </div>
          <div className="p-2.5 bg-violet-500/20 text-violet-400 rounded-xl">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600/10 to-emerald-900/5 border border-white/[0.06] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400">Porciones Preparadas</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">
              {items.reduce((acc, curr) => acc + curr.assigned, 0)}
            </h3>
          </div>
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-600/10 to-amber-900/5 border border-white/[0.06] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400">Porciones Pendientes</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">
              {items.reduce((acc, curr) => acc + curr.pending, 0)}
            </h3>
          </div>
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
            <AlertCircle className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar platos o pasteles a preparar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-950/40 border border-white/[0.08] hover:border-white/[0.15] focus:border-violet-500/50 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all duration-300"
        />
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-sm text-zinc-400">Cargando consolidado de cocina...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-zinc-900/10 border border-dashed border-white/[0.06] p-16 rounded-3xl text-center">
          <ChefHat className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-base font-bold text-white">Sin viandas pendientes</h3>
          <p className="text-xs text-zinc-500 mt-1">No hay pedidos pendientes de cocción o despacho para esta fecha.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const progress = item.requested > 0 ? (item.assigned / item.requested) * 100 : 0;
            const inputVal = inputQuantities[item.productId] ?? "";

            return (
              <div 
                key={item.productId} 
                className="bg-zinc-900/20 backdrop-blur-md border border-white/[0.06] hover:border-violet-500/20 p-6 rounded-3xl flex flex-col justify-between transition-all duration-300 group shadow-lg"
              >
                <div>
                  {/* Image and Name */}
                  <div className="flex items-center gap-4">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.productName} 
                        className="w-14 h-14 rounded-2xl object-cover border border-white/[0.08]"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-zinc-950/60 border border-white/[0.08] flex items-center justify-center text-zinc-500">
                        <ChefHat className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-base group-hover:text-violet-400 transition-colors line-clamp-2">
                        {item.productName}
                      </h4>
                      <p className="text-xs text-zinc-500">Vianda / Repostería</p>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-5">
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-zinc-400">Progreso</span>
                      <span className={`${progress === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {item.assigned} / {item.requested} un. ({Math.round(progress)}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-950/60 h-2.5 rounded-full overflow-hidden border border-white/[0.04]">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress === 100 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                            : 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-[0_0_8px_rgba(124,58,237,0.3)]'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Box */}
                  <div className="grid grid-cols-3 gap-2 bg-zinc-950/40 border border-white/[0.04] p-3 rounded-2xl mt-4 text-center">
                    <div>
                      <p className="text-[10px] text-zinc-500">Requerido</p>
                      <p className="text-sm font-bold text-white mt-0.5">{item.requested}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500">Listos</p>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5">{item.assigned}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500">Pendiente</p>
                      <p className="text-sm font-bold text-amber-500 mt-0.5">{item.pending}</p>
                    </div>
                  </div>
                </div>

                {/* Operations Footer */}
                <div className="mt-6 pt-4 border-t border-white/[0.04] flex flex-col gap-3">
                  {item.pending > 0 ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Cantidad hecha"
                        value={inputVal}
                        onChange={(e) => handleQuantityInputChange(item.productId, e.target.value)}
                        className="w-full bg-zinc-950/50 border border-white/[0.08] focus:border-violet-500/50 rounded-xl px-3 text-xs text-white focus:outline-none"
                        min="1"
                        max={item.pending}
                      />
                      <PremiumButton
                        onClick={() => handleRegisterProduction(item.productId)}
                        disabled={actionLoading === item.productId || !inputVal}
                        className="shrink-0 text-xs py-2"
                      >
                        {actionLoading === item.productId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Asignar"
                        )}
                      </PremiumButton>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                      Producción Completada
                    </div>
                  )}

                  {/* Quick Addition Buttons */}
                  {item.pending > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRegisterProduction(item.productId, 1)}
                        disabled={actionLoading !== null}
                        className="flex-1 py-1.5 bg-zinc-950/50 border border-white/[0.06] hover:bg-violet-600/15 hover:border-violet-500/30 text-[10px] text-zinc-400 hover:text-violet-300 font-semibold rounded-lg transition-colors"
                      >
                        +1 Listo
                      </button>
                      {item.pending >= 5 && (
                        <button
                          onClick={() => handleRegisterProduction(item.productId, 5)}
                          disabled={actionLoading !== null}
                          className="flex-1 py-1.5 bg-zinc-950/50 border border-white/[0.06] hover:bg-violet-600/15 hover:border-violet-500/30 text-[10px] text-zinc-400 hover:text-violet-300 font-semibold rounded-lg transition-colors"
                        >
                          +5 Listos
                        </button>
                      )}
                      {item.pending >= 10 && (
                        <button
                          onClick={() => handleRegisterProduction(item.productId, 10)}
                          disabled={actionLoading !== null}
                          className="flex-1 py-1.5 bg-zinc-950/50 border border-white/[0.06] hover:bg-violet-600/15 hover:border-violet-500/30 text-[10px] text-zinc-400 hover:text-violet-300 font-semibold rounded-lg transition-colors"
                        >
                          +10 Listos
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
