"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ClothingBrandItem = { id: string; name: string };
export type ClothingTypeItem  = { id: string; name: string };

export type SizeChartWithRows = {
  id: string;
  brandId: string;
  brandName: string;
  clothingTypeId: string;
  clothingTypeName: string;
  columns: string[];
  rows: { id: string; values: string[]; order: number }[];
};

// ─── Clothing Brands ──────────────────────────────────────────────────────

export async function getClothingBrands(tenantId: string): Promise<ClothingBrandItem[]> {
  return db.clothingBrand.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function createClothingBrand(
  tenantId: string,
  name: string
): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (!name.trim()) return { ok: false, error: "El nombre es obligatorio." };
  try {
    const b = await db.clothingBrand.create({ data: { tenantId, name: name.trim() } });
    return { ok: true, id: b.id };
  } catch {
    return { ok: false, error: "Ya existe una marca con ese nombre." };
  }
}

export async function deleteClothingBrand(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.clothingBrand.delete({ where: { id } });
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la marca." };
  }
}

// ─── Clothing Types ───────────────────────────────────────────────────────

export async function getClothingTypes(tenantId: string): Promise<ClothingTypeItem[]> {
  return db.clothingType.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function createClothingType(
  tenantId: string,
  name: string
): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (!name.trim()) return { ok: false, error: "El nombre es obligatorio." };
  try {
    const t = await db.clothingType.create({ data: { tenantId, name: name.trim() } });
    return { ok: true, id: t.id };
  } catch {
    return { ok: false, error: "Ya existe un tipo con ese nombre." };
  }
}

export async function deleteClothingType(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.clothingType.delete({ where: { id } });
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar el tipo." };
  }
}

// ─── Size Charts ──────────────────────────────────────────────────────────

export async function getSizeCharts(tenantId: string): Promise<SizeChartWithRows[]> {
  const charts = await db.sizeChart.findMany({
    where: { tenantId },
    include: {
      brand: true,
      clothingType: true,
      rows: { orderBy: { order: "asc" } },
    },
    orderBy: [{ brand: { name: "asc" } }, { clothingType: { name: "asc" } }],
  });

  return charts.map((c) => ({
    id: c.id,
    brandId: c.brandId,
    brandName: c.brand.name,
    clothingTypeId: c.clothingTypeId,
    clothingTypeName: c.clothingType.name,
    columns: JSON.parse(c.columns) as string[],
    rows: (c.rows as Array<{ id: string; values: string; order: number }>).map((r) => ({
      id: r.id,
      values: JSON.parse(r.values) as string[],
      order: r.order,
    })),
  }));
}

export async function createSizeChart(
  tenantId: string,
  brandId: string,
  clothingTypeId: string,
  columns: string[]
): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (!brandId || !clothingTypeId || columns.length < 1)
    return { ok: false, error: "Marca, tipo y al menos una columna son obligatorios." };
  try {
    const chart = await db.sizeChart.create({
      data: {
        tenantId,
        brandId,
        clothingTypeId,
        columns: JSON.stringify(columns.filter(Boolean)),
      },
    });
    revalidatePath(`/admin`);
    return { ok: true, id: chart.id };
  } catch {
    return { ok: false, error: "Ya existe una tabla para esa marca y tipo de indumentaria." };
  }
}

export async function deleteSizeChart(
  chartId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.sizeChart.delete({ where: { id: chartId } });
    revalidatePath(`/admin`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Error al eliminar la tabla." };
  }
}

export async function addSizeChartRow(
  chartId: string,
  values: string[]
): Promise<{ ok: boolean; error?: string; rowId?: string }> {
  try {
    const lastRow = await db.sizeChartRow.findFirst({
      where: { chartId },
      orderBy: { order: "desc" },
    });
    const row = await db.sizeChartRow.create({
      data: { chartId, values: JSON.stringify(values), order: lastRow ? lastRow.order + 1 : 0 },
    });
    return { ok: true, rowId: row.id };
  } catch {
    return { ok: false, error: "Error al agregar la fila." };
  }
}

export async function updateSizeChartRow(
  rowId: string,
  values: string[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.sizeChartRow.update({ where: { id: rowId }, data: { values: JSON.stringify(values) } });
    return { ok: true };
  } catch {
    return { ok: false, error: "Error al actualizar la fila." };
  }
}

export async function deleteSizeChartRow(
  rowId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.sizeChartRow.delete({ where: { id: rowId } });
    return { ok: true };
  } catch {
    return { ok: false, error: "Error al eliminar la fila." };
  }
}
