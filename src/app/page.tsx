"use client";

import React from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ShoppingBag, 
  TrendingUp, 
  Smartphone, 
  MessageSquare, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Check,
  Users,
  Percent,
  Calendar,
  Gift
} from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

const SEED_SHOPS = [
  {
    name: "Moda Urbana",
    slug: "moda-urbana",
    type: "ROPA",
    description: "Tienda premium de ropa de diseño independiente y accesorios.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500",
    color: "from-purple-500 to-indigo-600",
  },
  {
    name: "NutriViandas Cocina",
    slug: "nutriviandas-cocina",
    type: "VIANDA",
    description: "Comida saludable y viandas semanales listas para consumir.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500",
    color: "from-emerald-500 to-teal-600",
  },
  {
    name: "Dulzura & Arte Pastelería",
    slug: "dulzura-arte",
    type: "PASTELERIA",
    description: "Tortas, pasteles, postres artesanales y café de especialidad.",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500",
    color: "from-pink-500 to-rose-600",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Background Decorative Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-[400px] h-[400px] rounded-full blur-[150px] pointer-events-none animate-orb-1" style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)' }} />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-[180px] pointer-events-none animate-orb-2" style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)' }} />
      <div className="absolute bottom-1/4 left-10 w-[450px] h-[450px] rounded-full blur-[160px] pointer-events-none animate-orb-1" style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)' }} />

      {/* Navbar */}
      <header className="border-b border-white/5 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-50 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between max-w-7xl mx-auto w-full gap-3">
        <Link href="/" className="flex items-center gap-2 md:gap-3.5 shrink-0">
          <img src="/walyx-logo.png" alt="Walyx Symbol" className="h-9 md:h-12 w-auto object-contain" />
          <img src="/walyx-texto.png" alt="Walyx Text" className="h-8 md:h-11 w-auto object-contain mt-1 hidden sm:block" />
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link href="/login">
            <PremiumButton variant="ghost" size="sm" className="px-2.5 sm:px-4 text-xs">
              Ingresar
            </PremiumButton>
          </Link>
          <div className="w-px h-4 bg-white/10 hidden sm:block" />
          <Link href="/onboarding">
            <PremiumButton variant="primary" size="sm" glow className="text-xs px-3 sm:px-5 font-bold">
              <span className="hidden sm:inline">Registrar mi Negocio</span>
              <span className="inline sm:hidden">Registrarse</span>
            </PremiumButton>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-16 flex flex-col gap-24 relative z-10">
        
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-6 max-w-4xl mx-auto mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-orange-400 font-semibold uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Creación de Catálogos & Gestión Inteligente
          </div>
          <h1 className="text-4xl sm:text-7xl font-black tracking-tight text-white leading-none">
            Vende en automático y cobra directo por <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-blue-400 to-orange-500">WhatsApp</span>
          </h1>
          <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mt-2 leading-relaxed">
            La plataforma definitiva y adaptada a tu rubro. Gestiona variantes de talles en Ropa, menús de calorías en Viandas o porciones en Pastelería con un panel administrativo de nivel profesional.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <Link href="/onboarding">
              <PremiumButton variant="primary" size="lg" glow className="px-8 py-6 text-lg font-bold">
                Crear Mi Tienda Ahora <ArrowRight className="w-5 h-5 ml-2" />
              </PremiumButton>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card glass-card-hover p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Nicho 100% Adaptado</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Manejo de propiedades específicas para cada industria: talles y variantes de ropa, calorías e ingredientes para viandas fit, o porciones para pastelerías.
            </p>
          </div>
          <div className="glass-card glass-card-hover p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Pedido Directo a WhatsApp</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              El cliente navega tu catálogo, arma el carrito y, al confirmar, el sistema genera la orden y redirige a WhatsApp con el pedido perfectamente estructurado.
            </p>
          </div>
          <div className="glass-card glass-card-hover p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Cierre de Caja y ABC</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Métricas comerciales avanzadas: panel de ventas, arqueo de caja diario consolidado por método de pago y análisis de curva ABC para tus productos estrella.
            </p>
          </div>
        </section>

        {/* Unique Features Explanation (Vaca Club & Abandoned Carts) */}
        <section className="flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-orange-550 tracking-widest uppercase">Características Únicas</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">Herramientas que multiplican tus ventas</h2>
            <p className="text-zinc-400 mt-3 text-sm">
              Diseñamos integraciones exclusivas para resolver los problemas reales de los negocios de viandas, indumentaria y gastronomía.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vaca Club Card */}
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between group border border-blue-500/10 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px]" />
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Users className="w-7 h-7" />
                </div>
                <div className="inline-block self-start px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold">
                  Función Exclusiva Walyx
                </div>
                <h3 className="text-2xl font-black text-white">Vaca Club (Compra Grupal)</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Permite a tus clientes coordinar pedidos conjuntos. Ideal para oficinas, familias o grupos de amigos que compran viandas semanales. Uno inicia la compra, comparte un enlace único y todos agregan sus productos favoritos. Al final, se consolida en un solo pedido para optimizar la logística de envío.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-blue-400 font-bold group-hover:translate-x-1 transition-transform">
                <span>Reduce costos de envío hasta un 40%</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Abandoned Cart Recovery Card */}
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between group border border-orange-500/10 hover:border-orange-500/30 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-[60px]" />
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                  <Percent className="w-7 h-7" />
                </div>
                <div className="inline-block self-start px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold">
                  Automatización de Recuperación
                </div>
                <h3 className="text-2xl font-black text-white">Recuperador de Carritos Abandonados</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  No pierdas más ventas. Cuando un cliente arma un carrito pero no completa la confirmación de WhatsApp, el sistema detecta la inactividad y te permite enviarle un recordatorio personalizado con un solo clic. Ofrece cupones de descuento rápidos y aumenta la tasa de conversión hasta un 25%.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-orange-400 font-bold group-hover:translate-x-1 transition-transform">
                <span>Recupera el 25% de las ventas perdidas</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Plans */}
        <section className="flex flex-col gap-12 relative">
          <div className="absolute -top-20 left-1/3 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-orange-500 tracking-widest uppercase">Precios Transparentes</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">Planes de Suscripción Flexibles</h2>
            <p className="text-zinc-400 mt-3 text-sm">
              Escoge el plan perfecto para escalar tu negocio. Sin costos ocultos, cancela cuando quieras.
            </p>
          </div>

          <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 items-stretch snap-x snap-mandatory scrollbar-none pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0">
            {/* Plan Basico */}
            <div className="glass-card p-8 rounded-3xl flex flex-col justify-between border border-blue-500/10 hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] transition-all duration-300 w-[85vw] sm:w-[340px] md:w-auto shrink-0 md:shrink snap-center">
              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="text-lg font-bold text-zinc-300">Básico</h4>
                  <div className="mt-4 flex items-baseline gap-1 text-white">
                    <span className="text-3xl font-black">$9</span>
                    <span className="text-zinc-400 text-sm">USD/mes</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">~ $13.500 ARS/mes (Cotización BNA)</p>
                </div>
                <div className="border-t border-white/5 pt-6">
                  <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">Qué incluye:</p>
                  <ul className="flex flex-col gap-3 text-sm text-zinc-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span>Hasta 150 pedidos mensuales</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span>Hasta 50 productos activos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span>Catálogo web auto-gestionable</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span>Redirección a WhatsApp</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-8">
                <Link href="/onboarding" className="w-full block">
                  <button className="w-full py-3 rounded-xl bg-blue-950/20 hover:bg-blue-900/30 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
                    Comenzar Básico
                  </button>
                </Link>
              </div>
            </div>

            {/* Plan Pro (Recomendado) */}
            <div className="relative p-[2px] rounded-3xl bg-gradient-to-br from-blue-600 via-blue-900 to-orange-500 shadow-[0_0_40px_rgba(37,99,235,0.25)] hover:shadow-[0_0_50px_rgba(249,115,22,0.4)] transition-all duration-500 flex flex-col w-[85vw] sm:w-[340px] md:w-auto shrink-0 md:shrink snap-center">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-950 to-orange-950 text-white text-xs font-black uppercase tracking-wider rounded-full border border-orange-500/30 shadow-lg flex items-center gap-1.5 z-10">
                <Sparkles className="w-3 h-3 text-orange-400" />
                <span>Más popular</span>
              </div>
              <div className="bg-[#060814]/95 p-8 rounded-[22px] flex flex-col justify-between flex-1">
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">Pro</h4>
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-950 to-orange-950 border border-orange-500/20 text-orange-400 text-2xs font-extrabold uppercase">Recomendado</span>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1 text-white">
                      <span className="text-4xl font-black">$19</span>
                      <span className="text-zinc-400 text-sm">USD/mes</span>
                    </div>
                    <p className="text-xs text-orange-400/80 mt-1">~ $28.500 ARS/mes (Cotización BNA)</p>
                  </div>
                  <div className="border-t border-white/5 pt-6">
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-4">Qué incluye:</p>
                    <ul className="flex flex-col gap-3 text-sm text-zinc-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span><strong>Pedidos ilimitados</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span><strong>Productos ilimitados</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span>Acceso total a <strong>Vaca Club</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span>Recuperador de Carritos</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span>Planificador semanal de menús</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-8">
                  <Link href="/onboarding" className="w-full block">
                    <PremiumButton variant="primary" size="md" glow className="w-full font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-500 hover:to-orange-400 border-none text-white">
                      Comenzar Pro
                    </PremiumButton>
                  </Link>
                </div>
              </div>
            </div>

            {/* Plan Premium */}
            <div className="glass-card p-8 rounded-3xl flex flex-col justify-between border border-orange-500/10 hover:border-orange-500/40 hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-all duration-300 w-[85vw] sm:w-[340px] md:w-auto shrink-0 md:shrink snap-center">
              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="text-lg font-bold text-zinc-300">Premium</h4>
                  <div className="mt-4 flex items-baseline gap-1 text-white">
                    <span className="text-3xl font-black">$35</span>
                    <span className="text-zinc-400 text-sm">USD/mes</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">~ $52.500 ARS/mes (Cotización BNA)</p>
                </div>
                <div className="border-t border-white/5 pt-6">
                  <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">Qué incluye:</p>
                  <ul className="flex flex-col gap-3 text-sm text-zinc-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span>Todo lo del Plan Pro</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span>Soporte multi-agente</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span>Ejecutivo de cuentas dedicado</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span>Integración prioritaria</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-8">
                <Link href="/onboarding" className="w-full block">
                  <button className="w-full py-3 rounded-xl bg-orange-950/20 hover:bg-orange-900/30 border border-orange-500/20 hover:border-orange-500/40 text-orange-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
                    Comenzar Premium
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Stores Selection */}
        <section className="flex flex-col gap-8">
          <div className="text-center">
            <span className="text-xs font-bold text-orange-500 tracking-widest uppercase">Prueba el Sistema</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Tiendas de Demostración Semilla</h2>
            <p className="text-zinc-400 mt-2 text-sm max-w-lg mx-auto">
              Haz clic para visitar la tienda pública (vistas de cliente) o ingresar al panel administrativo y ver la gestión interna de cada una.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {SEED_SHOPS.map((shop) => (
              <div 
                key={shop.slug} 
                className="group relative rounded-2xl overflow-hidden transition-all flex flex-col justify-between glass-card glass-card-hover"
              >
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={shop.image} 
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 to-transparent" />
                  <div className="absolute top-4 right-4 bg-zinc-900/90 backdrop-blur border border-white/10 text-white text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    {shop.type}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-2">
                  <h3 className="text-xl font-black text-white">{shop.name}</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">{shop.description}</p>
                </div>

                <div className="p-6 pt-0 border-t border-white/5 flex gap-4 mt-4">
                  <Link href={`/shop/${shop.slug}`} className="flex-1">
                    <button className="w-full bg-white/5 text-zinc-100 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all uppercase cursor-pointer">
                      Tienda Pública
                    </button>
                  </Link>
                  <Link href={`/admin/${shop.slug}`} className="flex-1">
                    <button className="w-full bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all uppercase cursor-pointer">
                      Panel Admin
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950/80 py-10 px-6 text-center text-xs text-zinc-650 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/walyx-logo.png" alt="Walyx Symbol" className="h-10 w-auto object-contain opacity-95" />
              <img src="/walyx-texto.png" alt="Walyx Text" className="h-9 w-auto object-contain opacity-95 mt-0.5" />
            </div>
            <div className="text-left border-l border-zinc-800 pl-3">
              <p className="font-bold text-zinc-400">Walyx</p>
              <p className="text-[10px] text-zinc-600">SaaS de Venta conversacional</p>
            </div>
          </div>
          <p className="text-zinc-600 text-left sm:text-right">© 2026 Walyx / by lnx.com.ar. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-zinc-500 font-medium">
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Multi-Tenant Aislado</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

