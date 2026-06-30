"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveCartSession(
  tenantId: string,
  globalUserId: string | null,
  itemsJson: string
) {
  try {
    // We can try to look for an existing ACTIVE session for this globalUserId/tenantId or create one.
    // If globalUserId is null, we can do it by saving a session or creating a new one. But let's check if there is an active session.
    let existingSession = null;

    if (globalUserId) {
      existingSession = await db.cartSession.findFirst({
        where: {
          tenantId,
          globalUserId,
          status: "ACTIVE",
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (existingSession) {
      const updated = await db.cartSession.update({
        where: { id: existingSession.id },
        data: {
          items: itemsJson,
          updatedAt: new Date(),
        },
      });
      return { success: true, cartSession: updated };
    } else {
      const created = await db.cartSession.create({
        data: {
          tenantId,
          globalUserId: globalUserId || null,
          items: itemsJson,
          status: "ACTIVE",
        },
      });
      return { success: true, cartSession: created };
    }
  } catch (error: any) {
    console.error("Error saving cart session:", error);
    return { success: false, error: error.message || "Error al guardar la sesión del carrito." };
  }
}

export async function getAbandonedCarts(tenantId: string) {
  try {
    // Un cart se considera inactivo/abandonado si pasaron más de 5 minutos desde su última actualización y sigue en ACTIVE o ABANDONED.
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const carts = await db.cartSession.findMany({
      where: {
        tenantId,
        status: { in: ["ACTIVE", "ABANDONED"] },
        updatedAt: { lte: fiveMinutesAgo },
      },
      include: {
        globalUser: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return { success: true, data: carts };
  } catch (error: any) {
    console.error("Error getting abandoned carts:", error);
    return { success: false, error: error.message || "Error al obtener carritos abandonados." };
  }
}

export async function markCartAsRecovered(cartId: string) {
  try {
    const updated = await db.cartSession.update({
      where: { id: cartId },
      data: {
        status: "RECOVERED",
      },
    });

    revalidatePath("/admin/[tenantSlug]", "layout");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error marking cart as recovered:", error);
    return { success: false, error: error.message || "Error al marcar el carrito como recuperado." };
  }
}
