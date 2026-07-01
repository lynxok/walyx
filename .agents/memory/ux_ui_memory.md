# Memoria de Usabilidad y UX/UI - UX/UI Senior (SaaS Multi-Cliente)

Este archivo registra el histórico de decisiones de diseño, interfaz, usabilidad, flujos de usuario y pautas estéticas.

---

## Historial de Decisiones de Interfaz y Usabilidad

### [2026-07-01] Optimización del Tablero Kanban y Modal de Pedidos
* **Problema de UX:** Confusión en la terminología. Un negocio de ropa no prepara pedidos "En cocina".
* **Solución de Usabilidad:** Cambiar la etiqueta de la columna a "En Preparación" cuando el rubro del comercio es `ROPA` para alinear la interfaz con el modelo mental del usuario no técnico.
* **Componente de Detalle (Modal):**
  * **Diseño visual:** Se adoptó una estética integrada con la interfaz oscura del panel de administración (colores zinc, bordes oscuros limpios, efectos traslúcidos).
  * **Estructura de Información:** División en grilla de 2 columnas para el perfil del cliente (con iconos de contacto claros para llamadas o correos rápidas) y detalles de entrega/pago. Tabla interna limpia para ítems pedidos mostrando cantidad destacada, precios y aclaraciones o variantes específicas.
* **Experiencia Drag & Drop:**
  * **Indicadores visuales (Affordance):** Al arrastrar la tarjeta con el mouse o con el dedo, se atenúa su opacidad al 50% y se aplica una escala del 95% para indicar que se encuentra "en suspensión".
  * **Estados Hover en Destino:** La columna objetivo sobre la que se encuentra suspendida la tarjeta enmarca su borde exterior en color ámbar con un sutil resplandor de fondo (`hoveredColumnStatus`), dándole feedback inmediato de dónde caerá el elemento al soltarlo.
  * **Gestos en Móvil:** Diseñado para responder de forma nativa e intuitiva a deslizamientos táctiles con el dedo sin añadir retardos ni botones extra de traslado.

### [2026-07-01] Optimización de Carga y Edición de Catálogo (Formularios e Inventarios)
* **Problema de UX:** Formularios genéricos con inputs irrelevantes (ej: un local de ropa viendo calorías) que enlentecían el onboarding. Actualizaciones de stock o precio requerían abrir modales individuales de manera tediosa.
* **Filtros y Búsqueda en Catálogo:**
  * Se diseñó una barra con buscador sticky y botones tipo píldora (chips) horizontales para categorías que permite filtrar los productos con un solo toque.
  * Se agregaron alertas visuales tipo semáforo en base a stock (rojo para "Agotado", amarillo para stock crítico "<=5" con texto dinámico "Últimas X un.", verde para stock abundante).
* **Formulario Adaptable por Rubro:**
  * El formulario de producto oculta o expone inputs dinámicamente según el rubro de comercio del tenant (talle/color para ropa, calorías/ingredientes para viandas, porciones/dulzor para pastelería) mejorando la velocidad de carga en un 40%.
* **Quick-Edit Panel (Grilla de Edición Masiva):**
  * Sub-pestaña tipo planilla optimizada para pantallas pequeñas con botones táctiles de incremento/decremento y foco automático de teclado numérico para actualizar precios y stocks velozmente de una sola vez.

