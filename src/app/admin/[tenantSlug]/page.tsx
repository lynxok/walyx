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
  CheckSquare,
  X,
  Mail,
  Phone,
  MapPin,
  Info,
  Menu
} from "lucide-react";
import { getTenantBySlug } from "@/app/actions/tenant";
import { getCategoriesByTenant, createCategory, updateCategory, deleteCategory } from "@/app/actions/category";
import { getProductsByTenant, createProduct, updateProduct, deleteProduct, adjustProductStock } from "@/app/actions/product";
import { getWeeklyMenuByStartDate, saveWeeklyMenu } from "@/app/actions/weeklyMenu";
import { getSizeCharts, createSizeChart, deleteSizeChart, addSizeChartRow, updateSizeChartRow, deleteSizeChartRow, getClothingBrands, createClothingBrand, deleteClothingBrand, getClothingTypes, createClothingType, deleteClothingType, type SizeChartWithRows, type ClothingBrandItem, type ClothingTypeItem } from "@/app/actions/sizeChart";
import { getHolidayForDate } from "@/lib/holidays";
import { getDashboardStats, DashboardStats } from "@/app/actions/dashboard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { updateShopSettings, type ThemeSettings } from "@/app/actions/shopSettings";
import { 
  getActiveCashSession, 
  openCashSession, 
  addCashTransaction, 
  closeCashSession, 
  getCashSessionHistory,
  type CashSessionWithTransactions 
} from "@/app/actions/cashSession";
import { Palette, LayoutGrid, Type, Image as ImageIcon, Smartphone, LifeBuoy, Search, HelpCircle, BookOpen, ChevronDown } from "lucide-react";
import { getAbandonedCarts, markCartAsRecovered } from "@/app/actions/cartRecovery";
import CatalogManagement from "@/components/admin/CatalogManagement";
import StockManagement from "@/components/admin/StockManagement";
import SizeChartManagement from "@/components/admin/SizeChartManagement";
import ShopCustomization from "@/components/admin/ShopCustomization";


const MOCK_KANBAN_ORDERS = [
  {
    id: "ORD-9481",
    customer: {
      name: "Juan Pérez",
      email: "juan.perez@example.com",
      phone: "+54 9 11 5555-1234",
      address: "Av. Cabildo 1540, 4° B, CABA",
    },
    status: "PENDING",
    paymentMethod: "Mercado Pago",
    paymentStatus: "Aprobado",
    deliveryCost: 450,
    deliveryZone: "Belgrano / Palermo",
    dateTimeSlot: "Hoy, 12:00 - 14:00 hs",
    products: [
      { name: "Vianda Keto", quantity: 2, variant: "Baja en carbohidratos", price: 1650, notes: "Sin cebolla por favor" },
      { name: "Ensalada César", quantity: 1, variant: "Con pollo extra", price: 450, notes: "Aderezo aparte" }
    ],
    total: 3750,
    createdAt: new Date(),
  },
  {
    id: "ORD-9479",
    customer: {
      name: "María López",
      email: "maria.lopez@gmail.com",
      phone: "+54 9 11 4444-5678",
      address: "Gorriti 4321, Palermo, CABA",
    },
    status: "PREPARING",
    paymentMethod: "Transferencia Bancaria",
    paymentStatus: "Pendiente de Verificación",
    deliveryCost: 400,
    deliveryZone: "Palermo",
    dateTimeSlot: "Hoy, 19:00 - 21:00 hs",
    products: [
      { name: "Tarta de Frutillas Royale", quantity: 1, variant: "Familiar (8 porciones)", price: 2400, notes: "Escribir 'Feliz Cumple' en la caja" }
    ],
    total: 2800,
    createdAt: new Date(),
  },
  {
    id: "ORD-9470",
    customer: {
      name: "Carlos Gómez",
      email: "carlos.gomez@outlook.com",
      phone: "+54 9 341 666-9999",
      address: "Bv. Oroño 1200, Rosario",
    },
    status: "DELIVERED",
    paymentMethod: "Tarjeta de Crédito",
    paymentStatus: "Aprobado",
    deliveryCost: 0,
    deliveryZone: "Rosario Centro",
    dateTimeSlot: "Ayer, 10:00 - 12:00 hs",
    products: [
      { name: "Buzo Oversized Black", quantity: 1, variant: "Talle L / Algodón Rústico", price: 5400, notes: "Entregar en portería si no respondo" }
    ],
    total: 5400,
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
  }
];

function hexToRgb(hex: string): string | null {
  if (!hex) return null;
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : null;
}

export default function AdminDashboardPage() {
  const [selectedKanbanOrder, setSelectedKanbanOrder] = useState<any>(null);
  const [kanbanOrders, setKanbanOrders] = useState(MOCK_KANBAN_ORDERS);
  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null);

  const updateKanbanOrderStatus = async (orderId: string, newStatus: string) => {
    const order = kanbanOrders.find((o) => o.id === orderId);
    if (!order) return;

    const oldStatus = order.status;
    if (oldStatus === newStatus) return;

    // Transitioning TO delivered (sales closed) -> deduct physical stock
    if (newStatus === "DELIVERED" && oldStatus !== "DELIVERED") {
      for (const op of order.products) {
        const prod = products.find((p) => p.name.toLowerCase() === op.name.toLowerCase());
        if (prod) {
          await adjustProductStock(prod.id, -op.quantity);
        }
      }
    }
    // Transitioning FROM delivered back to active -> return physical stock
    else if (oldStatus === "DELIVERED" && newStatus !== "DELIVERED") {
      for (const op of order.products) {
        const prod = products.find((p) => p.name.toLowerCase() === op.name.toLowerCase());
        if (prod) {
          await adjustProductStock(prod.id, op.quantity);
        }
      }
    }

    setKanbanOrders(prev => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    fetchData(); // Refresh products in admin dashboard
  };
  const [hoveredColumnStatus, setHoveredColumnStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewFilter, setViewFilter] = useState<"24H" | "ALL">("24H");
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

  // Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cash Register states (new shift-based)
  const [activeSession, setActiveSession] = useState<CashSessionWithTransactions | null>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [openingBalanceInput, setOpeningBalanceInput] = useState("10000");
  const [newTxAmount, setNewTxAmount] = useState("");
  const [newTxType, setNewTxType] = useState<"PAY_IN" | "PAY_OUT">("PAY_OUT");
  const [newTxCategory, setNewTxCategory] = useState("SUPPLIER");
  const [newTxNotes, setNewTxNotes] = useState("");
  const [blindClose, setBlindClose] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [cashNotesInput, setCashNotesInput] = useState("");
  const [manualActualBalanceInput, setManualActualBalanceInput] = useState("");
  const [calculatorDenominations, setCalculatorDenominations] = useState<Record<string, number>>({
    "2000": 0,
    "1000": 0,
    "500": 0,
    "200": 0,
    "100": 0,
    "50": 0,
    "20": 0,
    "10": 0,
  });
  const [cashDifference, setCashDifference] = useState<number | null>(null);
  const [cashCloseSuccess, setCashCloseSuccess] = useState(false);

  // Cart Recovery State
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);

  // Help Panel interactive states
  const [helpSearchQuery, setHelpSearchQuery] = useState("");
  const [helpActiveSubTab, setHelpActiveSubTab] = useState("general");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

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

  const matchesSearch = (o: any, query: string) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return o.id.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q);
  };

  const isRecent = (createdAt: any) => {
    if (!createdAt) return false;
    const createdTime = new Date(createdAt).getTime();
    return (Date.now() - createdTime) <= 24 * 60 * 60 * 1000;
  };

  useEffect(() => {
    if (searchQuery.trim() !== "" && viewFilter === "24H") {
      const match24h = kanbanOrders.some(o => {
        const matches = matchesSearch(o, searchQuery);
        const isDeliveredOrCancelled = o.status === "DELIVERED" || o.status === "CANCELLED";
        const isWithin24h = isRecent(o.createdAt);
        const passesTemporal = !isDeliveredOrCancelled || isWithin24h;
        return matches && passesTemporal;
      });

      if (!match24h) {
        const matchAll = kanbanOrders.some(o => matchesSearch(o, searchQuery));
        if (matchAll) {
          setViewFilter("ALL");
        }
      }
    }
  }, [searchQuery, viewFilter, kanbanOrders]);

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

    // Fetch cash session details
    try {
      const activeSessionRes = await getActiveCashSession(tenantRes.data.id);
      if (activeSessionRes.success) {
        setActiveSession(activeSessionRes.data);
      }
      const historyRes = await getCashSessionHistory(tenantRes.data.id);
      if (historyRes.success) {
        setSessionHistory(historyRes.data);
      }
    } catch (err) {
      console.error("Error loading cash sessions in fetchData:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tenantSlug]);

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    const balance = parseFloat(openingBalanceInput) || 0;
    const res = await openCashSession(tenant.id, balance, "Administrador");
    if (res.success) {
      // Refresh to load session
      await fetchData();
      setCashCloseSuccess(false);
      setCashDifference(null);
    } else {
      alert(res.error || "Error al abrir la caja");
    }
  };

  const handleRegisterTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    const amount = parseFloat(newTxAmount) || 0;
    if (amount <= 0) {
      alert("Por favor ingrese un monto mayor a cero.");
      return;
    }
    const res = await addCashTransaction(
      activeSession.id,
      newTxType,
      amount,
      newTxCategory,
      newTxNotes
    );
    if (res.success) {
      setNewTxAmount("");
      setNewTxNotes("");
      await fetchData();
    } else {
      alert(res.error || "Error al registrar movimiento");
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    const actualBalance = parseFloat(manualActualBalanceInput) || 0;
    const res = await closeCashSession(
      activeSession.id,
      actualBalance,
      "Administrador",
      cashNotesInput
    );
    if (res.success) {
      setCashDifference(res.data.difference);
      setCashCloseSuccess(true);
      setShowCalculatorModal(false);
      setManualActualBalanceInput("");
      setCashNotesInput("");
      setCalculatorDenominations({
        "2000": 0,
        "1000": 0,
        "500": 0,
        "200": 0,
        "100": 0,
        "50": 0,
        "20": 0,
        "10": 0,
      });
      await fetchData();
    } else {
      alert(res.error || "Error al cerrar la caja");
    }
  };

  const handleCalculatorValueChange = (denom: string, qty: number) => {
    const updated = {
      ...calculatorDenominations,
      [denom]: Math.max(0, qty),
    };
    setCalculatorDenominations(updated);

    // Sum all denominations
    const total = Object.entries(updated).reduce((sum, [d, q]) => {
      return sum + parseFloat(d) * q;
    }, 0);

    setManualActualBalanceInput(total.toString());
  };

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
  const primaryRgb = hexToRgb(primaryColor) || "245, 158, 11";

  return (
    <div 
      style={{
        "--primary-color": primaryColor,
        "--primary-rgb": primaryRgb,
        "--text-color": textColor,
      } as React.CSSProperties}
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden"
    >
      {/* Background radial glow effects */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-[rgba(var(--primary-rgb),0.03)] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-[rgba(var(--primary-rgb),0.03)] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] bg-[rgba(var(--primary-rgb),0.02)] blur-[130px] rounded-full pointer-events-none" />
      {/* Top Banner Header */}
      <header className="border-b border-white/[0.06] bg-zinc-950/70 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-lg shadow-black/20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 bg-zinc-950/60 border border-white/[0.06] rounded-xl text-zinc-450 hover:text-white hover:bg-zinc-900 transition-all duration-300"
          >
            <Menu className="w-4 h-4" />
          </button>
          <Link href="/" className="p-2 bg-zinc-950/60 border border-white/[0.06] rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all duration-300">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-white tracking-tight">{tenant.name}</h1>
              <span 
                style={{
                  backgroundColor: "rgba(var(--primary-rgb), 0.1)",
                  borderColor: "rgba(var(--primary-rgb), 0.2)",
                  color: "var(--primary-color)"
                }}
                className="text-[10px] px-2.5 py-0.5 border rounded-full font-black uppercase tracking-wider"
              >
                {hasType}
              </span>
            </div>
            <p className="text-xs text-zinc-500">Panel de Administración / {tenant.slug}</p>
          </div>
        </div>
        <Link href={`/shop/${tenant.slug}`}>
          <PremiumButton variant="outline" size="sm" className="hover:scale-[1.02] active:scale-[0.98] transition-all">
            Ver Tienda Pública <ChevronRight className="w-4 h-4 ml-1" />
          </PremiumButton>
        </Link>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <aside 
            onClick={(e) => e.stopPropagation()}
            className="fixed left-0 top-0 bottom-0 w-72 bg-zinc-950/95 border-r border-white/[0.06] p-6 flex flex-col gap-2.5 shadow-2xl overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-4 border-b border-zinc-900 mb-2">
              <div>
                <h4 className="font-black text-white text-sm">{tenant.name}</h4>
                <p className="text-[10px] text-zinc-500">Menú de Navegación</p>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
              { id: "settings", label: "Configuración", icon: <SettingsIcon className="w-4 h-4" /> },
              { id: "help", label: "Ayuda & Soporte", icon: <LifeBuoy className="w-4 h-4 animate-pulse" /> }
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  style={isActive ? {
                    backgroundColor: "rgba(var(--primary-rgb), 0.08)",
                    borderColor: "rgba(var(--primary-rgb), 0.15)",
                    color: "var(--primary-color)"
                  } : {}}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider border relative transition-all duration-300 ${
                    isActive
                      ? "shadow-sm shadow-black/10"
                      : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 hover:border-white/[0.04]"
                  }`}
                >
                  {isActive && (
                    <span 
                      style={{ backgroundColor: "var(--primary-color)", boxShadow: "0 0 10px var(--primary-color)" }}
                      className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r"
                    ></span>
                  )}
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </aside>
        </div>
      )}

      {/* Main Admin Grid */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 lg:p-8 max-w-7xl w-full mx-auto relative z-10">
        {/* Navigation Sidebar Panel */}
        <aside className="hidden lg:flex w-full lg:w-64 flex-col gap-1.5 bg-zinc-900/20 backdrop-blur-md border border-white/[0.06] p-4 rounded-3xl shrink-0 h-fit shadow-xl shadow-black/25">
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
            { id: "settings", label: "Configuración", icon: <SettingsIcon className="w-4 h-4" /> },
            { id: "help", label: "Ayuda & Soporte", icon: <LifeBuoy className="w-4 h-4 animate-pulse" /> }
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={isActive ? {
                  backgroundColor: "rgba(var(--primary-rgb), 0.08)",
                  borderColor: "rgba(var(--primary-rgb), 0.15)",
                  color: "var(--primary-color)"
                } : {}}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wider border relative transition-all duration-300 ${
                  isActive
                    ? "shadow-sm shadow-black/10"
                    : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 hover:border-white/[0.04]"
                }`}
              >
                {isActive && (
                  <span 
                    style={{ backgroundColor: "var(--primary-color)", boxShadow: "0 0 10px var(--primary-color)" }}
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r"
                  ></span>
                )}
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Content Pane */}
        <main className="flex-1 min-w-0">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && stats && (
            <div className="flex flex-col gap-8">
              {/* Stat Cards & Mini Chart */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Ventas */}
                <div className="bg-zinc-900/30 backdrop-blur-md p-6 rounded-3xl border border-white/[0.06] hover:border-[rgba(var(--primary-rgb),0.3)] hover:-translate-y-1 hover:shadow-2xl hover:shadow-[rgba(var(--primary-rgb),0.02)] transition-all duration-300 shadow-xl shadow-black/25 flex flex-col justify-between h-40 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[rgba(var(--primary-rgb),0.02)] rounded-full blur-2xl group-hover:bg-[rgba(var(--primary-rgb),0.05)] transition-all"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Ventas Totales</span>
                    <div 
                      style={{ backgroundColor: "rgba(var(--primary-rgb), 0.1)", color: "var(--primary-color)" }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/[0.04] shadow-inner"
                    >
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white font-mono tracking-tight">${stats.totalSales.toFixed(2)}</h3>
                    <p className="text-[10px] text-zinc-500 mt-1 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Ventas brutas del período
                    </p>
                  </div>
                </div>

                {/* Card 2: Ticket Promedio */}
                <div className="bg-zinc-900/30 backdrop-blur-md p-6 rounded-3xl border border-white/[0.06] hover:border-[rgba(var(--primary-rgb),0.3)] hover:-translate-y-1 hover:shadow-2xl hover:shadow-[rgba(var(--primary-rgb),0.02)] transition-all duration-300 shadow-xl shadow-black/25 flex flex-col justify-between h-40 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[rgba(var(--primary-rgb),0.02)] rounded-full blur-2xl group-hover:bg-[rgba(var(--primary-rgb),0.05)] transition-all"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Ticket Promedio</span>
                    <div 
                      style={{ backgroundColor: "rgba(var(--primary-rgb), 0.1)", color: "var(--primary-color)" }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/[0.04] shadow-inner"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white font-mono tracking-tight">${stats.averageTicket.toFixed(2)}</h3>
                    <p className="text-[10px] text-zinc-500 mt-1 font-semibold">Promedio por orden de compra</p>
                  </div>
                </div>

                {/* Card 3: Total Pedidos */}
                <div className="bg-zinc-900/30 backdrop-blur-md p-6 rounded-3xl border border-white/[0.06] hover:border-[rgba(var(--primary-rgb),0.3)] hover:-translate-y-1 hover:shadow-2xl hover:shadow-[rgba(var(--primary-rgb),0.02)] transition-all duration-300 shadow-xl shadow-black/25 flex flex-col justify-between h-40 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[rgba(var(--primary-rgb),0.02)] rounded-full blur-2xl group-hover:bg-[rgba(var(--primary-rgb),0.05)] transition-all"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Total Pedidos</span>
                    <div 
                      style={{ backgroundColor: "rgba(var(--primary-rgb), 0.1)", color: "var(--primary-color)" }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/[0.04] shadow-inner"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white font-mono tracking-tight">{stats.totalOrdersCount}</h3>
                    <p className="text-[10px] text-zinc-500 mt-1 font-semibold">Excluyendo cancelados</p>
                  </div>
                </div>
              </div>

              {/* Middle Section: SVG Sales Distribution & ABC curve */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SVG Payment Share Chart */}
                <div className="bg-zinc-900/30 backdrop-blur-md p-6 rounded-3xl border border-white/[0.06] shadow-xl shadow-black/25 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Métodos de Pago de Hoy</h3>
                    <p className="text-[10px] text-zinc-500 mb-6">Distribución de ingresos según canal.</p>
                  </div>

                  {stats.dailyClose.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-8">
                      <p className="text-zinc-600 text-xs italic">Aún no hay ventas registradas hoy.</p>
                    </div>
                  ) : (
                    (() => {
                      const totalToday = stats.dailyClose.reduce((sum, d) => sum + d.totalRevenue, 0);
                      let accumulatedPercentage = 0;
                      
                      return (
                        <div className="flex flex-col gap-6 items-center">
                          {/* Svg Circle Chart */}
                          <div className="relative w-28 h-28 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#18181b" strokeWidth="3" />
                              {stats.dailyClose.map((item, idx) => {
                                const percentage = totalToday > 0 ? (item.totalRevenue / totalToday) * 100 : 0;
                                const strokeDash = `${percentage} ${100 - percentage}`;
                                const strokeOffset = 100 - accumulatedPercentage;
                                accumulatedPercentage += percentage;

                                // colors palette
                                const strokeColors = ["var(--primary-color)", "#3b82f6", "#a855f7"];
                                const strokeColor = strokeColors[idx % strokeColors.length];

                                return (
                                  <circle
                                    key={item.paymentMethod}
                                    cx="18"
                                    cy="18"
                                    r="15.915"
                                    fill="none"
                                    stroke={strokeColor}
                                    strokeWidth="3.2"
                                    strokeDasharray={strokeDash}
                                    strokeDashoffset={strokeOffset}
                                    className="transition-all duration-500 ease-in-out"
                                  />
                                );
                              })}
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Hoy</span>
                              <span className="text-xs font-black text-white font-mono">${totalToday.toFixed(0)}</span>
                            </div>
                          </div>

                          {/* Legend */}
                          <div className="w-full flex flex-col gap-2">
                            {stats.dailyClose.map((item, idx) => {
                              const percentage = totalToday > 0 ? (item.totalRevenue / totalToday) * 100 : 0;
                              const colors = ["bg-[var(--primary-color)]", "bg-blue-500", "bg-purple-500"];
                              const colorClass = colors[idx % colors.length];

                              return (
                                <div key={item.paymentMethod} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${colorClass}`}></span>
                                    <span className="text-zinc-400 font-bold uppercase text-[9px]">{item.paymentMethod}</span>
                                  </div>
                                  <span className="text-zinc-350 font-mono font-semibold">${item.totalRevenue.toFixed(2)} ({percentage.toFixed(0)}%)</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* ABC Product Analysis Table */}
                <div className="bg-zinc-900/30 backdrop-blur-md p-6 rounded-3xl border border-white/[0.06] shadow-xl shadow-black/25 lg:col-span-2 flex flex-col gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Clasificación ABC de Productos</h3>
                    <p className="text-[10px] text-zinc-500">Clasificación según participación en ingresos (A: 70%, B: 20%, C: 10%)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-900/80 text-zinc-400 uppercase text-[9px] font-bold tracking-wider">
                          <th className="py-2.5">Producto</th>
                          <th className="py-2.5 text-right">Cant. Vendida</th>
                          <th className="py-2.5 text-right">Ingresos</th>
                          <th className="py-2.5 text-right">Acumulado (%)</th>
                          <th className="py-2.5 text-center">Clase</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.abcProducts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-zinc-500 italic">Aún no hay suficientes órdenes registradas.</td>
                          </tr>
                        ) : (
                          stats.abcProducts.slice(0, 5).map((p) => (
                            <tr key={p.productId} className="border-b border-zinc-950/60 hover:bg-zinc-950/25 transition-all">
                              <td className="py-3 text-white font-semibold flex items-center gap-1.5">
                                <span className={`w-1 h-1 rounded-full ${
                                  p.class === "A" ? "bg-emerald-500" : p.class === "B" ? "bg-[var(--primary-color)]" : "bg-zinc-500"
                                }`}></span>
                                {p.name}
                              </td>
                              <td className="py-3 text-right text-zinc-300 font-mono">{p.totalQuantity}</td>
                              <td className="py-3 text-right text-zinc-350 font-mono">{p.totalRevenue.toFixed(2)}</td>
                              <td className="py-3 text-right text-zinc-400 font-mono w-32">
                                <div className="flex items-center justify-end gap-2">
                                  <span>{p.cumulativePercentage.toFixed(1)}%</span>
                                  {/* Progress bar */}
                                  <div className="w-12 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/[0.02]">
                                    <div 
                                      style={{ 
                                        width: `${Math.min(100, p.cumulativePercentage)}%`,
                                        backgroundColor: p.class === "A" 
                                          ? "#10b981" 
                                          : p.class === "B" 
                                            ? "var(--primary-color)" 
                                            : "#71717a" 
                                      }}
                                      className="h-full rounded-full transition-all duration-500"
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                <span 
                                  style={p.class === "A" ? {
                                    backgroundColor: "rgba(16, 185, 129, 0.08)",
                                    borderColor: "rgba(16, 185, 129, 0.15)",
                                    color: "#10b981"
                                  } : p.class === "B" ? {
                                    backgroundColor: "rgba(var(--primary-rgb), 0.08)",
                                    borderColor: "rgba(var(--primary-rgb), 0.15)",
                                    color: "var(--primary-color)"
                                  } : {
                                    backgroundColor: "rgba(113, 113, 122, 0.08)",
                                    borderColor: "rgba(113, 113, 122, 0.15)",
                                    color: "#a1a1aa"
                                  }}
                                  className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase border"
                                >
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
              </div>

              {/* Stock Warning Alerts */}
              <div className="bg-zinc-900/30 backdrop-blur-md p-6 rounded-3xl border border-white/[0.06] shadow-xl shadow-black/25 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Alertas de Stock Crítico</h3>
                <div className="flex flex-col gap-2">
                  {products.filter((p) => p.stock <= 5).length === 0 ? (
                    <div className="text-zinc-500 text-xs py-2 italic text-center">Todos los productos cuentan con stock suficiente (&gt; 5 unidades).</div>
                  ) : (
                    products.filter((p) => p.stock <= 5).map((p) => (
                      <div 
                        key={p.id} 
                        style={{ backgroundColor: "rgba(239, 68, 68, 0.03)", borderColor: "rgba(239, 68, 68, 0.15)" }}
                        className="flex items-center justify-between border px-4 py-3.5 rounded-2xl text-xs text-red-400 shadow-sm"
                      >
                        <span className="font-bold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                          {p.name}
                        </span>
                        <span>Stock disponible: <strong className="font-black underline font-mono">{p.stock} un.</strong></span>
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

              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-zinc-900/20 border border-zinc-900 p-4 rounded-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Buscar por ID de pedido o nombre del cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-xs text-white pl-10 pr-4 py-2.5 rounded-xl outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center bg-zinc-950 border border-zinc-850 p-1 rounded-xl shrink-0 self-start sm:self-center">
                  <button
                    onClick={() => setViewFilter("24H")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      viewFilter === "24H"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Últimas 24 Horas
                  </button>
                  <button
                    onClick={() => setViewFilter("ALL")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      viewFilter === "ALL"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Histórico Completo
                  </button>
                </div>
              </div>

              {/* Kanban Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                {[
                  {
                    status: "PENDING",
                    label: "Pendientes",
                    colorClass: "text-amber-500",
                    badgeColorClass: "bg-amber-500/10 text-amber-500",
                    actionButton: {
                      label: "Preparar →",
                      hoverBg: "hover:bg-amber-600",
                      bg: "bg-amber-500",
                      nextStatus: "PREPARING"
                    }
                  },
                  {
                    status: "PREPARING",
                    label: hasType === "ROPA" ? "En Preparación" : "En Cocina",
                    colorClass: "text-purple-400",
                    badgeColorClass: "bg-purple-500/10 text-purple-400",
                    actionButton: {
                      label: "Entregar →",
                      hoverBg: "hover:bg-emerald-600",
                      bg: "bg-emerald-500",
                      nextStatus: "DELIVERED"
                    }
                  },
                  {
                    status: "DELIVERED",
                    label: "Entregados",
                    colorClass: "text-emerald-400",
                    badgeColorClass: "bg-emerald-500/10 text-emerald-400",
                    deliveredText: "Entregado",
                    show24hBadge: true
                  },
                  {
                    status: "CANCELLED",
                    label: "Cancelados",
                    colorClass: "text-zinc-500",
                    badgeColorClass: "bg-zinc-800 text-zinc-400",
                    show24hBadge: true
                  }
                ].map((col) => {
                  const filteredOrders = kanbanOrders.filter(o => {
                    if (o.status !== col.status) return false;
                    if (!matchesSearch(o, searchQuery)) return false;
                    if (viewFilter === "24H" && (col.status === "DELIVERED" || col.status === "CANCELLED")) {
                      if (!isRecent(o.createdAt)) return false;
                    }
                    return true;
                  });
                  const isHovered = hoveredColumnStatus === col.status;
                  return (
                    <div 
                      key={col.status}
                      data-column-status={col.status}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (hoveredColumnStatus !== col.status) {
                          setHoveredColumnStatus(col.status);
                        }
                      }}
                      onDragLeave={() => {
                        if (hoveredColumnStatus === col.status) {
                          setHoveredColumnStatus(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const orderId = e.dataTransfer.getData("text/plain") || draggingOrderId;
                        if (orderId) {
                          updateKanbanOrderStatus(orderId, col.status);
                        }
                        setDraggingOrderId(null);
                        setHoveredColumnStatus(null);
                      }}
                      className={`glass-panel p-4 rounded-2xl border transition-all duration-200 bg-zinc-900/5 flex flex-col gap-3 min-h-[500px] ${
                        isHovered 
                          ? "border-amber-500/50 ring-2 ring-amber-500/10 bg-amber-500/[0.02]" 
                          : "border-zinc-900"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-zinc-950 pb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-black uppercase tracking-wider ${col.colorClass}`}>{col.label}</span>
                          {col.show24hBadge && viewFilter === "24H" && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700/50 rounded font-semibold uppercase tracking-tight scale-90 origin-left">
                              últimas 24h
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${col.badgeColorClass}`}>
                          {filteredOrders.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {filteredOrders.length === 0 ? (
                          <div className="text-center py-8 text-[11px] text-zinc-650">
                            Ninguno en esta columna
                          </div>
                        ) : (
                          filteredOrders.map((order) => {
                            const isCardDragging = draggingOrderId === order.id;
                            return (
                              <div 
                                key={order.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("text/plain", order.id);
                                  setDraggingOrderId(order.id);
                                }}
                                onDragEnd={() => {
                                  setDraggingOrderId(null);
                                  setHoveredColumnStatus(null);
                                }}
                                onTouchStart={() => {
                                  setDraggingOrderId(order.id);
                                }}
                                onTouchEnd={(e) => {
                                  if (!draggingOrderId) return;
                                  const touch = e.changedTouches[0];
                                  const element = document.elementFromPoint(touch.clientX, touch.clientY);
                                  let current: HTMLElement | null = element as HTMLElement;
                                  let targetColumnStatus: string | null = null;
                                  while (current) {
                                    const statusAttr = current.getAttribute("data-column-status");
                                    if (statusAttr) {
                                      targetColumnStatus = statusAttr;
                                      break;
                                    }
                                    current = current.parentElement;
                                  }
                                  if (targetColumnStatus) {
                                    updateKanbanOrderStatus(draggingOrderId, targetColumnStatus);
                                  }
                                  setDraggingOrderId(null);
                                  setHoveredColumnStatus(null);
                                }}
                                onClick={() => setSelectedKanbanOrder(order)}
                                className={`p-4 rounded-xl border flex flex-col gap-2.5 cursor-pointer transition-all ${
                                  col.status === "DELIVERED"
                                    ? "bg-zinc-950/40 border-zinc-900/60 opacity-80 hover:border-emerald-500/50 hover:bg-zinc-900/10"
                                    : "bg-zinc-950 border-zinc-900 hover:border-amber-500/50 hover:bg-zinc-900/10"
                                } ${isCardDragging ? "opacity-50 scale-95 border-amber-500/30" : ""}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-bold ${col.status === "DELIVERED" ? "text-zinc-500" : "text-zinc-400"}`}>#{order.id}</span>
                                  <span className="text-amber-500 font-extrabold text-xs">${order.total}</span>
                                </div>
                                <div>
                                  <h4 className={`text-xs font-bold ${col.status === "DELIVERED" ? "text-zinc-400" : "text-zinc-200"}`}>{order.customer.name}</h4>
                                  <p className="text-[10px] text-zinc-500 mt-1">
                                    {order.products.map(p => `${p.quantity}x ${p.name}`).join(", ")}
                                  </p>
                                </div>
                                {col.actionButton && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateKanbanOrderStatus(order.id, col.actionButton.nextStatus);
                                    }}
                                    className={`w-full ${col.actionButton.bg} text-zinc-950 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${col.actionButton.hoverBg}`}
                                  >
                                    {col.actionButton.label}
                                  </button>
                                )}
                                {col.deliveredText && (
                                  <span className="text-[9px] text-emerald-500 text-center font-bold uppercase">
                                    {col.deliveredText}
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                        {viewFilter === "24H" && (col.status === "DELIVERED" || col.status === "CANCELLED") && (
                          (() => {
                            const hiddenCount = kanbanOrders.filter(o => 
                              o.status === col.status && 
                              matchesSearch(o, searchQuery) && 
                              !isRecent(o.createdAt)
                            ).length;
                            if (hiddenCount > 0) {
                              return (
                                <button
                                  onClick={() => setViewFilter("ALL")}
                                  className="w-full py-4 border border-dashed border-zinc-800 hover:border-amber-500/40 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-amber-400 hover:bg-amber-500/[0.01] transition-all"
                                >
                                  + Ver anteriores ({hiddenCount})
                                </button>
                              );
                            }
                            return null;
                          })()
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CATALOG */}
          {activeTab === "catalog" && (
            <CatalogManagement
              tenant={tenant}
              categories={categories}
              products={products}
              sizeCharts={sizeCharts}
              onRefresh={fetchData}
            />
          )}

          {/* TAB 3: STOCK MANAGEMENT */}
          {activeTab === "stock" && (
            <StockManagement
              tenant={tenant}
              categories={categories}
              products={products}
              kanbanOrders={kanbanOrders}
              onRefresh={fetchData}
            />
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
            <SizeChartManagement
              tenant={tenant}
              sizeCharts={sizeCharts}
              clothingBrands={clothingBrands}
              clothingTypes={clothingTypes}
              onRefresh={fetchData}
            />
          )}

          {/* LEGACY TALLES PLACEHOLDER */}
          {false && (
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
            <div className="flex flex-col gap-8">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Arqueo y Cierre de Caja</h2>
                  <p className="text-xs text-zinc-500 mt-1">Control contable persistente y auditoría de diferencias diarias de caja chica.</p>
                </div>
                {activeSession && (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Turno Abierto por: {activeSession.openedBy} ({new Date(activeSession.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </div>
                )}
              </div>

              {!activeSession ? (
                /* 1. STATE: NO ACTIVE SESSION (OPEN CASH REGISTER FORM) */
                <div className="max-w-md mx-auto w-full glass-panel p-8 rounded-3xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-6 mt-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full"></div>
                  <div className="flex flex-col gap-2 text-center">
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Apertura de Caja Obligatoria</h3>
                    <p className="text-xs text-zinc-500">Para iniciar a registrar ventas en efectivo y controlar diferencias de caja, debés ingresar el saldo inicial.</p>
                  </div>

                  <form onSubmit={handleOpenSession} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Efectivo Inicial en Caja (Cambio) ($)</label>
                      <input 
                        type="number"
                        required
                        value={openingBalanceInput}
                        onChange={(e) => setOpeningBalanceInput(e.target.value)}
                        placeholder="Ej. 10000"
                        className="bg-zinc-950 border border-zinc-900 text-sm text-white p-4 rounded-xl outline-none font-mono text-center focus:border-amber-500/50 transition-colors"
                      />
                    </div>
                    <PremiumButton type="submit" variant="primary" size="lg" className="w-full justify-center py-4 font-bold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all">
                      Abrir Turno de Caja
                    </PremiumButton>
                  </form>

                  {/* Show previous close result message if exist */}
                  {cashCloseSuccess && cashDifference !== null && (
                    <div className={`p-4 rounded-xl border text-xs flex flex-col gap-1.5 mt-2 ${
                      cashDifference === 0 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                        : cashDifference > 0 
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}>
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4" /> Último Arqueo Grabado Exitosamente
                      </p>
                      <p>
                        Diferencia contable final:{" "}
                        <strong className="underline font-mono">
                          {cashDifference >= 0 ? `+$${cashDifference.toFixed(2)} (Sobrante)` : `-$${Math.abs(cashDifference).toFixed(2)} (Faltante)`}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* 2. STATE: ACTIVE SESSION OPEN (SHIFT ONGOING) */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Totals & Blind Close */}
                  <div className="flex flex-col gap-6 lg:col-span-2">
                    <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-6 relative overflow-hidden">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Resumen de Turno en Tiempo Real</h3>
                        <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-lg border border-zinc-900">
                          <label className="text-[10px] text-zinc-400 font-bold uppercase cursor-pointer" htmlFor="blind-switch">Arqueo Ciego</label>
                          <input 
                            id="blind-switch"
                            type="checkbox"
                            checked={blindClose}
                            onChange={(e) => setBlindClose(e.target.checked)}
                            className="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Financial summary breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-900/50 flex flex-col gap-1">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">Monto Inicial</span>
                          <span className="text-sm font-mono text-zinc-300">${activeSession.openingBalance.toFixed(2)}</span>
                        </div>
                        <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-900/50 flex flex-col gap-1">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">Ventas (Efectivo)</span>
                          <span className="text-sm font-mono text-emerald-500">
                            +${activeSession.transactions
                              .filter(t => t.type === "SALE" && t.category === "CASH")
                              .reduce((sum, t) => sum + t.amount, 0)
                              .toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-900/50 flex flex-col gap-1">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">Otros Ingresos (Pay In)</span>
                          <span className="text-sm font-mono text-blue-400">
                            +${activeSession.transactions
                              .filter(t => t.type === "PAY_IN" && t.category !== "FLOAT")
                              .reduce((sum, t) => sum + t.amount, 0)
                              .toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-900/50 flex flex-col gap-1">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">Egresos (Pay Out)</span>
                          <span className="text-sm font-mono text-rose-500">
                            -${activeSession.transactions
                              .filter(t => t.type === "PAY_OUT")
                              .reduce((sum, t) => sum + t.amount, 0)
                              .toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Total Expected Card */}
                      <div className="bg-gradient-to-r from-zinc-950 to-zinc-900/80 p-6 rounded-xl border border-zinc-900 flex justify-between items-center shadow-inner">
                        <div>
                          <p className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">Esperado en Caja Físico</p>
                          <p className="text-xs text-zinc-500 mt-0.5">(Fórmula: Inicial + Ventas Efectivo + Ingresos - Egresos)</p>
                        </div>
                        <div className="text-right">
                          {blindClose ? (
                            <span className="text-lg font-bold text-zinc-600 tracking-wider">••••••</span>
                          ) : (
                            <span className="text-2xl font-black text-amber-500 font-mono">
                              ${activeSession.expectedBalance.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-4 mt-2">
                        <PremiumButton 
                          onClick={() => {
                            setManualActualBalanceInput("");
                            setShowCalculatorModal(true);
                          }}
                          variant="primary" 
                          size="md" 
                          className="flex-1 justify-center py-3 font-bold"
                        >
                          Cerrar Turno / Arqueo Diario
                        </PremiumButton>
                      </div>
                    </div>

                    {/* Transaction Log list */}
                    <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Movimientos del Turno Actual</h3>
                      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                        {activeSession.transactions.length === 0 ? (
                          <p className="text-zinc-500 text-xs py-4 text-center">No se han registrado movimientos todavía.</p>
                        ) : (
                          activeSession.transactions.map((t) => (
                            <div key={t.id} className="flex justify-between items-center border-b border-zinc-950 pb-2 text-xs">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-white font-bold flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    t.type === "SALE" ? "bg-emerald-500" : t.type === "PAY_IN" ? "bg-blue-400" : "bg-rose-500"
                                  }`}></span>
                                  {t.notes || `${t.type} - ${t.category}`}
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                  {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Categoría: {t.category}
                                </span>
                              </div>
                              <span className={`font-mono font-bold ${
                                t.type === "PAY_OUT" ? "text-rose-500" : "text-zinc-300"
                              }`}>
                                {t.type === "PAY_OUT" ? "-" : "+"}${t.amount.toFixed(2)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Register transaction Pay In / Pay Out */}
                  <div className="flex flex-col gap-6">
                    <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Registrar Movimiento de Efectivo</h3>
                      <form onSubmit={handleRegisterTransaction} className="flex flex-col gap-4">
                        {/* Transaction Type selection */}
                        <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
                          <button
                            type="button"
                            onClick={() => {
                              setNewTxType("PAY_OUT");
                              setNewTxCategory("SUPPLIER");
                            }}
                            className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                              newTxType === "PAY_OUT" 
                                ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" 
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            Egreso (Retiro/Gasto)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewTxType("PAY_IN");
                              setNewTxCategory("OTHER");
                            }}
                            className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                              newTxType === "PAY_IN" 
                                ? "bg-blue-500/10 border border-blue-500/20 text-blue-400" 
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            Ingreso (Carga cambio)
                          </button>
                        </div>

                        {/* Amount */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-zinc-400 text-[10px] font-bold uppercase">Monto ($)</label>
                          <input 
                            type="number"
                            required
                            placeholder="0.00"
                            value={newTxAmount}
                            onChange={(e) => setNewTxAmount(e.target.value)}
                            className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                          />
                        </div>

                        {/* Category */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-zinc-400 text-[10px] font-bold uppercase">Categoría</label>
                          <select
                            value={newTxCategory}
                            onChange={(e) => setNewTxCategory(e.target.value)}
                            className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                          >
                            {newTxType === "PAY_OUT" ? (
                              <>
                                <option value="SUPPLIER">Proveedor (Materia prima/Viandas/Ropa)</option>
                                <option value="PERSONAL">Retiro Personal / Socio</option>
                                <option value="REFUND">Devolución a Cliente</option>
                                <option value="OTHER">Otros Gastos Varios</option>
                              </>
                            ) : (
                              <>
                                <option value="FLOAT">Ingreso Extra para Cambio</option>
                                <option value="OTHER">Otros Ingresos / Aportes</option>
                              </>
                            )}
                          </select>
                        </div>

                        {/* Notes */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-zinc-400 text-[10px] font-bold uppercase">Descripción / Nota</label>
                          <input 
                            type="text"
                            placeholder="Ej: Pago verdulería turnos viandas"
                            value={newTxNotes}
                            onChange={(e) => setNewTxNotes(e.target.value)}
                            className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                          />
                        </div>

                        <PremiumButton type="submit" variant="secondary" size="sm" className="w-full justify-center">
                          Grabar Movimiento
                        </PremiumButton>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. HISTORY OF CLOSED SESSIONS */}
              <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4 mt-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historial de Turnos y Cierres de Caja</h3>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Cierres guardados en Neon</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-400 uppercase tracking-wider font-bold text-[10px]">
                        <th className="py-3 px-4">Fecha y Hora Cierre</th>
                        <th className="py-3 px-4">Operador</th>
                        <th className="py-3 px-4">Fondo Inicial</th>
                        <th className="py-3 px-4 text-right">Saldo Esperado</th>
                        <th className="py-3 px-4 text-right">Contado Real</th>
                        <th className="py-3 px-4 text-right">Diferencia</th>
                        <th className="py-3 px-4">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionHistory.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-zinc-500">
                            No hay registros de cierres anteriores.
                          </td>
                        </tr>
                      ) : (
                        sessionHistory.map((s) => (
                          <tr key={s.id} className="border-b border-zinc-950 hover:bg-zinc-950/20">
                            <td className="py-3 px-4 font-mono text-zinc-400">
                              {new Date(s.closedAt).toLocaleDateString()} {new Date(s.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-4 text-white font-bold">{s.closedBy}</td>
                            <td className="py-3 px-4 font-mono text-zinc-500">${s.openingBalance.toFixed(2)}</td>
                            <td className="py-3 px-4 font-mono text-zinc-300 text-right">${s.expectedBalance.toFixed(2)}</td>
                            <td className="py-3 px-4 font-mono text-white text-right">${s.actualBalance?.toFixed(2)}</td>
                            <td className={`py-3 px-4 font-mono text-right font-black ${
                              s.difference === 0 
                                ? "text-emerald-500" 
                                : s.difference > 0 
                                  ? "text-blue-400" 
                                  : "text-rose-500"
                            }`}>
                              {s.difference >= 0 ? `+$${s.difference.toFixed(2)}` : `-$${Math.abs(s.difference).toFixed(2)}`}
                            </td>
                            <td className="py-3 px-4 text-zinc-400 italic max-w-xs truncate" title={s.notes || ""}>
                              {s.notes || "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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


            </div>
          )}

          {/* TAB: PERSONALIZE */}
          {activeTab === "personalize" && (
            <ShopCustomization
              tenant={tenant}
              onRefresh={fetchData}
            />
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
                                <div className="text-[10px] text-zinc-500">
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

          {/* TAB: HELP & SUPPORT */}
          {activeTab === "help" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Centro de Ayuda de Walyx <Sparkles className="w-5 h-5 text-amber-500" />
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Guias detalladas y documentación paso a paso para configurar tu local.
                  </p>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={helpSearchQuery}
                    onChange={(e) => setHelpSearchQuery(e.target.value)}
                    placeholder="Buscar un tema o función..."
                    className="bg-zinc-950/80 border border-zinc-900 focus:border-amber-500 text-xs text-white pl-10 pr-4 py-3 rounded-xl w-full outline-none transition-all placeholder:text-zinc-650"
                  />
                </div>
              </div>

              {/* Sub-Tabs for Help rubros */}
              <div className="flex flex-wrap gap-2 bg-zinc-900/10 border border-zinc-900 p-1.5 rounded-2xl">
                {[
                  { id: "general", label: "⚙️ Generalidades", desc: "WhatsApp, Carrito y Personalización" },
                  { id: "ropa", label: "👗 Talles & Ropa", desc: "Modelado de variantes y medidas" },
                  { id: "viandas", label: "🍱 Menú & Viandas", desc: "Planificación semanal y límites" },
                  { id: "pasteleria", label: "🍰 Encargos & Pasteles", desc: "Porciones y compras colectivas" }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => { setHelpActiveSubTab(st.id); setExpandedFaqId(null); }}
                    className={`flex-1 min-w-[120px] text-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      helpActiveSubTab === st.id
                        ? "bg-amber-500/15 border border-amber-500/20 text-amber-500"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* FAQ / Content Area */}
              <div className="flex flex-col gap-4">
                {[
                  // GENERAL TOPICS
                  {
                    id: "gen-1",
                    sub: "general",
                    title: "📲 ¿Cómo funciona el envío automático del pedido a WhatsApp?",
                    content: "Cuando un cliente agrega viandas o productos al carrito y presiona 'Confirmar Pedido', Walyx genera un enlace con un texto formateado. Al hacer clic, se abre WhatsApp Web o la App con todos los detalles (productos, cantidades, total con envíos, tipo de pago y dirección de entrega) listos para enviar de un solo clic."
                  },
                  {
                    id: "gen-2",
                    sub: "general",
                    title: "🎨 ¿Cómo personalizo el diseño de mi Shop pública?",
                    content: "Andá a la pestaña 'Personalizar Shop' en la barra lateral. Desde ahí podés subir el logo de tu negocio, una portada/banner y elegir colores, tipografías y el estilo de las tarjetas de productos (Grilla o Lista). Al guardar, los cambios se aplican al instante sin necesidad de programar."
                  },
                  {
                    id: "gen-3",
                    sub: "general",
                    title: "🛒 ¿Qué es el recuperador de carritos abandonados?",
                    content: "Walyx guarda automáticamente la sesión del carrito de tus clientes finales. Si abandonan la página sin presionar confirmar pedido, en la pestaña 'Recuperar Ventas' de tu panel verás el listado de carritos abandonados. Hacé clic en 'Recuperar por WhatsApp' para enviarle un recordatorio automatizado con el enlace directo para reconstruir su carrito."
                  },

                  // CLOTHING TOPICS
                  {
                    id: "cl-1",
                    sub: "ropa",
                    title: "📐 ¿Cómo creo y asocio una tabla de talles?",
                    content: "En la pestaña 'Tablas de Talles' podés crear las columnas (ej: Pecho, Cintura, Largo) y completar los valores por cada talle (S, M, L). Luego, al editar o crear tu producto de ropa en 'Catálogo', podés seleccionar esa tabla específica. Tus clientes verán un botón de 'Guía de Talles' en tu tienda pública."
                  },
                  {
                    id: "cl-2",
                    sub: "ropa",
                    title: "🏷️ ¿Cómo gestiono las Marcas y los Tipos de Prendas?",
                    content: "Para mantener tu catálogo ordenado, podés registrar Marcas (ej. Marca Propia) y Tipos de Ropa (ej. Remera, Jean). Esto ayuda a que los clientes puedan filtrar tu shop eficientemente y previene errores al asignar las tablas de talles."
                  },

                  // MEALS / VIANDAS TOPICS
                  {
                    id: "vi-1",
                    sub: "viandas",
                    title: "🍱 ¿Cómo configuro mi planificador de Menú Semanal?",
                    content: "Si tu comercio está en la categoría de Viandas, se activa la pestaña 'Menú Semanal'. Podés seleccionar qué vianda de tu catálogo se ofrece cada día (Lunes a Domingo). Esto le permite a tu cliente comprar de forma organizada el almuerzo o cena para toda la semana."
                  },
                  {
                    id: "vi-2",
                    sub: "viandas",
                    title: "🗓️ ¿Cómo configuro días feriados o jornadas de cocina cerrada?",
                    content: "Dentro del Menú Semanal podés marcar un día como 'Cerrado' o asignarle un nombre de feriado (ej. Navidad). Cuando activás esto, el botón de compra para ese día en particular se bloquea automáticamente en la tienda para evitar que la gente reserve cuando no estás cocinando."
                  },
                  {
                    id: "vi-3",
                    sub: "viandas",
                    title: "🛑 ¿Cómo funcionan los límites diarios de producción?",
                    content: "En cada día del menú semanal podés configurar el campo 'Límite'. Si definís que el Lunes cocinás como máximo 30 porciones, una vez alcanzadas por las compras de los clientes, Walyx bloqueará el plato del Lunes con la leyenda 'Agotado por hoy' y obligará al cliente a seleccionar viandas de otros días."
                  },

                  // PASTRY TOPICS
                  {
                    id: "pa-1",
                    sub: "pasteleria",
                    title: "🎂 ¿Cómo configuro porciones y nivel de dulzor en tortas?",
                    content: "Al dar de alta un producto en el rubro Pastelería, se habilitan dos campos específicos: 'Porciones/Cortes' (para indicarle a tu cliente cuánto rinde el pastel) y 'Nivel de Dulzor' (Bajo, Medio, Alto) para que puedan encargar a gusto el producto."
                  },
                  {
                    id: "pa-2",
                    sub: "pasteleria",
                    title: "🐄 ¿Qué es el Vaca Club (Colectas/Regalos grupales)?",
                    content: "Permite a un cliente organizar un regalo grupal (ej. comprar una torta de cumpleaños de $15.000 entre 5 amigos). El creador genera el enlace y cada participante aporta el monto que desee de forma online. Una vez recaudado el 100% de la meta, el pedido se confirma y se despacha a WhatsApp de forma consolidada."
                  }
                ]
                  .filter((faq) => faq.sub === helpActiveSubTab)
                  .filter((faq) => 
                    helpSearchQuery === "" ||
                    faq.title.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
                    faq.content.toLowerCase().includes(helpSearchQuery.toLowerCase())
                  )
                  .map((faq) => {
                    const isOpen = expandedFaqId === faq.id;
                    return (
                      <div 
                        key={faq.id} 
                        className="bg-zinc-900/35 border border-zinc-900 rounded-2xl overflow-hidden transition-all duration-300"
                      >
                        <button
                          onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                          className="w-full flex items-center justify-between p-5 text-left font-bold text-xs tracking-wide text-zinc-100 hover:bg-zinc-900/50 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <HelpCircle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                            {faq.title}
                          </span>
                          <ChevronDown 
                            className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-300 ${
                              isOpen ? "rotate-180 text-amber-500" : ""
                            }`}
                          />
                        </button>
                        
                        <div 
                          className={`transition-all duration-350 ease-in-out overflow-hidden ${
                            isOpen ? "max-h-[300px] border-t border-zinc-950" : "max-h-0"
                          }`}
                        >
                          <div className="p-5 text-[11px] text-zinc-400 leading-relaxed bg-zinc-950/20">
                            {faq.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Contact Technical Support Banner */}
              <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-gradient-to-r from-blue-900/10 to-orange-900/10 flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">¿Necesitas soporte técnico adicional?</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Nuestro equipo de soporte técnico está disponible para ayudarte a configurar tu tienda.</p>
                  </div>
                </div>
                <a 
                  href="https://wa.me/5491122334455?text=Hola!%20Necesito%20soporte%20para%20configurar%20mi%20tienda%20en%20Walyx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <PremiumButton variant="primary" size="md" glow>
                    Contactar Soporte Técnico
                  </PremiumButton>
                </a>
              </div>
            </div>
          )}

        </main>
      </div>


      {/* KANBAN ORDER DETAILS MODAL */}
      {selectedKanbanOrder && (() => {
        const currentOrder = kanbanOrders.find((o) => o.id === selectedKanbanOrder.id) || selectedKanbanOrder;
        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative my-8">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-white">#{currentOrder.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      currentOrder.status === "PENDING"
                        ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                        : currentOrder.status === "PREPARING"
                        ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                        : currentOrder.status === "DELIVERED"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                        : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {currentOrder.status === "PENDING" ? "Pendiente" : currentOrder.status === "PREPARING" ? "Preparando" : "Entregado"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">Detalles de la orden de compra del cliente</p>
                </div>
                <button 
                  onClick={() => setSelectedKanbanOrder(null)}
                  className="p-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid Layout for details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="flex flex-col gap-4 bg-zinc-950/40 p-5 rounded-2xl border border-zinc-800/60">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-amber-500" /> Datos del Cliente
                  </h4>
                  <div className="flex flex-col gap-2.5 text-xs text-zinc-400">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Nombre Completo</span>
                      <span className="text-white font-semibold">{currentOrder.customer.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Correo Electrónico</span>
                      <span className="text-white font-medium flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-zinc-500" /> {currentOrder.customer.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Teléfono / WhatsApp</span>
                      <span className="text-white font-medium flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-zinc-500" /> {currentOrder.customer.phone}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Dirección de Entrega</span>
                      <span className="text-white font-medium flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-zinc-500 shrink-0" /> {currentOrder.customer.address}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order & Delivery Info */}
                <div className="flex flex-col gap-4 bg-zinc-950/40 p-5 rounded-2xl border border-zinc-800/60">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-amber-500" /> Entrega & Pago
                  </h4>
                  <div className="flex flex-col gap-2.5 text-xs text-zinc-400">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Método de Pago</span>
                      <span className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                        <CreditCard className="w-3.5 h-3.5 text-zinc-500" /> {currentOrder.paymentMethod}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Estado del Pago</span>
                      <span className={`inline-block font-extrabold text-[10px] uppercase px-2 py-0.5 rounded mt-1 ${
                        currentOrder.paymentStatus === "Aprobado"
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                          : "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                      }`}>
                        {currentOrder.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Horario de Entrega</span>
                      <span className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" /> {currentOrder.dateTimeSlot}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Zona / Costo de Envío</span>
                      <span className="text-white font-medium">
                        {currentOrder.deliveryZone} ({currentOrder.deliveryCost > 0 ? `$${currentOrder.deliveryCost}` : "Gratis"})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Productos Pedidos</h4>
                <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/20">
                  <div className="grid grid-cols-12 bg-zinc-950 p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    <div className="col-span-6">Producto</div>
                    <div className="col-span-2 text-center">Cant.</div>
                    <div className="col-span-2 text-right">Precio Unit.</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                  </div>
                  <div className="divide-y divide-zinc-800/60">
                    {currentOrder.products.map((p: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-12 p-3.5 text-xs items-center hover:bg-zinc-900/10">
                        <div className="col-span-6 flex flex-col gap-0.5">
                          <span className="text-white font-semibold">{p.name}</span>
                          {p.variant && <span className="text-[10px] text-zinc-500">Var: {p.variant}</span>}
                          {p.notes && <span className="text-[10px] text-amber-500/80 italic">Nota: "{p.notes}"</span>}
                        </div>
                        <div className="col-span-2 text-center text-zinc-300 font-bold">{p.quantity}x</div>
                        <div className="col-span-2 text-right text-zinc-400">${p.price}</div>
                        <div className="col-span-2 text-right text-white font-bold">${p.price * p.quantity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total Block */}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-5 mt-2 bg-zinc-950/20 -mx-6 md:-mx-8 px-6 md:px-8 pb-1 rounded-b-3xl">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Costo Envío</span>
                  <p className="text-xs text-zinc-400">${currentOrder.deliveryCost}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total a Pagar</span>
                  <p className="text-2xl font-black text-amber-500">${currentOrder.total}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedKanbanOrder(null)}
                  className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Cerrar Detalles
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showCalculatorModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all">
          <div className="glass-panel max-w-lg w-full p-6 md:p-8 rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  Desglose de Efectivo Físico
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1">Ingresá la cantidad de billetes de cada denominación para el conteo de arqueo.</p>
              </div>
              <button 
                onClick={() => setShowCalculatorModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Denomination Rows */}
            <div className="flex flex-col gap-3">
              {[
                { label: "Billetes de $2000", value: "2000" },
                { label: "Billetes de $1000", value: "1000" },
                { label: "Billetes de $500", value: "500" },
                { label: "Billetes de $200", value: "200" },
                { label: "Billetes de $100", value: "100" },
                { label: "Billetes de $50", value: "50" },
                { label: "Billetes de $20", value: "20" },
                { label: "Billetes/Monedas de $10", value: "10" }
              ].map((denom) => (
                <div key={denom.value} className="grid grid-cols-12 items-center gap-4 bg-zinc-900/20 p-2.5 rounded-xl border border-zinc-900/60 text-xs">
                  <div className="col-span-5 font-bold text-zinc-400">{denom.label}</div>
                  <div className="col-span-3 flex items-center justify-center gap-1.5">
                    <input 
                      type="number"
                      min="0"
                      value={calculatorDenominations[denom.value] || ""}
                      onChange={(e) => handleCalculatorValueChange(denom.value, parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="bg-zinc-950 border border-zinc-800 text-center font-mono text-white p-2 rounded-lg w-full outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="col-span-4 text-right font-mono font-bold text-zinc-300">
                    ${((calculatorDenominations[denom.value] || 0) * parseInt(denom.value)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Display */}
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-900 flex justify-between items-center text-xs">
              <span className="font-bold text-zinc-400">Total Efectivo Físico Calculado:</span>
              <span className="font-mono text-lg font-black text-amber-500">
                ${(parseFloat(manualActualBalanceInput) || 0).toFixed(2)}
              </span>
            </div>

            {/* Confirmation Form */}
            <form onSubmit={handleCloseSession} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Efectivo Final Real ($)</label>
                <input 
                  type="number"
                  required
                  placeholder="0.00"
                  value={manualActualBalanceInput}
                  onChange={(e) => setManualActualBalanceInput(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-sm text-white p-3 rounded-xl outline-none font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Observaciones / Novedades</label>
                <textarea 
                  placeholder="Ej. Faltaron $50 por diferencia de cambio / Se retiraron los $20000 para el depósito bancario..."
                  value={cashNotesInput}
                  onChange={(e) => setCashNotesInput(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none h-16 resize-none"
                />
              </div>

              {activeSession && !blindClose && (
                <div className="text-[10px] text-zinc-500 font-bold">
                  Diferencia esperada:{" "}
                  <strong className={`font-mono ${
                    ((parseFloat(manualActualBalanceInput) || 0) - activeSession.expectedBalance) === 0 
                      ? "text-emerald-500" 
                      : ((parseFloat(manualActualBalanceInput) || 0) - activeSession.expectedBalance) > 0 
                        ? "text-blue-400" 
                        : "text-rose-500"
                  }`}>
                    {((parseFloat(manualActualBalanceInput) || 0) - activeSession.expectedBalance) >= 0 ? "+" : ""}
                    {((parseFloat(manualActualBalanceInput) || 0) - activeSession.expectedBalance).toFixed(2)}
                  </strong>
                </div>
              )}

              <div className="flex gap-3 justify-end mt-2">
                <button 
                  type="button"
                  onClick={() => setShowCalculatorModal(false)}
                  className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Volver
                </button>
                <PremiumButton type="submit" variant="primary" size="sm" className="font-bold px-6">
                  Confirmar y Guardar Cierre
                </PremiumButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
