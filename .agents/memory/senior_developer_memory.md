# Memoria Técnica - Senior Developer (SaaS Multi-Cliente)

Este archivo registra las decisiones técnicas de arquitectura, base de datos, dependencias y refactorizaciones del proyecto.

---

## Historial de Decisiones Técnicas y Cambios

### [2026-07-01] Kanban Reactivo, Detalles de Pedidos y Soporte Drag & Drop
* **Archivo Modificado:** `src/app/admin/[tenantSlug]/page.tsx`
* **Implementación:**
  * **Tipos de Negocio:** Se utiliza el tipo de categoría del tenant (`hasType === "ROPA"`) para alternar dinámicamente etiquetas del Kanban (cambiando "En Cocina" a "En Preparación").
  * **Estado Local de Pedidos:** Se encapsularon los pedidos en un estado React `kanbanOrders` inicializado con `MOCK_KANBAN_ORDERS` (enriquecido con datos detallados de clientes y artículos) para soportar reactividad instantánea.
  * **Detalle del Pedido:** Se creó el modal de visualización detallada (`selectedKanbanOrder`) mostrando desgloses de productos, subtotales, envíos y datos de contacto de clientes.
  * **Drag & Drop Multiplataforma:**
    * **Desktop:** Utiliza el API nativo de Drag & Drop de HTML5 (`draggable`, `onDragStart`, `onDrop`) guardando el estado mediante la variable `draggingOrderId` para prevenir el uso de dependencias externas incompatibles con React 19.
    * **Mobile (Touch):** Implementado mediante listeners táctiles (`onTouchStart`, `onTouchEnd`) que calculan la posición final del dedo con `document.elementFromPoint(clientX, clientY)` y escalan en el árbol DOM hasta encontrar la columna destino identificada por `data-column-status`.
    * **Seguridad y Burbujeo:** Se introdujo `e.stopPropagation()` en los botones de acción rápida de las tarjetas del Kanban ("Preparar", "Entregar") para evitar la apertura accidental del modal al mover o interactuar con el pedido.
* **Verificación:** Ejecución exitosa de `npm run build` con cero errores de compilación TypeScript.

### [2026-07-01] Desacoplamiento de Módulo y Editor Masivo de Catálogo
* **Archivos Modificados:**
  * `src/app/actions/product.ts` (Modificado para agregar Server Action de lote)
  * `src/app/admin/[tenantSlug]/page.tsx` (Modificado para integrar el componente y remover lógica heredada)
* **Archivo Nuevo:**
  * `src/components/admin/CatalogManagement.tsx` (Componente modular de Catálogo)
* **Implementación:**
  * **Server Action Masivo:** Se programó `updateProductsBulk` que ejecuta actualizaciones individuales concurrentes agrupadas dentro de una transacción `db.$transaction` de Prisma, garantizando consistencia en las modificaciones en lote de stock, precio y visibilidad.
  * **Modularización:** Se removieron más de 650 líneas de código de `page.tsx` correspondientes a variables de estado de productos, callbacks de guardado/borrado y renderizado de modales (crear producto, crear categoría). Todo se delegó al componente autónomo `CatalogManagement`.
  * **Campos Dinámicos por Tenant:** El formulario de productos renderiza secciones condicionales según `categories[0].type` (`ROPA`, `VIANDA` o `PASTELERIA`), mapeando los atributos de base de datos específicos de cada rubro en inputs dedicados.
  * **Filtros e Interfaz Reactiva:** Se programó un buscador por filtro de texto combinable con el selector horizontal de categorías. El control rápido de visibilidad (`isActive`) llama a un endpoint de base de datos al instante.
  * **Quick-Edit Grid:** Sub-pestaña que expone una grilla con inputs numéricos para modificar precio y stock en lote, guardando los cambios asincrónicamente mediante `updateProductsBulk` y refrescando el dashboard.
* **Verificación:** Compilación exitosa de Next.js (`npm run build`) en Turbopack con 0 advertencias de tipado.

