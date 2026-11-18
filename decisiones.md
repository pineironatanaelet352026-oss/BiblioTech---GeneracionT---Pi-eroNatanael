# Registro de Decisiones de Negocio y Diseño — BiblioTech

Este documento registra cada decisión acordada entre el cliente y el equipo de desarrollo, organizadas temáticamente con su pregunta disparadora, la resolución adoptada y la justificación técnica/funcional.

---

## Tema 1: Identidad, Propósito y Alcance

### Decisión 1.1: Nombre del Sistema
- **Pregunta:** ¿Cómo se denominará el sistema y qué identidad institucional tendrá?
- **Respuesta:** **BiblioTech**.
- **Justificación:** Comunica de forma moderna y profesional el propósito tecnológico y educativo aplicado a una biblioteca o mediateca escolar.

### Decisión 1.2: Modalidad del Proyecto y Autoría
- **Pregunta:** ¿El proyecto se desarrolla de forma individual o grupal?
- **Respuesta:** Individual (desarrollado y presentado por Camila).
- **Justificación:** Cumple con la opción individual permitida en las consignas del Bootcamp.

### Decisión 1.3: Alcance de Notificaciones (Correos electrónicos)
- **Pregunta:** ¿Se integrará un servicio externo de envío de correos electrónicos transaccionales (SMTP/SendGrid)?
- **Respuesta:** No. Las notificaciones, avisos de vencimiento y disponibilidad de reservas se gestionarán internamente dentro de la interfaz web mediante estados, alertas e insignias visuales.
- **Justificación:** La consigna indica expresamente *"No es obligatorio implementar envío de correos electrónicos"*. Esto previene fallos por claves de API vencidas o límites de envío en la evaluación de la docente.

---

## Tema 2: Usuarios y Roles

### Decisión 2.1: Estructura de Roles
- **Pregunta:** ¿Qué roles convivirán en el sistema y qué capacidades tendrán?
- **Respuesta:** Dos roles primarios:
  1. `ADMIN` (Bibliotecario): Control total de catálogo, operaciones de mostrador (préstamos y devoluciones) y auditoría de sanciones.
  2. `LECTOR` (subclasificado en tipo `ALUMNO` y `DOCENTE`): Acceso a búsqueda, consulta de préstamos personales, solicitudes de renovación y reservas.
- **Justificación:** Permite modelar permisos en la API y refleja la dinámica real de un establecimiento educativo.

---

## Tema 3: Modelo de Catálogo (Títulos vs. Ejemplares)

### Decisión 3.1: Separación de Obra (Título) y Copia Física (Ejemplar)
- **Pregunta:** ¿El préstamo se realiza sobre un libro abstracto o sobre una unidad física específica?
- **Respuesta:** Se modela una relación uno a muchos: un **Recurso/Título** (ej. *"Cien Años de Soledad"*) posee múltiples **Ejemplares** físicos individuales (ej. código `LIB-001-A`, `LIB-001-B`), cada uno con su estado propio (`DISPONIBLE`, `PRESTADO`, `RESERVADO`, `EN_REPARACION`, `DADO_DE_BAJA`).
- **Justificación:** Es la única forma realista de controlar stock exacto y permitir que varios usuarios tengan el mismo título en simultáneo sin colisiones de datos.

---

## Tema 4: Políticas de Préstamos y Cupos

### Decisión 4.1: Límites cuantitativos y temporales por Rol
- **Pregunta:** ¿Cuáles son los cupos máximos de recursos en simultáneo y los plazos de devolución?
- **Respuesta:**
  - **Alumnos:** Máximo **2 ejemplares simultáneos** durante **7 días corridos**.
  - **Docentes:** Máximo **4 ejemplares simultáneos** durante **14 días corridos**.
- **Justificación:** Contempla la necesidad académica docente de preparar unidades curriculares sin desabastecer la disponibilidad para el alumnado.

### Decisión 4.2: Cómputo de Días
- **Pregunta:** ¿Los plazos se cuentan en días hábiles o días corridos?
- **Respuesta:** Días corridos. Si el día de vencimiento cae en fin de semana, la fecha límite se fija computando los días corridos de calendario estándar.
- **Justificación:** Evita ambigüedades de calendarios de feriados locales y simplifica el cálculo matemático verificable tanto en backend como en tests.

---

## Tema 5: Políticas de Renovación

### Decisión 5.1: Cantidad de Renovaciones permitidas
- **Pregunta:** ¿Cuántas veces puede renovarse un préstamo en curso?
- **Respuesta:** **1 sola vez** consecutiva por préstamo.
- **Justificación:** Evita la apropiación indefinida de un ejemplar por parte de un mismo usuario.

### Decisión 5.2: Condiciones de Aprobación de la Renovación
- **Pregunta:** ¿Bajo qué condiciones el sistema autoriza o rechaza una renovación?
- **Respuesta:** La renovación se aprueba únicamente si:
  1. El préstamo se encuentra dentro del plazo (no está vencido).
  2. El usuario no posee sanciones activas ni otros préstamos en mora.
  3. No existen **reservas activas** en cola sobre ese mismo título por parte de otros usuarios.
  Si se aprueba, se extiende el vencimiento por el mismo plazo original del rol (7 días para alumnos, 14 para docentes).
- **Justificación:** Prioriza a nuevos lectores que están esperando el material sobre la extensión del usuario actual.

---

## Tema 6: Mora, Bloqueos y Sanciones

### Decisión 6.1: Bloqueo Preventivo Inmediato
- **Pregunta:** ¿Qué ocurre en el momento exacto en que un préstamo supera su fecha de vencimiento sin ser devuelto?
- **Respuesta:** El préstamo cambia de estado a `VENCIDO` y el usuario queda en estado `BLOQUEADO_POR_MORA`. No puede solicitar nuevos préstamos, renovaciones ni reservas mientras mantenga material vencido en su poder.
- **Justificación:** Regla de negocio elemental para exigir la restitución inmediata del bien.

### Decisión 6.2: Sanción Post-Devolución
- **Pregunta:** ¿Cómo se penaliza la devolución tardía una vez entregado el ejemplar?
- **Respuesta:** Se aplica una suspensión temporal automática calculada como:
  $$\text{Días de suspensión} = \text{Días de retraso} \times 2$$
  Durante ese período, el usuario no puede solicitar préstamos ni reservas.
- **Justificación:** Fomenta la responsabilidad en la entrega a término mediante un cálculo matemático predecible, justo y sin discrecionalidad.

---

## Tema 7: Reservas y Lista de Espera

### Decisión 7.1: Reglas para Reservar
- **Pregunta:** ¿Cuándo puede un lector solicitar una reserva?
- **Respuesta:** Únicamente cuando la cantidad de ejemplares disponibles en el catálogo para ese título sea igual a **0**, y el usuario no se encuentre sancionado ni con mora.
- **Justificación:** Si hay ejemplares disponibles en mostrador, el usuario debe acercarse a retirarlo directamente como préstamo, no bloquearlo por reserva.

### Decisión 7.2: Asignación y Tolerancia de Retiro
- **Pregunta:** ¿Cómo se gestiona el ejemplar cuando es devuelto por un lector y existe lista de espera?
- **Respuesta:** El ejemplar devuelto pasa automáticamente al estado `RESERVADO` para el primer usuario de la cola FIFO. Se genera una ventana de tolerancia de **48 horas corridas** para que el beneficiario se presente a retirarlo. Si transcurren las 48 horas sin retiro, la reserva caduca automáticamente y el ejemplar se reasigna al siguiente en la cola (o pasa a `DISPONIBLE` si no hay más interesados).
- **Justificación:** Garantiza justicia en el orden de espera y previene que un libro quede inmovilizado si el usuario que reservó desiste de retirarlo.

---

## Tema 8: Stack y Arquitectura Técnica

### Decisión 8.1: Stack Tecnológico
- **Pregunta:** ¿Qué tecnologías sustentarán el frontend, backend y persistencia?
- **Respuesta:**
  - **Frontend:** React 18+ con TypeScript, Vite y Tailwind CSS.
  - **Backend:** Node.js con Express, TypeScript y validación con Zod.
  - **Base de Datos:** PostgreSQL relacional alojada en Neon.
  - **Testing:** Vitest / Jest y Supertest para pruebas de endpoints y lógica de negocio.
- **Justificación:** Adhesión a las tecnologías sugeridas en las clases del Bootcamp, asegurando tipado estático seguro de punta a punta y compatibilidad con despliegues en Netlify y Render.
