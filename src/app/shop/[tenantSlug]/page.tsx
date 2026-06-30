"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  Sparkles
} from "lucide-react";
import { getTenantBySlug } from "@/app/actions/tenant";
import { getProductsByTenant } from "@/app/actions/product";
import { createOrder } from "@/app/actions/order";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ProductCard, ProductData, ProductType } from "@/components/ui/ProductCard";

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
  const tenantSlug = params.tenantSlug as string;

  const [tenant, setTenant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("TODAS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cart State (for Ropa/Pastelería)
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Weekly Planner State (for Viandas)
  const [weeklyPlanner, setWeeklyPlanner] = useState<Record<string, { productId: string; quantity: number; notes: string }>>({
    Lunes: { productId: "", quantity: 1, notes: "" },
    Martes: { productId: "", quantity: 1, notes: "" },
    Miércoles: { productId: "", quantity: 1, notes: "" },
    Jueves: { productId: "", quantity: 1, notes: "" },
    Viernes: { productId: "", quantity: 1, notes: "" },
    Sábado: { productId: "", quantity: 1, notes: "" },
    Domingo: { productId: "", quantity: 1, notes: "" },
  });

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

    const tenantRes = await getTenantBySlug(tenantSlug);
    if (!tenantRes.success || !tenantRes.data) {
      setError(tenantRes.error || "Esta tienda no está activa.");
      setLoading(false);
      return;
    }

    const tenantData = tenantRes.data;
    setTenant(tenantData);
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
      deliveryDate: new Date().toLocaleDateString("es-AR"),
      deliveryTimeSlot: selectedTimeSlot,
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Background Decorative Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header bar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-white">{tenant.name}</h1>
            <p className="text-xs text-zinc-500">{tenant.description || "Catálogo oficial"}</p>
          </div>
        </div>

        {!isViandaStore && (
          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-full font-bold relative transition-all cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-600 border border-zinc-950 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        )}
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

              <div className="flex flex-col gap-4 bg-zinc-900/10 border border-zinc-900 rounded-3xl p-6">
                {Object.keys(weeklyPlanner).map((day) => (
                  <div key={day} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center border-b border-zinc-900/80 pb-4">
                    <span className="text-sm font-black text-amber-500 w-24">{day}</span>
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
                  </div>
                ))}
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
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 bg-amber-500 border-amber-500 text-zinc-950 cursor-pointer"
              >
                Todas las categorías
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                    selectedCategory === c.id
                      ? "bg-amber-500 border-amber-500 text-zinc-950"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Product Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-zinc-500 text-sm">No hay productos disponibles en esta categoría.</div>
              ) : (
                filteredProducts.map((p) => (
                  <ProductCard 
                    key={p.id} 
                    product={p} 
                    onAddToCart={handleAddToCart}
                  />
                ))
              )}
            </div>
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

    </div>
  );
}
