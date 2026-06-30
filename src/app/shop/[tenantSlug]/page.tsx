"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShoppingCart, 
  ArrowLeft, 
  MessageSquare,
  CheckCircle,
  Loader2,
  Calendar,
  X,
  Trash2,
  MapPin,
  Clock,
  Sparkles,
  LogIn,
  LogOut,
  User
} from "lucide-react";
import { getTenantBySlug } from "@/app/actions/tenant";
import { getProductsByTenant } from "@/app/actions/product";
import { createOrder } from "@/app/actions/order";
import { getWeeklyMenuByStartDate } from "@/app/actions/weeklyMenu";
import { getHolidayForDate } from "@/lib/holidays";
import { getCurrentGlobalUser, logoutGlobalUser } from "@/app/actions/auth";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ProductCard, ProductData, ProductType } from "@/components/ui/ProductCard";
import { createGroupGift } from "@/app/actions/groupGift";
import { saveCartSession, getAbandonedCarts } from "@/app/actions/cartRecovery";

// Mock delivery zones matching dynamic styles
const DEFAULT_ZONES = [
  { name: "Palermo / Belgrano", cost: 350 },
  { name: "Caballito / Almagro", cost: 400 },
  { name: "Recoleta / Retiro", cost: 380 },
  { name: "Retiro en Sucursal / Take Away", cost: 0 }
];

// Mock delivery time slots
const TIME_SLOTS = [
  "Hoy 12:00 a 14:00 (Almuerzo)",
  "Hoy 19:30 a 22:00 (Cena)",
  "Mañana 12:00 a 14:00 (Almuerzo)",
  "Mañana 19:30 a 22:00 (Cena)"
];

export default function ShopPublicPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  const [tenant, setTenant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("TODAS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [globalUser, setGlobalUser] = useState<any>(null);

  // Theme states
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#f59e0b");
  const [backgroundColor, setBackgroundColor] = useState("#09090b");
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Outfit");
  const [cardStyle, setCardStyle] = useState<"glass" | "classic" | "minimal">("glass");

  // Cart State (for Ropa/Pastelería)
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Group Gift (Vaca Club) Modal State
  const [vacaProduct, setVacaProduct] = useState<ProductData | null>(null);
  const [vacaCreatorName, setVacaCreatorName] = useState("");
  const [vacaCreatorPhone, setVacaCreatorPhone] = useState("");
  const [vacaMessage, setVacaMessage] = useState("");
  const [vacaLoading, setVacaLoading] = useState(false);

  // Dynamic Weekly Planner States (for Viandas)
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [weeklyPlanner, setWeeklyPlanner] = useState<Record<string, { productId: string; quantity: number; notes: string; isClosed: boolean; holidayName: string | null }>>({
    Lunes: { productId: "", quantity: 1, notes: "", isClosed: false, holidayName: null },
    Martes: { productId: "", quantity: 1, notes: "", isClosed: false, holidayName: null },
    Miércoles: { productId: "", quantity: 1, notes: "", isClosed: false, holidayName: null },
    Jueves: { productId: "", quantity: 1, notes: "", isClosed: false, holidayName: null },
    Viernes: { productId: "", quantity: 1, notes: "", isClosed: false, holidayName: null },
    Sábado: { productId: "", quantity: 1, notes: "", isClosed: false, holidayName: null },
    Domingo: { productId: "", quantity: 1, notes: "", isClosed: false, holidayName: null },
  });

  const getPlanningWeeks = () => {
    const weeks = [];
    const today = new Date();
    const day = today.getDay();
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

  // Checkout Form State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedZone, setSelectedZone] = useState(DEFAULT_ZONES[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0]);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "CARD">("CASH");

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    // Load active session if any
    const user = await getCurrentGlobalUser();
    if (user) {
      setGlobalUser(user);
      setCustomerName(user.name);
      setCustomerEmail(user.email);
      if (user.phone) setCustomerPhone(user.phone);
    }

    const tenantRes = await getTenantBySlug(tenantSlug);
    if (!tenantRes.success || !tenantRes.data) {
      setError(tenantRes.error || "Esta tienda no está activa.");
      setLoading(false);
      return;
    }

    const tenantData = tenantRes.data;
    setTenant(tenantData);
    setLogoUrl(tenantData.logoUrl || "");
    setBannerUrl(tenantData.bannerUrl || "");
    if (tenantData.themeSettings) {
      try {
        const theme = JSON.parse(tenantData.themeSettings);
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
    setCategories(tenantData.categories || []);

    const productsRes = await getProductsByTenant(tenantData.id);
    if (productsRes.success && productsRes.data) {
      let mappedType: ProductType = "vianda";
      const storeType = tenantData.categories?.[0]?.type;
      if (storeType === "ROPA") {
        mappedType = "clothing";
      } else if (storeType === "PASTELERIA") {
        mappedType = "bakery";
      }

      const mapped: ProductData[] = productsRes.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
        type: mappedType,
        description: p.description || "",
        calories: p.calories || undefined,
        sizes: p.size ? p.size.split(",").map((s: string) => s.trim()) : undefined,
        colors: p.color ? p.color.split(",").map((c: string) => c.trim()) : undefined,
        portions: p.portions ? [p.portions] : undefined
      }));

      setProducts(mapped);

      if (mapped.length > 0) {
        const firstProdId = mapped[0].id;
        const initialPlanner: any = {};
        ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].forEach((day) => {
          initialPlanner[day] = { productId: firstProdId, quantity: 1, notes: "" };
        });
        setWeeklyPlanner(initialPlanner);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tenantSlug]);

  // Sync Cart to db session
  useEffect(() => {
    if (!tenant) return;
    const syncCart = async () => {
      // Don't save empty cart on initial render before data fetches, check if cart has been interacted or not
      // We can serialize and save it.
      const itemsJson = JSON.stringify(cart);
      await saveCartSession(tenant.id, globalUser ? globalUser.id : null, itemsJson);
    };
    syncCart();
  }, [cart, tenant, globalUser]);

  const handleCreateVaca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacaProduct || !tenant) return;
    setVacaLoading(true);
    const res = await createGroupGift(
      tenant.id,
      vacaProduct.id,
      vacaCreatorName,
      vacaCreatorPhone,
      vacaMessage
    );
    setVacaLoading(false);
    if (res.success && res.giftId) {
      alert("¡Colecta Creada! Compartí el link con tus amigos.");
      router.push(`/shop/${tenantSlug}/vaca/${res.giftId}`);
    } else {
      alert(res.error || "No se pudo crear la colecta.");
    }
  };

  useEffect(() => {
    const checkRecoveredCart = async () => {
      if (typeof window === "undefined" || !products.length || !tenant) return;
      const urlParams = new URLSearchParams(window.location.search);
      const recoveredCartId = urlParams.get("recoveredCart");
      if (recoveredCartId) {
        try {
          // Fetch the cart session details by querying from neon/sqlite, but since we are on the client,
          // let's fetch abandoned carts for this tenant and find it or call a server action.
          // Since we want to find the specific cart, we can call getAbandonedCarts and filter by ID or similar.
          const res = await getAbandonedCarts(tenant.id);
          if (res.success && res.data) {
            const match = res.data.find((c: any) => c.id === recoveredCartId);
            if (match) {
              const loadedItems = JSON.parse(match.items);
              if (Array.isArray(loadedItems)) {
                setCart(loadedItems);
                setIsCartOpen(true);
                // Clean URL query param
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }
          }
        } catch (e) {
          console.error("Error recovering cart:", e);
        }
      }
    };
    checkRecoveredCart();
  }, [products, tenant]);

  useEffect(() => {
    const loadWeeklyMenuPlan = async () => {
      const isViandaStore = categories.length > 0 && categories[0].type === "VIANDA";
      if (!tenant || !isViandaStore || !products.length) return;
      const currentWeek = planningWeeks[selectedWeekIndex];
      const res = await getWeeklyMenuByStartDate(tenant.id, currentWeek.startDateStr);

      const initialPlanner: any = {};
      ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].forEach((day) => {
        initialPlanner[day] = { productId: "", quantity: 1, notes: "", isClosed: false, holidayName: null };
      });

      if (res.success && res.data && res.data.length > 0) {
        res.data.forEach((dayItem: any) => {
          if (initialPlanner[dayItem.dayName]) {
            initialPlanner[dayItem.dayName].productId = dayItem.productId || "";
            initialPlanner[dayItem.dayName].isClosed = dayItem.isClosed || false;
            initialPlanner[dayItem.dayName].holidayName = dayItem.holidayName || null;
          }
        });
      } else {
        // Fallback to old defaults by name match
        const oldDefaults: Record<string, string> = {
          Lunes: "Wok de Pollo con Vegetales y Arroz Integral",
          Martes: "Guiso Nutritivo de Lentejas Veggie",
          Miércoles: "Salmón Grillado con Puré de Calabaza",
          Jueves: "Wok de Pollo con Vegetales y Arroz Integral",
          Viernes: "Guiso Nutritivo de Lentejas Veggie",
          Sábado: "Salmón Grillado con Puré de Calabaza",
          Domingo: "",
        };

        const dayOffsets: Record<string, number> = {
          Lunes: 0,
          Martes: 1,
          Miércoles: 2,
          Jueves: 3,
          Viernes: 4,
          Sábado: 5,
          Domingo: 6
        };

        Object.entries(oldDefaults).forEach(([day, name]) => {
          const match = products.find((p) => p.name === name);
          const mon = new Date(currentWeek.startDateStr);
          mon.setUTCDate(mon.getUTCDate() + dayOffsets[day]);
          const holiday = getHolidayForDate(mon);

          initialPlanner[day] = {
            productId: match ? match.id : "",
            quantity: 1,
            notes: "",
            isClosed: holiday !== null,
            holidayName: holiday
          };
        });
      }

      setWeeklyPlanner(initialPlanner);
    };

    loadWeeklyMenuPlan();
  }, [selectedWeekIndex, tenant, products, categories]);

  const handleAddToCart = (prod: ProductData, options: any) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === prod.id && JSON.stringify(item.options) === JSON.stringify(options)
      );

      if (existingIdx > -1) {
        const nextCart = [...prev];
        nextCart[existingIdx].quantity += 1;
        return nextCart;
      }

      return [...prev, { product: prod, quantity: 1, options }];
    });
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + selectedZone.cost;
  };

  // Submit order for standard catalog (Ropa/Pastelería)
  const handleCheckoutCart = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!globalUser) {
      // Redirect to login page
      router.push(`/shop/${tenantSlug}/login?redirect=/shop/${tenantSlug}`);
      return;
    }

    if (!customerName || !customerEmail) {
      alert("Por favor completa tu nombre y correo electrónico.");
      return;
    }

    setCheckoutLoading(true);

    const items = cart.map((item) => {
      let variantTitle = undefined;
      if (item.options && Object.keys(item.options).length > 0) {
        variantTitle = Object.entries(item.options)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
      }
      return {
        productId: item.product.id,
        quantity: item.quantity,
        variantTitle,
        customization: item.customization || undefined,
      };
    });

    // Append options details into notes
    let optionDetailsStr = "Opciones elegidas por producto:\n";
    cart.forEach((item) => {
      if (item.options && Object.keys(item.options).length > 0) {
        optionDetailsStr += `- ${item.product.name} [${Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(", ")}]\n`;
      }
    });

    const detailedDeliveryNotes = `${optionDetailsStr}\nZona: ${selectedZone.name} (Costo: $${selectedZone.cost})\nHorario de Entrega: ${selectedTimeSlot}\nNotas: ${deliveryNotes}`;

    const res = await createOrder({
      tenantId: tenant.id,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      deliveryNotes: detailedDeliveryNotes,
      paymentMethod,
      items,
      deliveryCost: selectedZone.cost,
      deliveryZoneName: selectedZone.name,
      deliveryDate: new Date().toLocaleDateString("es-AR"),
      deliveryTimeSlot: selectedTimeSlot,
      globalUserId: globalUser.id,
    });

    setCheckoutLoading(false);
    if (res.success && res.data) {
      setOrderSuccess(res.data);
      setCart([]);
      setIsCartOpen(false);
      window.open(res.data.whatsappUrl, "_blank");
    } else {
      alert(res.error || "Hubo un problema al procesar tu pedido.");
    }
  };

  // Submit order for Weekly Planner (Viandas)
  const handleCheckoutWeeklyPlanner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!globalUser) {
      // Redirect to login page
      router.push(`/shop/${tenantSlug}/login?redirect=/shop/${tenantSlug}`);
      return;
    }

    if (!customerName || !customerEmail) {
      alert("Por favor completa tu nombre y correo electrónico.");
      return;
    }

    const selectedDays = Object.entries(weeklyPlanner).filter(([_, info]) => info.productId !== "");
    if (selectedDays.length === 0) {
      alert("Por favor selecciona al menos una vianda para la semana.");
      return;
    }

    setCheckoutLoading(true);

    const items = selectedDays.map(([day, info]) => ({
      productId: info.productId,
      quantity: info.quantity,
      variantTitle: day,
      customization: info.notes || undefined,
    }));

    let plannerSummary = "Detalle del menú semanal:\n";
    selectedDays.forEach(([day, info]) => {
      const p = products.find((prod) => prod.id === info.productId);
      plannerSummary += `- ${day}: ${info.quantity}x ${p?.name} ${info.notes ? `(${info.notes})` : ""}\n`;
    });

    const currentWeek = planningWeeks[selectedWeekIndex];
    const detailedNotes = `${plannerSummary}\nZona de Envío: ${selectedZone.name} (Costo: $${selectedZone.cost})\nFranja Horaria: ${selectedTimeSlot}\nNotas adicionales: ${deliveryNotes}`;

    const res = await createOrder({
      tenantId: tenant.id,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      deliveryNotes: detailedNotes,
      paymentMethod,
      items,
      deliveryCost: selectedZone.cost,
      deliveryZoneName: selectedZone.name,
      deliveryDate: `${currentWeek.label} (${currentWeek.dateRange})`,
      deliveryTimeSlot: selectedTimeSlot,
      globalUserId: globalUser.id,
    });

    setCheckoutLoading(false);
    if (res.success && res.data) {
      setOrderSuccess(res.data);
      window.open(res.data.whatsappUrl, "_blank");
    } else {
      alert(res.error || "Hubo un problema al procesar tu pedido semanal.");
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
        <p className="text-red-400 font-bold">{error || "Esta tienda no está activa."}</p>
        <Link href="/">
          <button className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl">Volver al inicio</button>
        </Link>
      </div>
    );
  }

  const isViandaStore = categories.length > 0 && categories[0].type === "VIANDA";

  const filteredProducts = selectedCategory === "TODAS" 
    ? products 
    : products; // Bypass client filtering for simplicity

  return (
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
        // Inject color theme values as CSS variables so components like PremiumButton can inherit them
        ["--primary-theme-color" as any]: primaryColor,
        ["--text-theme-color" as any]: textColor,
      }}
      className="min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300"
    >
      {/* Background Decorative Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-[350px] h-[350px] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `${primaryColor}0a` }} />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none" style={{ backgroundColor: `${primaryColor}0a` }} />

      {/* Banner de Portada */}
      {bannerUrl && (
        <div className="h-44 w-full relative overflow-hidden border-b border-zinc-900">
          <img src={bannerUrl} alt="Store Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
        </div>
      )}

      {/* Header bar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          
          {logoUrl && (
            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-900 overflow-hidden shadow-md shrink-0">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <h1 className="text-lg font-black text-white">{tenant.name}</h1>
            <p className="text-xs text-zinc-500">{tenant.description || "Catálogo oficial"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {globalUser ? (
            <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 py-1.5 px-3 rounded-2xl">
              <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[10px] text-zinc-100 font-bold max-w-[100px] truncate">{globalUser.name}</span>
                <span className="text-[8px] text-zinc-550 truncate">Mi Cuenta</span>
              </div>
              <button
                onClick={async () => {
                  await logoutGlobalUser();
                  setGlobalUser(null);
                  setCustomerName("");
                  setCustomerEmail("");
                  setCustomerPhone("");
                  router.refresh();
                }}
                title="Cerrar Sesión"
                className="p-1 hover:text-red-400 text-zinc-500 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link href={`/shop/${tenantSlug}/login?redirect=/shop/${tenantSlug}`}>
              <button className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 py-2 px-4 text-xs font-bold text-zinc-300 rounded-xl hover:bg-zinc-800 hover:text-white transition-all cursor-pointer">
                <LogIn className="w-3.5 h-3.5" />
                Ingresar
              </button>
            </Link>
          )}

          {!isViandaStore && (
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-3 text-zinc-950 rounded-full font-bold relative transition-all cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 border border-zinc-950 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">

        {orderSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-2xl mb-8 flex flex-col gap-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" /> ¡Pedido Creado Correctamente!
            </h3>
            <p className="text-xs leading-relaxed">
              Hemos registrado tu pedido en nuestra base de datos. Si no se abrió la ventana de WhatsApp automáticamente, haz clic en el botón a continuación para enviar los detalles al comercio.
            </p>
            <a href={orderSuccess.whatsappUrl} target="_blank" rel="noopener noreferrer">
              <PremiumButton variant="primary" size="sm" className="w-fit">
                Reabrir WhatsApp <MessageSquare className="w-4 h-4 ml-2" />
              </PremiumButton>
            </a>
          </div>
        )}

        {/* 1. PUBLIC VIANDAS PLANNER VIEW */}
        {isViandaStore ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Planner Forms */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Planificador Semanal</h2>
                  <p className="text-xs text-zinc-500">Arma tu menú de viandas diarias y te las enviamos juntas.</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Elegir Semana de Entrega</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {planningWeeks.map((w, idx) => {
                    const isSelected = selectedWeekIndex === idx;
                    return (
                      <button
                        key={w.startDateStr}
                        type="button"
                        onClick={() => setSelectedWeekIndex(idx)}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500 text-amber-500 font-bold"
                            : "bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                        }`}
                      >
                        <span className="text-xs font-black">{w.label}</span>
                        <span className="text-[9px] opacity-75 font-semibold">{w.dateRange}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-4 bg-zinc-900/10 border border-zinc-900 rounded-3xl p-6">
                {Object.keys(weeklyPlanner).map((day) => {
                  const isClosedHoliday = weeklyPlanner[day].isClosed;
                  const holidayName = weeklyPlanner[day].holidayName;
                  return (
                    <div 
                      key={day} 
                      className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center border-b border-zinc-900/80 pb-4 transition-all duration-300 ${
                        isClosedHoliday ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 w-24 shrink-0">
                        <span className="text-sm font-black text-amber-500">{day}</span>
                        {isClosedHoliday && (
                          <span className="text-[8px] bg-red-500/15 text-red-400 border border-red-500/20 px-1 py-0.5 rounded font-black uppercase text-center w-fit">
                            {holidayName ? "Feriado" : "Cerrado"}
                          </span>
                        )}
                      </div>

                      {isClosedHoliday ? (
                        <div className="flex-1 w-full bg-zinc-950/40 border border-zinc-900/50 rounded-xl p-3 text-xs text-red-400/80 font-bold italic flex items-center gap-1.5 animate-fade-in">
                          🚫 {holidayName ? `Feriado: ${holidayName}` : "Cerrado"} - Sin reparto de viandas
                        </div>
                      ) : (
                        <>
                          <div className="relative flex-1 w-full">
                            <select
                              value={weeklyPlanner[day].productId}
                              onChange={(e) => setWeeklyPlanner({
                                ...weeklyPlanner,
                                [day]: { ...weeklyPlanner[day], productId: e.target.value }
                              })}
                              className="bg-zinc-950/80 border border-zinc-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-550/20 text-xs text-white p-3.5 pr-8 rounded-xl outline-none w-full appearance-none transition-all cursor-pointer"
                            >
                              <option value="" className="bg-zinc-950 text-zinc-400">-- No llevar vianda --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id} className="bg-zinc-950 text-zinc-100">
                                  {p.name} (${p.price} | {p.calories || 0} kcal)
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-xs">Cant:</span>
                            <input 
                              type="number" 
                              min="1"
                              value={weeklyPlanner[day].quantity}
                              onChange={(e) => setWeeklyPlanner({
                                ...weeklyPlanner,
                                [day]: { ...weeklyPlanner[day], quantity: parseInt(e.target.value) || 1 }
                              })}
                              className="bg-zinc-950 border border-zinc-900 focus:border-amber-500 text-xs text-white p-3.5 rounded-xl w-16 text-center outline-none transition-all"
                            />
                          </div>

                          <input 
                            type="text" 
                            placeholder="Nota (ej. sin cebolla)"
                            value={weeklyPlanner[day].notes}
                            onChange={(e) => setWeeklyPlanner({
                              ...weeklyPlanner,
                              [day]: { ...weeklyPlanner[day], notes: e.target.value }
                            })}
                            className="bg-zinc-950 border border-zinc-900 focus:border-amber-500 text-xs text-white p-3.5 rounded-xl flex-1 w-full outline-none transition-all"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checkout Form */}
            <div className="glass-panel p-6 rounded-3xl border border-zinc-900 bg-zinc-900/10 h-fit flex flex-col gap-4">
              <h3 className="text-lg font-black text-white">Confirmar Pedido</h3>
              <form onSubmit={handleCheckoutWeeklyPlanner} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Nombre Completo</label>
                  <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Email</label>
                  <input type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Teléfono</label>
                  <input type="text" placeholder="+549..." value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Dirección de Entrega</label>
                  <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none" />
                </div>

                {/* Delivery Zone Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" /> Zona de Entrega / Envío
                  </label>
                  <select 
                    value={JSON.stringify(selectedZone)} 
                    onChange={(e) => setSelectedZone(JSON.parse(e.target.value))}
                    className="bg-zinc-950 border border-zinc-900 text-xs p-3 rounded-xl text-white outline-none"
                  >
                    {DEFAULT_ZONES.map((zone) => (
                      <option key={zone.name} value={JSON.stringify(zone)}>
                        {zone.name} (+${zone.cost})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Time Slot Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> Fecha y Hora de Entrega
                  </label>
                  <select 
                    value={selectedTimeSlot} 
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="bg-zinc-950 border border-zinc-900 text-xs p-3 rounded-xl text-white outline-none"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Método de Pago</label>
                  <select value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} className="bg-zinc-950 border border-zinc-900 text-xs p-3 rounded-xl text-white outline-none">
                    <option value="CASH">Efectivo</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="CARD">Tarjeta Débito/Crédito</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Aclaraciones de envío</label>
                  <textarea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none resize-none h-16" />
                </div>

                <div className="border-t border-zinc-900 pt-4 mt-2 flex justify-between font-black text-sm text-zinc-200">
                  <span>Costo Envío:</span>
                  <span className="text-amber-500">${selectedZone.cost}</span>
                </div>

                <PremiumButton type="submit" variant="primary" size="lg" disabled={checkoutLoading} glow className="w-full justify-center py-4 mt-2">
                  {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirmar por WhatsApp <MessageSquare className="w-5 h-5 ml-2" /></>}
                </PremiumButton>
              </form>
            </div>
          </div>
        ) : (
          /* 2. PUBLIC CLOTHING / BAKERY CATALOG VIEW */
          <div className="flex flex-col gap-8">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button 
                onClick={() => setSelectedCategory("TODAS")}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer"
                style={{
                  backgroundColor: selectedCategory === "TODAS" ? primaryColor : "rgba(255,255,255,0.05)",
                  color: selectedCategory === "TODAS" ? "#000000" : textColor,
                  borderColor: selectedCategory === "TODAS" ? primaryColor : "rgba(255,255,255,0.1)",
                }}
              >
                Todas las categorías
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer"
                  style={{
                    backgroundColor: selectedCategory === c.id ? primaryColor : "rgba(255,255,255,0.05)",
                    color: selectedCategory === c.id ? "#000000" : textColor,
                    borderColor: selectedCategory === c.id ? primaryColor : "rgba(255,255,255,0.1)",
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Product Card Layout (Grid or List based on theme settings) */}
            {layoutMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-3 text-center py-12 text-zinc-500 text-sm">No hay productos disponibles en esta categoría.</div>
                ) : (
                  filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: cardStyle === "glass" ? "rgba(255, 255, 255, 0.03)" : cardStyle === "classic" ? "transparent" : "rgba(255, 255, 255, 0.015)",
                        borderColor: cardStyle === "classic" ? "rgba(255, 255, 255, 0.1)" : "rgba(255,255,255,0.05)",
                        backdropFilter: cardStyle === "glass" ? "blur(12px)" : "none",
                      }}
                      className="rounded-3xl border overflow-hidden flex flex-col group h-full transition-all duration-350 hover:translate-y-[-2px]"
                    >
                      <ProductCard 
                        product={p} 
                        onAddToCart={handleAddToCart}
                        onGroupGift={(prod) => {
                          setVacaProduct(prod);
                          setVacaCreatorName(globalUser?.name || "");
                          setVacaCreatorPhone(globalUser?.phone || "");
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            ) : (
              // List layout mode
              <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-sm">No hay productos disponibles en esta categoría.</div>
                ) : (
                  filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: cardStyle === "glass" ? "rgba(255, 255, 255, 0.03)" : cardStyle === "classic" ? "transparent" : "rgba(255, 255, 255, 0.015)",
                        borderColor: cardStyle === "classic" ? "rgba(255, 255, 255, 0.1)" : "rgba(255,255,255,0.05)",
                        backdropFilter: cardStyle === "glass" ? "blur(12px)" : "none",
                      }}
                      className="rounded-2xl border p-4 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between transition-all duration-350"
                    >
                      <div className="flex gap-4 items-center flex-1 min-w-0">
                        {p.image && (
                          <img src={p.image} alt={p.name} className="w-16 h-16 rounded-xl object-cover bg-zinc-900 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-zinc-100 truncate">{p.name}</h4>
                          <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">{p.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col items-end gap-3 sm:gap-1.5 w-full sm:w-auto justify-between border-t sm:border-t-0 border-zinc-900 pt-3 sm:pt-0 shrink-0">
                        <span className="text-sm font-black" style={{ color: primaryColor }}>${p.price}</span>
                        <PremiumButton
                          variant="primary"
                          size="sm"
                          className="font-bold text-[10px] py-2 px-4 cursor-pointer"
                          onClick={() => {
                            const options: any = {};
                            if (p.type === "clothing" && p.sizes) options.size = p.sizes[0];
                            if (p.type === "clothing" && p.colors) options.color = p.colors[0];
                            if (p.type === "bakery" && p.portions) options.portions = p.portions[0];
                            handleAddToCart(p, options);
                          }}
                        >
                          Añadir al Carrito
                        </PremiumButton>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* SHOPPING CART DRAWER PANEL (For Clothing/Pastry) */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-all" onClick={() => setIsCartOpen(false)} />
          <div className="fixed top-0 right-0 h-[100dvh] w-full sm:w-[450px] bg-zinc-950 border-l border-zinc-900 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto">
            
            {/* Header */}
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-amber-500" /> Mi Carrito</h3>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            {/* Cart Items list */}
            <div className="flex-1 p-6 flex flex-col gap-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">Tu carrito está vacío. Agrega algunos artículos.</div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-900 relative">
                    <img src={item.product.image} alt={item.product.name} className="w-14 h-14 rounded-lg object-cover bg-zinc-850" />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white">{item.product.name}</h4>
                      {item.options && Object.keys(item.options).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {Object.entries(item.options).map(([k, v]) => (
                            <span key={k} className="text-[9px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 capitalize">{k}: {String(v)}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-zinc-500">Cant: {item.quantity}</span>
                        <span className="text-xs font-bold text-amber-500">${item.product.price * item.quantity}</span>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveFromCart(idx)} className="absolute top-2 right-2 text-zinc-500 hover:text-red-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Form & Total */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-zinc-900 bg-zinc-950/80 sticky bottom-0 flex flex-col gap-3">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal()}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Envío ({selectedZone.name}):</span>
                  <span>${selectedZone.cost}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-white border-t border-zinc-900 pt-2 mb-2">
                  <span>Total final:</span>
                  <span className="text-amber-500">${calculateTotal()}</span>
                </div>

                <form onSubmit={handleCheckoutCart} className="flex flex-col gap-3 text-xs">
                  <input type="text" placeholder="Nombre completo" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-white outline-none" />
                  <input type="email" placeholder="Correo electrónico" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-white outline-none" />
                  <input type="text" placeholder="Teléfono" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-white outline-none" />
                  <input type="text" placeholder="Dirección de envío" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-white outline-none" />
                  
                  {/* Delivery Zone Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" /> Zona de Entrega / Envío
                    </label>
                    <select 
                      value={JSON.stringify(selectedZone)} 
                      onChange={(e) => setSelectedZone(JSON.parse(e.target.value))}
                      className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-white outline-none"
                    >
                      {DEFAULT_ZONES.map((zone) => (
                        <option key={zone.name} value={JSON.stringify(zone)}>
                          {zone.name} (+${zone.cost})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Delivery Time Slot Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> Fecha y Hora de Entrega
                    </label>
                    <select 
                      value={selectedTimeSlot} 
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-white outline-none"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>

                  <select value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-white outline-none">
                    <option value="CASH">Efectivo</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="CARD">Tarjeta de Crédito</option>
                  </select>

                  <textarea placeholder="Notas adicionales..." value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-white outline-none resize-none h-14" />
                  
                  <PremiumButton type="submit" variant="primary" size="lg" disabled={checkoutLoading} glow className="w-full justify-center py-4 mt-2">
                    {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirmar por WhatsApp <MessageSquare className="w-5 h-5 ml-2" /></>}
                  </PremiumButton>
                </form>
              </div>
            )}
          </div>
        </>
      )}
      {/* VACA CLUB MODAL */}
      {vacaProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-900 w-full max-w-md rounded-3xl p-6 flex flex-col gap-4 relative">
            <button 
              onClick={() => setVacaProduct(null)} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                🎁 Regalar en Grupo (Vaca Club)
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Creá una colecta para comprarle <strong>{vacaProduct.name}</strong> en grupo a un amigo/a.
              </p>
            </div>

            <div className="flex gap-3 items-center p-3 bg-zinc-900/30 border border-zinc-900 rounded-2xl">
              <img 
                src={vacaProduct.image} 
                alt={vacaProduct.name} 
                className="w-12 h-12 rounded-xl object-cover" 
              />
              <div>
                <h4 className="text-xs font-bold text-zinc-100">{vacaProduct.name}</h4>
                <p className="text-xs font-extrabold text-amber-500 mt-0.5">${vacaProduct.price}</p>
              </div>
            </div>

            <form onSubmit={handleCreateVaca} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-550 font-bold uppercase">Tu Nombre (Creador/Organizador)</label>
                <input 
                  type="text" 
                  required 
                  value={vacaCreatorName} 
                  onChange={(e) => setVacaCreatorName(e.target.value)} 
                  placeholder="Ej. Martín" 
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-550 font-bold uppercase">Tu WhatsApp (para coordinar envío)</label>
                <input 
                  type="text" 
                  required 
                  value={vacaCreatorPhone} 
                  onChange={(e) => setVacaCreatorPhone(e.target.value)} 
                  placeholder="Ej. +5491122334455" 
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-550 font-bold uppercase">Dedicatoria / Mensaje (opcional)</label>
                <textarea 
                  value={vacaMessage} 
                  onChange={(e) => setVacaMessage(e.target.value)} 
                  placeholder="¡Espero que te guste mucho este regalo!" 
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none resize-none h-16" 
                />
              </div>

              <PremiumButton 
                type="submit" 
                variant="primary" 
                size="lg" 
                disabled={vacaLoading} 
                className="w-full justify-center mt-2"
              >
                {vacaLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear Colecta y Obtener Link"}
              </PremiumButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
