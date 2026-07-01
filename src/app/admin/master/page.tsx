"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Store, Users, ShoppingBag, DollarSign, Edit, Plus, X, Check, ShieldAlert, KeyRound, Eye, EyeOff, TrendingUp, BarChart3, Award } from "lucide-react";
import { getCurrentGlobalUser } from "@/app/actions/auth";
import { getAllTenants, getSystemStats, updateTenantPlanAndStatus, updateTenantPasswordAdmin } from "@/app/actions/master";
import { createTenant } from "@/app/actions/tenant";
import { PremiumButton } from "@/components/ui/PremiumButton";
import Link from "next/link";

function PasswordRevealer({ password }: { password: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="inline-flex items-center gap-1.5 bg-zinc-950/60 border border-zinc-800/80 px-2 py-0.5 rounded-lg text-[10px] text-zinc-400 font-mono">
      <span>{revealed ? password : "••••••••"}</span>
      <button 
        type="button" 
        onClick={() => setRevealed(!revealed)}
        className="text-zinc-500 hover:text-zinc-300 transition-colors ml-0.5"
      >
        {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
    </div>
  );
}

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

  // Change Password Modal States
  const [passwordTenant, setPasswordTenant] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [saving, setSaving] = useState(false);

  // Analytics calculations
  const storeRankings = React.useMemo(() => {
    return tenants.map(t => {
      const totalSales = t.orders?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0;
      const orderCount = t.orders?.length || 0;
      const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;
      const type = t.categories?.[0]?.type || "VIANDA";
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        totalSales,
        orderCount,
        avgTicket,
        type,
        plainPassword: t.plainPassword,
        passwordHash: t.passwordHash,
        planType: t.planType,
        status: t.status,
        maxProductsAllowed: t.maxProductsAllowed,
        maxOrdersAllowedPerMonth: t.maxOrdersAllowedPerMonth,
        _count: t._count
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [tenants]);

  const totalEconomicFlow = React.useMemo(() => {
    return storeRankings.reduce((acc, t) => acc + t.totalSales, 0);
  }, [storeRankings]);

  const rubroStats = React.useMemo(() => {
    const counts = { ROPA: 0, VIANDA: 0, PASTELERIA: 0 };
    storeRankings.forEach(t => {
      const type = t.type as keyof typeof counts;
      if (counts[type] !== undefined) {
        counts[type]++;
      } else {
        counts.VIANDA++;
      }
    });
    const total = storeRankings.length || 1;
    return {
      counts,
      pct: {
        ROPA: (counts.ROPA / total) * 100,
        VIANDA: (counts.VIANDA / total) * 100,
        PASTELERIA: (counts.PASTELERIA / total) * 100,
      }
    };
  }, [storeRankings]);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTenant) return;
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await updateTenantPasswordAdmin(passwordTenant.id, newPassword);
    setSaving(false);

    if (res.success) {
      setSuccess(`Contraseña de ${passwordTenant.name} cambiada con éxito.`);
      setPasswordTenant(null);
      setNewPassword("");
      await loadData();
    } else {
      setError(res.error || "Error al cambiar la contraseña.");
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantSlug) return;
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
    if (res.success && res.data) {
      setSuccess(`Negocio '${res.data.name}' creado con éxito.`);
      setShowAddModal(false);
      // Reset form
      setNewTenantName("");
      setNewTenantSlug("");
      setNewTenantDesc("");
      setNewTenantType("VIANDA");
      await loadData();
    } else {
      setError(res.error || "Error al crear inquilino.");
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
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-black text-white">Acceso Denegado</h1>
        <p className="text-zinc-500 text-xs mt-1.5 max-w-sm">No tienes permisos de administrador para ver este panel central.</p>
        <Link href="/" className="mt-6 text-xs text-amber-500 font-bold hover:underline">Volver al inicio</Link>
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

        {/* Premium Analytics Dashboard */}
        {stats && tenants.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Economic Summary & Rubros */}
            <div className="lg:col-span-1 bg-zinc-900/30 border border-zinc-900 backdrop-blur-md p-6 rounded-3xl flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider mb-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Rendimiento Global</span>
                </div>
                <h3 className="text-lg font-black text-white">Flujo Económico</h3>
                <p className="text-zinc-500 text-xs mt-0.5">Volumen transaccionado total acumulado por tiendas.</p>
                <div className="mt-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Flujo Económico Total</span>
                  <span className="text-3xl font-black text-emerald-400 mt-1">${totalEconomicFlow.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="border-t border-zinc-900/80 pt-5">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider mb-3">
                  <BarChart3 className="w-4 h-4" />
                  <span>Distribución por Rubro</span>
                </div>
                <div className="flex flex-col gap-3">
                  {/* Vianda */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-zinc-300">
                      <span>🍱 Viandas ({rubroStats.counts.VIANDA})</span>
                      <span>{rubroStats.pct.VIANDA.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500" style={{ width: `${rubroStats.pct.VIANDA}%` }} />
                    </div>
                  </div>
                  {/* Ropa */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-zinc-300">
                      <span>👕 Ropa ({rubroStats.counts.ROPA})</span>
                      <span>{rubroStats.pct.ROPA.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${rubroStats.pct.ROPA}%` }} />
                    </div>
                  </div>
                  {/* Pasteleria */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold text-zinc-300">
                      <span>🍰 Pastelería ({rubroStats.counts.PASTELERIA})</span>
                      <span>{rubroStats.pct.PASTELERIA.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500" style={{ width: `${rubroStats.pct.PASTELERIA}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Sales Rankings */}
            <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-900 backdrop-blur-md p-6 rounded-3xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                    <Award className="w-4 h-4" />
                    <span>Líderes de Venta</span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">Ranking de Comercios</h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase bg-zinc-950/60 border border-zinc-800 px-2 py-1 rounded-lg">Por Volumen</span>
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto max-h-[260px] pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {storeRankings.length === 0 ? (
                  <p className="text-zinc-500 text-xs py-8 text-center">No hay datos de ventas disponibles.</p>
                ) : (
                  storeRankings.map((t, idx) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl hover:border-zinc-800/80 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                          idx === 0 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                          idx === 1 ? "bg-zinc-300/10 text-zinc-300 border border-zinc-300/20" :
                          idx === 2 ? "bg-amber-700/10 text-amber-700 border border-amber-700/20" :
                          "bg-zinc-900 text-zinc-500 border border-zinc-800"
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white flex items-center gap-1.5">
                            {t.name}
                            <span className="text-[9px] text-zinc-500 font-normal">({t.slug})</span>
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5 flex gap-2">
                            <span>📦 {t.orderCount} pedidos</span>
                            <span>•</span>
                            <span>🎫 Avg ticket: ${t.avgTicket.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-400">${t.totalSales.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
                        <p className="text-[9px] text-zinc-600 font-bold uppercase mt-0.5">
                          {t.type === "VIANDA" ? "🍱 VIANDA" : t.type === "ROPA" ? "👕 ROPA" : "🍰 PASTELERÍA"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
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
                  <th className="px-6 py-4">Estadísticas y Clave</th>
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
                        <div className="flex flex-col gap-1">
                          <span>{t.name}</span>
                          {!t.passwordHash && (
                            <span className="inline-flex self-start text-[9px] font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Sin Clave Configurada
                            </span>
                          )}
                        </div>
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
                        <div className="flex flex-col gap-1.5">
                          <span>📋 {t._count.orders} pedidos procesados</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-zinc-500 font-normal">Clave:</span>
                            {t.plainPassword ? (
                              <PasswordRevealer password={t.plainPassword} />
                            ) : (
                              <span className="text-[10px] text-zinc-600 font-normal italic">No disponible</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => { setPasswordTenant(t); setNewPassword(""); }}
                            className="p-2 hover:bg-zinc-800 rounded-xl transition-all inline-flex items-center gap-1.5 text-zinc-400 hover:text-orange-400 font-bold"
                          >
                            <KeyRound className="w-4 h-4" /> Clave
                          </button>
                          <button
                            onClick={() => handleEditClick(t)}
                            className="p-2 hover:bg-zinc-800 rounded-xl transition-all inline-flex items-center gap-1.5 text-zinc-400 hover:text-amber-500 font-bold"
                          >
                            <Edit className="w-4 h-4" /> Configurar
                          </button>
                        </div>
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

      {/* Change Password Modal */}
      {passwordTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 relative flex flex-col gap-4 shadow-2xl">
            <button
              onClick={() => setPasswordTenant(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white">Asignar Contraseña</h3>
            <p className="text-xs text-zinc-500 -mt-2">Establece una contraseña de panel para {passwordTenant.name}</p>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Nueva Contraseña (mín. 6 caracteres)</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="bg-zinc-950 border border-zinc-800 text-xs text-white p-3 pr-11 rounded-xl outline-none w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <PremiumButton type="submit" variant="primary" size="md" disabled={saving || newPassword.length < 6} glow className="justify-center py-3.5 mt-2 bg-gradient-to-r from-orange-500 to-amber-500">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Contraseña"}
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
