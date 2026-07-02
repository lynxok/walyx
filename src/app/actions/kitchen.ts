"use server";

import { db } from "@/lib/db";

export type KitchenConsolidatedItem = {
  productId: string;
  productName: string;
  imageUrl: string | null;
  requested: number;
  assigned: number;
  pending: number;
};

/**
 * Gets the consolidated list of items to prepare in the kitchen for a given delivery date and tenant.
 * Filters by orders in status "PENDING" or "PREPARING".
 */
export async function getKitchenConsolidated(
  tenantId: string,
  deliveryDate: string
): Promise<{ success: boolean; data?: KitchenConsolidatedItem[]; error?: string }> {
  try {
    if (!tenantId || !deliveryDate) {
      throw new Error("tenantId y deliveryDate son requeridos.");
    }

    // Retrieve all order items for the given tenant, deliveryDate and pending/preparing status
    const orderItems = await db.orderItem.findMany({
      where: {
        order: {
          tenantId,
          deliveryDate,
          status: { in: ["PENDING", "PREPARING"] },
        },
      },
      include: {
        product: true,
      },
    });

    // Aggregate by product in memory
    const aggregation: Record<string, KitchenConsolidatedItem> = {};

    for (const item of orderItems) {
      const productId = item.productId;
      if (!aggregation[productId]) {
        aggregation[productId] = {
          productId,
          productName: item.product.name,
          imageUrl: item.product.imageUrl || null,
          requested: 0,
          assigned: 0,
          pending: 0,
        };
      }

      aggregation[productId].requested += item.quantity;
      aggregation[productId].assigned += item.assignedQuantity;
      // Calculate pending per item to avoid issues if assignedQuantity exceeds quantity on some custom flows
      aggregation[productId].pending += Math.max(0, item.quantity - item.assignedQuantity);
    }

    return {
      success: true,
      data: Object.values(aggregation),
    };
  } catch (error: any) {
    console.error("Error in getKitchenConsolidated:", error);
    return {
      success: false,
      error: error.message || "Error al obtener el consolidado de cocina.",
    };
  }
}

/**
 * Assigns produced stock to orders containing the specified product on a given delivery date.
 * Uses a FIFO (First In, First Out) ordering based on order creation time.
 * Only targets orders in "PENDING" or "PREPARING" status.
 */
export async function assignProductionStock(
  tenantId: string,
  productId: string,
  quantityProduced: number,
  deliveryDate: string
): Promise<{ success: boolean; data?: { assignedTotal: number; remainingStock: number; updatedItemsCount: number }; error?: string }> {
  try {
    if (!tenantId || !productId || !deliveryDate) {
      throw new Error("tenantId, productId y deliveryDate son requeridos.");
    }

    if (quantityProduced <= 0) {
      throw new Error("La cantidad producida debe ser mayor a cero.");
    }

    const result = await db.$transaction(async (tx) => {
      // Find all order items for the given product, tenant, date and pending/preparing status
      const items = await tx.orderItem.findMany({
        where: {
          productId,
          order: {
            tenantId,
            deliveryDate,
            status: { in: ["PENDING", "PREPARING"] },
          },
        },
        include: {
          order: true,
        },
        orderBy: {
          createdAt: "asc", // FIFO based on creation date of OrderItem (or Order)
        },
      });

      // Filter items that still have pending quantity to be assigned
      const unassignedItems = items.filter(
        (item) => item.assignedQuantity < item.quantity
      );

      let remainingStock = quantityProduced;
      let updatedCount = 0;
      const ordersToVerify = new Set<string>();

      for (const item of unassignedItems) {
        if (remainingStock <= 0) break;

        const needed = item.quantity - item.assignedQuantity;
        const toAssign = Math.min(needed, remainingStock);

        const newAssignedQuantity = item.assignedQuantity + toAssign;
        remainingStock -= toAssign;

        // Update the assignedQuantity on the OrderItem
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            assignedQuantity: newAssignedQuantity,
          },
        });

        updatedCount++;
        ordersToVerify.add(item.orderId);
      }

      // Automatically transition order status to "PREPARING" if they are currently "PENDING"
      for (const orderId of ordersToVerify) {
        const order = await tx.order.findUnique({
          where: { id: orderId },
        });

        if (order && order.status === "PENDING") {
          await tx.order.update({
            where: { id: orderId },
            data: {
              status: "PREPARING",
            },
          });
        }
      }

      return {
        assignedTotal: quantityProduced - remainingStock,
        remainingStock,
        updatedItemsCount: updatedCount,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("Error in assignProductionStock:", error);
    return {
      success: false,
      error: error.message || "Error al asignar stock de producción.",
    };
  }
}
