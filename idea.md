# BiblioTech — Sistema de Préstamos de Biblioteca y Mediateca Escolar

## 1. Resumen Ejecutivo
BiblioTech es una plataforma web integral diseñada para modernizar y transparentar la gestión de préstamos, devoluciones, reservas y sanciones en bibliotecas y mediatecas escolares. 

El sistema reemplaza las planillas físicas o registros informales por un entorno automatizado con reglas de negocio claras, garantizando la equidad en el acceso al material bibliográfico y multimedia, minimizando la pérdida de recursos y eliminando la discrecionalidad en la aplicación de sanciones por mora.

---

## 2. Problema a Resolver
En el ámbito de las bibliotecas y mediatecas escolares, la gestión manual o mediante hojas de cálculo presenta deficiencias críticas:
1. **Pérdida y extravío de material:** Dificultad para rastrear qué alumno o docente tiene un ejemplar específico y desde qué fecha.
2. **Falta de equidad y acaparamiento:** Usuarios que retienen libros por tiempo indeterminado sin que el sistema limite nuevos préstamos.
3. **Mora descontrolada:** Inexistencia de un cálculo automático de penalizaciones por entrega tardía, lo que genera desinterés en devolver a término.
4. **Falta de visibilidad de disponibilidad:** Los estudiantes no saben si un libro o dispositivo está disponible en biblioteca sin concurrir físicamente, ni pueden registrarse en una lista de espera ordenada.

---

## 3. Solución Propuesta
BiblioTech proporciona una aplicación web centralizada donde:
- El **Personal Bibliotecario** gestiona el catálogo de recursos, administra los ejemplares físicos individuales (con códigos de identificación únicos), registra préstamos y devoluciones en mostrador, y supervisa el estado de mora y sanciones.
- Los **Lectores (Alumnos y Docentes)** consultan el catálogo en tiempo real con stock de ejemplares disponibles, visualizan sus préstamos activos con fechas de vencimiento, solicitan renovaciones en línea (si cumplen las condiciones) y reservan ejemplares agotados incorporándose a una cola de espera equitativa.
- El **Motor de Reglas de Negocio** valida automáticamente el cupo máximo por rol, calcula fechas límite, bloquea nuevos préstamos a usuarios en mora, aplica suspensiones automáticas proporcionales al retraso y gestiona la caducidad de reservas.

---

## 4. Usuarios y Roles del Sistema

### A. Bibliotecario / Administrador
- Acceso a la gestión completa del catálogo (alta y edición de recursos y ejemplares).
- Registro de préstamos presenciales a alumnos y docentes.
- Registro de devoluciones de ejemplares, verificando estado físico.
- Consulta de métricas: préstamos activos, préstamos vencidos, reservas en espera y usuarios sancionados.
- Capacidad de conmutar el estado de un ejemplar (disponible, prestado, reservado, en mantenimiento/baja).

### B. Lector — Alumno
- Consulta del catálogo con filtros (título, autor, categoría).
- Límite estricto de **2 recursos en simultáneo**.
- Plazo de préstamo de **7 días corridos**.
- Derecho a **1 renovación** (por 7 días adicionales) si no hay mora ni reservas previas.
- Posibilidad de reservar títulos sin stock disponible.

### C. Lector — Docente
- Consulta del catálogo general y materiales curriculares.
- Límite ampliado de **4 recursos en simultáneo** para preparación de clases.
- Plazo de préstamo de **14 días corridos**.
- Derecho a **1 renovación** (por 14 días adicionales) si no hay mora ni reservas previas.
- Posibilidad de reservar títulos sin stock disponible.

---

## 5. Alcance del Sistema

### A. Incluido en el Alcance (MVP Completo y Funcional)
- Gestión de Catálogo: Títulos (metadatos de la obra) y Ejemplares físicos (instancias físicas con código de inventario).
- Gestión de Usuarios y Roles: Alumnos, Docentes y Bibliotecarios.
- Ciclo de Vida del Préstamo: Solicitud/registro, control de cupo, fecha límite calculada por rol, devolución y renovación.
- Motor de Sanciones y Mora: Detección automática de préstamos vencidos, bloqueo preventivo y cálculo de días de suspensión acumulativa (2 días de suspensión por cada día de mora).
- Cola de Reservas FIFO: Solicitud de reserva sobre títulos sin disponibilidad física y asignación prioritaria con ventana de retiro de 48 horas tras la devolución de un ejemplar.
- Panel de control y pantallas de consulta claras y responsive para bibliotecarios y lectores.

### B. Excluido del Alcance (Para evitar complejidad artificial)
- Envío real de correos electrónicos o notificaciones por SMS/WhatsApp (se manejan alertas visuales en la plataforma web, cumpliendo con la consigna oficial).
- Pasarelas de pago o cobro de multas monetarias (el régimen disciplinario es exclusivamente por tiempo de suspensión).
- Lectores de código de barras por hardware físico dedicado (se utilizarán identificadores alfanuméricos ingresables por teclado o búsqueda rápida).
