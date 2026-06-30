import { db } from "@/lib/db";
import { cookies } from "next/headers";
import * as crypto from "crypto";

// Use a fallback JWT-like/encrypted cookie mechanism.
// Since we want standard Node.js crypto to avoid heavy dependencies,
// we will hash passwords using PBKDF2/scrypt, and sign session cookies using HMAC SHA-256.

const SESSION_COOKIE_NAME = "global_user_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "default-super-secret-key-lynx-venta-viandas-sso-cross-tenant-2026";

// Helpers for password hashing
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

// Helpers for Session signing (to make it secure on client side)
function signSession(data: { id: string; email: string }): string {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64url");
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(payload);
  const signature = hmac.digest("base64url");
  return `${payload}.${signature}`;
}

function verifySession(token: string): { id: string; email: string } | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;

    const hmac = crypto.createHmac("sha256", SESSION_SECRET);
    hmac.update(payloadB64);
    const expectedSignature = hmac.digest("base64url");

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (payload.exp < Date.now()) return null;

    return { id: payload.id, email: payload.email };
  } catch {
    return null;
  }
}

export async function registerGlobalUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;

  if (!email || !password || !name) {
    return { success: false, error: "El email, contraseña y nombre son obligatorios." };
  }

  try {
    const existing = await db.globalUser.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "El email ya se encuentra registrado." };
    }

    const passwordHash = hashPassword(password);
    const user = await db.globalUser.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
      },
    });

    const token = signSession({ id: user.id, email: user.email });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return { success: true, user: { id: user.id, email: user.email, name: user.name } };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al registrar el usuario." };
  }
}

export async function loginGlobalUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "El email y la contraseña son obligatorios." };
  }

  try {
    const user = await db.globalUser.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return { success: false, error: "Credenciales inválidas." };
    }

    const token = signSession({ id: user.id, email: user.email });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return { success: true, user: { id: user.id, email: user.email, name: user.name } };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al iniciar sesión." };
  }
}

export async function logoutGlobalUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return { success: true };
}

export async function getCurrentGlobalUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifySession(token);
    if (!payload) return null;

    const user = await db.globalUser.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}
