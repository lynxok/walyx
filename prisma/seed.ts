import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.tenant.deleteMany({});

  console.log("Seeding tenants...");

  // 1. Tenant: Clothing Shop (Ropa)
  const clothingTenant = await prisma.tenant.create({
    data: {
      name: "Moda Urbana",
      slug: "moda-urbana",
      description: "Tienda premium de ropa de diseño independiente y accesorios.",
    },
  });

  // 2. Tenant: Food/Viandas Shop (Viandas)
  const viandasTenant = await prisma.tenant.create({
    data: {
      name: "NutriViandas Cocina",
      slug: "nutriviandas-cocina",
      description: "Comida saludable y viandas semanales listas para consumir.",
    },
  });

  // 3. Tenant: Bakery/Pastry Shop (Pastelería)
  const bakeryTenant = await prisma.tenant.create({
    data: {
      name: "Dulzura & Arte Pastelería",
      slug: "dulzura-arte",
      description: "Tortas, pasteles, postres artesanales y café de especialidad.",
    },
  });

  console.log("Seeding categories...");

  // Categories for Clothing
  const catJeans = await prisma.category.create({
    data: {
      name: "Jeans & Pantalones",
      slug: "jeans-pantalones",
      type: "ROPA",
      tenantId: clothingTenant.id,
    },
  });

  const catRemeras = await prisma.category.create({
    data: {
      name: "Remeras & Tops",
      slug: "remeras-tops",
      type: "ROPA",
      tenantId: clothingTenant.id,
    },
  });

  const catCamperas = await prisma.category.create({
    data: {
      name: "Camperas & Abrigos",
      slug: "camperas-abrigos",
      type: "ROPA",
      tenantId: clothingTenant.id,
    },
  });

  // Categories for Viandas
  const catSaludable = await prisma.category.create({
    data: {
      name: "Viandas Fit",
      slug: "viandas-fit",
      type: "VIANDA",
      tenantId: viandasTenant.id,
    },
  });

  const catVegetariano = await prisma.category.create({
    data: {
      name: "Viandas Veggie",
      slug: "viandas-veggie",
      type: "VIANDA",
      tenantId: viandasTenant.id,
    },
  });

  // Categories for Pastelería
  const catTortas = await prisma.category.create({
    data: {
      name: "Tortas Enteras",
      slug: "tortas-enteras",
      type: "PASTELERIA",
      tenantId: bakeryTenant.id,
    },
  });

  const catIndividuales = await prisma.category.create({
    data: {
      name: "Porciones & Individuales",
      slug: "porciones-individuales",
      type: "PASTELERIA",
      tenantId: bakeryTenant.id,
    },
  });

  console.log("Seeding products...");

  // Products for Clothing Tenant
  const pJeanSkinny = await prisma.product.create({
    data: {
      name: "Jean Skinny Classic Black",
      description: "Jean elastizado color negro profundo, corte skinny de tiro alto.",
      price: 45000.0,
      stock: 25,
      imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500",
      tenantId: clothingTenant.id,
      categoryId: catJeans.id,
      size: "M",
      color: "Negro",
      material: "Denim Elastizado",
    },
  });

  const pRemeraOversize = await prisma.product.create({
    data: {
      name: "Remera Oversize Vintage",
      description: "Remera 100% algodón peinado con estampado vintage en la espalda.",
      price: 22000.0,
      stock: 40,
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500",
      tenantId: clothingTenant.id,
      categoryId: catRemeras.id,
      size: "XL",
      color: "Blanco Off-White",
      material: "Algodón 100%",
    },
  });

  const pCamperaCuero = await prisma.product.create({
    data: {
      name: "Campera Biker de Cuero Ecológico",
      description: "Campera estilo biker con cierres metálicos plateados y forrería interna.",
      price: 85000.0,
      stock: 12,
      imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
      tenantId: clothingTenant.id,
      categoryId: catCamperas.id,
      size: "L",
      color: "Marrón Gastado",
      material: "Cuero Sintético / PU",
    },
  });

  // Products for Viandas Tenant
  const pViandaPollo = await prisma.product.create({
    data: {
      name: "Wok de Pollo con Vegetales y Arroz Integral",
      description: "Trozos de pechuga de pollo grillada con mix de vegetales al wok y base de arroz integral.",
      price: 6800.0,
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500",
      tenantId: viandasTenant.id,
      categoryId: catSaludable.id,
      calories: 450,
      ingredients: "Pollo, Zanahoria, Zucchini, Cebolla, Morrón, Arroz Integral, Salsa de Soja baja en sodio",
      isVegan: false,
      isGlutenFree: true,
    },
  });

  const pViandaLentejas = await prisma.product.create({
    data: {
      name: "Guiso Nutritivo de Lentejas Veggie",
      description: "Guiso de lentejas con calabaza, papas, zanahoria y especias aromáticas.",
      price: 6200.0,
      stock: 45,
      imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=500",
      tenantId: viandasTenant.id,
      categoryId: catVegetariano.id,
      calories: 380,
      ingredients: "Lentejas, Calabaza, Papa, Zanahoria, Cebolla, Ajo, Pimentón dulce, Laurel",
      isVegan: true,
      isGlutenFree: true,
    },
  });

  const pViandaSalmon = await prisma.product.create({
    data: {
      name: "Salmón Grillado con Puré de Calabaza",
      description: "Filete de salmón rosado sellado al grill acompañado de puré rústico de calabaza y semillas de sésamo.",
      price: 12500.0,
      stock: 20,
      imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500",
      tenantId: viandasTenant.id,
      categoryId: catSaludable.id,
      calories: 520,
      ingredients: "Salmón rosado, Calabaza, Aceite de oliva, Semillas de sésamo, Sal marina",
      isVegan: false,
      isGlutenFree: true,
    },
  });

  // Products for Pastelería Tenant
  const pTortaRogel = await prisma.product.create({
    data: {
      name: "Super Rogel Artesanal",
      description: "Capas de masa crocante ultra fina intercaladas con abundante dulce de leche repostero y cobertura de merengue italiano dorado.",
      price: 24000.0,
      stock: 8,
      imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500",
      tenantId: bakeryTenant.id,
      categoryId: catTortas.id,
      sweetnessLevel: "Alto",
      portions: 12,
    },
  });

  const pLemonPie = await prisma.product.create({
    data: {
      name: "Porción de Lemon Pie",
      description: "Masa sablée crocante, crema suave de limón natural y merengue italiano flameado.",
      price: 4500.0,
      stock: 30,
      imageUrl: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500",
      tenantId: bakeryTenant.id,
      categoryId: catIndividuales.id,
      sweetnessLevel: "Medio",
      portions: 1,
    },
  });

  const pBrownieNuez = await prisma.product.create({
    data: {
      name: "Brownie con Nueces Individual",
      description: "Húmedo de chocolate semi-amargo con trozos crujientes de nueces seleccionadas.",
      price: 3800.0,
      stock: 40,
      imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500",
      tenantId: bakeryTenant.id,
      categoryId: catIndividuales.id,
      sweetnessLevel: "Alto",
      portions: 1,
    },
  });

  console.log("Seeding customers...");

  // Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: "Juan Pérez",
      email: "juan.perez@example.com",
      phone: "+541199887766",
      address: "Av. Corrientes 1500, CABA",
      tenantId: clothingTenant.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: "María Rodriguez",
      email: "maria.rod@example.com",
      phone: "+541122334455",
      address: "Palermo Soho, CABA",
      tenantId: viandasTenant.id,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: "Sofía Martínez",
      email: "sofia.m@example.com",
      phone: "+541155667788",
      address: "Belgrano R, CABA",
      tenantId: bakeryTenant.id,
    },
  });

  console.log("Seeding orders...");

  // Order for Clothing Tenant
  const orderClothing = await prisma.order.create({
    data: {
      tenantId: clothingTenant.id,
      customerId: customer1.id,
      status: "DELIVERED",
      total: 67000.0,
      paymentMethod: "CARD",
      paymentStatus: "PAID",
      deliveryAddress: "Av. Corrientes 1500, CABA",
      deliveryNotes: "Dejar en portería.",
      items: {
        create: [
          {
            productId: pJeanSkinny.id,
            quantity: 1,
            price: 45000.0,
          },
          {
            productId: pRemeraOversize.id,
            quantity: 1,
            price: 22000.0,
          },
        ],
      },
    },
  });

  // Order for Viandas Tenant
  const todayStr = new Date().toISOString().split("T")[0];

  const orderViandas = await prisma.order.create({
    data: {
      tenantId: viandasTenant.id,
      customerId: customer2.id,
      status: "PREPARING",
      total: 19800.0,
      paymentMethod: "TRANSFER",
      paymentStatus: "PAID",
      deliveryAddress: "Palermo Soho, CABA",
      deliveryNotes: "Tocar timbre de planta baja.",
      deliveryDate: todayStr,
      items: {
        create: [
          {
            productId: pViandaPollo.id,
            quantity: 2,
            price: 6800.0,
          },
          {
            productId: pViandaLentejas.id,
            quantity: 1,
            price: 6200.0,
          },
        ],
      },
    },
  });

  // Order for Pastelería Tenant
  const orderBakery = await prisma.order.create({
    data: {
      tenantId: bakeryTenant.id,
      customerId: customer3.id,
      status: "PENDING",
      total: 12100.0,
      paymentMethod: "CASH",
      paymentStatus: "PENDING",
      deliveryAddress: "Belgrano R, CABA",
      deliveryNotes: "Llamar antes de llegar.",
      deliveryDate: todayStr,
      items: {
        create: [
          {
            productId: pLemonPie.id,
            quantity: 1,
            price: 4500.0,
          },
          {
            productId: pBrownieNuez.id,
            quantity: 2,
            price: 3800.0,
          },
        ],
      },
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
