"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type CreateCategoryInput = {
  name: string;
  slug: string;
  description?: string;
  type: string; // ROPA, VIANDA, PASTELERIA
  price?: number;
  tenantId: string;
};

export async function getCategoriesByTenant(tenantId: string) {
  try {
    const categories = await db.category.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
    return { success: true, data: categories };
  } catch (error: any) {
    console.error("Error fetching categories: ", error);
    return { success: false, error: "Error al listar las categorías" };
  }
}

export async function createCategory(input: CreateCategoryInput) {
  try {
    // Check slug uniqueness within tenant
    const existing = await db.category.findFirst({
      where: {
        slug: input.slug.toLowerCase().trim(),
        tenantId: input.tenantId,
      },
    });

    if (existing) {
      throw new Error("El slug ya está registrado para este inquilino.");
    }

    const category = await db.category.create({
      data: {
        name: input.name,
        slug: input.slug.toLowerCase().trim(),
        description: input.description,
        type: input.type,
        price: input.price !== undefined ? input.price : null,
        tenantId: input.tenantId,
      },
    });

    return { success: true, data: category };
  } catch (error: any) {
    console.error("Error creating category: ", error);
    return { success: false, error: error.message || "Error al crear la categoría" };
  }
}

export async function updateCategory(
  id: string,
  input: { name: string; slug: string; description?: string; type: string; price?: number }
) {
  try {
    const category = await db.category.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug.toLowerCase().trim(),
        description: input.description,
        type: input.type,
        price: input.price !== undefined ? input.price : null,
      },
    });

    // Cascading price updates to all products if it is a VIANDA category
    if (input.type === "VIANDA" && input.price !== undefined && input.price !== null) {
      await db.product.updateMany({
        where: { categoryId: id },
        data: { price: input.price },
      });
    }

    return { success: true, data: category };
  } catch (error: any) {
    console.error("Error updating category: ", error);
    return { success: false, error: "Error al actualizar la categoría" };
  }
}

export async function deleteCategory(id: string) {
  try {
    const category = await db.category.delete({
      where: { id },
    });
    return { success: true, data: category };
  } catch (error: any) {
    console.error("Error deleting category: ", error);
    return { success: false, error: "Error al eliminar la categoría" };
  }
}
