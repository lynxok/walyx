# Walyx SaaS - Knowledge Base & Desarrollo Futuro

Este documento recopila las decisiones de arquitectura, diseño de interfaz y trucos de maquetación móvil descubiertos e implementados durante el desarrollo del SaaS. Debe servir como referencia obligatoria para cualquier desarrollador o agente que trabague en el codebase en el futuro.

---

## 1. Sistema de Tematización Dinámica (Multi-Tenant)

* **Conversión Hex a RGB:**
  * El color de marca del inquilino (tenant) se almacena en base de datos en formato Hexadecimal (ej. `#f97316`).
  * Para permitir el uso de transparencias (`rgba(...)`), efectos de cristal (glassmorphism) y brillos ambientales con Tailwind, es mandatorio convertir el Hex a valores RGB individuales.
  * Implementamos un helper `hexToRgb(hex)` que inyecta tanto `--primary-color` como `--primary-rgb` (ej. `249, 115, 22`) como variables CSS en el contenedor principal de la vista del panel de administración.
  * **Regla a futuro:** Evitar clases de Tailwind estáticas (como `text-orange-500` o variantes inexistentes como `text-zinc-550`) en componentes del panel del inquilino. En su lugar, utilizar estilos inline o variables CSS del tema:
    ```tsx
    style={{ color: "var(--primary-color)" }}
    // O utilizando la variable RGB en tailwind:
    className="bg-[rgba(var(--primary-rgb),0.15)] border-[rgba(var(--primary-rgb),0.2)]"
    ```

---

## 2. Pautas de Diseño Responsivo y Mobile-First

* **Evitar Desbordamientos en Cabeceras (Viewports < 400px):**
  * En dispositivos móviles (ej. iPhone 12 de 390px), los nombres largos de locales y múltiples botones colapsan y se enciman fácilmente.
  * **Regla de títulos:** Aplicar siempre truncado seguro con un ancho máximo responsivo en los títulos para evitar que desplacen botones laterales:
    ```tsx
    className="truncate max-w-[130px] sm:max-w-xs md:max-w-none"
    ```
  * **Regla de botones de acción:** Reemplazar textos largos por variantes responsivas (ej. cambiar text "Registrar mi Negocio" por "Registrarse" o reducir botones a iconos compactos como `<ChevronRight className="w-4 h-4" />` mediante selectores `hidden sm:flex` y `flex sm:hidden`).
  * **Regla de separadores:** Ocultar líneas divisorias rígidas en celulares (`hidden sm:block`) para permitir que el contenido respire de manera natural.

* **Peligro de Recorte Vertical en Desplazamientos (`overflow`):**
  * Cualquier contenedor equipado con desplazamiento horizontal (`overflow-x-auto`) o comportamiento de carrusel recortará verticalmente a los elementos posicionados de forma absoluta que sobresalgan del borde superior (como el badge `-top-3.5` de "Más popular" en el plan Pro, o tarjetas elevándose por encima con `hover:-translate-y-2`).
  * **Solución:** Siempre se debe proporcionar un espaciado superior interno de seguridad (`pt-5` o similar) al contenedor de scroll para evitar que el navegador recorte estos componentes.

---

## 3. Componente de Carrusel Autodeslizable (`AutoCarousel.tsx`)

* Creamos un componente genérico reutilizable en [AutoCarousel.tsx](file:///C:/Users/ignac/.gemini/antigravity/worktrees/Venta%20de%20Viandas%20%28Cocina%29/redesign-cash-closing-flow/src/components/ui/AutoCarousel.tsx) que envuelve listas de tarjetas y las transforma en carruseles táctiles autodeslizables en móviles.
* **Características Clave:**
  * **Auto-slide:** Rotación automática cada 5 segundos mediante un hook `useEffect` con temporizador.
  * **Pausa Inteligente (Pause-on-hover/touch):** Detiene el temporizador en eventos `onMouseEnter` y `onTouchStart` para que el usuario pueda leer información crítica sin interrupciones molestas.
  * **Paginación Dinámica (Dots):** Muestra círculos de estado activos que cambian de tamaño y brillan en función del slide visible, sincronizados mediante cálculo de scroll horizontal en tiempo real.
  * **Fallback Desktop:** Se convierte automáticamente en una grilla estática multi-columna en computadoras (`md:grid`) omitiendo el comportamiento del carrusel y los puntos indicadores.

---

## 4. Estructura contable del Arqueo de Caja (Neon DB)

* Las sesiones de caja utilizan los modelos de Prisma `CashSession` y `CashTransaction` para persistir aperturas, depósitos/retiros (`PAY_IN` / `PAY_OUT`) y cierres.
* Toda transacción de venta generada con método de pago `CASH` en la tienda pública del inquilino busca de manera automática la sesión activa de caja del día para registrar un cobro de forma centralizada y mantener la trazabilidad del dinero físico esperado.

---

## 5. Kanban de Pedidos y Optimización para Mobile/iOS

* **Problema de Recarga de Pantalla Completa:**
  * **Causa:** Llamar a `fetchData()` tras cambiar de estado una orden activaba el loader de pantalla completa `setLoading(true)`, desmontando toda la UI.
  * **Solución:** `fetchData` ahora admite un parámetro `silent: boolean = false`. Cuando es `true`, los datos se actualizan en segundo plano (silent refetch) combinándose con actualizaciones de estado optimistas locales.
* **Conflicto de Drag-and-Drop y Scroll en iOS:**
  * **Problema:** En celulares (especialmente iOS/Safari), el gesto táctil del usuario para arrastrar una tarjeta interfiere con el scroll vertical de la pantalla. Si se desactiva el scroll mediante `touch-action: none`, el usuario no puede navegar hacia abajo en el tablero para ver el resto de columnas o tarjetas inferiores.
  * **Solución:**
    1. **Desactivar Drag Táctil en Mobile:** Eliminar interacciones complejas de arrastre por touch en smartphones (manteniendo el drag-and-drop con mouse en computadoras).
    2. **Controles de Estado Rápidos (Botones):** Habilitar botones de acción directa en las tarjetas móviles para cambiar su estado con un solo tap (ej. "PREPARAR →", "ENTREGAR →", "REABRIR", "CANCELAR").
    3. **Evitar Propagación:** Aplicar `e.stopPropagation()` en los botones de transición rápida de la tarjeta para evitar abrir el panel de detalles del pedido al presionarlos.
* **Espacios Vacíos (Gaps) Responsivos en Kanban:**
  * Las columnas Kanban vacías o con pocos pedidos tenían un `min-h-[500px]` fijo, provocando un vacío gigante en mobile. Se optimizó usando `min-h-[150px] md:min-h-[500px]` para que el layout colapse adecuadamente en celulares de forma compacta.

