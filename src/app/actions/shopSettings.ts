"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface ThemeSettings {
  primaryColor: string;
  backgroundColor: string;
  layoutMode: "grid" | "list";
  textColor: string;
  fontFamily: string;
  cardStyle: "glass" | "classic" | "minimal";
  // Expanded Settings
  announcementText?: string;
  announcementActive?: boolean;
  announcementBg?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  whatsappUrl?: string;
  isStoreClosed?: boolean;
  storeClosedMessage?: string;
  borderRadius?: "none" | "subtle" | "rounded" | "pill";
}

export async function updateShopSettings(
  tenantId: string,
  data: {
    logoUrl?: string | null;
    bannerUrl?: string | null;
    description?: string | null;
    themeSettings?: ThemeSettings;
  }
) {
  try {
    const updateData: {
      logoUrl?: string | null;
      bannerUrl?: string | null;
      description?: string | null;
      themeSettings?: string;
    } = {};

    if (data.logoUrl !== undefined) {
      updateData.logoUrl = data.logoUrl;
    }
    if (data.bannerUrl !== undefined) {
      updateData.bannerUrl = data.bannerUrl;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.themeSettings !== undefined) {
      updateData.themeSettings = JSON.stringify(data.themeSettings);
    }

    const updatedTenant = await db.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    revalidatePath(`/admin/${updatedTenant.slug}`);
    revalidatePath(`/shop/${updatedTenant.slug}`);

    return { success: true, tenant: updatedTenant };
  } catch (error: any) {
    console.error("Error updating shop settings:", error);
    return { success: false, error: error?.message || "Failed to update shop settings" };
  }
}
