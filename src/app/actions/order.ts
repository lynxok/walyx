"use server";

import { db } from "@/lib/db";

export type OrderItemInput = {
  productId: string;
  quantity: number;
  variantTitle?: string;
  customization?: string;
};

export type CreateOrderInput = {
  tenantId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryNotes?: string;
  paymentMethod: "CASH" | "TRANSFER" | "CARD";
  deliveryAddress?: string;
  deliveryCost?: number;
  deliveryZoneName?: string;
  deliveryDate?: string;
  deliveryTimeSlot?: string;
  items: OrderItemInput[];
};

export async function createOrder(input: CreateOrderInput) {
  try {
    if (input.items.length === 0) {
      throw new Error("El pedido debe contener al menos un producto.");
    }

    // 1. Get Tenant details (needed for phone number or store branding in WhatsApp message)
    const tenant = await db.tenant.findUnique({
      where: { id: input.tenantId },
    });

    if (!tenant) {
      throw new Error("El inquilino no existe.");
    }

    // 2. Find or Create Customer for this tenant
    let customer = await db.customer.findFirst({
      where: {
        email: input.customerEmail.toLowerCase().trim(),
        tenantId: input.tenantId,
      },
    });

    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: input.customerName,
          email: input.customerEmail.toLowerCase().trim(),
          phone: input.customerPhone,
          address: input.customerAddress,
          tenantId: input.tenantId,
        },
      });
    } else {
      // Optionally update phone and address
      customer = await db.customer.update({
        where: { id: customer.id },
        data: {
          name: input.customerName,
          phone: input.customerPhone || customer.phone,
          address: input.customerAddress || customer.address,
        },
      });
    }

    // 3. Fetch products and calculate total while building order items
    const productIds = input.items.map((i) => i.productId);
    const dbProducts = await db.product.findMany({
      where: {
        id: { in: productIds },
        tenantId: input.tenantId,
      },
    });

    const productsMap = new Map(dbProducts.map((p) => [p.id, p]));

    let itemsTotal = 0;
    const orderItemsData = [];

    for (const item of input.items) {
      const product = productsMap.get(item.productId);
      if (!product) {
        throw new Error(`El producto con ID ${item.productId} no pertenece a esta tienda o no existe.`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para el producto: ${product.name}. Stock disponible: ${product.stock}`);
      }

      const itemTotal = product.price * item.quantity;
      itemsTotal += itemTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        variantTitle: item.variantTitle || null,
        customization: item.customization || null,
      });

      // Deduct stock
      await db.product.update({
        where: { id: product.id },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    const deliveryCost = input.deliveryCost || 0;
    const orderTotal = itemsTotal + deliveryCost;

    // 4. Create the Order
    const order = await db.order.create({
      data: {
        tenantId: input.tenantId,
        customerId: customer.id,
        status: "PENDING",
        total: orderTotal,
        paymentMethod: input.paymentMethod,
        paymentStatus: "PENDING",
        deliveryAddress: input.deliveryAddress || input.customerAddress,
        deliveryNotes: input.deliveryNotes,
        deliveryCost,
        deliveryZoneName: input.deliveryZoneName || null,
        deliveryDate: input.deliveryDate || null,
        deliveryTimeSlot: input.deliveryTimeSlot || null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // 5. Build WhatsApp text message for the user redirection
    const storePhone = "+5491122334455"; // Reemplazar con el teléfono configurado del inquilino
    
    let messageText = `*Nuevo Pedido - ${tenant.name}*\n\n`;
    messageText += `*Cliente:* ${customer.name}\n`;
    messageText += `*Email:* ${customer.email}\n`;
    if (customer.phone) messageText += `*Teléfono:* ${customer.phone}\n`;
    
    // Date and time slots
    if (order.deliveryDate) {
      messageText += `*Fecha de Entrega:* ${order.deliveryDate}\n`;
    }
    if (order.deliveryTimeSlot) {
      messageText += `*Franja Horaria:* ${order.deliveryTimeSlot}\n`;
    }

    messageText += `\n*Detalle del Pedido:*\n`;
    
    order.items.forEach((item) => {
      let itemLine = `- ${item.quantity}x ${item.product.name}`;
      if (item.variantTitle) {
        itemLine += ` (${item.variantTitle})`;
      }
      itemLine += ` ($${item.price.toFixed(2)} c/u)`;
      if (item.customization) {
        itemLine += `\n  _Aclaración: ${item.customization}_`;
      }
      messageText += itemLine + `\n`;
    });
    
    messageText += `\n*Subtotal:* $${itemsTotal.toFixed(2)}\n`;
    if (deliveryCost > 0) {
      const zoneName = order.deliveryZoneName ? ` (${order.deliveryZoneName})` : "";
      messageText += `*Envío${zoneName}:* $${deliveryCost.toFixed(2)}\n`;
    }
    messageText += `*Total final:* $${orderTotal.toFixed(2)}\n`;
    messageText += `*Método de Pago:* ${input.paymentMethod}\n`;
    
    if (order.deliveryAddress) {
      messageText += `*Dirección de Entrega:* ${order.deliveryAddress}\n`;
    }
    if (order.deliveryNotes) {
      messageText += `*Notas:* ${order.deliveryNotes}\n`;
    }
    
    messageText += `\n¡Gracias por tu compra!`;

    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${storePhone}?text=${encodedMessage}`;

    return {
      success: true,
      data: {
        orderId: order.id,
        total: orderTotal,
        whatsappUrl,
      },
    };
  } catch (error: any) {
    console.error("Error creating order: ", error);
    return { success: false, error: error.message || "Error al registrar el pedido" };
  }
}
