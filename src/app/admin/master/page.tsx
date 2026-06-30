"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Store, Users, ShoppingBag, DollarSign, Edit, Plus, X, Check, ShieldAlert } from "lucide-react";
import { getCurrentGlobalUser } from "@/app/actions/auth";
import { getAllTenants, getSystemStats, updateTenantPlanAndStatus } from "@/app/actions/master";
import { createTenant } from "@/app/actions/tenant";
import { PremiumButton } from "@/components/ui/PremiumButton";

export default function MasterDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit Subscription Modal States
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [newPlan, setNewPlan] = useState("BASIC");
  const [newStatus, setNewStatus] = useState("TRIAL");
  const [maxProducts, setMaxProducts] = useState(20);
  const [maxOrders, setMaxOrders] = useState(30);

  // New Tenant (Onboarding) Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantSlug, setNewTenantSlug] = useState("");
  const [newTenantDesc, setNewTenantDesc] = useState("");
  const [newTenantType, setNewTenantType] = useState<"ROPA" | "VIANDA" | "PASTELERIA">("VIANDA");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        const user = await getCurrentGlobalUser();
        if (!user || !user.isSuperAdmin) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        setIsAdmin(true);
        await loadData();
      } catch (err) {
        setIsAdmin(false);
      }
      setLoading(false);
    }
    checkAuthAndLoad();
  }, []);

  async function loadData() {
    setError("");
    const [tenantsRes, statsRes] = await Promise.all([
      getAllTenants(),
      getSystemStats()
    ]);

    if (tenantsRes.success) {
      setTenants(tenantsRes.data || []);
    } else {
      setError(tenantsRes.error || "Error al cargar inquilinos.");
    }

    if (statsRes.success) {
      setStats(statsRes.data);
    }
  }

  const handleEditClick = (tenant: any) => {
    setEditingTenant(tenant);
    setNewPlan(tenant.planType);
    setNewStatus(tenant.status);
    setMaxProducts(tenant.maxProductsAllowed);
    setMaxOrders(tenant.maxOrdersAllowedPerMonth);
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await updateTenantPlanAndStatus(editingTenant.id, {
      planType: newPlan,
      status: newStatus,
      maxProductsAllowed: maxProducts,
      maxOrdersAllowedPerMonth: maxOrders
    });

    setSaving(false);
    if (res.success) {
      setSuccess(`Plan de ${editingTenant.name} actualizado con éxito.`);
      setEditingTenant(null);
      await loadData();
    } else {
      setError(res.error || "Error al actualizar suscripción.");
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await createTenant({
      name: newTenantName,
      slug: newTenantSlug,
      description: newTenantDesc,
      type: newTenantType
    });

    setSaving(false);
    if (res.success) {
      setSuccess(`Comercio "${newTenantName}" creado con éxito.`);
      setShowAddModal(false);
      // Reset form
      setNewTenantName("");
      setNewTenantSlug("");
      setNewTenantDesc("");
      setNewTenantType("VIANDA");
      await loadData();
    } else {
      setError(res.error || "Error al crear comercio.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-black text-white">Acceso Denegado</h1>
        <p className="text-sm text-zinc-500 max-w-sm mt-2">
          Debes estar autenticado con una cuenta de Superadmin para acceder al panel maestro `/admin/master`.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 relative overflow-hidden">
      {/* Decorative Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-[400px] h-[400px] rounded-full blur-[160px] pointer-events-none bg-amber-500/5" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full blur-[160px] pointer-events-none bg-orange-600/5" />

      <div className="max-w-7xl mx-auto z-10 relative flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
          <div>
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Panel de Administración Central</span>
            <h1 className="text-3xl font-black text-white tracking-tight mt-0.5">Master Console</h1>
          </div>
          <PremiumButton
            onClick={() => setShowAddModal(true)}
            variant="primary"
            size="md"
            glow
            className="flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Alta Nuevo Comercio
          </PremiumButton>
        </div>

        {/* Feedback Alert */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl font-medium flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-500" /> {success}
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-zinc-900/30 border border-zinc-900 backdrop-blur-md p-6 rounded-3xl flex items-center gap-5">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <DollarSign className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">MRR Estimado</p>
                <h3 className="text-2xl font-black text-white mt-1">${stats.mrrEstimate} USD</h3>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-900 backdrop-blur-md p-6 rounded-3xl flex items-center gap-5">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <Store className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Tiendas Activas</p>
                <h3 className="text-2xl font-black text-white mt-1">{stats.activeShops} / {tenants.length}</h3>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-900 backdrop-blur-md p-6 rounded-3xl flex items-center gap-5">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <ShoppingBag className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Pedidos Totales</p>
                <h3 className="text-2xl font-black text-white mt-1">{stats.totalOrders}</h3>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-900 backdrop-blur-md p-6 rounded-3xl">
              <p className="text-xs text-zinc-500 font-medium mb-2.5">Comercios por Rubro</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800 text-zinc-300 font-bold uppercase">
                  🍱 Viandas ({stats.rubrosCount.VIANDA})
                </span>
                <span className="text-[10px] bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800 text-zinc-300 font-bold uppercase">
                  👕 Ropa ({stats.rubrosCount.ROPA})
                </span>
                <span className="text-[10px] bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800 text-zinc-300 font-bold uppercase">
                  🍰 Pastelería ({stats.rubrosCount.PASTELERIA})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tenant Directory Table / List */}
        <div className="bg-zinc-900/30 border border-zinc-900 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl">
          <div className="px-6 py-5 border-b border-zinc-900/60 flex items-center justify-between">
            <h3 className="text-md font-bold text-white">Comercios Registrados</h3>
            <span className="text-xs text-zinc-500">{tenants.length} tiendas en total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900/60 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Comercio</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Suscripción</th>
                  <th className="px-6 py-4">Límites</th>
                  <th className="px-6 py-4">Estadísticas</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/40 text-xs">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-zinc-500">
                      No hay comercios registrados en el sistema.
                    </td>
                  </tr>
                ) : (
                  tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">
                        {t.name}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-mono">
                        {t.slug}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            t.planType === "PREMIUM" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                            t.planType === "PRO" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                            "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}>
                            Plan {t.planType}
                          </span>
                          <span className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            t.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" :
                            t.status === "TRIAL" ? "bg-cyan-500/10 text-cyan-400" :
                            "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {t.status === "SUSPENDED" ? "SUSPENDIDO" : t.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        <div className="flex flex-col gap-0.5">
                          <span>📦 Prod: {t._count.products} / {t.maxProductsAllowed}</span>
                          <span>🛒 Pedidos/Mes: {t.maxOrdersAllowedPerMonth} máx</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-bold">
                        📋 {t._count.orders} pedidos procesados
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditClick(t)}
                          className="p-2 hover:bg-zinc-800 rounded-xl transition-all inline-flex items-center gap-1.5 text-zinc-400 hover:text-amber-500 font-bold"
                        >
                          <Edit className="w-4 h-4" /> Configurar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Subscription Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 relative flex flex-col gap-4 shadow-2xl">
            <button
              onClick={() => setEditingTenant(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white">Editar Suscripción</h3>
            <p className="text-xs text-zinc-500 -mt-2">Modifica los parámetros de {editingTenant.name}</p>

            <form onSubmit={handleUpdateSubscription} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-xs text-white p-3 rounded-xl outline-none"
                >
                  <option value="BASIC">BASIC ($19/mo)</option>
                  <option value="PRO">PRO ($49/mo)</option>
                  <option value="PREMIUM">PREMIUM ($99/mo)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Estado de la cuenta</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-xs text-white p-3 rounded-xl outline-none"
                >
                  <option value="TRIAL">TRIAL (Período de prueba)</option>
                  <option value="ACTIVE">ACTIVE (Activo)</option>
                  <option value="SUSPENDED">SUSPENDED (Suspendido)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Productos Máximos Permitidos</label>
                <input
                  type="number"
                  value={maxProducts}
                  onChange={(e) => setMaxProducts(parseInt(e.target.value))}
                  required
                  className="bg-zinc-950 border border-zinc-800 text-xs text-white p-3 rounded-xl outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Pedidos Mensuales Permitidos</label>
                <input
                  type="number"
                  value={maxOrders}
                  onChange={(e) => setMaxOrders(parseInt(e.target.value))}
                  required
                  className="bg-zinc-950 border border-zinc-800 text-xs text-white p-3 rounded-xl outline-none"
                />
              </div>

              <PremiumButton type="submit" variant="primary" size="md" disabled={saving} glow className="justify-center py-3.5 mt-2">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
              </PremiumButton>
            </form>
          </div>
        </div>
      )}

      {/* Add Tenant / Onboarding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 relative flex flex-col gap-4 shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white">Alta de Comercio</h3>
            <p className="text-xs text-zinc-500 -mt-2">Completa los datos del onboarding rápido</p>

            <form onSubmit={handleCreateTenant} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Nombre de la Tienda</label>
                <input
                  type="text"
                  value={newTenantName}
                  onChange={(e) => {
                    setNewTenantName(e.target.value);
                    // Autofill slug
                    setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                  }}
                  required
                  placeholder="Mi local viandas"
                  className="bg-zinc-950 border border-zinc-800 text-xs text-white p-3 rounded-xl outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Slug (Ruta URL)</label>
                <input
                  type="text"
                  value={newTenantSlug}
                  onChange={(e) => setNewTenantSlug(e.target.value)}
                  required
                  placeholder="mi-local-viandas"
                  className="bg-zinc-950 border border-zinc-800 text-xs text-white p-3 rounded-xl outline-none font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Rubro Principal</label>
                <select
                  value={newTenantType}
                  onChange={(e) => setNewTenantType(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-800 text-xs text-white p-3 rounded-xl outline-none"
                >
                  <option value="VIANDA">🍱 VIANDAS</option>
                  <option value="ROPA">👕 ROPA</option>
                  <option value="PASTELERIA">🍰 PASTELERÍA</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Descripción (Opcional)</label>
                <textarea
                  value={newTenantDesc}
                  onChange={(e) => setNewTenantDesc(e.target.value)}
                  placeholder="Escribe una pequeña descripción..."
                  rows={2}
                  className="bg-zinc-950 border border-zinc-800 text-xs text-white p-3 rounded-xl outline-none resize-none"
                />
              </div>

              <PremiumButton type="submit" variant="primary" size="md" disabled={saving} glow className="justify-center py-3.5 mt-2">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear e Inicializar Categorías"}
              </PremiumButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
