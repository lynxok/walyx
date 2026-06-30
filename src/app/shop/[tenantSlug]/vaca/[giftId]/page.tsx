import { getGroupGiftDetails, addGiftContribution } from "@/app/actions/groupGift";
import { getTenantBySlug } from "@/app/actions/tenant";
import { PremiumButton } from "@/components/ui/PremiumButton";
import Link from "next/link";
import { Gift, Heart, ArrowLeft, Send } from "lucide-react";
import React from "react";

interface VacaGiftPageProps {
  params: Promise<{
    tenantSlug: string;
    giftId: string;
  }>;
}

export default async function VacaGiftPage({ params }: VacaGiftPageProps) {
  const resolvedParams = await params;
  const { tenantSlug, giftId } = resolvedParams;

  const giftRes = await getGroupGiftDetails(giftId);
  const tenantRes = await getTenantBySlug(tenantSlug);

  if (!giftRes.success || !giftRes.data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center gap-4">
        <p className="text-red-400 font-bold">No se encontró la colecta o no es válida.</p>
        <Link href={`/shop/${tenantSlug}`}>
          <PremiumButton variant="outline" size="sm">Volver a la Tienda</PremiumButton>
        </Link>
      </div>
    );
  }

  const gift = giftRes.data;
  const tenant = tenantRes.data;

  // Determine theme colors
  let primaryColor = "#f59e0b";
  let backgroundColor = "#09090b";
  if (tenant && tenant.themeSettings) {
    try {
      const theme = JSON.parse(tenant.themeSettings);
      if (theme.primaryColor) primaryColor = theme.primaryColor;
      if (theme.backgroundColor) backgroundColor = theme.backgroundColor;
    } catch {}
  }

  const progressPercent = Math.min(100, Math.round((gift.raisedAmount / gift.targetAmount) * 100));
  const isCompleted = gift.status === "COMPLETED";

  // Build WhatsApp template for completed group order dispatch
  const buildWhatsAppLink = () => {
    const text = `¡Hola! Vengo de completar la colecta de Vaca Club 🎁\n\n` +
      `*Regalo:* ${gift.product.name}\n` +
      `*Organizador:* ${gift.creatorName} (${gift.creatorPhone})\n` +
      `*Meta:* $${gift.targetAmount}\n` +
      `*Recaudado:* $${gift.raisedAmount}\n` +
      `*Mensaje:* "${gift.message || "Sin dedicatoria"}"\n\n` +
      `*Aportantes:*\n` +
      gift.contributions.map((c: any) => `- ${c.contributorName}: $${c.amount}`).join("\n") +
      `\n\n¡Por favor, coordinemos la entrega del regalo!`;
    return `https://wa.me/${gift.creatorPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
  };

  async function submitAporte(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const amountStr = formData.get("amount") as string;
    const amount = parseFloat(amountStr);

    if (!name || isNaN(amount) || amount <= 0) {
      return;
    }

    await addGiftContribution(giftId, name, amount);
  }

  return (
    <div 
      style={{
        backgroundColor: backgroundColor,
        ["--primary-theme-color" as any]: primaryColor,
      }}
      className="min-h-screen text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans"
    >
      {/* Decorative glows */}
      <div className="absolute top-10 left-1/4 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `${primaryColor}15` }} />
      <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `${primaryColor}15` }} />

      <div className="max-w-xl w-full flex flex-col gap-6 relative z-10">
        <Link href={`/shop/${tenantSlug}`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors w-fit text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </Link>

        {/* Gorgeous Dark Glassmorphic Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] font-black tracking-widest text-amber-500 uppercase flex items-center gap-1.5 mb-1 bg-amber-500/10 border border-amber-500/20 py-1 px-3 rounded-full w-fit">
                <Gift className="w-3.5 h-3.5" /> Vaca Club
              </span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight mt-2 text-zinc-100">
                Colecta de {gift.creatorName}
              </h1>
              {gift.message && (
                <p className="text-sm text-zinc-400 italic mt-2 border-l-2 border-amber-500/50 pl-3 py-1">
                  "{gift.message}"
                </p>
              )}
            </div>
            {gift.product.imageUrl && (
              <img 
                src={gift.product.imageUrl} 
                alt={gift.product.name} 
                className="w-20 h-20 rounded-2xl object-cover border border-zinc-800 shrink-0" 
              />
            )}
          </div>

          {/* Product details */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-[10px] text-zinc-550 font-bold uppercase">Regalo Elegido</p>
              <h3 className="text-sm font-bold text-zinc-200">{gift.product.name}</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-550 font-bold uppercase">Precio Meta</p>
              <p className="text-sm font-black text-amber-500">${gift.targetAmount}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold text-zinc-400">
              <span>Recaudado: ${gift.raisedAmount}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-3.5 bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500 rounded-full" 
                style={{ 
                  width: `${progressPercent}%`,
                  backgroundColor: primaryColor,
                  boxShadow: `0 0 12px ${primaryColor}60`
                }} 
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>Meta: ${gift.targetAmount}</span>
              <span>Resta: ${Math.max(0, gift.targetAmount - gift.raisedAmount)}</span>
            </div>
          </div>

          {/* Completed State or Contribution Form */}
          {isCompleted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center flex flex-col gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="font-black text-lg text-emerald-400">¡Meta Alcanzada!</h3>
                <p className="text-xs text-zinc-400 mt-1">La colecta está completa. El organizador ya puede finalizar el pedido.</p>
              </div>
              <a 
                href={buildWhatsAppLink()} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full"
              >
                <PremiumButton 
                  variant="primary" 
                  size="lg" 
                  glow 
                  className="w-full justify-center py-4 bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-black"
                >
                  Finalizar pedido por WhatsApp
                </PremiumButton>
              </a>
            </div>
          ) : (
            <div className="bg-zinc-950/30 border border-zinc-900 rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">Hacer mi aporte</h3>
              <form action={submitAporte} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    placeholder="Tu Nombre" 
                    className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs text-white outline-none" 
                  />
                  <input 
                    type="number" 
                    name="amount" 
                    required 
                    min="1" 
                    placeholder="Monto a Aportar ($)" 
                    className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs text-white outline-none font-bold text-amber-500" 
                  />
                </div>
                <PremiumButton type="submit" variant="primary" size="sm" className="w-full justify-center">
                  Aportar a la colecta <Send className="w-3.5 h-3.5 ml-2" />
                </PremiumButton>
              </form>
            </div>
          )}

          {/* List of contributors */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Aportes de los Amigos ({gift.contributions.length})
            </h4>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {gift.contributions.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4 italic">Aún no hay aportes. ¡Sé el primero!</p>
              ) : (
                gift.contributions.map((contribution: any) => (
                  <div 
                    key={contribution.id} 
                    className="flex justify-between items-center p-3 bg-zinc-950/20 border border-zinc-900/50 rounded-xl"
                  >
                    <span className="text-xs text-zinc-300 font-semibold">{contribution.contributorName}</span>
                    <span className="text-xs font-black text-amber-500">+${contribution.amount}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
