"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft, ArrowRight, Loader2, Store } from "lucide-react";
import { createTenant } from "@/app/actions/tenant";
import { PremiumButton } from "@/components/ui/PremiumButton";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"ROPA" | "VIANDA" | "PASTELERIA">("VIANDA");
  const [whatsapp, setWhatsapp] = useState("");
  const [deliveryCost, setDeliveryCost] = useState("0");
  const [deliveryZones, setDeliveryZones] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate clean slug
    const cleaned = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with -
      .replace(/(^-|-$)/g, ""); // trim leading/trailing -
    setSlug(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      setError("Por favor, completa el nombre y slug de tu negocio.");
      return;
    }
    setError("");
    setLoading(true);

    const res = await createTenant({
      name,
      slug,
      description,
      type,
    });

    if (res.success && res.data) {
      // In a production setup, we would also store whatsapp, delivery cost, and delivery zones.
      // For this MVP, we save the Tenant and categories, then redirect.
      router.push(`/admin/${res.data.slug}`);
    } else {
      setError(res.error || "Hubo un error al registrar el negocio.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl bg-zinc-900/40 border border-zinc-900 rounded-3xl p-8 backdrop-blur-md relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-xs mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              Registrar mi Negocio <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            </h1>
            <p className="text-zinc-500 text-xs mt-0.5">Empieza a vender y gestionar tu catálogo hoy mismo.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Nombre del Negocio</label>
            <input 
              type="text"
              required
              placeholder="Ej. Hamburguesería Central o boutique chic"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="bg-zinc-950 border border-zinc-900 focus:border-amber-500 outline-none text-sm text-white px-4 py-3 rounded-xl transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Slug de la Tienda (URL única)</label>
            <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 focus-within:border-amber-500 transition-all">
              <span className="text-zinc-500 text-sm select-none">/shop/</span>
              <input 
                type="text"
                required
                placeholder="ej-mi-tienda"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="bg-transparent border-none outline-none text-sm text-white flex-1 min-w-0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Descripción Breve</label>
            <textarea 
              placeholder="Describe lo que vendes o los días que cocinas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-zinc-950 border border-zinc-900 focus:border-amber-500 outline-none text-sm text-white px-4 py-3 rounded-xl transition-all resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(["VIANDA", "ROPA", "PASTELERIA"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-3 rounded-xl font-bold text-xs tracking-wider border transition-all ${
                  type === t
                    ? "bg-amber-500/10 border-amber-500 text-amber-500"
                    : "bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                }`}
              >
                {t === "VIANDA" ? "🍱 VIANDAS" : t === "ROPA" ? "👗 ROPA" : "🎂 PASTELERÍA"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">WhatsApp de Contacto</label>
              <input 
                type="text"
                placeholder="+54911223344"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="bg-zinc-950 border border-zinc-900 focus:border-amber-500 outline-none text-sm text-white px-4 py-3 rounded-xl transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Costo de Envío ($)</label>
              <input 
                type="number"
                placeholder="0"
                value={deliveryCost}
                onChange={(e) => setDeliveryCost(e.target.value)}
                className="bg-zinc-950 border border-zinc-900 focus:border-amber-500 outline-none text-sm text-white px-4 py-3 rounded-xl transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Zonas de Entrega (Separadas por comas)</label>
            <input 
              type="text"
              placeholder="Palermo, Belgrano, Caballito"
              value={deliveryZones}
              onChange={(e) => setDeliveryZones(e.target.value)}
              className="bg-zinc-950 border border-zinc-900 focus:border-amber-500 outline-none text-sm text-white px-4 py-3 rounded-xl transition-all"
            />
          </div>

          <PremiumButton 
            type="submit" 
            variant="primary" 
            size="lg" 
            disabled={loading}
            glow 
            className="w-full justify-center mt-2 py-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Creando tienda...
              </>
            ) : (
              <>
                Crear Mi Negocio <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </PremiumButton>
        </form>
      </div>
    </div>
  );
}
