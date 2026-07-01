# Memoria del Product Owner (SaaS Multi-Cliente)

Este archivo registra el historial de decisiones de producto, prioridades, requerimientos y evolución general del SaaS.

---

## Historial de Decisiones de Producto

### [2026-07-01] Adaptación de Flujo Kanban por Rubro y Drag & Drop
* **Funcionalidad:** Personalización del flujo de preparación de pedidos según el tipo de negocio.
  * **Problema:** Negocios del tipo "Ropa" (no gastronómicos) mostraban el estado "En Cocina" en el Kanban, lo cual afectaba la lógica de su modelo de negocio.
  * **Solución:** Se parametrizó la columna para que muestre "En Preparación" cuando el tipo de categoría principal del inquilino es `ROPA` y "En Cocina" en otros casos (viandas, pastelería).
* **Funcionalidad:** Visualización detallada de pedidos e interacción fluida en Kanban.
  * **Solución:** Se implementó un modal interactivo que detalla la información del cliente, entrega, método de pago e ítems. También se dotó al tablero de capacidades Drag & Drop compatibles con ratón y toques móviles para mejorar la agilidad en la gestión de pedidos diarios.
* **Impacto Comercial:** Mayor versatilidad del SaaS para diferentes nichos de mercado (moda vs gastronomía). Mayor usabilidad y agilidad operativa.

### [2026-07-01] Refactorización de Catálogo y Carga Inteligente
* **Funcionalidad:** Modularización y optimización de la gestión del catálogo.
  * **Problema:** El formulario de carga genérico abrumaba al usuario no técnico mostrando campos irrelevantes. Modificar masivamente precios o stock requería abrir cada producto uno por uno, resultando impráctico en celulares.
  * **Solución:** Se implementó una interfaz de catálogo independiente que expone un formulario adaptable por rubro (ocultando información cruzada). Se incorporaron alertas de inventario (tipo semáforo) y una grilla compacta de "Editor Masivo" para modificar precio/stock en lote con Server Actions en transacción única.
* **Impacto Comercial:** Reducción drástica del abandono en la carga inicial (onboarding del comerciante) y prevención de quejas de clientes por quiebre involuntario de stock.

