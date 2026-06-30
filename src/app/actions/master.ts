"use server";

import { db } from "@/lib/db";
import { getCurrentGlobalUser } from "./auth";
import { revalidatePath } from "next/cache";

// Ensure the user is a superadmin or mock admin
async function ensureSuperAdmin() {
  const user = await getCurrentGlobalUser();
  // We check if the user is authenticated and isSuperAdmin is true.
  // We can also check if process.env.NODE_ENV === "development" to allow access if there are no superadmins yet,
  // or simple fallback credentials. Let's make it secure but accessible.
  if (!user?.isSuperAdmin) {
    throw new Error("No autorizado. Debes ser Superadmin.");
  }
}

export async function getAllTenants() {
  await ensureSuperAdmin();
  try {
    const tenants = await db.tenant.findMany({
      include: {
        _count: {
          select: { products: true, orders: true }
        },
        categories: {
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: tenants };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al obtener tiendas." };
  }
}

export async function getSystemStats() {
  await ensureSuperAdmin();
  try {
    const tenants = await db.tenant.findMany({
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });

    const activeShops = tenants.filter(t => t.status === "ACTIVE").length;
    const totalOrders = tenants.reduce((acc, t) => acc + t._count.orders, 0);

    // Calculate MRR estimate based on plan types:
    // BASIC: $19/mo, PRO: $49/mo, PREMIUM: $99/mo
    let mrrEstimate = 0;
    tenants.forEach((t) => {
      if (t.status === "ACTIVE") {
        if (t.planType === "BASIC") mrrEstimate += 19;
        else if (t.planType === "PRO") mrrEstimate += 49;
        else if (t.planType === "PREMIUM") mrrEstimate += 99;
      }
    });

    // Count by rubro/type
    const rubrosCount = { ROPA: 0, VIANDA: 0, PASTELERIA: 0 };
    for (const tenant of tenants) {
      // Find type from the first category if exists, or default to VIANDA
      const firstCat = await db.category.findFirst({ where: { tenantId: tenant.id } });
      const type = (firstCat?.type as "ROPA" | "VIANDA" | "PASTELERIA") || "VIANDA";
      rubrosCount[type] = (rubrosCount[type] || 0) + 1;
    }

    return {
      success: true,
      data: {
        mrrEstimate,
        totalOrders,
        activeShops,
        rubrosCount
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al obtener estadísticas del sistema." };
  }
}

export async function updateTenantPlanAndStatus(
  tenantId: string,
  input: {
    planType: string;
    status: string;
    maxProductsAllowed?: number;
    maxOrdersAllowedPerMonth?: number;
  }
) {
  await ensureSuperAdmin();
  try {
    // Set typical limits if not specified
    let maxProducts = input.maxProductsAllowed;
    let maxOrders = input.maxOrdersAllowedPerMonth;

    if (maxProducts === undefined) {
      if (input.planType === "BASIC") maxProducts = 20;
      else if (input.planType === "PRO") maxProducts = 100;
      else if (input.planType === "PREMIUM") maxProducts = 1000;
    }

    if (maxOrders === undefined) {
      if (input.planType === "BASIC") maxOrders = 30;
      else if (input.planType === "PRO") maxOrders = 300;
      else if (input.planType === "PREMIUM") maxOrders = 5000;
    }

    const updated = await db.tenant.update({
      where: { id: tenantId },
      data: {
        planType: input.planType,
        status: input.status,
        maxProductsAllowed: maxProducts,
        maxOrdersAllowedPerMonth: maxOrders,
        trialEndsAt: input.status === "TRIAL" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
      }
    });

    revalidatePath("/admin/master");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar la suscripción." };
  }
}
