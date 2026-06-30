"use client";

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lock,
  Store,
  User,
  Sparkles,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { loginTenant } from "@/app/actions/tenantAuth";

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = "negocio" | "cliente";

function LoginContent() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("negocio");

  // Negocio
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [errorBusiness, setErrorBusiness] = useState("");

  // Cliente — redirige a la tienda elegida
  const [shopSlug, setShopSlug] = useState("");
  const [loadingClient, setLoadingClient] = useState(false);
  const [errorClient, setErrorClient] = useState("");

  // ── Login de Negocio ─────────────────────────────────────────────────────
  const handleBusinessLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBusiness("");
    setLoadingBusiness(true);

    const res = await loginTenant(slug.trim().toLowerCase(), password);
    setLoadingBusiness(false);

    if (res.success) {
      router.push(`/admin/${res.slug}`);
      router.refresh();
    } else {
      setErrorBusiness(res.error || "Error al iniciar sesión.");
    }
  };

  // ── Ir al login de cliente de una tienda ────────────────────────────────
  const handleClientGo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorClient("");
    if (!shopSlug.trim()) {
      setErrorClient("Ingresá el nombre de la tienda.");
      return;
    }
    setLoadingClient(true);

    const res = await fetch(`/api/tenant-check?slug=${shopSlug.trim().toLowerCase()}`);
    setLoadingClient(false);

    if (res.ok) {
      router.push(`/shop/${shopSlug.trim().toLowerCase()}/login`);
    } else {
      setErrorClient("No encontramos una tienda con ese nombre.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-20 left-1/4 w-[450px] h-[450px] rounded-full blur-[150px] pointer-events-none" style={{ backgroundColor: "rgba(37,99,235,0.09)" }} />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] rounded-full blur-[150px] pointer-events-none" style={{ backgroundColor: "rgba(249,115,22,0.09)" }} />

      {/* Navbar */}
      <header className="border-b border-white/5 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3">
          <img src="/walyx-logo.png" alt="Walyx" className="h-10 w-auto object-contain" />
          <img src="/walyx-texto.png" alt="Walyx" className="h-9 w-auto object-contain mt-1" />
        </Link>
        <Link href="/onboarding">
          <PremiumButton variant="ghost" size="sm">
            Registrar mi Negocio <ArrowRight className="w-4 h-4 ml-1" />
          </PremiumButton>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md flex flex-col gap-6">

          {/* Header */}
          <div className="text-center flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-orange-400 font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Bienvenido a Walyx
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              ¿Cómo querés{" "}
              <span className="bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
                ingresar?
              </span>
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/[0.04] border border-white/10 rounded-2xl p-1.5 gap-1.5">
            <button
              onClick={() => { setTab("negocio"); setErrorBusiness(""); setErrorClient(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                tab === "negocio"
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Store className="w-4 h-4" /> Mi Negocio
            </button>
            <button
              onClick={() => { setTab("cliente"); setErrorBusiness(""); setErrorClient(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                tab === "cliente"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <User className="w-4 h-4" /> Soy Cliente
            </button>
          </div>

          {/* Card */}
          <div className="bg-white/[0.03] border border-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl flex flex-col gap-5">

            {/* ── TAB NEGOCIO ── */}
            {tab === "negocio" && (
              <>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold text-white">Panel de administración</p>
                  <p className="text-xs text-zinc-500">
                    Ingresá con el nombre y contraseña de tu negocio.
                  </p>
                </div>

                <form onSubmit={handleBusinessLogin} className="flex flex-col gap-4">
                  {/* Slug */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                      Nombre del negocio (slug)
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                        placeholder="ej: moda-urbana"
                        required
                        className="bg-zinc-950/80 border border-zinc-800 focus:border-blue-500 text-sm text-white pl-10 pr-4 py-3.5 rounded-xl w-full outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="bg-zinc-950/80 border border-zinc-800 focus:border-blue-500 text-sm text-white pl-10 pr-11 py-3.5 rounded-xl w-full outline-none transition-all placeholder:text-zinc-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {errorBusiness && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
                      {errorBusiness}
                    </div>
                  )}

                  <PremiumButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loadingBusiness}
                    glow
                    className="w-full justify-center py-4 mt-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                  >
                    {loadingBusiness ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Ingresar al Panel <ChevronRight className="w-4 h-4 ml-1" /></>
                    )}
                  </PremiumButton>
                </form>

                <div className="border-t border-white/5 pt-4 text-center">
                  <p className="text-xs text-zinc-500">
                    ¿No tenés cuenta?{" "}
                    <Link href="/onboarding" className="text-blue-400 font-bold hover:underline">
                      Registrá tu negocio gratis
                    </Link>
                  </p>
                </div>
              </>
            )}

            {/* ── TAB CLIENTE ── */}
            {tab === "cliente" && (
              <>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold text-white">Acceder como cliente</p>
                  <p className="text-xs text-zinc-500">
                    Ingresá el nombre de la tienda donde querés comprar y te llevamos al login.
                  </p>
                </div>

                <form onSubmit={handleClientGo} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                      Nombre de la tienda
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={shopSlug}
                        onChange={(e) => setShopSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                        placeholder="ej: moda-urbana"
                        required
                        className="bg-zinc-950/80 border border-zinc-800 focus:border-orange-500 text-sm text-white pl-10 pr-4 py-3.5 rounded-xl w-full outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-600 pl-1">
                      El comerciante te debería haber enviado el nombre de su tienda.
                    </p>
                  </div>

                  {errorClient && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
                      {errorClient}
                    </div>
                  )}

                  <PremiumButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loadingClient}
                    glow
                    className="w-full justify-center py-4 mt-1"
                  >
                    {loadingClient ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Ir a la tienda <ArrowRight className="w-4 h-4 ml-1" /></>
                    )}
                  </PremiumButton>
                </form>
              </>
            )}
          </div>

          <Link href="/" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors justify-center">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
