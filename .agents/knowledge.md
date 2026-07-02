# LYNX Core Knowledge & Architecture Base (SaaS Multi-Cliente)

Este archivo actúa como la base de conocimiento consolidada sobre el estado actual, arquitectura y componentes clave implementados en el SaaS multi-cliente LYNX. Sirve para brindar un contexto inmediato en nuevas conversaciones y optimizar el consumo de tokens.

---

## 1. Rubros del SaaS y Adaptación Dinámica (`hasType`)
LYNX opera de forma multi-tenant soportando tres verticales de negocio en base al tipo de categorías del comercio:
- **`ROPA` (Moda):** Habilita atributos de talle, color, material, guía de talles y control de stock tripartito.
- **`VIANDA` (Gastronomía):** Habilita planificador de menú diario/semanal, calorías, ingredientes y atributos alimenticios (Vegano/Gluten-Free).
- **`PASTELERIA` (Pastelería):** Habilita configuración de porciones y niveles de dulzura.

---

## 2. Componentes Modulares Implementados (Admin Panel)

### A. Catálogo y Modales Rubro-Dependientes (`CatalogManagement.tsx`)
- **Ubicación:** `src/components/admin/CatalogManagement.tsx`
- **Funcionalidad:**
  - Formulario dinámico de creación de productos que oculta/muestra campos según el rubro del tenant.
  - Buscador y filtrado por chips de categorías.
  - **Editor Masivo de Stock/Precios:** Pestaña compacta tipo grid para ediciones rápidas en lote que invoca la Server Action `updateProductsBulk` (transacción única en Prisma).
  - Selector de Guía de Talles para asociar tablas a categorías de ropa.

### B. Kanban de Pedidos Inteligente
- **Ubicación:** `src/app/admin/[tenantSlug]/page.tsx`
- **Funcionalidad:**
  - Drag & Drop nativo compatible con eventos de ratón en escritorio y gestos táctiles en móviles (`onTouchStart`/`onTouchEnd` con detección mediante `document.elementFromPoint`).
  - **Archivado Dinámico 24H:** Ocultamiento automático de pedidos históricos (más de 24 horas transcurridas) en las columnas finalizadas (`DELIVERED`/`CANCELLED`).
  - **Filtro Segmentado y Buscador:** Selector de vista ("Últimas 24h" / "Ver Historial") y buscador. Si un término de búsqueda coincide únicamente con pedidos históricos, se auto-conmuta el filtro a "Ver Historial".
  - Tarjeta de acción punteada al pie de columnas indicando `+ Ver anteriores ({count})`.

### C. Control de Stock Tripartito (`StockManagement.tsx`)
- **Ubicación:** `src/components/admin/StockManagement.tsx`
- **Funcionalidad:**
  - **Stock Físico (On Hand):** Mercadería real disponible en almacén (`p.stock`).
  - **Stock Reservado (Committed):** Unidades comprometidas en pedidos activos (`PENDING` o `PREPARING`).
  - **Stock Disponible (Available):** Unidades libres para venta (`Físico - Reservado`).
  - **ActiveReservationsModal:** Modal que se abre al hacer clic en las unidades reservadas, desglosando los tickets (ID de orden, cliente, cantidad y fecha de entrega) que retienen el stock.
  - **Alertas de Déficit:** Banners de alerta visual cuando el stock disponible es menor a cero.
  - **Integración con Kanban:** Al mover a `DELIVERED`, se descuenta físicamente el stock de la base de datos atómicamente; al pasar a `CANCELLED`, se liberan las reservas automáticamente.

### D. Gestión de Tabla de Talles (`SizeChartManagement.tsx`)
- **Ubicación:** `src/components/admin/SizeChartManagement.tsx`
- **Funcionalidad:**
  - **Plantillas Rápidas (Presets):** Carga rápida de columnas estándar para remeras/buzos, pantalones y calzado.
  - **Spreadsheet Inline Editor:** Modificación directa de las filas y medidas en un grid tipo Excel sin modales individuales por fila.
  - **Integración:** Las tablas se asocian a nivel de **Categoría** de producto en la base de datos.

### E. Personalizador de Shop (`ShopCustomization.tsx`)
- **Ubicación:** `src/components/admin/ShopCustomization.tsx`
- **Funcionalidad:**
  - **Canvas Image Uploader:** Cargador de logo y banner que redimensiona y comprime las imágenes (Logo a max 250px, Banner a max 800px) en WebP/JPEG a calidad 80% en el cliente antes de transformarlas a Base64. Se guardan directamente en los campos `logoUrl` y `bannerUrl` en la base de datos de Neon de forma ultraliviana (15KB - 30KB) sin costos de storage externo.
  - **Modo Vacaciones (Cierre Temporal):** Switch para suspender la tienda con un mensaje personalizado.
  - **Anuncio Promocional:** Banner superior (con switch, texto y color).
  - **Redes Sociales:** Links de Instagram, TikTok y WhatsApp.
  - **Bordes Redondeados (Border Radius Global):** Selector visual (`none` / `subtle` / `rounded` / `pill`) que define la variable CSS `--border-radius-theme` heredada en el storefront.

---

## 3. Acciones de Servidor y Esquema Prisma (`prisma/schema.prisma`)
- **`Category.sizeChartId`**: Campo opcional que vincula la categoría con `SizeChart` con borrado en `SetNull`.
- **`adjustProductStock`**: Incrementos y decrementos atómicos del inventario físico en base de datos.
- **`updateShopSettings`**: Serializa los estilos, anuncios, redes, estado operacional y radio de bordes en la columna JSON `themeSettings` de la tabla `Tenant`.

---

## 4. Visualización en Tienda Pública (Storefront)
- **Ubicación:** `src/app/shop/[tenantSlug]/page.tsx`
- **Acciones dinámicas:**
  - Si la tienda está en **Modo Vacaciones**, se bloquea la navegación mostrando una tarjeta de alerta con el eslogan, mensaje personalizado de vacaciones y botones de contacto directo a redes.
  - Si el **Banner de Anuncio** está activo, se renderiza al tope del portal.
  - El botón **📐 Guía de Talles** aparece contextualizado si la categoría tiene una tabla asociada, abriendo un modal glassmorphic con conversor dinámico de CM a Pulgadas (soporta rangos como `90-95` cm).
  - Las tarjetas de productos (`ProductCard.tsx`), botones e inputs heredan la variable `--border-radius-theme` de manera uniforme.
