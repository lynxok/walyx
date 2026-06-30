"use server";

import { db as prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SizeChartWithRows = {
  id: string;
  brand: string;
  clothingType: string;
  columns: string[];
  rows: { id: string; values: string[]; order: number }[];
};

// ─── Get all size charts for a tenant ─────────────────────────────────────────

export async function getSizeCharts(tenantId: string): Promise<SizeChartWithRows[]> {
  const charts = await prisma.sizeChart.findMany({
    where: { tenantId },
    include: { rows: { orderBy: { order: "asc" } } },
    orderBy: [{ brand: "asc" }, { clothingType: "asc" }],
  });

  return charts.map((c) => ({
    id: c.id,
    brand: c.brand,
    clothingType: c.clothingType,
    columns: JSON.parse(c.columns) as string[],
    rows: (c.rows as Array<{ id: string; values: string; order: number }>).map((r) => ({
      id: r.id,
      values: JSON.parse(r.values) as string[],
      order: r.order,
    })),
  }));
}

// ─── Create a new size chart ──────────────────────────────────────────────────

export async function createSizeChart(
  tenantId: string,
  brand: string,
  clothingType: string,
  columns: string[]
): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (!brand.trim() || !clothingType.trim() || columns.length < 1) {
    return { ok: false, error: "Marca, tipo y columnas son obligatorios." };
  }

  try {
    const chart = await prisma.sizeChart.create({
      data: {
        tenantId,
        brand: brand.trim(),
        clothingType: clothingType.trim(),
        columns: JSON.stringify(columns.map((c) => c.trim()).filter(Boolean)),
      },
    });
    revalidatePath(`/admin`);
    return { ok: true, id: chart.id };
  } catch {
    return { ok: false, error: "Ya existe una tabla para esa marca y tipo de indumentaria." };
  }
}

// ─── Update chart metadata (brand / clothingType / columns) ──────────────────

export async function updateSizeChart(
  chartId: string,
  brand: string,
  clothingType: string,
  columns: string[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.sizeChart.update({
      where: { id: chartId },
      data: {
        brand: brand.trim(),
        clothingType: clothingType.trim(),
        columns: JSON.stringify(columns.map((c) => c.trim()).filter(Boolean)),
      },
    });
    revalidatePath(`/admin`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Error al actualizar la tabla." };
  }
}

// ─── Delete a size chart (cascades rows) ─────────────────────────────────────

export async function deleteSizeChart(
  chartId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.sizeChart.delete({ where: { id: chartId } });
    revalidatePath(`/admin`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Error al eliminar la tabla." };
  }
}

// ─── Add a row to a chart ────────────────────────────────────────────────────

export async function addSizeChartRow(
  chartId: string,
  values: string[]
): Promise<{ ok: boolean; error?: string; rowId?: string }> {
  try {
    const lastRow = await prisma.sizeChartRow.findFirst({
      where: { chartId },
      orderBy: { order: "desc" },
    });
    const nextOrder = lastRow ? lastRow.order + 1 : 0;

    const row = await prisma.sizeChartRow.create({
      data: {
        chartId,
        values: JSON.stringify(values),
        order: nextOrder,
      },
    });
    return { ok: true, rowId: row.id };
  } catch {
    return { ok: false, error: "Error al agregar la fila." };
  }
}

// ─── Update a row ────────────────────────────────────────────────────────────

export async function updateSizeChartRow(
  rowId: string,
  values: string[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.sizeChartRow.update({
      where: { id: rowId },
      data: { values: JSON.stringify(values) },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Error al actualizar la fila." };
  }
}

// ─── Delete a row ────────────────────────────────────────────────────────────

export async function deleteSizeChartRow(
  rowId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.sizeChartRow.delete({ where: { id: rowId } });
    return { ok: true };
  } catch {
    return { ok: false, error: "Error al eliminar la fila." };
  }
}
