"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  AlertTriangle, 
  Plus, 
  Minus,
  FileText,
  X
} from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { updateProduct } from "@/app/actions/product";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  type: string;
  price?: number | null;
}

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  categoryId: string;
  category?: Category | null;
}

interface StockAdjustmentLog {
  id: string;
  productName: string;
  qty: number;
  reason: string;
  timestamp: Date;
}

interface KanbanProduct {
  name: string;
  quantity: number;
  variant?: string;
  price: number;
  notes?: string;
  productId?: string;
}

interface KanbanOrder {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryCost: number;
  deliveryZone: string;
  dateTimeSlot: string;
  products: KanbanProduct[];
  total: number;
  createdAt: Date;
}

interface StockManagementProps {
  tenant: Tenant;
  categories: Category[];
  products: Product[];
  kanbanOrders: KanbanOrder[];
  onRefresh: () => void;
}

export default function StockManagement({
  tenant,
  categories,
  products,
  kanbanOrders,
  onRefresh
}: StockManagementProps) {
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  
  // Stock Movement Form State
  const [stockMovementProdId, setStockMovementProdId] = useState(products[0]?.id || "");
  const [stockMovementQty, setStockMovementQty] = useState<number>(0);
  const [stockMovementReason, setStockMovementReason] = useState("Ingreso manual");
  const [submittingMovement, setSubmittingMovement] = useState(false);

  // Manual Adjustments History Log (Stateful MVP)
  const [adjustmentLogs, setAdjustmentLogs] = useState<StockAdjustmentLog[]>(() => [
    {
      id: "1",
      productName: products[0]?.name || "Producto Inicial",
      qty: 10,
      reason: "Ingreso de mercadería inicial",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: "2",
      productName: products[1]?.name || "Producto Secundario",
      qty: -2,
      reason: "Ajuste por rotura / descarte",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  ]);

  // Reservation details modal
  const [selectedReservedProduct, setSelectedReservedProduct] = useState<Product | null>(null);

  interface ReservationDetail {
    orderId: string;
    customerName: string;
    quantity: number;
    variant?: string;
    dateTimeSlot: string;
    status: string;
  }

  // Calculate dynamic reserves per product
  const productReservations = useMemo(() => {
    const reservations: Record<string, { total: number; details: ReservationDetail[] }> = {};
    
    // Initialize for all products
    products.forEach((p) => {
      reservations[p.id] = { total: 0, details: [] };
    });

    // Scan kanbanOrders for PENDING or PREPARING status
    kanbanOrders.forEach((order) => {
      if (order.status === "PENDING" || order.status === "PREPARING") {
        order.products.forEach((op: KanbanProduct) => {
          // Match by name or ID
          const matchedProduct = products.find(
            (p) => p.id === op.productId || p.name.toLowerCase() === op.name.toLowerCase()
          );

          if (matchedProduct) {
            reservations[matchedProduct.id].total += op.quantity;
            reservations[matchedProduct.id].details.push({
              orderId: order.id,
              customerName: order.customer.name,
              quantity: op.quantity,
              variant: op.variant,
              dateTimeSlot: order.dateTimeSlot,
              status: order.status
            });
          }
        });
      }
    });

    return reservations;
  }, [products, kanbanOrders]);

  // Compute products table data
  const processedProducts = useMemo(() => {
    return products.map((p) => {
      const reserved = productReservations[p.id]?.total || 0;
      const available = p.stock - reserved;
      return {
        ...p,
        reserved,
        available
      };
    });
  }, [products, productReservations]);

  // Filtered processed products
  const filteredProducts = useMemo(() => {
    return processedProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryId === "all" || p.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [processedProducts, searchQuery, selectedCategoryId]);

  // Count products with stock deficit
  const deficitCount = useMemo(() => {
    return processedProducts.filter((p) => p.available < 0).length;
  }, [processedProducts]);

  // Handle Manual Stock Movement registration
  const handleApplyStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockMovementProdId || stockMovementQty === 0) return;

    const prod = products.find((p) => p.id === stockMovementProdId);
    if (!prod) return;

    setSubmittingMovement(true);
    const res = await updateProduct(stockMovementProdId, {
      tenantId: tenant.id,
      categoryId: prod.categoryId,
      price: prod.price,
      name: prod.name,
      stock: prod.stock + stockMovementQty,
    });
    setSubmittingMovement(false);

    if (res.success) {
      // Append to local adjustment logs
      const newLog: StockAdjustmentLog = {
        id: Math.random().toString(),
        productName: prod.name,
        qty: stockMovementQty,
        reason: stockMovementReason,
        timestamp: new Date()
      };
      setAdjustmentLogs(prev => [newLog, ...prev]);

      setStockMovementQty(0);
      setStockMovementReason("Ingreso manual");
      onRefresh();
    } else {
      alert(res.error || "Error al registrar el movimiento.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-xl font-bold text-white">Control de Inventario</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Gestión de stock físico, reservas en preparación y stock neto de venta.</p>
      </div>

      {/* DEFICIT BANNER ALERT */}
      {deficitCount > 0 && (
        <div className="flex items-center gap-3 bg-red-950/40 border border-red-900/60 text-red-200 px-4 py-3 rounded-2xl text-xs animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <span className="font-bold text-red-400">¡Alerta de Déficit de Inventario!</span> Hay <span className="font-black underline">{deficitCount}</span> {deficitCount === 1 ? "producto" : "productos"} con stock disponible negativo (más reservas activas que stock físico). Por favor, ingresa mercadería o resuelve los pedidos pendientes.
          </div>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900/60 pb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider shrink-0">Categoría:</span>
          <button
            onClick={() => setSelectedCategoryId("all")}
            className={`px-3 py-1.5 rounded-xl text-xs border transition-all shrink-0 ${
              selectedCategoryId === "all"
                ? "bg-amber-500/10 border-amber-500 text-amber-400 font-bold"
                : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategoryId(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs border transition-all shrink-0 ${
                selectedCategoryId === c.id
                  ? "bg-amber-500/10 border-amber-500 text-amber-400 font-bold"
                  : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PRODUCTS STOCK GRID */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-zinc-900 bg-zinc-900/10 overflow-hidden">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Detalle de Inventario</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Producto</th>
                    <th className="py-3 px-2 text-center w-24">Físico</th>
                    <th className="py-3 px-2 text-center w-28">Reservado</th>
                    <th className="py-3 px-2 text-center w-24">Disponible</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-zinc-500">
                        No se encontraron productos.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const hasDeficit = p.available < 0;
                      
                      return (
                        <tr key={p.id} className="border-b border-zinc-900/40 hover:bg-zinc-900/10 transition-colors">
                          <td className="py-3 px-2">
                            <div>
                              <p className="text-white font-bold">{p.name}</p>
                              <p className="text-[10px] text-zinc-500">{p.category?.name || "Sin Categoría"}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center font-bold font-mono text-zinc-300">
                            {p.stock}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {p.reserved > 0 ? (
                              <button
                                onClick={() => setSelectedReservedProduct(p)}
                                title="Ver pedidos que reservan"
                                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-black font-mono transition-all inline-flex items-center gap-1 cursor-pointer"
                              >
                                {p.reserved} reservadas
                              </button>
                            ) : (
                              <span className="text-zinc-600 font-mono">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {hasDeficit ? (
                              <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-black font-mono inline-flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                {p.available}
                              </span>
                            ) : (
                              <span className={`font-black font-mono ${p.available === 0 ? "text-zinc-500" : "text-emerald-400"}`}>
                                {p.available}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SIDE PANELS (Movement and Logs) */}
        <div className="flex flex-col gap-6">
          
          {/* Nuevo Movimiento */}
          <div className="glass-panel p-5 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Nuevo Movimiento</h3>
            <form onSubmit={handleApplyStockMovement} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-[10px] font-bold uppercase">Producto</label>
                <select
                  value={stockMovementProdId}
                  onChange={(e) => setStockMovementProdId(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none w-full"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-[10px] font-bold uppercase">Cantidad (Positiva/Negativa)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStockMovementQty(prev => prev - 1)}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 rounded-xl border border-zinc-900 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    placeholder="Ej. +10 o -5"
                    value={stockMovementQty === 0 ? "" : stockMovementQty}
                    onChange={(e) => setStockMovementQty(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-900 text-xs text-white text-center p-3 rounded-xl outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setStockMovementQty(prev => prev + 1)}
                    className="p-3 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 rounded-xl border border-zinc-900 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 text-[10px] font-bold uppercase">Motivo</label>
                <input
                  type="text"
                  required
                  value={stockMovementReason}
                  onChange={(e) => setStockMovementReason(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                />
              </div>

              <PremiumButton
                type="submit"
                variant="primary"
                size="sm"
                className="w-full justify-center"
                disabled={submittingMovement || stockMovementQty === 0}
              >
                {submittingMovement ? "Registrando..." : "Registrar Ajuste"}
              </PremiumButton>

            </form>
          </div>

          {/* Historial de Ajustes */}
          <div className="glass-panel p-5 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-2.5">
              <FileText className="w-4 h-4 text-zinc-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Historial de Ajustes</h3>
            </div>
            
            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
              {adjustmentLogs.map((log) => (
                <div key={log.id} className="border-b border-zinc-900/40 pb-3 flex items-center justify-between text-xs last:border-0 last:pb-0">
                  <div>
                    <p className="text-white font-semibold">{log.productName}</p>
                    <p className="text-zinc-500 text-[9px] mt-0.5">{log.reason}</p>
                    <p className="text-zinc-600 text-[8px] mt-0.5">
                      {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                    </p>
                  </div>
                  <span className={`font-black font-mono shrink-0 ${log.qty > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {log.qty > 0 ? `+${log.qty}` : log.qty} u.
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ACTIVE RESERVATIONS MODAL */}
      {selectedReservedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-900 w-full max-w-xl rounded-3xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-white">Detalle de Reservas</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Producto: <span className="text-zinc-300 font-bold">{selectedReservedProduct.name}</span></p>
              </div>
              <button
                onClick={() => setSelectedReservedProduct(null)}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {productReservations[selectedReservedProduct.id]?.details.map((det: ReservationDetail, idx: number) => (
                <div 
                  key={idx} 
                  className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2">
                    <span className="text-[10px] font-black text-amber-500 bg-amber-500/5 px-2 py-0.5 border border-amber-500/20 rounded-md">
                      #{det.orderId}
                    </span>
                    <span className={`text-[9px] uppercase font-black tracking-wider ${det.status === "PENDING" ? "text-yellow-400" : "text-blue-400"}`}>
                      {det.status === "PENDING" ? "Pendiente" : "Preparando"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold">Cliente</p>
                      <p className="text-white font-semibold mt-0.5">{det.customerName}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold">Cantidad Reservada</p>
                      <p className="text-white font-black font-mono mt-0.5">{det.quantity}x <span className="text-[10px] text-zinc-500 font-normal">({det.variant || "Estándar"})</span></p>
                    </div>
                  </div>

                  <div className="text-[10px] text-zinc-500 border-t border-zinc-900/40 pt-2 flex items-center justify-between">
                    <span>Horario Slot: {det.dateTimeSlot}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-900">
              <PremiumButton 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedReservedProduct(null)}
              >
                Cerrar Detalle
              </PremiumButton>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
