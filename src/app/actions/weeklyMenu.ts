"use server";

import { db } from "@/lib/db";

export type WeeklyMenuDayInput = {
  dayName: string;
  productId: string;
  limit?: number;
};

// Helper to normalize the start date to a standard string or Date
function getStartDate(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function getWeeklyMenuByStartDate(tenantId: string, startDateStr: string) {
  try {
    const startDate = getStartDate(startDateStr);

    let menu = await db.weeklyMenu.findFirst({
      where: {
        tenantId,
        startDate,
      },
      include: {
        days: {
          include: {
            product: true,
          },
        },
      },
    });

    // If no menu exists for this week yet, return empty list or default placeholders
    if (!menu) {
      return { success: true, data: [] };
    }

    return { success: true, data: menu.days };
  } catch (error: any) {
    console.error("Error getting weekly menu: ", error);
    return { success: false, error: "Error al cargar el menú semanal" };
  }
}

export async function saveWeeklyMenu(
  tenantId: string,
  startDateStr: string,
  daysData: WeeklyMenuDayInput[]
) {
  try {
    const startDate = getStartDate(startDateStr);

    // 1. Find or create the WeeklyMenu record
    let menu = await db.weeklyMenu.findUnique({
      where: {
        tenantId_startDate: {
          tenantId,
          startDate,
        },
      },
    });

    if (!menu) {
      menu = await db.weeklyMenu.create({
        data: {
          tenantId,
          startDate,
        },
      });
    }

    // 2. Upsert each day's selection
    for (const item of daysData) {
      // Find existing day selection
      const existingDay = await db.weeklyMenuDay.findUnique({
        where: {
          menuId_dayName: {
            menuId: menu.id,
            dayName: item.dayName,
          },
        },
      });

      if (existingDay) {
        await db.weeklyMenuDay.update({
          where: { id: existingDay.id },
          data: {
            productId: item.productId || null,
            limit: item.limit ?? 30,
          },
        });
      } else {
        await db.weeklyMenuDay.create({
          data: {
            menuId: menu.id,
            dayName: item.dayName,
            productId: item.productId || null,
            limit: item.limit ?? 30,
          },
        });
      }
    }

    return { success: true, message: "Menú semanal guardado correctamente" };
  } catch (error: any) {
    console.error("Error saving weekly menu: ", error);
    return { success: false, error: "Error al guardar el menú semanal" };
  }
}
