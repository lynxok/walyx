"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type ProductInput = {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  imageUrl?: string;
  isActive?: boolean;
  tenantId: string;
  categoryId: string;

  // Ropa
  size?: string;
  color?: string;
  material?: string;

  // Viandas
  calories?: number;
  ingredients?: string;
  isVegan?: boolean;
  isGlutenFree?: boolean;

  // Pastelería
  sweetnessLevel?: string;
  portions?: number;
};

export async function getProductsByTenant(tenantId: string, categoryId?: string) {
  try {
    const products = await db.product.findMany({
      where: {
        tenantId,
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: products };
  } catch (error: any) {
    console.error("Error fetching products: ", error);
    return { success: false, error: "Error al listar los productos" };
  }
}

export async function createProduct(input: ProductInput) {
  try {
    // Check tenant limits
    const tenant = await db.tenant.findUnique({
      where: { id: input.tenantId },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!tenant) {
      return { success: false, error: "El inquilino no existe." };
    }

    if (tenant.status === "SUSPENDED") {
      return { success: false, error: "Tu cuenta está suspendida. Contacta a soporte o actualiza tu plan." };
    }

    if (tenant._count.products >= tenant.maxProductsAllowed) {
      return {
        success: false,
        error: `Has alcanzado el límite máximo de productos para tu plan actual (${tenant.maxProductsAllowed} productos). Por favor, actualiza tu plan en el panel.`
      };
    }

    let finalPrice = input.price;
    if (input.categoryId) {
      const category = await db.category.findUnique({
        where: { id: input.categoryId },
      });
      if (category && category.type === "VIANDA" && category.price !== null && category.price !== undefined) {
        finalPrice = category.price;
      }
    }

    const product = await db.product.create({
      data: {
        name: input.name,
        description: input.description,
        price: finalPrice,
        stock: input.stock ?? 0,
        imageUrl: input.imageUrl,
        isActive: input.isActive ?? true,
        tenantId: input.tenantId,
        categoryId: input.categoryId,

        // Specialized fields
        size: input.size,
        color: input.color,
        material: input.material,

        calories: input.calories,
        ingredients: input.ingredients,
        isVegan: input.isVegan ?? false,
        isGlutenFree: input.isGlutenFree ?? false,

        sweetnessLevel: input.sweetnessLevel,
        portions: input.portions,
      },
    });
    return { success: true, data: product };
  } catch (error: any) {
    console.error("Error creating product: ", error);
    return { success: false, error: "Error al crear el producto" };
  }
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  try {
    let finalPrice = input.price;
    const catId = input.categoryId;
    if (catId) {
      const category = await db.category.findUnique({
        where: { id: catId },
      });
      if (category && category.type === "VIANDA" && category.price !== null && category.price !== undefined) {
        finalPrice = category.price;
      }
    }

    const product = await db.product.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        price: finalPrice,
        stock: input.stock,
        imageUrl: input.imageUrl,
        isActive: input.isActive,
        categoryId: input.categoryId,

        // Specialized fields
        size: input.size,
        color: input.color,
        material: input.material,

        calories: input.calories,
        ingredients: input.ingredients,
        isVegan: input.isVegan,
        isGlutenFree: input.isGlutenFree,

        sweetnessLevel: input.sweetnessLevel,
        portions: input.portions,
      },
    });
    return { success: true, data: product };
  } catch (error: any) {
    console.error("Error updating product: ", error);
    return { success: false, error: "Error al actualizar el producto" };
  }
}

export async function deleteProduct(id: string) {
  try {
    const product = await db.product.delete({
      where: { id },
    });
    return { success: true, data: product };
  } catch (error: any) {
    console.error("Error deleting product: ", error);
    return { success: false, error: "Error al eliminar el producto" };
  }
}
