"use server";

import { db } from "@/lib/db";

export type DashboardStats = {
  totalSales: number;
  averageTicket: number;
  totalOrdersCount: number;
  abcProducts: {
    productId: string;
    name: string;
    totalQuantity: number;
    totalRevenue: number;
    cumulativePercentage: number;
    class: "A" | "B" | "C";
  }[];
  dailyClose: {
    paymentMethod: string;
    count: number;
    totalRevenue: number;
  }[];
};

export async function getDashboardStats(tenantId: string): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    // 1. Fetch all orders for this tenant
    const orders = await db.order.findMany({
      where: {
        tenantId,
        status: { not: "CANCELLED" }, // Exclude cancelled orders from stats
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const totalOrdersCount = orders.length;
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const averageTicket = totalOrdersCount > 0 ? totalSales / totalOrdersCount : 0;

    // 2. ABC Product Classification
    // Group sales by product
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = productSalesMap.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          productSalesMap.set(item.productId, {
            name: item.product.name,
            quantity: item.quantity,
            revenue: item.price * item.quantity,
          });
        }
      });
    });

    // Convert map to array and sort by revenue descending
    const productSalesList = Array.from(productSalesMap.entries()).map(([productId, info]) => ({
      productId,
      name: info.name,
      totalQuantity: info.quantity,
      totalRevenue: info.revenue,
    }));

    productSalesList.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate cumulative percentages and classes (A: 70%, B: 20%, C: 10%)
    let currentCumulative = 0;
    const abcProducts = productSalesList.map((prod) => {
      currentCumulative += prod.totalRevenue;
      const cumulativePercentage = totalSales > 0 ? (currentCumulative / totalSales) * 100 : 0;
      
      let classification: "A" | "B" | "C" = "C";
      if (cumulativePercentage <= 70) {
        classification = "A";
      } else if (cumulativePercentage <= 90) {
        classification = "B";
      }

      return {
        ...prod,
        cumulativePercentage,
        class: classification,
      };
    });

    // 3. Daily Cash Close (Cierre de Caja Diario)
    // Filter orders created today (midnight UTC/local for simplicity in this demo)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await db.order.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: today,
        },
        status: { not: "CANCELLED" },
      },
    });

    // Group today's orders by payment method
    const paymentGroups: Record<string, { count: number; totalRevenue: number }> = {};
    todayOrders.forEach((o) => {
      const pm = o.paymentMethod;
      if (!paymentGroups[pm]) {
        paymentGroups[pm] = { count: 0, totalRevenue: 0 };
      }
      paymentGroups[pm].count += 1;
      paymentGroups[pm].totalRevenue += o.total;
    });

    const dailyClose = Object.entries(paymentGroups).map(([paymentMethod, info]) => ({
      paymentMethod,
      count: info.count,
      totalRevenue: info.totalRevenue,
    }));

    return {
      success: true,
      data: {
        totalSales,
        averageTicket,
        totalOrdersCount,
        abcProducts,
        dailyClose,
      },
    };
  } catch (error: any) {
    console.error("Error calculating dashboard stats: ", error);
    return { success: false, error: "Error al calcular las estadísticas del panel de control" };
  }
}
