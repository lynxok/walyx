"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Package,
  Calendar,
  Layers,
  Activity,
  CreditCard,
  Settings as SettingsIcon,
  Trash2,
  Edit,
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  CheckSquare
} from "lucide-react";
import { getTenantBySlug } from "@/app/actions/tenant";
import { getCategoriesByTenant, createCategory, updateCategory, deleteCategory } from "@/app/actions/category";
import { getProductsByTenant, createProduct, updateProduct, deleteProduct } from "@/app/actions/product";
import { getWeeklyMenuByStartDate, saveWeeklyMenu } from "@/app/actions/weeklyMenu";
import { getHolidayForDate } from "@/lib/holidays";
import { getDashboardStats, DashboardStats } from "@/app/actions/dashboard";
import { PremiumButton } from "@/components/ui/PremiumButton";

export default function AdminDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  const [activeTab, setActiveTab] = useState("dashboard");
  const [tenant, setTenant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const hasType = categories.length > 0 ? categories[0].type : "VIANDA";
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Product Form state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState(0);
  const [prodStock, setProdStock] = useState(0);
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  // Clothing
  const [prodSize, setProdSize] = useState("");
  const [prodColor, setProdColor] = useState("");
  const [prodMaterial, setProdMaterial] = useState("");
  // Viandas
  const [prodCalories, setProdCalories] = useState(0);
  const [prodIngredients, setProdIngredients] = useState("");
  const [prodIsVegan, setProdIsVegan] = useState(false);
  const [prodIsGlutenFree, setProdIsGlutenFree] = useState(false);
  // Pasteleria
  const [prodSweetness, setProdSweetness] = useState("");
  const [prodPortions, setProdPortions] = useState(1);

  // Manual stock movement states
  const [stockMovementProdId, setStockMovementProdId] = useState("");
  const [stockMovementQty, setStockMovementQty] = useState(0);
  const [stockMovementReason, setStockMovementReason] = useState("Ingreso de mercadería");

  // Category management state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catName, setCatName] = useState("");
  const [catPrice, setCatPrice] = useState<number>(0);
  const [categoryError, setCategoryError] = useState("");

  // Insumos/Recipes states
  const [insumos, setInsumos] = useState<string[]>(["Harina 0000", "Pollo Pechuga", "Zanahoria fresca", "Dulce de Leche Repostero"]);

  // Cash Register states
  const [cashAmount, setCashAmount] = useState("0");
  const [transferAmount, setTransferAmount] = useState("0");
  const [expenses, setExpenses] = useState("0");
  const [cashDifference, setCashDifference] = useState<number | null>(null);
  const [cashCloseSuccess, setCashCloseSuccess] = useState(false);

  // Dynamic Weekly Menu states (for Viandas)
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [weeklyMenuData, setWeeklyMenuData] = useState<Record<string, { productId: string; limit: number; isClosed: boolean; holidayName: string | null }>>({
    Lunes: { productId: "", limit: 30, isClosed: false, holidayName: null },
    Martes: { productId: "", limit: 30, isClosed: false, holidayName: null },
    Miércoles: { productId: "", limit: 30, isClosed: false, holidayName: null },
    Jueves: { productId: "", limit: 30, isClosed: false, holidayName: null },
    Viernes: { productId: "", limit: 30, isClosed: false, holidayName: null },
    Sábado: { productId: "", limit: 30, isClosed: false, holidayName: null },
    Domingo: { productId: "", limit: 30, isClosed: false, holidayName: null },
  });

  const getPlanningWeeks = () => {
    const weeks = [];
    const today = new Date();
    const day = today.getDay();
    // Monday of current week
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startMonday = new Date(today.setDate(diff));
    startMonday.setHours(0, 0, 0, 0);

    for (let i = 0; i < 5; i++) {
      const mon = new Date(startMonday);
      mon.setDate(startMonday.getDate() + i * 7);
      
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      
      const formattedMon = mon.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
      const formattedSun = sun.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
      
      weeks.push({
        label: `Semana ${i + 1}`,
        dateRange: `${formattedMon} al ${formattedSun}`,
        startDateStr: mon.toISOString().split("T")[0],
      });
    }
    return weeks;
  };

  const planningWeeks = getPlanningWeeks();

  const fetchData = async () => {
    setLoading(true);
    setError("");

    const tenantRes = await getTenantBySlug(tenantSlug);
    if (!tenantRes.success || !tenantRes.data) {
      setError(tenantRes.error || "Inquilino no encontrado.");
      setLoading(false);
      return;
    }

    setTenant(tenantRes.data);
    setCategories(tenantRes.data.categories || []);

    const productsRes = await getProductsByTenant(tenantRes.data.id);
    if (productsRes.success && productsRes.data) {
      setProducts(productsRes.data);
      if (productsRes.data.length > 0) {
        setStockMovementProdId(productsRes.data[0].id);
      }
    }

    const statsRes = await getDashboardStats(tenantRes.data.id);
    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tenantSlug]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setProdName("");
    setProdDesc("");
    setProdPrice(0);
    setProdStock(0);
    setProdImageUrl("");
    setProdCategoryId(categories[0]?.id || "");
    setProdSize("");
    setProdColor("");
    setProdMaterial("");
    setProdCalories(0);
    setProdIngredients("");
    setProdIsVegan(false);
    setProdIsGlutenFree(false);
    setProdSweetness("");
    setProdPortions(1);
    setShowProductModal(true);
  };

  const handleOpenEditModal = (p: any) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDesc(p.description || "");
    setProdPrice(p.price);
    setProdStock(p.stock);
    setProdImageUrl(p.imageUrl || "");
    setProdCategoryId(p.categoryId);
    setProdSize(p.size || "");
    setProdColor(p.color || "");
    setProdMaterial(p.material || "");
    setProdCalories(p.calories || 0);
    setProdIngredients(p.ingredients || "");
    setProdIsVegan(p.isVegan || false);
    setProdIsGlutenFree(p.isGlutenFree || false);
    setProdSweetness(p.sweetnessLevel || "");
    setProdPortions(p.portions || 1);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasType = categories.length > 0 ? categories[0].type : "VIANDA";
    const inheritedPrice = hasType === "VIANDA" 
      ? (categories.find(c => c.id === prodCategoryId)?.price || 0)
      : prodPrice;

    if (!prodName || inheritedPrice <= 0 || !prodCategoryId) {
      alert("Por favor asegúrate de que el producto tenga un nombre, categoría y precio válido.");
      return;
    }

    const payload = {
      name: prodName,
      description: prodDesc,
      price: inheritedPrice,
      stock: prodStock,
      imageUrl: prodImageUrl,
      tenantId: tenant.id,
      categoryId: prodCategoryId,
      size: prodSize || undefined,
      color: prodColor || undefined,
      material: prodMaterial || undefined,
      calories: prodCalories || undefined,
      ingredients: prodIngredients || undefined,
      isVegan: prodIsVegan,
      isGlutenFree: prodIsGlutenFree,
      sweetnessLevel: prodSweetness || undefined,
      portions: prodPortions || undefined,
    };

    let res;
    if (editingProduct) {
      res = await updateProduct(editingProduct.id, payload);
    } else {
      res = await createProduct(payload);
    }

    if (res.success) {
      setShowProductModal(false);
      fetchData();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      const res = await deleteProduct(id);
      if (res.success) {
        fetchData();
      }
    }
  };

  const handleApplyStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockMovementProdId || stockMovementQty === 0) return;

    const prod = products.find((p) => p.id === stockMovementProdId);
    if (!prod) return;

    const res = await updateProduct(stockMovementProdId, {
      tenantId: tenant.id,
      categoryId: prod.categoryId,
      price: prod.price,
      name: prod.name,
      stock: prod.stock + stockMovementQty,
    });

    if (res.success) {
      alert("Movimiento de stock registrado correctamente.");
      setStockMovementQty(0);
      fetchData();
    }
  };

  const handleCalculateCashDifference = (e: React.FormEvent) => {
    e.preventDefault();
    const systemTotal = stats?.dailyClose.reduce((sum: number, d: any) => sum + d.totalRevenue, 0) || 0;
    const userTotal = parseFloat(cashAmount) + parseFloat(transferAmount) - parseFloat(expenses);
    setCashDifference(userTotal - systemTotal);
    setCashCloseSuccess(true);
  };

  const handleOpenCreateCategoryModal = () => {
    setEditingCategory(null);
    setCatName("");
    setCatPrice(0);
    setCategoryError("");
    setShowCategoryModal(true);
  };

  const handleOpenEditCategoryModal = (cat: any) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatPrice(cat.price || 0);
    setCategoryError("");
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    const catSlug = catName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let res;
    if (editingCategory) {
      res = await updateCategory(editingCategory.id, {
        name: catName,
        slug: catSlug,
        type: hasType,
        price: hasType === "VIANDA" ? catPrice : undefined,
      });
    } else {
      res = await createCategory({
        name: catName,
        slug: catSlug,
        type: hasType,
        price: hasType === "VIANDA" ? catPrice : undefined,
        tenantId: tenant.id,
      });
    }

    if (res.success) {
      setShowCategoryModal(false);
      fetchData();
    } else {
      setCategoryError(res.error || "Error al guardar la categoría.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta categoría? Se eliminarán también todos los productos asociados debido al borrado en cascada.")) {
      const res = await deleteCategory(id);
      if (res.success) {
        fetchData();
      } else {
        alert(res.error || "Error al eliminar la categoría.");
      }
    }
  };

  // Sync product price with category price automatically when category changes (VIANDA only)
  useEffect(() => {
    if (hasType === "VIANDA" && prodCategoryId) {
      const selectedCat = categories.find((c) => c.id === prodCategoryId);
      if (selectedCat && selectedCat.price !== null && selectedCat.price !== undefined) {
        setProdPrice(selectedCat.price);
      }
    }
  }, [prodCategoryId, categories, hasType]);

  // Dynamic Weekly Menu fetch for the selected week
  useEffect(() => {
    const fetchWeekMenu = async () => {
      if (!tenant || !products.length) return;
      const currentWeek = planningWeeks[selectedWeekIndex];
      const res = await getWeeklyMenuByStartDate(tenant.id, currentWeek.startDateStr);
      
      const dayOffsets: Record<string, number> = {
        Lunes: 0,
        Martes: 1,
        Miércoles: 2,
        Jueves: 3,
        Viernes: 4,
        Sábado: 5,
        Domingo: 6
      };

      const newMenu: Record<string, { productId: string; limit: number; isClosed: boolean; holidayName: string | null }> = {
        Lunes: { productId: "", limit: 30, isClosed: false, holidayName: null },
        Martes: { productId: "", limit: 30, isClosed: false, holidayName: null },
        Miércoles: { productId: "", limit: 30, isClosed: false, holidayName: null },
        Jueves: { productId: "", limit: 30, isClosed: false, holidayName: null },
        Viernes: { productId: "", limit: 30, isClosed: false, holidayName: null },
        Sábado: { productId: "", limit: 30, isClosed: false, holidayName: null },
        Domingo: { productId: "", limit: 30, isClosed: false, holidayName: null },
      };

      if (res.success && res.data && res.data.length > 0) {
        res.data.forEach((dayItem: any) => {
          if (newMenu[dayItem.dayName]) {
            newMenu[dayItem.dayName] = {
              productId: dayItem.productId || "",
              limit: dayItem.limit || 30,
              isClosed: dayItem.isClosed || false,
              holidayName: dayItem.holidayName || null,
            };
          }
        });
      } else {
        // Fallback to match by old default seed names
        const oldDefaults: Record<string, string> = {
          Lunes: "Wok de Pollo con Vegetales y Arroz Integral",
          Martes: "Guiso Nutritivo de Lentejas Veggie",
          Miércoles: "Salmón Grillado con Puré de Calabaza",
          Jueves: "Wok de Pollo con Vegetales y Arroz Integral",
          Viernes: "Guiso Nutritivo de Lentejas Veggie",
          Sábado: "Salmón Grillado con Puré de Calabaza",
          Domingo: "",
        };

        Object.entries(oldDefaults).forEach(([day, name]) => {
          const match = products.find((p) => p.name === name);
          const mon = new Date(currentWeek.startDateStr);
          mon.setUTCDate(mon.getUTCDate() + dayOffsets[day]);
          const holiday = getHolidayForDate(mon);

          newMenu[day] = {
            productId: match ? match.id : "",
            limit: 30,
            isClosed: holiday !== null,
            holidayName: holiday
          };
        });
      }

      setWeeklyMenuData(newMenu);
    };

    fetchWeekMenu();
  }, [selectedWeekIndex, tenant, products]);

  const handleSaveWeeklyMenu = async () => {
    if (!tenant) return;
    const currentWeek = planningWeeks[selectedWeekIndex];
    const payload = Object.entries(weeklyMenuData).map(([dayName, info]) => ({
      dayName,
      productId: info.productId,
      limit: info.limit,
      isClosed: info.isClosed,
      holidayName: info.holidayName,
    }));

    const res = await saveWeeklyMenu(tenant.id, currentWeek.startDateStr, payload);
    if (res.success) {
      alert("Menú semanal guardado correctamente.");
    } else {
      alert(res.error || "Error al guardar el menú.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 font-bold">{error || "Error al cargar la tienda."}</p>
        <Link href="/">
          <button className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl">Volver al inicio</button>
        </Link>
      </div>
    );
  }

  // Detect type based on categories
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Top Banner Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">{tenant.name}</h1>
              <span className="text-xs px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-bold uppercase">{hasType}</span>
            </div>
            <p className="text-xs text-zinc-500">Panel de Administración / {tenant.slug}</p>
          </div>
        </div>
        <Link href={`/shop/${tenant.slug}`}>
          <PremiumButton variant="outline" size="sm">
            Ver Tienda Pública <ChevronRight className="w-4 h-4 ml-1" />
          </PremiumButton>
        </Link>
      </header>

      {/* Main Admin Grid */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Navigation Sidebar Panel */}
        <aside className="w-full lg:w-64 border-r border-zinc-900 p-6 flex flex-col gap-2 bg-zinc-900/10 shrink-0">
          {[
            { id: "dashboard", label: "Dashboard", icon: <TrendingUp className="w-4 h-4" /> },
            { id: "orders", label: "Pedidos (Kanban)", icon: <ShoppingBag className="w-4 h-4" /> },
            { id: "catalog", label: "Catálogo", icon: <Package className="w-4 h-4" /> },
            { id: "stock", label: "Control de Stock", icon: <Layers className="w-4 h-4" /> },
            ...(hasType === "VIANDA" ? [{ id: "menu", label: "Menú Semanal", icon: <Calendar className="w-4 h-4" /> }] : []),
            ...(hasType !== "ROPA" ? [{ id: "insumos", label: "Recetas e Insumos", icon: <Activity className="w-4 h-4" /> }] : []),
            ...(hasType === "ROPA" ? [{ id: "talles", label: "Tablas de Talles", icon: <Layers className="w-4 h-4" /> }] : []),
            { id: "cash", label: "Cierre de Caja", icon: <CreditCard className="w-4 h-4" /> },
            { id: "settings", label: "Configuración", icon: <SettingsIcon className="w-4 h-4" /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider border transition-all ${
                activeTab === item.id
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                  : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-6 lg:p-10 max-w-5xl w-full mx-auto">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && stats && (
            <div className="flex flex-col gap-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Ventas Totales</span>
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <h3 className="text-3xl font-black text-white">${stats.totalSales.toFixed(2)}</h3>
                  <p className="text-xs text-emerald-500 font-semibold">Ventas del período</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Ticket Promedio</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-3xl font-black text-white">${stats.averageTicket.toFixed(2)}</h3>
                  <p className="text-xs text-zinc-500">Por orden de compra</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Pedidos</span>
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <h3 className="text-3xl font-black text-white">{stats.totalOrdersCount}</h3>
                  <p className="text-xs text-amber-500 font-semibold">Excluyendo cancelados</p>
                </div>
              </div>

              {/* ABC Product Analysis Table */}
              <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Curva ABC de Productos Estrellas</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Clasificación según participación en ingresos (A: 70%, B: 20%, C: 10%)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-400">
                        <th className="py-3 font-bold uppercase tracking-wider">Producto</th>
                        <th className="py-3 font-bold uppercase tracking-wider text-right">Cant. Vendida</th>
                        <th className="py-3 font-bold uppercase tracking-wider text-right">Ingresos Totales</th>
                        <th className="py-3 font-bold uppercase tracking-wider text-right">Acumulado (%)</th>
                        <th className="py-3 font-bold uppercase tracking-wider text-center">Clasificación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.abcProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-zinc-600">Aún no hay suficientes órdenes registradas.</td>
                        </tr>
                      ) : (
                        stats.abcProducts.map((p) => (
                          <tr key={p.productId} className="border-b border-zinc-900/60 hover:bg-zinc-900/20">
                            <td className="py-3 text-white font-semibold">{p.name}</td>
                            <td className="py-3 text-right text-zinc-300">{p.totalQuantity}</td>
                            <td className="py-3 text-right text-zinc-300">${p.totalRevenue.toFixed(2)}</td>
                            <td className="py-3 text-right text-zinc-400">{p.cumulativePercentage.toFixed(1)}%</td>
                            <td className="py-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                p.class === "A" 
                                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500" 
                                  : p.class === "B"
                                  ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                                  : "bg-zinc-800 text-zinc-400"
                              }`}>
                                Clase {p.class}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stock Warning Alerts */}
              <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-3">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Alertas de Stock Crítico</h3>
                <div className="flex flex-col gap-2">
                  {products.filter((p) => p.stock <= 5).length === 0 ? (
                    <div className="text-zinc-500 text-xs py-2">Todos los productos cuentan con stock suficiente (&gt; 5 unidades).</div>
                  ) : (
                    products.filter((p) => p.stock <= 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between bg-red-500/5 border border-red-500/20 px-4 py-3 rounded-xl text-xs text-red-400">
                        <span className="font-semibold">{p.name}</span>
                        <span>Stock disponible: <strong className="font-black underline">{p.stock}</strong></span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ORDERS KANBAN */}
          {activeTab === "orders" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white">Tablero Kanban de Pedidos</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Administra el flujo de preparación y entrega de tus pedidos.</p>
              </div>

              {/* Kanban Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                {/* Column 1: PENDING */}
                <div className="glass-panel p-4 rounded-2xl border border-zinc-900 bg-zinc-900/5 flex flex-col gap-3 min-h-[500px]">
                  <div className="flex items-center justify-between border-b border-zinc-950 pb-2.5">
                    <span className="text-xs font-black text-amber-500 uppercase tracking-wider">Pendientes</span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold">Mock</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400">#ORD-9481</span>
                        <span className="text-amber-500 font-extrabold text-xs">$3,750</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200">Juan Pérez</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">2x Vianda Keto, 1x Ensalada</p>
                      </div>
                      <button 
                        onClick={() => alert("Pedido movido a Preparación.")}
                        className="w-full bg-amber-500 text-zinc-950 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all hover:bg-amber-600"
                      >
                        Preparar →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 2: PREPARING */}
                <div className="glass-panel p-4 rounded-2xl border border-zinc-900 bg-zinc-900/5 flex flex-col gap-3 min-h-[500px]">
                  <div className="flex items-center justify-between border-b border-zinc-950 pb-2.5">
                    <span className="text-xs font-black text-purple-400 uppercase tracking-wider">En Cocina</span>
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-bold">1</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400">#ORD-9479</span>
                        <span className="text-amber-500 font-extrabold text-xs">$2,800</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200">María López</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">1x Tarta de Frutillas Royale</p>
                      </div>
                      <button 
                        onClick={() => alert("Pedido marcado como Entregado.")}
                        className="w-full bg-emerald-500 text-zinc-950 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all hover:bg-emerald-600"
                      >
                        Entregar →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 3: DELIVERED */}
                <div className="glass-panel p-4 rounded-2xl border border-zinc-900 bg-zinc-900/5 flex flex-col gap-3 min-h-[500px]">
                  <div className="flex items-center justify-between border-b border-zinc-950 pb-2.5">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Entregados</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/60 flex flex-col gap-2.5 opacity-60">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-500">#ORD-9470</span>
                        <span className="text-zinc-500 font-bold text-xs">$5,400</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-400">Carlos Gómez</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">1x Buzo Oversized Black</p>
                      </div>
                      <span className="text-[9px] text-emerald-500 text-center font-bold uppercase">Entregado</span>
                    </div>
                  </div>
                </div>

                {/* Column 4: CANCELLED */}
                <div className="glass-panel p-4 rounded-2xl border border-zinc-900 bg-zinc-900/5 flex flex-col gap-3 min-h-[500px]">
                  <div className="flex items-center justify-between border-b border-zinc-950 pb-2.5">
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">Cancelados</span>
                  </div>
                  <div className="flex flex-col gap-3 text-center py-8 text-[11px] text-zinc-650">
                    Ninguno en esta jornada
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CATALOG */}
          {activeTab === "catalog" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Catálogo de Productos</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Define los artículos de venta de tu negocio.</p>
                </div>
                <PremiumButton variant="primary" size="sm" onClick={handleOpenCreateModal} glow>
                  <Plus className="w-4 h-4" /> Agregar Producto
                </PremiumButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-zinc-500 text-xs">No hay productos en esta tienda aún.</div>
                ) : (
                  products.map((p) => (
                    <div key={p.id} className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-5 flex gap-4 hover:border-zinc-800 transition-colors">
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.name} className="w-20 h-20 rounded-xl object-cover" />
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <h3 className="font-bold text-white text-sm">{p.name}</h3>
                            <div className="flex gap-2">
                              <button onClick={() => handleOpenEditModal(p)} className="p-1 text-zinc-400 hover:text-amber-500 transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="p-1 text-zinc-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{p.description || "Sin descripción"}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-amber-500 font-bold text-sm">${p.price.toFixed(2)}</span>
                          <span className="text-zinc-500 text-xs">Stock: {p.stock}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STOCK MANAGEMENT */}
          {activeTab === "stock" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white">Control de Inventario</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Registra ingresos o egresos de mercadería manualmente.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form to change stock */}
                <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 md:col-span-1 flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Nuevo Movimiento</h3>
                  <form onSubmit={handleApplyStockMovement} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold uppercase">Producto</label>
                      <select 
                        value={stockMovementProdId}
                        onChange={(e) => setStockMovementProdId(e.target.value)}
                        className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold uppercase">Cantidad (Positiva/Negativa)</label>
                      <input 
                        type="number"
                        placeholder="Ej. +10 o -5"
                        value={stockMovementQty}
                        onChange={(e) => setStockMovementQty(parseInt(e.target.value) || 0)}
                        className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold uppercase">Motivo</label>
                      <input 
                        type="text"
                        value={stockMovementReason}
                        onChange={(e) => setStockMovementReason(e.target.value)}
                        className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                      />
                    </div>

                    <PremiumButton type="submit" variant="primary" size="sm" className="w-full justify-center">
                      Registrar Movimiento
                    </PremiumButton>
                  </form>
                </div>

                {/* Stock log (mock for MVP display) */}
                <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 md:col-span-2 flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historial de Ajustes</h3>
                  <div className="flex flex-col gap-2">
                    <div className="border-b border-zinc-900 py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-white font-semibold">Ingreso de mercadería inicial</p>
                        <p className="text-zinc-500 text-[10px]">Hace 2 horas</p>
                      </div>
                      <span className="text-emerald-500 font-bold font-mono">+10 unidades</span>
                    </div>
                    <div className="border-b border-zinc-900 py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-white font-semibold">Ajuste por rotura / descarte</p>
                        <p className="text-zinc-500 text-[10px]">Hace 4 horas</p>
                      </div>
                      <span className="text-red-500 font-bold font-mono">-2 unidades</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WEEKLY MENU (VIANDAS ONLY) */}
          {activeTab === "menu" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white">Planificación de Menús Semanales</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Configura la vianda recomendada para cada día de la semana y su cupo máximo de producción.</p>
              </div>

              {/* Selector de semanas premium */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Período de Planificación</span>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {planningWeeks.map((w, idx) => {
                    const isSelected = selectedWeekIndex === idx;
                    return (
                      <button
                        key={w.startDateStr}
                        onClick={() => setSelectedWeekIndex(idx)}
                        className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500 text-amber-550"
                            : "bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                        }`}
                      >
                        <span className="text-xs font-black">{w.label}</span>
                        <span className="text-[9px] opacity-70 font-semibold">{w.dateRange}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                {Object.entries(weeklyMenuData).map(([day, info]: [string, any]) => {
                  const hasHoliday = !!info.holidayName;
                  return (
                    <div 
                      key={day} 
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4 transition-all duration-300 ${
                        info.isClosed ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-1 w-44 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-amber-500">{day}</span>
                          {info.isClosed && (
                            <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-black uppercase">
                              Cerrado
                            </span>
                          )}
                        </div>
                        {hasHoliday && (
                          <span className="text-[9px] text-red-400 font-semibold leading-none">
                            🎉 Feriado: {info.holidayName}
                          </span>
                        )}
                      </div>
                      
                      <select 
                        disabled={info.isClosed}
                        value={info.productId}
                        onChange={(e) => setWeeklyMenuData({
                          ...weeklyMenuData,
                          [day]: { ...info, productId: e.target.value }
                        })}
                        className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none flex-1 w-full animate-fade-in disabled:cursor-not-allowed"
                      >
                        <option value="">Ninguna vianda seleccionada</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-500 text-xs">Cupo:</span>
                          <input 
                            type="number"
                            disabled={info.isClosed}
                            value={info.limit}
                            onChange={(e) => setWeeklyMenuData({
                              ...weeklyMenuData,
                              [day]: { ...info, limit: parseInt(e.target.value) || 0 }
                            })}
                            className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl w-16 text-center outline-none disabled:cursor-not-allowed"
                          />
                        </div>

                        <label className="flex items-center gap-1.5 text-[10px] text-zinc-400 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={info.isClosed}
                            onChange={(e) => setWeeklyMenuData({
                              ...weeklyMenuData,
                              [day]: { ...info, isClosed: e.target.checked }
                            })}
                            className="accent-red-500 rounded"
                          />
                          Cerrar Día
                        </label>
                      </div>

                    </div>
                  );
                })}
                <PremiumButton variant="primary" size="sm" onClick={handleSaveWeeklyMenu} className="self-end mt-4 animate-pulse-slow">
                  Guardar Configuración de Menú
                </PremiumButton>
              </div>
            </div>
          )}

          {/* TAB 5: INSUMOS & RECIPES - only for VIANDA and PASTELERIA */}
          {activeTab === "insumos" && hasType !== "ROPA" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white">Insumos y Recetas</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Define materias primas y asócialas a tus productos de venta para control automático de stock.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* raw materials */}
                <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mis Insumos</h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ej. Chocolate Cobertura" 
                      id="newInsumoInput"
                      className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none flex-1"
                    />
                    <PremiumButton variant="primary" size="sm" onClick={() => {
                      const input = document.getElementById("newInsumoInput") as HTMLInputElement;
                      if (input && input.value) {
                        setInsumos([...insumos, input.value]);
                        input.value = "";
                      }
                    }}>
                      Añadir
                    </PremiumButton>
                  </div>
                  <div className="flex flex-col gap-2">
                    {insumos.map((ins, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-zinc-900/80 py-2.5 text-xs text-zinc-300">
                        <span>{ins}</span>
                        <button onClick={() => setInsumos(insumos.filter((_, idx) => idx !== i))} className="text-red-500/80 hover:text-red-400">Eliminar</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recipe linker */}
                <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Asociar Insumo a Producto (Receta)</h3>
                  <div className="flex flex-col gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-zinc-500 text-[10px] font-bold">Producto Final</label>
                      <select className="bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl text-white outline-none">
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-zinc-500 text-[10px] font-bold">Insumo Utilizado</label>
                      <select className="bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl text-white outline-none">
                        {insumos.map((ins, idx) => (
                          <option key={idx} value={ins}>{ins}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-zinc-500 text-[10px] font-bold">Cantidad por Unidad</label>
                      <input type="text" placeholder="Ej. 150 grs o 1 unidad" className="bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl text-white outline-none" />
                    </div>
                    <PremiumButton variant="outline" size="sm" onClick={() => alert("Receta enlazada correctamente.")} className="mt-2">
                      Guardar Relación de Receta
                    </PremiumButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TABLAS DE TALLES - only for ROPA */}
          {activeTab === "talles" && hasType === "ROPA" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white">Tablas de Talles</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Definí las medidas para cada categoría de ropa. Tus clientes podrán consultarlas en la tienda pública antes de comprar.</p>
              </div>

              {/* Tabla de Remeras */}
              {[
                { cat: "Remeras / Buzos", cols: ["Talle", "Pecho (cm)", "Manga (cm)", "Largo (cm)"], rows: [["S", "88-92", "59", "68"], ["M", "93-97", "61", "70"], ["L", "98-103", "63", "72"], ["XL", "104-110", "65", "74"], ["XXL", "111-118", "67", "76"]] },
                { cat: "Pantalones / Jeans", cols: ["Talle", "Cintura (cm)", "Cadera (cm)", "Largo (cm)"], rows: [["36", "76-80", "92-96", "100"], ["38", "81-85", "97-101", "101"], ["40", "86-90", "102-106", "102"], ["42", "91-95", "107-111", "103"], ["44", "96-100", "112-116", "104"]] },
                { cat: "Calzado", cols: ["Talle ARG", "Talle EUR", "Largo Pie (cm)"], rows: [["36", "36", "23.0"], ["37", "37", "23.7"], ["38", "38", "24.3"], ["39", "39", "25.0"], ["40", "40", "25.7"], ["41", "41", "26.3"], ["42", "42", "27.0"], ["43", "43", "27.7"]] },
              ].map((table) => (
                <div key={table.cat} className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">{table.cat}</h3>
                    <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full font-semibold uppercase">Editable</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          {table.cols.map((col) => (
                            <th key={col} className="text-left text-zinc-400 font-bold uppercase tracking-wider py-2 pr-4 text-[10px]">{col}</th>
                          ))}
                          <th className="text-left text-zinc-400 font-bold uppercase tracking-wider py-2 text-[10px]">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, ri) => (
                          <tr key={ri} className="border-b border-zinc-900/50 hover:bg-zinc-900/20 transition-colors">
                            {row.map((cell, ci) => (
                              <td key={ci} className="py-2 pr-4">
                                <input
                                  type="text"
                                  defaultValue={cell}
                                  className="bg-transparent border-b border-zinc-800 focus:border-amber-500 text-white text-xs py-1 outline-none w-full transition-colors"
                                />
                              </td>
                            ))}
                            <td className="py-2">
                              <button className="text-red-500/60 hover:text-red-400 text-[10px] font-semibold transition-colors">Eliminar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <PremiumButton
                      variant="outline"
                      size="sm"
                      onClick={() => alert(`Fila agregada a ${table.cat}`)}
                    >
                      + Agregar Fila
                    </PremiumButton>
                    <PremiumButton
                      variant="primary"
                      size="sm"
                      onClick={() => alert(`Tabla de "${table.cat}" guardada.`)}
                    >
                      Guardar Tabla
                    </PremiumButton>
                  </div>
                </div>
              ))}

              {/* Equivalencias Internacionales */}
              <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Equivalencias Internacionales</h3>
                <p className="text-xs text-zinc-500">Referencia rápida de conversión de talles entre regiones.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        {["Argentina / Latam", "USA", "Europa", "UK"].map((h) => (
                          <th key={h} className="text-left text-zinc-400 font-bold uppercase tracking-wider py-2 pr-4 text-[10px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[["XS", "XS", "XS", "6-8"], ["S", "S", "S", "8-10"], ["M", "M", "M", "10-12"], ["L", "L", "L", "12-14"], ["XL", "XL", "XL", "14-16"], ["XXL", "XXL", "XXL", "18-20"]].map((row, i) => (
                        <tr key={i} className="border-b border-zinc-900/50 hover:bg-zinc-900/20 transition-colors">
                          {row.map((cell, j) => (
                            <td key={j} className="py-2.5 pr-4 text-zinc-300 font-mono">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CASH REGISTER CLOSE */}
          {activeTab === "cash" && (

            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white">Arqueo y Cierre de Caja Diario</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Controla los ingresos del día versus lo registrado por el sistema para detectar diferencias de caja.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Caja Física</h3>
                  <form onSubmit={handleCalculateCashDifference} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold uppercase">Efectivo en Caja ($)</label>
                      <input 
                        type="number"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold uppercase">Transferencias Recibidas ($)</label>
                      <input 
                        type="number"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold uppercase">Gastos / Retiros del Día ($)</label>
                      <input 
                        type="number"
                        value={expenses}
                        onChange={(e) => setExpenses(e.target.value)}
                        className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                      />
                    </div>
                    <PremiumButton type="submit" variant="primary" size="sm" className="w-full justify-center">
                      Verificar Diferencias
                    </PremiumButton>
                  </form>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Ingresos Registrados por LYNX</h3>
                    <div className="flex flex-col gap-3 text-xs mb-6">
                      {stats?.dailyClose.length === 0 ? (
                        <p className="text-zinc-500">Hoy no se han registrado ventas aún.</p>
                      ) : (
                        stats?.dailyClose.map((c: any) => (
                          <div key={c.paymentMethod} className="flex justify-between border-b border-zinc-900 pb-2">
                            <span className="text-zinc-400 font-bold uppercase">{c.paymentMethod}</span>
                            <span className="text-white font-mono">${c.totalRevenue.toFixed(2)} ({c.count} ped.)</span>
                          </div>
                        ))
                      )}
                      <div className="flex justify-between font-black text-amber-500 text-sm mt-2">
                        <span>Total Sistema:</span>
                        <span>${stats?.dailyClose.reduce((sum: number, d: any) => sum + d.totalRevenue, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {cashCloseSuccess && cashDifference !== null && (
                    <div className={`p-4 rounded-xl border text-xs flex flex-col gap-1 ${
                      cashDifference === 0 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}>
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4" /> Arqueo Calculado
                      </p>
                      <p>
                        Diferencia de caja:{" "}
                        <strong className="underline">
                          {cashDifference >= 0 ? `+$${cashDifference.toFixed(2)}` : `-$${Math.abs(cashDifference).toFixed(2)}`}
                        </strong>
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1">Cierre grabado exitosamente.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === "settings" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white">Configuración del Comercio</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Modifica los detalles básicos de tu cuenta y local comercial.</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Nombre</label>
                  <input type="text" defaultValue={tenant.name} className="bg-zinc-950 border border-zinc-900 text-sm text-white px-4 py-3 rounded-xl" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Descripción</label>
                  <textarea defaultValue={tenant.description || ""} className="bg-zinc-950 border border-zinc-900 text-sm text-white px-4 py-3 rounded-xl h-24" />
                </div>
                <PremiumButton variant="primary" size="sm" onClick={() => alert("Configuración guardada.")} className="self-end">
                  Guardar Cambios
                </PremiumButton>
              </div>

              {/* Category Pricing Manager */}
              <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gestionar Categorías</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Edita nombres y establece precios de categoría (heredados por los productos).</p>
                  </div>
                  <PremiumButton variant="outline" size="sm" onClick={handleOpenCreateCategoryModal}>
                    <Plus className="w-4 h-4 mr-1" /> Nueva Categoría
                  </PremiumButton>
                </div>
                <div className="flex flex-col gap-3">
                  {categories.map((cat) => {
                    const isVianda = cat.type === "VIANDA";
                    return (
                      <div key={cat.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center border-b border-zinc-900 pb-3">
                        <div className="flex-1">
                          <span className="text-xs font-bold text-white">{cat.name}</span>
                          <span className="text-[9px] ml-2 px-1.5 py-0.5 bg-zinc-950 text-zinc-400 border border-zinc-900 rounded font-semibold uppercase">{cat.type}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {isVianda && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase">Precio Categoría ($):</span>
                              <input 
                                type="number"
                                defaultValue={cat.price || 0}
                                onBlur={async (e) => {
                                  const newPrice = parseFloat(e.target.value) || 0;
                                  const res = await updateCategory(cat.id, {
                                    name: cat.name,
                                    slug: cat.slug,
                                    type: cat.type,
                                    price: newPrice
                                  });
                                  if (res.success) {
                                    alert(`Precio de la categoría "${cat.name}" actualizado a $${newPrice}. Los productos asociados heredaron este precio.`);
                                    fetchData();
                                  }
                                }}
                                className="bg-zinc-950 border border-zinc-900 focus:border-amber-500 text-xs text-white p-2 rounded-lg w-24 text-center outline-none transition-colors"
                              />
                            </div>
                          )}
                          <div className="flex gap-2.5">
                            <button 
                              onClick={() => handleOpenEditCategoryModal(cat)} 
                              className="p-1 text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
                              title="Editar Categoría"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(cat.id)} 
                              className="p-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Eliminar Categoría"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* PRODUCT CREATION/EDIT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-900 w-full max-w-2xl rounded-3xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-black text-white">{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Ingresa los detalles básicos y específicos del rubro del producto.</p>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Nombre del Producto</label>
                  <input 
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Categoría</label>
                  <select 
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Precio ($)</label>
                  {hasType === "VIANDA" ? (
                    <div className="flex flex-col gap-1">
                      <input 
                        type="number"
                        disabled
                        value={categories.find(c => c.id === prodCategoryId)?.price || 0}
                        className="bg-zinc-950 border border-zinc-900 opacity-60 text-xs text-amber-500 p-3 rounded-xl cursor-not-allowed outline-none font-bold"
                      />
                      <span className="text-[9px] text-zinc-500">Heredado de la categoría</span>
                    </div>
                  ) : (
                    <input 
                      type="number"
                      required
                      value={prodPrice}
                      onChange={(e) => setProdPrice(parseFloat(e.target.value) || 0)}
                      className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Stock Inicial</label>
                  <input 
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(parseInt(e.target.value) || 0)}
                    className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">URL de la Imagen</label>
                  <input 
                    type="text"
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Descripción</label>
                <textarea 
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none resize-none h-16"
                />
              </div>

              {/* SPECIALIZED SPECIFIC FIELDS DEPENDING ON RUBRO TYPE */}
              {hasType === "ROPA" && (
                <div className="border-t border-zinc-900 pt-4 flex flex-col gap-3">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Variantes y Especificaciones de Ropa</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Talle</label>
                      <input type="text" value={prodSize} onChange={(e) => setProdSize(e.target.value)} placeholder="Ej. S, M, L, XL" className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Color</label>
                      <input type="text" value={prodColor} onChange={(e) => setProdColor(e.target.value)} placeholder="Ej. Azul Marino" className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Material / Tela</label>
                      <input type="text" value={prodMaterial} onChange={(e) => setProdMaterial(e.target.value)} placeholder="Ej. Algodón 100%" className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {hasType === "VIANDA" && (
                <div className="border-t border-zinc-900 pt-4 flex flex-col gap-3">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Información Nutricional (Viandas)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Calorías (kcal)</label>
                      <input type="number" value={prodCalories} onChange={(e) => setProdCalories(parseInt(e.target.value) || 0)} className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Ingredientes</label>
                      <input type="text" value={prodIngredients} onChange={(e) => setProdIngredients(e.target.value)} placeholder="Pollo, arroz, calabaza" className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-6 mt-1.5 text-xs">
                    <label className="flex items-center gap-2 text-zinc-300">
                      <input type="checkbox" checked={prodIsVegan} onChange={(e) => setProdIsVegan(e.target.checked)} className="accent-amber-500" /> Apto Vegano
                    </label>
                    <label className="flex items-center gap-2 text-zinc-300">
                      <input type="checkbox" checked={prodIsGlutenFree} onChange={(e) => setProdIsGlutenFree(e.target.checked)} className="accent-amber-500" /> Sin TACC / Gluten-Free
                    </label>
                  </div>
                </div>
              )}

              {hasType === "PASTELERIA" && (
                <div className="border-t border-zinc-900 pt-4 flex flex-col gap-3">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Detalle de Pastelería</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Nivel de Dulzor</label>
                      <select value={prodSweetness} onChange={(e) => setProdSweetness(e.target.value)} className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none">
                        <option value="">Seleccionar...</option>
                        <option value="Bajo">Bajo</option>
                        <option value="Medio">Medio</option>
                        <option value="Alto">Alto</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-zinc-400 text-[10px] font-bold">Porciones / Cortes</label>
                      <input type="number" value={prodPortions} onChange={(e) => setProdPortions(parseInt(e.target.value) || 1)} className="bg-zinc-950 border border-zinc-900 text-xs text-white p-2.5 rounded-xl outline-none" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end border-t border-zinc-900 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowProductModal(false)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <PremiumButton type="submit" variant="primary" size="sm">
                  {editingProduct ? "Guardar Cambios" : "Crear Producto"}
                </PremiumButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY CREATION/EDIT MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-900 w-full max-w-md rounded-3xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-black text-white">{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Ingresa los detalles básicos para agrupar tus productos.</p>
            </div>

            {categoryError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
                {categoryError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Nombre de la Categoría</label>
                <input 
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {hasType === "VIANDA" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Precio de Viandas en esta Categoría ($)</label>
                  <input 
                    type="number"
                    required
                    value={catPrice}
                    onChange={(e) => setCatPrice(parseFloat(e.target.value) || 0)}
                    className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none focus:border-amber-500 transition-colors font-bold text-amber-500"
                  />
                  <p className="text-[10px] text-zinc-500">Todas las viandas asignadas a esta categoría tomarán este precio automáticamente.</p>
                </div>
              )}

              <div className="flex gap-3 justify-end border-t border-zinc-900 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCategoryModal(false)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <PremiumButton type="submit" variant="primary" size="sm">
                  {editingCategory ? "Guardar Cambios" : "Crear Categoría"}
                </PremiumButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY CREATION/EDIT MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-55 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-6 flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-black text-white">{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Configura los detalles de la categoría para tu catálogo.</p>
            </div>

            {categoryError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
                {categoryError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Nombre de la Categoría</label>
                <input 
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3.5 rounded-xl outline-none"
                  placeholder="Ej. Viandas Premium o Remeras"
                />
              </div>

              {hasType === "VIANDA" && (
                <div className="flex flex-col gap-1.5 border-t border-zinc-900 pt-3">
                  <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Precio Fijo para Viandas ($)</label>
                  <input 
                    type="number"
                    value={catPrice}
                    onChange={(e) => setCatPrice(parseFloat(e.target.value) || 0)}
                    className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3.5 rounded-xl outline-none"
                    placeholder="Ej. 3500 (Dejar en 0 si no aplica)"
                  />
                  <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">
                    * Todos los productos de esta categoría heredarán este precio automáticamente y se actualizarán en cascada.
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end border-t border-zinc-900 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCategoryModal(false)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <PremiumButton type="submit" variant="primary" size="sm">
                  {editingCategory ? "Guardar Cambios" : "Crear Categoría"}
                </PremiumButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
