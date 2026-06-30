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
    const product = await db.product.create({
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
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
    const product = await db.product.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
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
