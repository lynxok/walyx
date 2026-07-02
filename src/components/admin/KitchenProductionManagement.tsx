"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  ChefHat, 
  Plus, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Truck,
  Check
} from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { 
  getKitchenConsolidated, 
  assignProductionStock, 
  updateOrderItemAssignment, 
  deliverOrder 
} from "@/app/actions/kitchen";

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
  const [activeSubTab, setActiveSubTab] = useState<"prep" | "dispatch">("prep");
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Accordion expanded state for product rows
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

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
      setError(err.message || "Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsolidatedData();
  }, [selectedDate]);

  const toggleProductExpand = (productId: string) => {
    setExpandedProducts(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  // Handles manual checkbox checking per individual portion in a customer's order item
  const handleCheckboxChange = async (orderItemId: string, currentAssigned: number, totalQty: number, checkIndex: number) => {
    // If checkIndex is checked, we want to set assigned quantity to checkIndex + 1
    // If checkIndex is unchecked, we set it to checkIndex (so checkIndex is now the first unchecked one)
    const isCurrentlyChecked = checkIndex < currentAssigned;
    const newAssigned = isCurrentlyChecked ? checkIndex : checkIndex + 1;

    setActionLoading(orderItemId);
    try {
      const res = await updateOrderItemAssignment(orderItemId, newAssigned);
      if (res.success) {
        await fetchConsolidatedData();
      } else {
        alert(res.error || "Error al actualizar la asignación.");
      }
    } catch (err: any) {
      alert(err.message || "Error al procesar la asignación.");
    } finally {
      setActionLoading(null);
    }
  };

  // Registers batch production via FIFO
  const handleRegisterBatchProduction = async (productId: string, qty: number) => {
    setActionLoading(productId);
    try {
      const res = await assignProductionStock(tenant.id, productId, qty, selectedDate);
      if (res.success) {
        await fetchConsolidatedData();
      } else {
        alert(res.error || "Error al asignar producción.");
      }
    } catch (err: any) {
      alert(err.message || "Error de red.");
    } finally {
      setActionLoading(null);
    }
  };

  // Marks a completed order as DELIVERED
  const handleDeliverOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const res = await deliverOrder(orderId);
      if (res.success) {
        await fetchConsolidatedData();
      } else {
        alert(res.error || "Error al despachar pedido.");
      }
    } catch (err: any) {
      alert(err.message || "Error al despachar.");
    } finally {
      setActionLoading(null);
    }
  };

  // Calculations for Dispatch SubTab
  // Groups order details by Order ID to identify which orders are completely ready for dispatch
  const getOrdersForDispatch = () => {
    const ordersMap: Record<string, {
      orderId: string;
      customerName: string;
      totalItems: number;
      assignedItems: number;
      isReady: boolean;
      itemsList: { productName: string; qty: number; assigned: number }[];
    }> = {};

    for (const prod of items) {
      for (const ord of prod.orders) {
        if (!ordersMap[ord.orderId]) {
          ordersMap[ord.orderId] = {
            orderId: ord.orderId,
            customerName: ord.customerName,
            totalItems: 0,
            assignedItems: 0,
            isReady: false,
            itemsList: []
          };
        }
        ordersMap[ord.orderId].totalItems += ord.requestedQuantity;
        ordersMap[ord.orderId].assignedItems += ord.assignedQuantity;
        ordersMap[ord.orderId].itemsList.push({
          productName: prod.productName,
          qty: ord.requestedQuantity,
          assigned: ord.assignedQuantity
        });
      }
    }

    return Object.values(ordersMap).map(o => ({
      ...o,
      isReady: o.totalItems > 0 && o.totalItems === o.assignedItems
    }));
  };

  const ordersForDispatch = getOrdersForDispatch();
  const readyOrders = ordersForDispatch.filter(o => o.isReady);
  const pendingOrders = ordersForDispatch.filter(o => !o.isReady);

  const filteredItems = items.filter(item => 
    item.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Navigation & Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/30 backdrop-blur-md border border-white/[0.06] p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-600/20 border border-violet-500/30 rounded-2xl text-violet-400">
            <ChefHat className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Cocina y Despacho
            </h2>
            <p className="text-xs text-zinc-400">
              Registra qué viandas o tortas están listas y despacha los pedidos completados a tus clientes.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* SubTab Toggle */}
          <div className="flex p-1 bg-zinc-950/60 border border-white/[0.06] rounded-xl">
            <button
              onClick={() => setActiveSubTab("prep")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeSubTab === "prep" 
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25" 
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              1. Cocina (Consolidado)
            </button>
            <button
              onClick={() => setActiveSubTab("dispatch")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeSubTab === "dispatch" 
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25" 
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              2. Despacho ({readyOrders.length})
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-3 bg-zinc-950/40 border border-white/[0.08] p-2.5 rounded-xl">
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
      </div>

      {/* Main Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-sm text-zinc-400">Actualizando datos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      ) : activeSubTab === "prep" ? (
        /* SUB-TAB 1: COCOINA CONSOLIDADO (ROW LAYOUT) */
        <div className="flex flex-col gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-4 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar plato o postre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/40 border border-white/[0.08] focus:border-violet-500/50 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none transition-all"
            />
          </div>

          {/* List Wrapper */}
          <div className="bg-zinc-950/40 border border-white/[0.06] rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-zinc-900/40 text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
                    <th className="py-4 px-6 w-10"></th>
                    <th className="py-4 px-6">Plato / Producto</th>
                    <th className="py-4 px-6 text-center">Total Demanda</th>
                    <th className="py-4 px-6 text-center">Listos</th>
                    <th className="py-4 px-6 text-center">Pendientes</th>
                    <th className="py-4 px-6 text-right">Lotes Rápidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-zinc-500">
                        No hay viandas o pasteles pendientes de preparación.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isExpanded = expandedProducts[item.productId];
                      const progress = item.requested > 0 ? (item.assigned / item.requested) * 100 : 0;

                      return (
                        <React.Fragment key={item.productId}>
                          {/* Parent Row */}
                          <tr className="hover:bg-white/[0.02] transition-colors group">
                            <td className="py-4 px-6">
                              <button
                                onClick={() => toggleProductExpand(item.productId)}
                                className="p-1 bg-zinc-900/60 border border-white/[0.06] rounded-lg text-zinc-400 hover:text-white"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                {item.imageUrl ? (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.productName} 
                                    className="w-10 h-10 rounded-lg object-cover border border-white/[0.08]"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-zinc-500">
                                    <ChefHat className="w-5 h-5" />
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">
                                    {item.productName}
                                  </div>
                                  {/* Progress bar under name */}
                                  <div className="w-32 bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-1.5 border border-white/[0.04]">
                                    <div 
                                      className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-violet-600'}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center text-sm font-semibold text-white">
                              {item.requested} un.
                            </td>
                            <td className="py-4 px-6 text-center text-sm font-semibold text-emerald-400">
                              {item.assigned} un.
                            </td>
                            <td className="py-4 px-6 text-center text-sm font-semibold text-amber-500">
                              {item.pending} un.
                            </td>
                            <td className="py-4 px-6 text-right">
                              {item.pending > 0 ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => handleRegisterBatchProduction(item.productId, 1)}
                                    disabled={actionLoading !== null}
                                    className="px-2.5 py-1 bg-zinc-900 border border-white/[0.06] hover:border-violet-500/30 text-[10px] text-zinc-400 hover:text-violet-300 rounded font-semibold transition-colors"
                                  >
                                    +1 Listo
                                  </button>
                                  {item.pending >= 5 && (
                                    <button
                                      onClick={() => handleRegisterBatchProduction(item.productId, 5)}
                                      disabled={actionLoading !== null}
                                      className="px-2.5 py-1 bg-zinc-900 border border-white/[0.06] hover:border-violet-500/30 text-[10px] text-zinc-400 hover:text-violet-300 rounded font-semibold transition-colors"
                                    >
                                      +5
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRegisterBatchProduction(item.productId, item.pending)}
                                    disabled={actionLoading !== null}
                                    className="px-2.5 py-1 bg-violet-600/20 border border-violet-500/30 text-[10px] text-violet-300 hover:bg-violet-600/30 rounded font-bold transition-colors"
                                    title="Marcar todo el pendiente como listo"
                                  >
                                    Tildar Todo
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                  Completo
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Nested Detail Row */}
                          {isExpanded && (
                            <tr className="bg-zinc-900/20">
                              <td colSpan={6} className="p-0">
                                <div className="px-16 py-4 border-t border-white/[0.03] bg-zinc-950/20">
                                  <div className="text-xs text-zinc-400 font-semibold mb-3 flex items-center gap-1.5">
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    Pedidos que contienen este plato (Criterio FIFO):
                                  </div>
                                  <div className="flex flex-col gap-2.5">
                                    {item.orders.map((ord: any) => (
                                      <div 
                                        key={ord.orderItemId}
                                        className="flex items-center justify-between bg-zinc-950/50 border border-white/[0.04] p-3 rounded-xl hover:border-white/[0.08] transition-all"
                                      >
                                        <div>
                                          <span className="text-xs font-bold text-white">{ord.customerName}</span>
                                          <span className="text-[10px] text-zinc-500 ml-2">
                                            ({new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                          </span>
                                        </div>

                                        {/* Individual Portion Interactive Checkboxes */}
                                        <div className="flex items-center gap-3">
                                          <span className="text-[10px] text-zinc-400 mr-2">
                                            Listos: {ord.assignedQuantity} / {ord.requestedQuantity}
                                          </span>
                                          <div className="flex items-center gap-1">
                                            {Array.from({ length: ord.requestedQuantity }).map((_, idx) => {
                                              const isChecked = idx < ord.assignedQuantity;
                                              const isDisabled = actionLoading === ord.orderItemId;

                                              return (
                                                <button
                                                  key={idx}
                                                  onClick={() => handleCheckboxChange(ord.orderItemId, ord.assignedQuantity, ord.requestedQuantity, idx)}
                                                  disabled={isDisabled}
                                                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                                    isChecked 
                                                      ? "bg-emerald-500 border-emerald-500 text-black font-bold shadow-[0_0_6px_rgba(16,185,129,0.3)]" 
                                                      : "border-zinc-700 bg-zinc-900 text-transparent hover:border-zinc-500"
                                                  }`}
                                                  title={`Marcar porción ${idx + 1}`}
                                                >
                                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* SUB-TAB 2: DESPACHO / PEDIDOS LISTOS PARA ENVÍO */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left panel: Ready for Delivery */}
          <div className="bg-zinc-950/40 border border-white/[0.06] p-6 rounded-3xl shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              Listos para Despacho / Envío ({readyOrders.length})
            </h3>
            <p className="text-xs text-zinc-400">
              Pedidos que ya tienen el 100% de sus viandas preparadas. Tíldalos para cambiar su estado a "Enviado" y cerrar la venta.
            </p>

            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
              {readyOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-white/[0.04] rounded-2xl">
                  No hay pedidos 100% listos para despacho todavía.
                </div>
              ) : (
                readyOrders.map(order => (
                  <div 
                    key={order.orderId}
                    className="bg-zinc-900/30 border border-white/[0.06] hover:border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{order.customerName}</div>
                      <div className="text-[10px] text-zinc-500 mt-1">
                        Contiene: {order.itemsList.map(i => `${i.qty}x ${i.productName}`).join(", ")}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeliverOrder(order.orderId)}
                      disabled={actionLoading === order.orderId}
                      className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 text-emerald-400 hover:text-black text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
                    >
                      {actionLoading === order.orderId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Truck className="w-3.5 h-3.5" />
                          Marcar Enviado
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right panel: Remaining/Pending preparation */}
          <div className="bg-zinc-950/40 border border-white/[0.06] p-6 rounded-3xl shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              En Cocina / Incompletos ({pendingOrders.length})
            </h3>
            <p className="text-xs text-zinc-400">
              Pedidos parcialmente preparados que aún esperan viandas pendientes de cocción.
            </p>

            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
              {pendingOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-white/[0.04] rounded-2xl">
                  No hay pedidos pendientes de cocción.
                </div>
              ) : (
                pendingOrders.map(order => {
                  const percent = Math.round((order.assignedItems / order.totalItems) * 100);
                  return (
                    <div 
                      key={order.orderId}
                      className="bg-zinc-900/10 border border-white/[0.04] p-4 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-zinc-300">{order.customerName}</div>
                        <div className="text-[10px] text-zinc-500 mt-1">
                          Preparado: {order.assignedItems} de {order.totalItems} viandas ({percent}%)
                        </div>
                      </div>

                      <div className="w-16 text-right">
                        <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
