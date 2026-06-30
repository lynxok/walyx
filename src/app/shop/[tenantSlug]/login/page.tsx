"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock, Mail, Phone, User, Check, ShieldCheck } from "lucide-react";
import { getTenantBySlug } from "@/app/actions/tenant";
import { loginGlobalUser, registerGlobalUser, verifyOTP, resendOTP } from "@/app/actions/auth";
import { PremiumButton } from "@/components/ui/PremiumButton";

export default function ShopLoginPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;
  const redirect = searchParams.get("redirect") || `/shop/${tenantSlug}`;

  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // OTP Verification Screen states
  const [showOTP, setShowOTP] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resending, setResending] = useState(false);

  // Theme states
  const [primaryColor, setPrimaryColor] = useState("#f59e0b");
  const [backgroundColor, setBackgroundColor] = useState("#09090b");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Outfit");

  useEffect(() => {
    async function loadTenant() {
      const res = await getTenantBySlug(tenantSlug);
      if (res.success && res.data) {
        setTenant(res.data);
        if (res.data.themeSettings) {
          try {
            const theme = JSON.parse(res.data.themeSettings);
            if (theme.primaryColor) setPrimaryColor(theme.primaryColor);
            if (theme.backgroundColor) setBackgroundColor(theme.backgroundColor);
            if (theme.textColor) setTextColor(theme.textColor);
            if (theme.fontFamily) setFontFamily(theme.fontFamily);
          } catch (e) {
            console.error("Theme parse error:", e);
          }
        }
      }
      setLoading(false);
    }
    loadTenant();
  }, [tenantSlug]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setActionLoading(true);

    const formData = new FormData(e.currentTarget);
    let res;
    if (isRegister) {
      res = await registerGlobalUser(formData);
    } else {
      res = await loginGlobalUser(formData);
    }

    setActionLoading(false);
    if (res.success) {
      if (res.requiresOTP) {
        setOtpEmail(res.email || formData.get("email") as string);
        setShowOTP(true);
        setSuccess("Código de verificación enviado. Revisa tu casilla o consola.");
      } else {
        setSuccess("Sesión iniciada con éxito. Redirigiendo...");
        setTimeout(() => {
          router.push(redirect);
          router.refresh();
        }, 1500);
      }
    } else {
      setError(res.error || "Ocurrió un error inesperado.");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setActionLoading(true);

    const res = await verifyOTP(otpEmail, otpCode);
    setActionLoading(false);

    if (res.success) {
      setSuccess("¡Código verificado! Sesión iniciada con éxito. Redirigiendo...");
      setTimeout(() => {
        router.push(redirect);
        router.refresh();
      }, 1500);
    } else {
      setError(res.error || "Código incorrecto o vencido.");
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setSuccess("");
    setResending(true);
    const res = await resendOTP(otpEmail);
    setResending(false);

    if (res.success) {
      setSuccess("Se ha reenviado un nuevo código OTP.");
    } else {
      setError(res.error || "Error al reenviar el código.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

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
          "Inter, sans-serif",
        ["--primary-theme-color" as any]: primaryColor,
        ["--text-theme-color" as any]: textColor,
      }}
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300"
    >
      {/* Background Decorative Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `${primaryColor}10` }} />
      <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `${primaryColor}10` }} />

      <div className="w-full max-w-md bg-zinc-900/40 border border-zinc-900/80 backdrop-blur-md p-8 rounded-3xl z-10 flex flex-col gap-6 shadow-2xl relative">
        <Link href={`/shop/${tenantSlug}`} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors absolute top-6 left-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a la tienda
        </Link>

        <div className="text-center mt-6">
          {tenant?.logoUrl && !showOTP && (
            <img src={tenant.logoUrl} alt="Store Logo" className="w-16 h-16 rounded-2xl mx-auto mb-3 object-cover border border-zinc-800" />
          )}
          {showOTP ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-2xl font-black text-white">Ingresá el código</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Enviamos un código de seguridad de 6 dígitos a <span className="text-white font-bold">{otpEmail}</span>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black text-white">{isRegister ? "Crear una cuenta" : "Iniciar Sesión"}</h2>
              <p className="text-xs text-zinc-500 mt-1">Accede a tus datos en {tenant?.name || "la tienda"}</p>
            </>
          )}
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" /> {success}
          </div>
        )}

        {showOTP ? (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase">Código de 6 dígitos</label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                required
                className="bg-zinc-950/80 border border-zinc-900 focus:border-amber-500 text-center text-lg font-mono tracking-widest text-white py-3.5 rounded-xl w-full outline-none transition-all"
              />
            </div>

            <PremiumButton type="submit" variant="primary" size="lg" disabled={actionLoading || otpCode.length !== 6} glow className="w-full justify-center py-4 mt-2">
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verificar Código"}
            </PremiumButton>

            <div className="text-center mt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resending}
                className="text-xs text-amber-500 font-bold hover:underline disabled:opacity-50"
              >
                {resending ? "Reenviando..." : "¿No recibiste el código? Reenviar código"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOTP(false);
                  setError("");
                  setSuccess("");
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 hover:underline"
              >
                Volver al login/registro
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Juan Pérez"
                      className="bg-zinc-950/80 border border-zinc-900 focus:border-amber-500 text-xs text-white pl-10 pr-4 py-3.5 rounded-xl w-full outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Teléfono (Opcional)</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+54911223344"
                      className="bg-zinc-950/80 border border-zinc-900 focus:border-amber-500 text-xs text-white pl-10 pr-4 py-3.5 rounded-xl w-full outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="email@ejemplo.com"
                  className="bg-zinc-950/80 border border-zinc-900 focus:border-amber-500 text-xs text-white pl-10 pr-4 py-3.5 rounded-xl w-full outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="bg-zinc-950/80 border border-zinc-900 focus:border-amber-500 text-xs text-white pl-10 pr-4 py-3.5 rounded-xl w-full outline-none transition-all"
                />
              </div>
            </div>

            <PremiumButton type="submit" variant="primary" size="lg" disabled={actionLoading} glow className="w-full justify-center py-4 mt-2">
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isRegister ? "Registrarse" : "Ingresar"}
            </PremiumButton>
          </form>
        )}

        {!showOTP && (
          <div className="text-center text-xs text-zinc-500 border-t border-zinc-900/60 pt-4 mt-2">
            {isRegister ? (
              <p>
                ¿Ya tienes cuenta?{" "}
                <button onClick={() => { setIsRegister(false); setError(""); }} className="text-amber-500 font-bold hover:underline">
                  Inicia sesión aquí
                </button>
              </p>
            ) : (
              <p>
                ¿No tienes cuenta?{" "}
                <button onClick={() => { setIsRegister(true); setError(""); }} className="text-amber-500 font-bold hover:underline">
                  Regístrate aquí
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

