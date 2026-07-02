"use client";

import React, { useState, useEffect } from "react";
import { 
  Palette, 
  Image as ImageIcon, 
  LayoutGrid, 
  Smartphone, 
  Loader2, 
  Upload,
  AlertTriangle,
  Megaphone,
  Share2,
  CalendarDays,
  Info
} from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { updateShopSettings, type ThemeSettings } from "@/app/actions/shopSettings";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  themeSettings: string;
}

interface ShopCustomizationProps {
  tenant: Tenant;
  onRefresh: () => void;
}

// Preset color palettes
const COLOR_PRESETS = [
  { name: "Ámbar Cyberpunk", primary: "#f59e0b", bg: "#09090b", text: "#ffffff" },
  { name: "Verde Orgánico", primary: "#10b981", bg: "#062f22", text: "#f0fdf4" },
  { name: "Rosa Dulce", primary: "#ec4899", bg: "#fdf2f8", text: "#1f2937" },
  { name: "Monocromo Elegante", primary: "#ffffff", bg: "#000000", text: "#e5e7eb" },
  { name: "Azul Eléctrico", primary: "#3b82f6", bg: "#0f172a", text: "#f8fafc" },
  { name: "Cereza Intenso", primary: "#ef4444", bg: "#450a0a", text: "#fef2f2" },
  { name: "Minimalista Claro", primary: "#18181b", bg: "#fafafa", text: "#18181b" },
  { name: "Lavanda Soft", primary: "#8b5cf6", bg: "#faf5ff", text: "#3b0764" }
];

export default function ShopCustomization({ tenant, onRefresh }: ShopCustomizationProps) {
  // Parse initial theme settings
  const initialTheme: ThemeSettings = (() => {
    try {
      return JSON.parse(tenant.themeSettings);
    } catch {
      return {
        primaryColor: "#f59e0b",
        backgroundColor: "#09090b",
        layoutMode: "grid",
        textColor: "#ffffff",
        fontFamily: "Outfit",
        cardStyle: "glass"
      };
    }
  })();

  // Core Identity States
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl || "");
  const [bannerUrl, setBannerUrl] = useState(tenant.bannerUrl || "");
  const [description, setDescription] = useState(tenant.description || "");

  // Colors & Styling States
  const [primaryColor, setPrimaryColor] = useState(initialTheme.primaryColor);
  const [backgroundColor, setBackgroundColor] = useState(initialTheme.backgroundColor);
  const [textColor, setTextColor] = useState(initialTheme.textColor);
  const [layoutMode, setLayoutMode] = useState(initialTheme.layoutMode);
  const [cardStyle, setCardStyle] = useState(initialTheme.cardStyle);
  const [fontFamily, setFontFamily] = useState(initialTheme.fontFamily);
  const [borderRadius, setBorderRadius] = useState<"none" | "subtle" | "rounded" | "pill">(
    initialTheme.borderRadius || "rounded"
  );

  // Announcement Bar States
  const [announcementText, setAnnouncementText] = useState(initialTheme.announcementText || "");
  const [announcementActive, setAnnouncementActive] = useState(!!initialTheme.announcementActive);
  const [announcementBg, setAnnouncementBg] = useState(initialTheme.announcementBg || "#f59e0b");

  // Social Links States
  const [instagramUrl, setInstagramUrl] = useState(initialTheme.instagramUrl || "");
  const [tiktokUrl, setTiktokUrl] = useState(initialTheme.tiktokUrl || "");
  const [whatsappUrl, setWhatsappUrl] = useState(initialTheme.whatsappUrl || "");

  // Store Operation Status
  const [isStoreClosed, setIsStoreClosed] = useState(!!initialTheme.isStoreClosed);
  const [storeClosedMessage, setStoreClosedMessage] = useState(
    initialTheme.storeClosedMessage || "Estamos cerrados por vacaciones. ¡Volvemos pronto!"
  );

  // Loading and helper UI states
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Compression helper
  const compressImageFile = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress as JPEG at 0.80 quality (extremely lightweight, perfect look)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.80);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === "logo") {
      setUploadingLogo(true);
      try {
        const compressed = await compressImageFile(file, 250, 250);
        setLogoUrl(compressed);
      } catch (err) {
        console.error("Error compressing logo:", err);
        alert("No se pudo procesar la imagen del logo.");
      } finally {
        setUploadingLogo(false);
      }
    } else {
      setUploadingBanner(true);
      try {
        const compressed = await compressImageFile(file, 800, 400);
        setBannerUrl(compressed);
      } catch (err) {
        console.error("Error compressing banner:", err);
        alert("No se pudo procesar la imagen de portada.");
      } finally {
        setUploadingBanner(false);
      }
    }
  };

  const handleSave = async () => {
    setSavingSettings(true);
    const res = await updateShopSettings(tenant.id, {
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
      description: description || null,
      themeSettings: {
        primaryColor,
        backgroundColor,
        layoutMode,
        textColor,
        fontFamily,
        cardStyle,
        borderRadius,
        announcementText,
        announcementActive,
        announcementBg,
        instagramUrl,
        tiktokUrl,
        whatsappUrl,
        isStoreClosed,
        storeClosedMessage
      }
    });
    setSavingSettings(false);
    if (res.success) {
      alert("¡Personalización guardada exitosamente!");
      onRefresh();
    } else {
      alert(res.error || "Error al guardar los ajustes.");
    }
  };

  // Convert borderRadius type to actual Tailwind preview class
  const getRadiusPreviewClass = () => {
    if (borderRadius === "none") return "rounded-none";
    if (borderRadius === "subtle") return "rounded-md";
    if (borderRadius === "pill") return "rounded-3xl";
    return "rounded-xl"; // rounded (default)
  };

  return (
    <div className="flex flex-col gap-6 max-w-none">
      
      {/* Live Editor Grid split layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Controls Form (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-5">
            
            {/* Identity & Visual Assets */}
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-500" /> Identidad Visual y Logotipo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Logo Upload Box */}
              <div className="flex flex-col gap-2">
                <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Logo Comercial</label>
                <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl relative overflow-hidden">
                  <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 relative overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-zinc-700" />
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <span className="text-[10px] text-zinc-500">Formato cuadrado ideal (WebP, PNG, JPG).</span>
                    <label className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-200 border border-zinc-800 rounded-lg cursor-pointer inline-flex items-center gap-1.5 w-fit font-bold transition-all">
                      <Upload className="w-3 h-3" /> Subir Imagen
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "logo")} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Banner Upload Box */}
              <div className="flex flex-col gap-2">
                <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Portada de Tienda</label>
                <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl relative overflow-hidden">
                  <div className="w-24 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 relative overflow-hidden">
                    {bannerUrl ? (
                      <img src={bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-zinc-700" />
                    )}
                    {uploadingBanner && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <span className="text-[10px] text-zinc-500">Banner horizontal (aprox. 8:3 ratio).</span>
                    <label className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-200 border border-zinc-800 rounded-lg cursor-pointer inline-flex items-center gap-1.5 w-fit font-bold transition-all">
                      <Upload className="w-3 h-3" /> Subir Imagen
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "banner")} />
                    </label>
                  </div>
                </div>
              </div>

            </div>

            {/* Description & Tagline */}
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Eslogan o Descripción de la Tienda</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Diseño independiente urbano 100% algodón, envío gratis en CABA."
                className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none resize-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Operational Status Panel (Vacation Mode) */}
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2 pt-2 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-amber-500" /> Estado de Operación (Modo Vacaciones)
            </h3>

            <div className="bg-zinc-950 border border-zinc-900/60 p-4 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Cerrar tienda temporalmente</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Suspende la compra del carrito y muestra un aviso en portada.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isStoreClosed} 
                    onChange={(e) => setIsStoreClosed(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500/80 peer-checked:after:bg-white"></div>
                </label>
              </div>

              {isStoreClosed && (
                <div className="flex flex-col gap-1.5 animate-fadeIn">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Mensaje de cierre para los clientes</label>
                  <input
                    type="text"
                    value={storeClosedMessage}
                    onChange={(e) => setStoreClosedMessage(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-xs text-white p-3 rounded-xl outline-none"
                  />
                </div>
              )}
            </div>

            {/* Announcement Banner Panel */}
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2 pt-2 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-500" /> Cartelera de Anuncios Promocionales
            </h3>

            <div className="bg-zinc-950 border border-zinc-900/60 p-4 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Activar anuncio superior</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Muestra un banner promocional arriba de todo en tu shop.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={announcementActive} 
                    onChange={(e) => setAnnouncementActive(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500/80 peer-checked:after:bg-white"></div>
                </label>
              </div>

              {announcementActive && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">Mensaje publicitario</label>
                    <input
                      type="text"
                      placeholder="Ej. 🔥 ¡15% de descuento pagando por transferencia!"
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 text-xs text-white p-3 rounded-xl outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">Fondo del banner</label>
                    <select
                      value={announcementBg}
                      onChange={(e) => setAnnouncementBg(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 text-xs text-white p-3 rounded-xl outline-none"
                    >
                      <option value="#f59e0b">Amarillo Ámbar</option>
                      <option value="#10b981">Verde Trébol</option>
                      <option value="#ec4899">Rosa Chicle</option>
                      <option value="#ef4444">Rojo Cereza</option>
                      <option value="#3b82f6">Azul Cobalto</option>
                      <option value="#18181b">Zinc Oscuro</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Social Networks Links */}
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2 pt-2 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-amber-500" /> Enlaces de Redes Sociales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Usuario Instagram</label>
                <input
                  type="text"
                  placeholder="Ej. tienda.moda"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Usuario TikTok</label>
                <input
                  type="text"
                  placeholder="Ej. tiendamoda"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Número WhatsApp</label>
                <input
                  type="text"
                  placeholder="Ej. +5491138402932"
                  value={whatsappUrl}
                  onChange={(e) => setWhatsappUrl(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                />
              </div>
            </div>

            {/* Palette & Presets */}
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2 pt-2 flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-500" /> Estilo Estético y Color de Marca
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setPrimaryColor(preset.primary);
                    setBackgroundColor(preset.bg);
                    setTextColor(preset.text);
                  }}
                  className="flex flex-col gap-1 p-2 bg-zinc-950 hover:border-zinc-700 border border-zinc-900 rounded-xl text-left transition-all"
                >
                  <span className="text-[9px] font-bold text-zinc-400 truncate">{preset.name}</span>
                  <div className="flex gap-1">
                    <span className="w-3 h-3 rounded-full border border-white/5" style={{ backgroundColor: preset.primary }} />
                    <span className="w-3 h-3 rounded-full border border-white/5" style={{ backgroundColor: preset.bg }} />
                    <span className="w-3 h-3 rounded-full border border-white/5" style={{ backgroundColor: preset.text }} />
                  </div>
                </button>
              ))}
            </div>

            {/* Manual Color Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Acento / Botón</label>
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-900 p-2 rounded-xl">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-6 w-8 bg-transparent border-0 rounded cursor-pointer shrink-0" />
                  <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="bg-transparent text-[11px] text-white outline-none w-full font-mono uppercase" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Fondo</label>
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-900 p-2 rounded-xl">
                  <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="h-6 w-8 bg-transparent border-0 rounded cursor-pointer shrink-0" />
                  <input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="bg-transparent text-[11px] text-white outline-none w-full font-mono uppercase" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Texto</label>
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-900 p-2 rounded-xl">
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-6 w-8 bg-transparent border-0 rounded cursor-pointer shrink-0" />
                  <input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="bg-transparent text-[11px] text-white outline-none w-full font-mono uppercase" />
                </div>
              </div>
            </div>

            {/* Layout structures */}
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2 pt-2 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-amber-500" /> Estructura y Bordes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Radio de Bordes (Global)</label>
                <select
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                >
                  <option value="none">Sin borde (0px - Cuadrado Clásico)</option>
                  <option value="subtle">Sutil (6px - Moderno Recto)</option>
                  <option value="rounded">Suave (12px - Redondeado Premium)</option>
                  <option value="pill">Muy redondo (24px - Estilo Cápsula)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Estructura</label>
                <select
                  value={layoutMode}
                  onChange={(e) => setLayoutMode(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                >
                  <option value="grid">Grilla (Cards)</option>
                  <option value="list">Lista compacta</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase">Estilo de Card</label>
                <select
                  value={cardStyle}
                  onChange={(e) => setCardStyle(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-900 text-xs text-white p-3 rounded-xl outline-none"
                >
                  <option value="glass">Vidrio Premium</option>
                  <option value="classic">Clásico con Borde</option>
                  <option value="minimal">Minimalista Plano</option>
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end border-t border-zinc-900 pt-4 mt-2">
              <PremiumButton
                variant="primary"
                size="md"
                disabled={savingSettings}
                glow
                onClick={handleSave}
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Personalización"}
              </PremiumButton>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Mobile Preview Frame (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col items-center gap-4 sticky top-6">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> Vista Previa en Vivo (Celular)
          </span>

          <div className="w-[320px] h-[580px] rounded-[40px] border-[10px] border-zinc-800 bg-zinc-950 relative shadow-2xl flex flex-col overflow-hidden select-none">
            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-800 rounded-full z-20 flex justify-center items-center">
              <div className="w-2.5 h-2.5 bg-black rounded-full ml-auto mr-4" />
            </div>

            {/* Mobile View Screen container */}
            <div
              style={{
                backgroundColor: backgroundColor,
                color: textColor,
                fontFamily: 
                  fontFamily === "Outfit" ? "Outfit, sans-serif" : 
                  fontFamily === "Geist" ? "Geist, sans-serif" : 
                  fontFamily === "Inter" ? "Inter, sans-serif" : 
                  "sans-serif",
                height: "100%"
              }}
              className="flex-1 flex flex-col overflow-y-auto pt-8 pb-4 text-left transition-all relative"
            >
              
              {/* Promo Announcement Banner */}
              {announcementActive && announcementText && (
                <div 
                  className="py-1.5 px-3 text-[9px] font-bold text-center text-white font-mono uppercase tracking-wider leading-none"
                  style={{ backgroundColor: announcementBg }}
                >
                  {announcementText}
                </div>
              )}

              {/* Cover Banner */}
              <div className="h-24 bg-zinc-900 relative overflow-hidden shrink-0 border-b border-white/5">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-zinc-900 to-zinc-950 flex items-center justify-center text-[9px] text-zinc-600 italic">
                    Banner de Portada
                  </div>
                )}
                <div className="absolute inset-0 bg-black/35" />
                
                {/* Logo Overlaid */}
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

              {/* Store Title Details */}
              <div className="px-4 py-3 border-b border-white/5 flex flex-col gap-0.5">
                <h4 className="text-xs font-black text-white">{tenant.name}</h4>
                <p className="text-[9px] text-zinc-400 line-clamp-2">{description || "Descripción comercial de la tienda."}</p>
              </div>

              {/* Vacations Locked screen block simulation */}
              {isStoreClosed ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3 bg-black/60 backdrop-blur-sm">
                  <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
                  <h5 className="text-xs font-extrabold text-white uppercase tracking-wider">Cerrado Temporalmente</h5>
                  <p className="text-[10px] text-zinc-400 max-w-[200px] leading-relaxed">
                    {storeClosedMessage}
                  </p>
                </div>
              ) : (
                /* Standard Store View Simulation */
                <div className="p-4 flex-1 flex flex-col gap-4">
                  {/* Category Chips */}
                  <div className="flex gap-1 overflow-x-auto pb-1 shrink-0">
                    <span
                      style={{ backgroundColor: primaryColor }}
                      className="px-2.5 py-1 rounded-full text-[8px] font-black text-black leading-none"
                    >
                      Destacados
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[8px] font-bold bg-white/5 text-zinc-400 border border-white/10 leading-none">
                      Nuevos
                    </span>
                  </div>

                  {/* Cards simulation using selected style and borderRadius */}
                  {layoutMode === "grid" ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 1, name: "Producto Destacado A", price: 4200 },
                        { id: 2, name: "Producto Destacado B", price: 3800 },
                      ].map((prod) => (
                        <div
                          key={prod.id}
                          style={{
                            background: cardStyle === "glass" ? "rgba(255, 255, 255, 0.03)" : cardStyle === "classic" ? "transparent" : "rgba(255, 255, 255, 0.015)",
                            borderColor: cardStyle === "classic" ? "rgba(255, 255, 255, 0.1)" : "rgba(255,255,255,0.05)",
                            backdropFilter: cardStyle === "glass" ? "blur(8px)" : "none",
                          }}
                          className={`border p-2 flex flex-col gap-1.5 transition-all ${getRadiusPreviewClass()}`}
                        >
                          <div className="h-16 w-full rounded-lg bg-white/5 relative overflow-hidden flex items-center justify-center text-[8px] text-zinc-700 font-bold">
                            Imagen
                          </div>
                          <div>
                            <h5 className="text-[9px] font-bold text-zinc-300 line-clamp-1">{prod.name}</h5>
                            <span className="text-[9px] font-black mt-0.5 block" style={{ color: primaryColor }}>
                              ${prod.price}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {[
                        { id: 1, name: "Producto Destacado A", price: 4200 },
                        { id: 2, name: "Producto Destacado B", price: 3800 },
                      ].map((prod) => (
                        <div
                          key={prod.id}
                          style={{
                            background: cardStyle === "glass" ? "rgba(255, 255, 255, 0.03)" : cardStyle === "classic" ? "transparent" : "rgba(255, 255, 255, 0.015)",
                            borderColor: cardStyle === "classic" ? "rgba(255, 255, 255, 0.1)" : "rgba(255,255,255,0.05)",
                            backdropFilter: cardStyle === "glass" ? "blur(8px)" : "none",
                          }}
                          className={`border p-2 flex gap-3 items-center transition-all ${getRadiusPreviewClass()}`}
                        >
                          <div className="h-10 w-10 rounded-lg bg-white/5 shrink-0 flex items-center justify-center text-[7px] text-zinc-700 font-bold">
                            Img
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-[9px] font-bold text-zinc-300 truncate">{prod.name}</h5>
                            <span className="text-[9px] font-black" style={{ color: primaryColor }}>
                              ${prod.price}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Social Buttons Simulator */}
                  {(instagramUrl || tiktokUrl || whatsappUrl) && (
                    <div className="flex justify-center gap-2.5 mt-auto pt-4 border-t border-white/5">
                      {instagramUrl && <span className="text-[8px] text-zinc-500 font-bold font-mono">@IG</span>}
                      {tiktokUrl && <span className="text-[8px] text-zinc-500 font-bold font-mono">@TikTok</span>}
                      {whatsappUrl && <span className="text-[8px] text-zinc-500 font-bold font-mono">WhatsApp</span>}
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
