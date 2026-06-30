"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock, Store, ArrowRight, Sparkles } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectSlug = searchParams.get("shop");

  const [slug, setSlug] = useState(redirectSlug || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) {
      setError("Ingresá el nombre de tu negocio.");
      return;
    }
    setLoading(true);
    setError("");

    // Verificar que el tenant existe antes de redirigir
    const res = await fetch(`/api/tenant-check?slug=${slug.trim().toLowerCase()}`);
    if (res.ok) {
      router.push(`/admin/${slug.trim().toLowerCase()}`);
    } else {
      setError("No encontramos un negocio con ese nombre. Verificá el slug de tu tienda.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-20 left-1/3 w-[400px] h-[400px] rounded-full blur-[150px] pointer-events-none" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }} />
      <div className="absolute bottom-20 right-1/3 w-[400px] h-[400px] rounded-full blur-[150px] pointer-events-none" style={{ backgroundColor: "rgba(249, 115, 22, 0.1)" }} />

      {/* Navbar */}
      <header className="border-b border-white/5 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3.5">
          <img src="/walyx-logo.png" alt="Walyx" className="h-10 w-auto object-contain" />
          <img src="/walyx-texto.png" alt="Walyx" className="h-9 w-auto object-contain mt-1" />
        </Link>
        <Link href="/onboarding">
          <PremiumButton variant="ghost" size="sm">
            Registrar mi Negocio <ArrowRight className="w-4 h-4 ml-1" />
          </PremiumButton>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Badge */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-orange-400 font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Panel de Comerciante
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Accedé a tu <span className="bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">panel</span>
            </h1>
            <p className="text-sm text-zinc-400">
              Ingresá el nombre único (slug) de tu negocio para acceder a tu panel de administración.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white/[0.03] border border-white/10 backdrop-blur-sm rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  Nombre de tu negocio (slug)
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
                <p className="text-[10px] text-zinc-600 pl-1">
                  El slug es el nombre corto de tu tienda, sin espacios ni mayúsculas.
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              <PremiumButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                glow
                className="w-full justify-center py-4 mt-1"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Ingresar al Panel <Lock className="w-4 h-4 ml-2" />
                  </>
                )}
              </PremiumButton>
            </form>

            <div className="border-t border-white/5 pt-4 text-center">
              <p className="text-xs text-zinc-500">
                ¿No tenés una cuenta?{" "}
                <Link href="/onboarding" className="text-orange-400 font-bold hover:underline transition-colors">
                  Registrá tu negocio aquí
                </Link>
              </p>
            </div>
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
