"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type CreateTenantInput = {
  name: string;
  slug: string;
  description?: string;
  type: "ROPA" | "VIANDA" | "PASTELERIA";
};

export async function createTenant(input: CreateTenantInput) {
  try {
    const existing = await db.tenant.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw new Error(`El slug "${input.slug}" ya está en uso.`);
    }

    // Create the tenant
    const tenant = await db.tenant.create({
      data: {
        name: input.name,
        slug: input.slug.toLowerCase().trim(),
        description: input.description,
      },
    });

    // Auto-create initial categories based on tenant type
    let defaultCategories: string[] = [];
    if (input.type === "ROPA") {
      defaultCategories = ["Remeras & Tops", "Pantalones & Jeans", "Accesorios"];
    } else if (input.type === "VIANDA") {
      defaultCategories = ["Viandas Fit", "Viandas Veggie", "Viandas Premium"];
    } else if (input.type === "PASTELERIA") {
      defaultCategories = ["Tortas Enteras", "Porciones & Dulzuras", "Panadería"];
    }

    for (const catName of defaultCategories) {
      const catSlug = catName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      await db.category.create({
        data: {
          name: catName,
          slug: catSlug,
          type: input.type,
          tenantId: tenant.id,
        },
      });
    }

    revalidatePath("/");
    return { success: true, data: tenant };
  } catch (error: any) {
    console.error("Error creating tenant: ", error);
    return { success: false, error: error.message || "Error al crear el inquilino" };
  }
}

export async function getTenantBySlug(slug: string) {
  try {
    const tenant = await db.tenant.findUnique({
      where: { slug },
      include: {
        categories: true,
      },
    });
    return { success: true, data: tenant };
  } catch (error: any) {
    console.error("Error getting tenant by slug: ", error);
    return { success: false, error: "Error al buscar el inquilino" };
  }
}

export async function updateTenant(id: string, data: { name: string; description?: string }) {
  try {
    const tenant = await db.tenant.update({
      where: { id },
      data,
    });
    revalidatePath(`/dashboard/${tenant.slug}`);
    return { success: true, data: tenant };
  } catch (error: any) {
    console.error("Error updating tenant: ", error);
    return { success: false, error: "Error al actualizar el inquilino" };
  }
}
