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
  Zap
} from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

const SEED_SHOPS = [
  {
    name: "Moda Urbana",
    slug: "moda-urbana",
    type: "ROPA",
    description: "Tienda premium de ropa de diseño independiente y accesorios.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500",
    color: "from-amber-500 to-yellow-600",
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
      <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Navbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-55 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 font-black text-2xl tracking-tight text-white">
          LYNX <span className="text-amber-500 font-medium">Cocina & Ventas</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/onboarding">
            <PremiumButton variant="primary" size="md" glow>
              Registrar mi Negocio
            </PremiumButton>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-16 flex flex-col gap-16 relative z-10">
        <section className="text-center flex flex-col items-center gap-6 max-w-3xl mx-auto mt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 font-semibold uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> El Futuro de tu Comercio Online
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            La plataforma multi-rubro para vender por <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">WhatsApp</span>
          </h1>
          <p className="text-zinc-400 text-lg sm:text-xl">
            Optimiza tu catálogo de Ropa con talles, tus Viandas saludables con menú semanal o tu Pastelería de diseño. Gestión interna premium con estadísticas reales.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Link href="/onboarding">
              <PremiumButton variant="primary" size="lg" glow className="px-8 py-6 text-lg font-bold">
                Empezar Onboarding <ArrowRight className="w-5 h-5 ml-2" />
              </PremiumButton>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
          <div className="glass-panel p-8 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 transition-all flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Nicho Adaptado</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Manejo de propiedades específicas para cada industria: talles y variantes de ropa, calorías e ingredientes para viandas fit, o porciones para pastelerías.
            </p>
          </div>
          <div className="glass-panel p-8 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 transition-all flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Pedido a WhatsApp</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              El cliente llena su carrito en la web pública del comercio y, al confirmar, el sistema genera la orden internamente y redirige con el pedido redactado.
            </p>
          </div>
          <div className="glass-panel p-8 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 transition-all flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Cierre de Caja y ABC</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Métricas avanzadas para el comerciante: panel de ventas, arqueo de caja diario por método de pago y análisis de curva ABC para tus productos estrella.
            </p>
          </div>
        </section>

        {/* Demo Stores Selection */}
        <section className="flex flex-col gap-8 mt-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">Tiendas de Demostración Semilla</h2>
            <p className="text-zinc-400 mt-2 text-sm max-w-lg mx-auto">
              Haz clic para visitar la tienda pública (vistas de cliente) o ingresar al panel administrativo y ver la gestión interna de cada una.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {SEED_SHOPS.map((shop) => (
              <div 
                key={shop.slug} 
                className="group relative rounded-2xl border border-zinc-900 bg-zinc-900/20 overflow-hidden hover:border-zinc-800 transition-all flex flex-col justify-between"
              >
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={shop.image} 
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                  <div className="absolute top-4 right-4 bg-zinc-900/90 backdrop-blur border border-zinc-800 text-zinc-100 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    {shop.type}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-2">
                  <h3 className="text-xl font-black text-white">{shop.name}</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">{shop.description}</p>
                </div>

                <div className="p-6 pt-0 border-t border-zinc-900/80 flex gap-4">
                  <Link href={`/shop/${shop.slug}`} className="flex-1">
                    <button className="w-full bg-zinc-900 text-zinc-100 hover:bg-zinc-800 border border-zinc-800 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all uppercase">
                      Tienda Pública
                    </button>
                  </Link>
                  <Link href={`/admin/${shop.slug}`} className="flex-1">
                    <button className="w-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all uppercase">
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
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 px-6 text-center text-xs text-zinc-600 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 LYNX Cocina & Ventas. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-zinc-500 font-medium">
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Multi-Tenant Aislado</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
