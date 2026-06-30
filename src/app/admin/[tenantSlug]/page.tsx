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
import { getSizeCharts, createSizeChart, deleteSizeChart, addSizeChartRow, updateSizeChartRow, deleteSizeChartRow, getClothingBrands, createClothingBrand, deleteClothingBrand, getClothingTypes, createClothingType, deleteClothingType, type SizeChartWithRows, type ClothingBrandItem, type ClothingTypeItem } from "@/app/actions/sizeChart";
import { getHolidayForDate } from "@/lib/holidays";
import { getDashboardStats, DashboardStats } from "@/app/actions/dashboard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { updateShopSettings, type ThemeSettings } from "@/app/actions/shopSettings";
import { Palette, LayoutGrid, Type, Image as ImageIcon, Smartphone, LifeBuoy } from "lucide-react";
import { getAbandonedCarts, markCartAsRecovered } from "@/app/actions/cartRecovery";

export default function AdminDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  const [activeTab, setActiveTab] = useState("dashboard");
  const [tenant, setTenant] = useState<any>(null);

  // Shop Personalization Editor States
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#f59e0b");
  const [backgroundColor, setBackgroundColor] = useState("#09090b");
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Outfit");
  const [cardStyle, setCardStyle] = useState<"glass" | "classic" | "minimal">("glass");
  const [savingSettings, setSavingSettings] = useState(false);
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

  // ─── Size Charts (Tablas de Talles) states ────────────────────────────────
  const [sizeCharts, setSizeCharts]           = useState<SizeChartWithRows[]>([]);
  const [clothingBrands, setClothingBrands]   = useState<ClothingBrandItem[]>([]);
  const [clothingTypes, setClothingTypes]     = useState<ClothingTypeItem[]>([]);
  const [scActiveBrandId, setScActiveBrandId] = useState<string | null>(null);
  // Panel: "charts" | "config"
  const [scPanel, setScPanel]                 = useState<"charts" | "config">("charts");
  // New chart form
  const [scNewBrandId, setScNewBrandId]       = useState("");
  const [scNewTypeId, setScNewTypeId]         = useState("");
  const [scNewCols, setScNewCols]             = useState<string[]>([]);
  const [scNewColInput, setScNewColInput]     = useState("");
  const [scShowNewForm, setScShowNewForm]     = useState(false);
  const [scSaving, setScSaving]               = useState(false);
  const [scError, setScError]                 = useState("");
  // Config panel inputs
  const [scBrandInput, setScBrandInput]       = useState("");
  const [scTypeInput, setScTypeInput]         = useState("");
  const [scConfigError, setScConfigError]     = useState("");
  // Inline row edit tracker: rowId -> values[]
  const [scRowEdits, setScRowEdits]           = useState<Record<string, string[]>>({});

  // Cash Register states
  const [cashAmount, setCashAmount] = useState("0");
  const [transferAmount, setTransferAmount] = useState("0");
  const [expenses, setExpenses] = useState("0");
  const [cashDifference, setCashDifference] = useState<number | null>(null);
  const [cashCloseSuccess, setCashCloseSuccess] = useState(false);

  // Cart Recovery State
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);

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
    setLogoUrl(tenantRes.data.logoUrl || "");
    setBannerUrl(tenantRes.data.bannerUrl || "");
    if (tenantRes.data.themeSettings) {
      try {
        const theme = JSON.parse(tenantRes.data.themeSettings) as ThemeSettings;
        if (theme.primaryColor) setPrimaryColor(theme.primaryColor);
        if (theme.backgroundColor) setBackgroundColor(theme.backgroundColor);
        if (theme.layoutMode) setLayoutMode(theme.layoutMode);
        if (theme.textColor) setTextColor(theme.textColor);
        if (theme.fontFamily) setFontFamily(theme.fontFamily);
        if (theme.cardStyle) setCardStyle(theme.cardStyle);
      } catch (e) {
        console.error("Failed to parse theme settings:", e);
      }
    }
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

    const cartsRes = await getAbandonedCarts(tenantRes.data.id);
    if (cartsRes.success && cartsRes.data) {
      setAbandonedCarts(cartsRes.data);
    }

    const [chartsData, brandsData, typesData] = await Promise.all([
      getSizeCharts(tenantRes.data.id),
      getClothingBrands(tenantRes.data.id),
      getClothingTypes(tenantRes.data.id),
    ]);
    setSizeCharts(chartsData);
    setClothingBrands(brandsData);
    setClothingTypes(typesData);
    if (chartsData.length > 0) setScActiveBrandId(chartsData[0].brandId);
    else if (brandsData.length > 0) setScActiveBrandId(brandsData[0].id);

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
            { id: "recovery", label: "Recuperar Ventas", icon: <LifeBuoy className="w-4 h-4" /> },
            { id: "personalize", label: "Personalizar Shop", icon: <Palette className="w-4 h-4" /> },
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

              {/* ── Header with panel toggle ─────────────────────────────── */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">Tablas de Talles</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Gestioná marcas, tipos de indumentaria y sus medidas.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setScPanel("charts")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${scPanel === "charts" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}
                  >
                    Tablas
                  </button>
                  <button
                    onClick={() => { setScPanel("config"); setScConfigError(""); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${scPanel === "config" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}
                  >
                    ⚙ Marcas y Tipos
                  </button>
                </div>
              </div>

              {/* ── PANEL: CONFIGURACIÓN (Marcas + Tipos) ──────────────────── */}
              {scPanel === "config" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Marcas */}
                  <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Marcas</h3>
                    {scConfigError && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{scConfigError}</p>}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nueva marca (ej: Nike, Levi's...)"
                        value={scBrandInput}
                        onChange={(e) => setScBrandInput(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && scBrandInput.trim()) {
                            const res = await createClothingBrand(tenant.id, scBrandInput);
                            if (res.ok) {
                              const updated = await getClothingBrands(tenant.id);
                              setClothingBrands(updated);
                              setScBrandInput("");
                            } else setScConfigError(res.error || "Error");
                          }
                        }}
                        className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white text-xs p-2.5 rounded-xl outline-none transition-colors"
                      />
                      <PremiumButton variant="primary" size="sm" onClick={async () => {
                        if (!scBrandInput.trim()) return;
                        const res = await createClothingBrand(tenant.id, scBrandInput);
                        if (res.ok) { const u = await getClothingBrands(tenant.id); setClothingBrands(u); setScBrandInput(""); }
                        else setScConfigError(res.error || "Error");
                      }}>
                        <Plus className="w-3.5 h-3.5" />
                      </PremiumButton>
                    </div>
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                      {clothingBrands.length === 0 && <p className="text-zinc-600 text-xs text-center py-4">Sin marcas aún</p>}
                      {clothingBrands.map((b) => (
                        <div key={b.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-900 group">
                          <span className="text-white text-xs font-medium">{b.name}</span>
                          <button
                            onClick={async () => {
                              await deleteClothingBrand(b.id);
                              const u = await getClothingBrands(tenant.id);
                              setClothingBrands(u);
                            }}
                            className="text-red-500/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          ><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tipos de indumentaria */}
                  <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Tipos de Indumentaria</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nuevo tipo (ej: Remeras, Calzado...)"
                        value={scTypeInput}
                        onChange={(e) => setScTypeInput(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && scTypeInput.trim()) {
                            const res = await createClothingType(tenant.id, scTypeInput);
                            if (res.ok) { const u = await getClothingTypes(tenant.id); setClothingTypes(u); setScTypeInput(""); }
                            else setScConfigError(res.error || "Error");
                          }
                        }}
                        className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white text-xs p-2.5 rounded-xl outline-none transition-colors"
                      />
                      <PremiumButton variant="primary" size="sm" onClick={async () => {
                        if (!scTypeInput.trim()) return;
                        const res = await createClothingType(tenant.id, scTypeInput);
                        if (res.ok) { const u = await getClothingTypes(tenant.id); setClothingTypes(u); setScTypeInput(""); }
                        else setScConfigError(res.error || "Error");
                      }}>
                        <Plus className="w-3.5 h-3.5" />
                      </PremiumButton>
                    </div>
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                      {clothingTypes.length === 0 && <p className="text-zinc-600 text-xs text-center py-4">Sin tipos aún</p>}
                      {clothingTypes.map((t) => (
                        <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-900 group">
                          <span className="text-white text-xs font-medium">{t.name}</span>
                          <button
                            onClick={async () => {
                              await deleteClothingType(t.id);
                              const u = await getClothingTypes(tenant.id);
                              setClothingTypes(u);
                            }}
                            className="text-red-500/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          ><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── PANEL: TABLAS ───────────────────────────────────────────── */}
              {scPanel === "charts" && (
                <div className="flex flex-col gap-6">

                  {/* Action bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                      {clothingBrands.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setScActiveBrandId(b.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            scActiveBrandId === b.id
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : "bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                          }`}
                        >
                          {b.name}
                        </button>
                      ))}
                      {clothingBrands.length === 0 && (
                        <p className="text-xs text-zinc-600">Primero agregá marcas en <button onClick={() => setScPanel("config")} className="text-amber-500 underline">⚙ Marcas y Tipos</button></p>
                      )}
                    </div>
                    <PremiumButton variant="primary" size="sm" onClick={() => { setScShowNewForm(true); setScError(""); setScNewCols([]); setScNewColInput(""); setScNewBrandId(""); setScNewTypeId(""); }}>
                      <Plus className="w-3.5 h-3.5" /> Nueva Tabla
                    </PremiumButton>
                  </div>

                  {/* NEW CHART FORM */}
                  {scShowNewForm && (
                    <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex flex-col gap-5">
                      <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Nueva Tabla de Talles</h3>
                      {scError && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{scError}</p>}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Marca - dropdown */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-zinc-400 text-[10px] font-bold uppercase">Marca</label>
                          <select
                            value={scNewBrandId}
                            onChange={(e) => setScNewBrandId(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white text-xs p-3 rounded-xl outline-none transition-colors appearance-none cursor-pointer"
                          >
                            <option value="">— Seleccioná una marca —</option>
                            {clothingBrands.map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                          {clothingBrands.length === 0 && (
                            <p className="text-zinc-600 text-[10px]">Sin marcas. <button onClick={() => { setScShowNewForm(false); setScPanel("config"); }} className="text-amber-500 underline">Agregar en ⚙ Marcas y Tipos</button></p>
                          )}
                        </div>
                        {/* Tipo - dropdown */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-zinc-400 text-[10px] font-bold uppercase">Tipo de Indumentaria</label>
                          <select
                            value={scNewTypeId}
                            onChange={(e) => setScNewTypeId(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white text-xs p-3 rounded-xl outline-none transition-colors appearance-none cursor-pointer"
                          >
                            <option value="">— Seleccioná un tipo —</option>
                            {clothingTypes.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          {clothingTypes.length === 0 && (
                            <p className="text-zinc-600 text-[10px]">Sin tipos. <button onClick={() => { setScShowNewForm(false); setScPanel("config"); }} className="text-amber-500 underline">Agregar en ⚙ Marcas y Tipos</button></p>
                          )}
                        </div>
                      </div>

                      {/* Columnas / Medidas con botón Agregar */}
                      <div className="flex flex-col gap-2">
                        <label className="text-zinc-400 text-[10px] font-bold uppercase">Columnas / Medidas</label>
                        {/* Chips */}
                        <div className="flex flex-wrap gap-2 min-h-[32px]">
                          {scNewCols.map((col, i) => (
                            <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                              {col}
                              <button
                                onClick={() => setScNewCols(scNewCols.filter((_, idx) => idx !== i))}
                                className="text-amber-400/60 hover:text-red-400 transition-colors"
                              >×</button>
                            </span>
                          ))}
                          {scNewCols.length === 0 && <span className="text-zinc-600 text-xs italic">Sin columnas aún…</span>}
                        </div>
                        {/* Input + Agregar */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ej: Talle, Pecho (cm), Largo (cm)..."
                            value={scNewColInput}
                            onChange={(e) => setScNewColInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && scNewColInput.trim()) {
                                setScNewCols([...scNewCols, scNewColInput.trim()]);
                                setScNewColInput("");
                              }
                            }}
                            className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white text-xs p-2.5 rounded-xl outline-none transition-colors"
                          />
                          <PremiumButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (scNewColInput.trim()) {
                                setScNewCols([...scNewCols, scNewColInput.trim()]);
                                setScNewColInput("");
                              }
                            }}
                          >
                            <Plus className="w-3.5 h-3.5" /> Agregar
                          </PremiumButton>
                        </div>
                        <p className="text-zinc-600 text-[10px]">También podés presionar Enter para agregar cada columna.</p>
                      </div>

                      <div className="flex gap-3 pt-1">
                        <PremiumButton
                          variant="primary"
                          size="sm"
                          disabled={scSaving}
                          onClick={async () => {
                            setScSaving(true);
                            setScError("");
                            const res = await createSizeChart(tenant.id, scNewBrandId, scNewTypeId, scNewCols);
                            if (res.ok) {
                              const [updatedCharts] = await Promise.all([getSizeCharts(tenant.id)]);
                              setSizeCharts(updatedCharts);
                              setScActiveBrandId(scNewBrandId);
                              setScShowNewForm(false);
                            } else {
                              setScError(res.error || "Error al crear la tabla.");
                            }
                            setScSaving(false);
                          }}
                        >
                          {scSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Crear Tabla"}
                        </PremiumButton>
                        <PremiumButton variant="outline" size="sm" onClick={() => setScShowNewForm(false)}>Cancelar</PremiumButton>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {sizeCharts.length === 0 && !scShowNewForm && (
                    <div className="glass-panel p-10 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col items-center justify-center gap-3">
                      <Layers className="w-8 h-8 text-zinc-700" />
                      <p className="text-zinc-500 text-sm">No hay tablas creadas aún.</p>
                      {clothingBrands.length === 0
                        ? <PremiumButton variant="outline" size="sm" onClick={() => setScPanel("config")}>Primero configurá marcas y tipos →</PremiumButton>
                        : <PremiumButton variant="outline" size="sm" onClick={() => setScShowNewForm(true)}>Crear primera tabla</PremiumButton>
                      }
                    </div>
                  )}

                  {/* Charts list filtered by active brand */}
                  {sizeCharts
                    .filter((c) => c.brandId === scActiveBrandId)
                    .map((chart) => (
                      <div key={chart.id} className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">{chart.brandName} — {chart.clothingTypeName}</h3>
                            <p className="text-zinc-600 text-[10px] mt-0.5">{chart.columns.length} columnas · {chart.rows.length} filas</p>
                          </div>
                          <button
                            onClick={async () => {
                              if (!confirm(`¿Eliminar la tabla "${chart.brandName} - ${chart.clothingTypeName}"?`)) return;
                              await deleteSizeChart(chart.id);
                              const updated = await getSizeCharts(tenant.id);
                              setSizeCharts(updated);
                            }}
                            className="text-red-500/50 hover:text-red-400 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Eliminar tabla
                          </button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-zinc-800">
                                {chart.columns.map((col) => (
                                  <th key={col} className="text-left text-zinc-400 font-bold uppercase tracking-wider py-2 pr-4 text-[10px]">{col}</th>
                                ))}
                                <th className="text-left text-zinc-400 font-bold uppercase tracking-wider py-2 text-[10px]"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {chart.rows.map((row) => {
                                const editing = scRowEdits[row.id] ?? row.values;
                                return (
                                  <tr key={row.id} className="border-b border-zinc-900/50 hover:bg-zinc-900/20 transition-colors group">
                                    {chart.columns.map((_, ci) => (
                                      <td key={ci} className="py-2 pr-4">
                                        <input
                                          type="text"
                                          value={editing[ci] ?? ""}
                                          onChange={(e) => {
                                            const newVals = [...editing];
                                            newVals[ci] = e.target.value;
                                            setScRowEdits((prev) => ({ ...prev, [row.id]: newVals }));
                                          }}
                                          onBlur={async () => {
                                            if (JSON.stringify(editing) !== JSON.stringify(row.values)) {
                                              await updateSizeChartRow(row.id, editing);
                                              const updated = await getSizeCharts(tenant.id);
                                              setSizeCharts(updated);
                                              setScRowEdits((prev) => { const n = { ...prev }; delete n[row.id]; return n; });
                                            }
                                          }}
                                          className="bg-transparent border-b border-zinc-800 focus:border-amber-500 text-white text-xs py-1 outline-none w-full transition-colors min-w-[60px]"
                                        />
                                      </td>
                                    ))}
                                    <td className="py-2">
                                      <button
                                        onClick={async () => { await deleteSizeChartRow(row.id); const updated = await getSizeCharts(tenant.id); setSizeCharts(updated); }}
                                        className="text-red-500/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                      ><Trash2 className="w-3 h-3" /></button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <PremiumButton
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const emptyRow = chart.columns.map(() => "");
                            await addSizeChartRow(chart.id, emptyRow);
                            const updated = await getSizeCharts(tenant.id);
                            setSizeCharts(updated);
                          }}
                        >
                          <Plus className="w-3 h-3" /> Agregar fila
                        </PremiumButton>
                      </div>
                    ))
                  }
                </div>
              )}
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

          {/* TAB: PERSONALIZE */}
          {activeTab === "personalize" && (
            <div className="flex flex-col gap-6 max-w-none">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-500" /> Layout Designer & Tienda Live Preview
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Modifica la estética visual, colores, logos, banners y tipografías. Mira los cambios en tiempo real antes de guardar.
                </p>
              </div>

              {/* Split Screen Panel */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* Left side: Controls (7 cols) */}
                <div className="xl:col-span-7 flex flex-col gap-6">
                  <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-5">
                    
                    <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-500" /> Identidad Visual
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">URL del Logo</label>
                        <input
                          type="text"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://ejemplo.com/logo.png"
                          className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">URL del Banner de Portada</label>
                        <input
                          type="text"
                          value={bannerUrl}
                          onChange={(e) => setBannerUrl(e.target.value)}
                          placeholder="https://ejemplo.com/banner.png"
                          className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2 pt-2 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-amber-500" /> Paletas de Colores Predefinidas
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { name: "Ámbar Cyberpunk", primary: "#f59e0b", bg: "#09090b", text: "#ffffff" },
                        { name: "Verde Orgánico", primary: "#10b981", bg: "#062f22", text: "#f0fdf4" },
                        { name: "Rosa Dulce", primary: "#ec4899", bg: "#fdf2f8", text: "#1f2937" },
                        { name: "Monocromo Elegante", primary: "#ffffff", bg: "#000000", text: "#e5e7eb" },
                        { name: "Azul Eléctrico", primary: "#3b82f6", bg: "#0f172a", text: "#f8fafc" },
                        { name: "Cereza Intenso", primary: "#ef4444", bg: "#450a0a", text: "#fef2f2" },
                        { name: "Minimalista Claro", primary: "#18181b", bg: "#fafafa", text: "#18181b" },
                        { name: "Lavanda Soft", primary: "#8b5cf6", bg: "#faf5ff", text: "#3b0764" }
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setPrimaryColor(preset.primary);
                            setBackgroundColor(preset.bg);
                            setTextColor(preset.text);
                          }}
                          className="flex flex-col gap-1 p-2.5 rounded-xl border border-zinc-900 hover:border-zinc-700 bg-zinc-950/40 text-left transition-all"
                        >
                          <span className="text-[10px] font-bold text-zinc-300 truncate">{preset.name}</span>
                          <div className="flex gap-1 mt-1">
                            <span className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: preset.primary }} />
                            <span className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: preset.bg }} />
                            <span className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: preset.text }} />
                          </div>
                        </button>
                      ))}
                    </div>

                    <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2 pt-2 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-amber-500" /> Ajuste Manual de Colores
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Primary Color Picker */}
                      <div className="flex flex-col gap-2">
                        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Color Primario / Acento</label>
                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="h-8 w-10 bg-transparent border-0 rounded-lg cursor-pointer outline-none shrink-0"
                          />
                          <input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="bg-transparent text-xs text-white outline-none w-full font-mono uppercase"
                          />
                        </div>
                        {/* Swatches Grid */}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#ef4444", "#8b5cf6", "#f43f5e", "#06b6d4", "#ffffff", "#000000"].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setPrimaryColor(c)}
                              className="w-[18px] h-[18px] rounded-full border border-white/10 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Background Color Picker */}
                      <div className="flex flex-col gap-2">
                        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Color de Fondo</label>
                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl">
                          <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="h-8 w-10 bg-transparent border-0 rounded-lg cursor-pointer outline-none shrink-0"
                          />
                          <input
                            type="text"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="bg-transparent text-xs text-white outline-none w-full font-mono uppercase"
                          />
                        </div>
                        {/* Swatches Grid */}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {["#09090b", "#062f22", "#0f172a", "#450a0a", "#fdf2f8", "#faf5ff", "#fafafa", "#020617", "#121212", "#ffffff"].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setBackgroundColor(c)}
                              className="w-[18px] h-[18px] rounded-full border border-white/10 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Text Color Picker */}
                      <div className="flex flex-col gap-2">
                        <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Color de Texto</label>
                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl">
                          <input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="h-8 w-10 bg-transparent border-0 rounded-lg cursor-pointer outline-none shrink-0"
                          />
                          <input
                            type="text"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="bg-transparent text-xs text-white outline-none w-full font-mono uppercase"
                          />
                        </div>
                        {/* Swatches Grid */}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {["#ffffff", "#f8fafc", "#f0fdf4", "#e5e7eb", "#1f2937", "#18181b", "#3b0764", "#fef2f2", "#a1a1aa", "#000000"].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setTextColor(c)}
                              className="w-[18px] h-[18px] rounded-full border border-white/10 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2 pt-2 flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-amber-500" /> Diseño y Estructura
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Modo de Layout</label>
                        <select
                          value={layoutMode}
                          onChange={(e) => setLayoutMode(e.target.value as "grid" | "list")}
                          className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                        >
                          <option value="grid">Grilla de Tarjetas (Grid)</option>
                          <option value="list">Lista Compacta (List)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Estilo de Tarjeta</label>
                        <select
                          value={cardStyle}
                          onChange={(e) => setCardStyle(e.target.value as "glass" | "classic" | "minimal")}
                          className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                        >
                          <option value="glass">Vidrio Premium (Glassmorphism)</option>
                          <option value="classic">Clásico con Borde</option>
                          <option value="minimal">Minimalista Plano</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Tipografía Principal</label>
                        <select
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value)}
                          className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                        >
                          <option value="Outfit">Outfit (Moderna & Premium)</option>
                          <option value="Geist">Geist Sans (Técnica & Limpia)</option>
                          <option value="Inter">Inter (Estándar & Neutra)</option>
                          <option value="Playfair Display">Playfair Display (Elegante & Serif)</option>
                          <option value="Montserrat">Montserrat (Geométrica & Urbana)</option>
                          <option value="Poppins">Poppins (Redonda & Amigable)</option>
                          <option value="Cinzel">Cinzel (Clásica Romana)</option>
                          <option value="Caveat">Caveat (Fantasía / Escrita a mano)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-zinc-900 pt-4 mt-2">
                      <PremiumButton
                        variant="primary"
                        size="md"
                        disabled={savingSettings}
                        glow
                        onClick={async () => {
                          setSavingSettings(true);
                          const res = await updateShopSettings(tenant.id, {
                            logoUrl: logoUrl || null,
                            bannerUrl: bannerUrl || null,
                            themeSettings: {
                              primaryColor,
                              backgroundColor,
                              layoutMode,
                              textColor,
                              fontFamily,
                              cardStyle,
                            },
                          });
                          setSavingSettings(false);
                          if (res.success) {
                            alert("¡Ajustes de personalización guardados exitosamente!");
                            fetchData();
                          } else {
                            alert(res.error || "Error al guardar personalización.");
                          }
                        }}
                      >
                        {savingSettings ? "Guardando..." : "Guardar Personalización"}
                      </PremiumButton>
                    </div>

                  </div>
                </div>

                {/* Right side: Smartphone mock Live Preview (5 cols) */}
                <div className="xl:col-span-5 flex flex-col items-center gap-4">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> Vista Previa en Vivo (Celular)
                  </span>

                  {/* Device Container Frame */}
                  <div className="w-[320px] h-[580px] rounded-[40px] border-[10px] border-zinc-800 bg-zinc-950 relative shadow-2xl flex flex-col overflow-hidden select-none">
                    
                    {/* Speaker/Camera notch mock */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-800 rounded-full z-20 flex justify-center items-center">
                      <div className="w-2.5 h-2.5 bg-black rounded-full ml-auto mr-4" />
                    </div>

                    {/* Simulating Custom Styles on the Preview Container */}
                    <div
                      style={{
                        backgroundColor: backgroundColor,
                        color: textColor,
                        fontFamily: 
                          fontFamily === "Outfit" ? "Outfit, sans-serif" : 
                          fontFamily === "Geist" ? "Geist, sans-serif" : 
                          fontFamily === "Playfair Display" ? "'Playfair Display', serif" : 
                          fontFamily === "Montserrat" ? "'Montserrat', sans-serif" :
                          fontFamily === "Poppins" ? "'Poppins', sans-serif" :
                          fontFamily === "Cinzel" ? "'Cinzel', serif" :
                          fontFamily === "Caveat" ? "'Caveat', cursive" :
                          "Inter, sans-serif",
                        height: "100%",
                      }}
                      className="flex-1 flex flex-col overflow-y-auto pt-8 pb-4 text-left transition-all"
                    >
                      {/* Simulating Banner */}
                      <div className="h-24 bg-zinc-900 relative overflow-hidden shrink-0 border-b border-white/5">
                        {bannerUrl ? (
                          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-zinc-900 to-zinc-950 flex items-center justify-center text-[10px] text-zinc-650 italic">
                            Banner de Portada
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30" />
                        
                        {/* Simulating Logo */}
                        <div className="absolute bottom-2 left-4 w-12 h-12 rounded-xl bg-zinc-950 border-2 border-zinc-900 overflow-hidden shadow-md flex items-center justify-center">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-black" style={{ color: primaryColor }}>
                              {tenant.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Store Mock Header */}
                      <div className="px-4 py-3 border-b border-white/5 flex flex-col gap-0.5">
                        <h4 className="text-sm font-bold text-white">{tenant.name}</h4>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">{tenant.description || "Cocina Artesanal y Viandas Premium"}</p>
                      </div>

                      {/* Mock Store Catalog */}
                      <div className="p-4 flex-1 flex flex-col gap-4">
                        
                        {/* Mock Category Chips */}
                        <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
                          <span
                            style={{ backgroundColor: primaryColor }}
                            className="px-2.5 py-1 rounded-full text-[9px] font-black text-black"
                          >
                            Destacados
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-white/5 text-zinc-400 border border-white/10">
                            Menú Diario
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-white/5 text-zinc-400 border border-white/10">
                            Keto
                          </span>
                        </div>

                        {/* Layout rendering dynamically inside mock */}
                        {layoutMode === "grid" ? (
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 1, name: "Wok de Vegetales", price: 2900 },
                              { id: 2, name: "Guiso de Lentejas", price: 3100 },
                            ].map((prod) => (
                              <div
                                key={prod.id}
                                style={{
                                  background: cardStyle === "glass" ? "rgba(255, 255, 255, 0.03)" : cardStyle === "classic" ? "transparent" : "rgba(255, 255, 255, 0.02)",
                                  borderColor: cardStyle === "classic" ? "rgba(255, 255, 255, 0.1)" : "rgba(255,255,255,0.05)",
                                  backdropFilter: cardStyle === "glass" ? "blur(8px)" : "none",
                                }}
                                className="rounded-xl border p-2 flex flex-col gap-1.5"
                              >
                                <div className="h-16 w-full rounded-lg bg-white/5 relative overflow-hidden flex items-center justify-center text-[9px] text-zinc-600">
                                  Imagen
                                </div>
                                <div>
                                  <h5 className="text-[10px] font-black text-zinc-200 line-clamp-1">{prod.name}</h5>
                                  <span className="text-[10px] font-black" style={{ color: primaryColor }}>
                                    ${prod.price}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {[
                              { id: 1, name: "Wok de Vegetales Especial", price: 2900 },
                              { id: 2, name: "Guiso de Lentejas Vegano", price: 3100 },
                            ].map((prod) => (
                              <div
                                key={prod.id}
                                style={{
                                  background: cardStyle === "glass" ? "rgba(255, 255, 255, 0.03)" : cardStyle === "classic" ? "transparent" : "rgba(255, 255, 255, 0.02)",
                                  borderColor: cardStyle === "classic" ? "rgba(255, 255, 255, 0.1)" : "rgba(255,255,255,0.05)",
                                  backdropFilter: cardStyle === "glass" ? "blur(8px)" : "none",
                                }}
                                className="rounded-xl border p-2.5 flex gap-3 items-center"
                              >
                                <div className="h-10 w-10 rounded-lg bg-white/5 shrink-0 flex items-center justify-center text-[8px] text-zinc-650">
                                  Img
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-[10px] font-bold text-zinc-200 truncate">{prod.name}</h5>
                                  <span className="text-[10px] font-black" style={{ color: primaryColor }}>
                                    ${prod.price}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: RECOVERY */}
          {activeTab === "recovery" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-white">Recuperar Ventas Abandonadas</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Visualizá carritos que no terminaron su pedido y contactalos con un recordatorio directo a WhatsApp.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-400">
                        <th className="py-3 font-bold uppercase tracking-wider">Usuario / Sesión</th>
                        <th className="py-3 font-bold uppercase tracking-wider">Productos en Carrito</th>
                        <th className="py-3 font-bold uppercase tracking-wider text-right">Total Estimado</th>
                        <th className="py-3 font-bold uppercase tracking-wider text-center">Inactividad</th>
                        <th className="py-3 font-bold uppercase tracking-wider text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abandonedCarts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-500 italic">
                            No se encontraron carritos inactivos o abandonados en este momento.
                          </td>
                        </tr>
                      ) : (
                        abandonedCarts.map((cart: any) => {
                          let itemsList: any[] = [];
                          try {
                            itemsList = JSON.parse(cart.items);
                          } catch {}

                          const totalEstimado = itemsList.reduce(
                            (sum, item) => sum + (item.product?.price || 0) * (item.quantity || 0),
                            0
                          );

                          const minutesInactive = Math.round(
                            (Date.now() - new Date(cart.updatedAt).getTime()) / 60000
                          );

                          const handleRecoverWhatsApp = async () => {
                            // Update status to RECOVERED in db
                            await markCartAsRecovered(cart.id);

                            // Build wa message
                            const name = cart.globalUser?.name || "Cliente";
                            const recoveryLink = `${window.location.origin}/shop/${tenantSlug}?recoveredCart=${cart.id}`;
                            const text = `¡Hola ${name}! 🛒\n\nVimos que dejaste algunos productos en tu carrito. Podés retomar tu compra y finalizar tu pedido haciendo clic en el siguiente enlace:\n\n${recoveryLink}\n\n¡Cualquier duda avisanos!`;
                            const phone = cart.globalUser?.phone || "";
                            const cleanPhone = phone.replace(/[^0-9]/g, "");

                            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
                            
                            // Reload list
                            fetchData();
                          };

                          return (
                            <tr key={cart.id} className="border-b border-zinc-900/60 hover:bg-zinc-900/20">
                              <td className="py-3.5">
                                <div className="font-bold text-zinc-150">
                                  {cart.globalUser?.name || "Invitado sin registrar"}
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">
                                  {cart.globalUser?.email || "Sin email"}
                                </div>
                                <div className="text-[10px] text-zinc-550">
                                  {cart.globalUser?.phone || "Sin teléfono"}
                                </div>
                              </td>
                              <td className="py-3.5">
                                <div className="flex flex-col gap-1">
                                  {itemsList.map((item: any, idx: number) => (
                                    <div key={idx} className="text-zinc-300 text-[11px]">
                                      {item.quantity}x {item.product?.name || "Producto desconocido"}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3.5 text-right font-bold text-amber-500">
                                ${totalEstimado}
                              </td>
                              <td className="py-3.5 text-center text-zinc-400">
                                {minutesInactive >= 60
                                  ? `${Math.round(minutesInactive / 60)} hs`
                                  : `${minutesInactive} min`}
                              </td>
                              <td className="py-3.5 text-center">
                                <PremiumButton
                                  variant="primary"
                                  size="sm"
                                  className="text-[10px] font-bold py-1.5 px-3"
                                  onClick={handleRecoverWhatsApp}
                                >
                                  Recuperar por WhatsApp
                                </PremiumButton>
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
