"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import * as crypto from "crypto";

const TENANT_COOKIE = "tenant_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "default-super-secret-key-lynx-venta-viandas-sso-cross-tenant-2026";

// ─── Helpers de contraseña ────────────────────────────────────────────────────
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return hash === originalHash;
}

// ─── Helpers de sesión firmada ────────────────────────────────────────────────
function signSession(data: { id: string; slug: string }): string {
  const payload = Buffer.from(
    JSON.stringify({ ...data, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  ).toString("base64url");
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(payload);
  const signature = hmac.digest("base64url");
  return `${payload}.${signature}`;
}

function verifySession(token: string): { id: string; slug: string } | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;

    const hmac = crypto.createHmac("sha256", SESSION_SECRET);
    hmac.update(payloadB64);
    const expectedSig = hmac.digest("base64url");
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8")
    );
    if (payload.exp < Date.now()) return null;

    return { id: payload.id, slug: payload.slug };
  } catch {
    return null;
  }
}

// ─── Actions públicas ─────────────────────────────────────────────────────────

/**
 * Inicia sesión como dueño de un negocio.
 * Recibe slug + contraseña y genera una cookie de sesión.
 */
export async function loginTenant(slug: string, password: string) {
  if (!slug || !password) {
    return { success: false, error: "El nombre del negocio y la contraseña son obligatorios." };
  }

  // Interceptar si intenta ingresar con un correo electrónico en lugar de un slug
  if (slug.includes("@")) {
    try {
      const email = slug.trim().toLowerCase();
      const user = await db.globalUser.findUnique({ where: { email } });
      
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return { success: false, error: "Credenciales de administrador inválidas." };
      }

      if (!user.isSuperAdmin) {
        return { success: false, error: "Este usuario no posee privilegios de Superadmin." };
      }

      // Iniciar sesión global (crear la cookie global_user_session)
      // Generamos el token usando el SESSION_SECRET
      const payload = Buffer.from(
        JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
      ).toString("base64url");
      const hmac = crypto.createHmac("sha256", SESSION_SECRET);
      hmac.update(payload);
      const signature = hmac.digest("base64url");
      const token = `${payload}.${signature}`;

      const cookieStore = await cookies();
      cookieStore.set("global_user_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return { success: true, isSuperAdmin: true };
    } catch (e: any) {
      return { success: false, error: "Error al autenticar Superadmin: " + e.message };
    }
  }

  try {
    const tenant = await db.tenant.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      select: { id: true, slug: true, name: true, passwordHash: true, status: true },
    });

    if (!tenant) {
      return { success: false, error: "No encontramos un negocio con ese nombre." };
    }

    if (!tenant.passwordHash) {
      return {
        success: false,
        error: "Este negocio no tiene contraseña configurada. Contactá a soporte.",
      };
    }

    if (!verifyPassword(password, tenant.passwordHash)) {
      return { success: false, error: "Contraseña incorrecta." };
    }

    if (tenant.status === "SUSPENDED") {
      return { success: false, error: "Este negocio está suspendido. Contactá a soporte." };
    }

    // Crear cookie de sesión de tenant
    const token = signSession({ id: tenant.id, slug: tenant.slug });
    const cookieStore = await cookies();
    cookieStore.set(TENANT_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: "/",
    });

    return { success: true, slug: tenant.slug, name: tenant.name, isSuperAdmin: false };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al iniciar sesión." };
  }
}

/**
 * Cierra sesión del dueño del negocio.
 */
export async function logoutTenant() {
  const cookieStore = await cookies();
  cookieStore.delete(TENANT_COOKIE);
  return { success: true };
}

/**
 * Retorna el tenant logueado actualmente (o null si no hay sesión).
 */
export async function getCurrentTenant() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TENANT_COOKIE)?.value;
    if (!token) return null;

    const payload = verifySession(token);
    if (!payload) return null;

    const tenant = await db.tenant.findUnique({
      where: { id: payload.id },
      select: { id: true, slug: true, name: true, status: true, planType: true },
    });

    return tenant;
  } catch {
    return null;
  }
}

/**
 * Establece la contraseña de un tenant (usado en el onboarding).
 */
export async function setTenantPassword(tenantId: string, password: string) {
  if (!password || password.length < 6) {
    return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }
  try {
    await db.tenant.update({
      where: { id: tenantId },
      data: { 
        passwordHash: hashPassword(password),
        plainPassword: password
      },
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al guardar la contraseña." };
  }
}
