"use server";

import { db } from "@/lib/db";

export type KitchenOrderItemDetail = {
  orderItemId: string;
  orderId: string;
  customerName: string;
  requestedQuantity: number;
  assignedQuantity: number;
  createdAt: Date;
  status: string;
};

export type KitchenConsolidatedItem = {
  productId: string;
  productName: string;
  imageUrl: string | null;
  requested: number;
  assigned: number;
  pending: number;
  orders: KitchenOrderItemDetail[];
};

/**
 * Gets the consolidated list of items to prepare in the kitchen for a given delivery date and tenant.
 * Filters by orders in status "PENDING" or "PREPARING".
 * Returns detailed orders for nested list items.
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
        order: {
          include: {
            customer: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
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
          orders: [],
        };
      }

      aggregation[productId].requested += item.quantity;
      aggregation[productId].assigned += item.assignedQuantity;
      aggregation[productId].pending += Math.max(0, item.quantity - item.assignedQuantity);

      aggregation[productId].orders.push({
        orderItemId: item.id,
        orderId: item.orderId,
        customerName: item.order.customer?.name || "Cliente",
        requestedQuantity: item.quantity,
        assignedQuantity: item.assignedQuantity,
        createdAt: item.order.createdAt,
        status: item.order.status
      });
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
          createdAt: "asc",
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

/**
 * Updates the assigned quantity for a single OrderItem manually from the nested list.
 */
export async function updateOrderItemAssignment(
  orderItemId: string,
  assignedQuantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!orderItemId || assignedQuantity < 0) {
      throw new Error("Parámetros inválidos.");
    }

    await db.$transaction(async (tx) => {
      const item = await tx.orderItem.findUnique({
        where: { id: orderItemId },
        include: { order: true }
      });

      if (!item) throw new Error("Ítem de pedido no encontrado.");
      if (assignedQuantity > item.quantity) {
        throw new Error("La cantidad asignada no puede superar la cantidad solicitada.");
      }

      await tx.orderItem.update({
        where: { id: orderItemId },
        data: { assignedQuantity }
      });

      // If at least one item starts getting prepared, transition order to PREPARING
      if (item.order.status === "PENDING" && assignedQuantity > 0) {
        await tx.order.update({
          where: { id: item.orderId },
          data: { status: "PREPARING" }
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error in updateOrderItemAssignment:", error);
    return { success: false, error: error.message || "Error al actualizar asignación." };
  }
}

/**
 * Marks an entire order as DELIVERED (despachada/enviada) and closes it.
 */
export async function deliverOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!orderId) {
      throw new Error("El ID del pedido es requerido.");
    }

    await db.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED" }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error in deliverOrder:", error);
    return { success: false, error: error.message || "Error al despachar el pedido." };
  }
}

