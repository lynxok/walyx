"use server";

import { db } from "@/lib/db";
import { getHolidayForDate } from "@/lib/holidays";

export type WeeklyMenuDayInput = {
  dayName: string;
  productId: string;
  limit?: number;
  isClosed?: boolean;
  holidayName?: string | null;
};

const dayOffsets: Record<string, number> = {
  Lunes: 0,
  Martes: 1,
  Miércoles: 2,
  Jueves: 3,
  Viernes: 4,
  Sábado: 5,
  Domingo: 6
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

    const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const results = [];

    for (const dayName of dayNames) {
      // Calculate specific calendar date of this weekday
      const date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + dayOffsets[dayName]);
      const calculatedHoliday = getHolidayForDate(date);

      const dbDay = menu?.days.find((d) => d.dayName === dayName);

      if (dbDay) {
        results.push({
          id: dbDay.id,
          dayName,
          productId: dbDay.productId || "",
          limit: dbDay.limit || 30,
          isClosed: dbDay.isClosed,
          holidayName: dbDay.holidayName || calculatedHoliday,
          product: dbDay.product,
        });
      } else {
        // Closed by default if it is a holiday
        results.push({
          id: "",
          dayName,
          productId: "",
          limit: 30,
          isClosed: calculatedHoliday !== null,
          holidayName: calculatedHoliday,
          product: null,
        });
      }
    }

    return { success: true, data: results };
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
            isClosed: item.isClosed ?? false,
            holidayName: item.holidayName || null,
          },
        });
      } else {
        await db.weeklyMenuDay.create({
          data: {
            menuId: menu.id,
            dayName: item.dayName,
            productId: item.productId || null,
            limit: item.limit ?? 30,
            isClosed: item.isClosed ?? false,
            holidayName: item.holidayName || null,
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
