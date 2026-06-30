"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createGroupGift(
  tenantId: string,
  productId: string,
  creatorName: string,
  creatorPhone: string,
  message?: string
) {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, error: "El producto no existe." };
    }

    const groupGift = await db.groupGift.create({
      data: {
        tenantId,
        productId,
        targetAmount: product.price,
        raisedAmount: 0,
        status: "PENDING",
        creatorName,
        creatorPhone,
        message: message || null,
      },
    });

    return { success: true, giftId: groupGift.id };
  } catch (error: any) {
    console.error("Error creating group gift:", error);
    return { success: false, error: error.message || "Error al crear la colecta." };
  }
}

export async function addGiftContribution(
  giftId: string,
  contributorName: string,
  amount: number
) {
  try {
    const groupGift = await db.groupGift.findUnique({
      where: { id: giftId },
    });

    if (!groupGift) {
      return { success: false, error: "La colecta no existe." };
    }

    const contribution = await db.giftContribution.create({
      data: {
        giftId,
        contributorName,
        amount,
        paymentStatus: "SUCCESS",
      },
    });

    const newRaisedAmount = groupGift.raisedAmount + amount;
    const isCompleted = newRaisedAmount >= groupGift.targetAmount;

    await db.groupGift.update({
      where: { id: giftId },
      data: {
        raisedAmount: newRaisedAmount,
        status: isCompleted ? "COMPLETED" : "PENDING",
      },
    });

    revalidatePath(`/shop/[tenantSlug]/vaca/${giftId}`, "page");

    return { success: true, contribution };
  } catch (error: any) {
    console.error("Error adding contribution:", error);
    return { success: false, error: error.message || "Error al agregar el aporte." };
  }
}

export async function getGroupGiftDetails(giftId: string) {
  try {
    const groupGift = await db.groupGift.findUnique({
      where: { id: giftId },
      include: {
        product: true,
        contributions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return { success: true, data: groupGift };
  } catch (error: any) {
    console.error("Error getting group gift details:", error);
    return { success: false, error: error.message || "Error al recuperar los detalles de la colecta." };
  }
}
