# Especificación de Requisitos de Software (Spec) — BiblioTech

**Versión:** 1.0.0  
**Estado:** Completa y Aprobada (Sin pendientes)  
**Fuente de verdad:** Consignas de Proyecto Final del Bootcamp IA-First y Registro de Decisiones de Negocio.

---

## 1. Objetivo del Sistema
BiblioTech es una plataforma web para la gestión integral de préstamos, devoluciones, reservas y sanciones de bibliotecas y mediatecas escolares. Su propósito es garantizar la equidad en el acceso a los recursos bibliográficos y didácticos, automatizar el control de plazos, erradicar la arbitrariedad en la aplicación de sanciones y brindar visibilidad en tiempo real del catálogo tanto a la administración como al alumnado y profesorado.

---

## 2. Usuarios y Roles

| Rol | Identificador | Capacidades y Alcance |
| :--- | :---: | :--- |
| **Bibliotecario / Administrador** | `ADMIN` | Alta, edición y baja lógica de recursos y ejemplares. Registro presencial de préstamos y devoluciones en mostrador. Visualización de morosos y levantamiento de bloqueos administrativos tras reposición física. |
| **Lector — Alumno** | `ALUMNO` | Consulta y búsqueda de catálogo. Límite de **2 préstamos simultáneos** por **7 días corridos**. Derecho a 1 renovación. Solicitud y cancelación de reservas. |
| **Lector — Docente** | `DOCENTE` | Consulta y búsqueda de catálogo. Límite ampliado de **4 préstamos simultáneos** por **14 días corridos**. Derecho a 1 renovación. Solicitud y cancelación de reservas. |

---

## 3. Alcance del Sistema

### 3.1. Dentro del Alcance
- Catálogo de Títulos y gestión de Ejemplares físicos individuales con códigos únicos.
- Filtro de catálogo por texto libre (título/autor), categoría temática y filtro booleano "solo disponibles".
- Registro de préstamos y devoluciones presenciales en mostrador.
- Detección automática de préstamos vencidos (mora) y bloqueo preventivo del usuario.
- Algoritmo de sanciones por entrega tardía: $2 \times \text{días de retraso}$ corridos.
- Renovación en línea (1 sola vez por préstamo, sujeta a no-mora y no-reservas de terceros).
- Cola de reservas FIFO para títulos sin ejemplares disponibles, con asignación automática y ventana de retiro de 48 horas tras devolución.
- Cancelación voluntaria de reserva con reasignación inmediata en cola.
- Gestión de estado físico del ejemplar al devolver: normal, deteriorado o extraviado (bloqueo administrativo).

### 3.2. Fuera del Alcance
- Envío real de correos electrónicos transaccionales externos (reemplazado por alertas y notificaciones visuales en la aplicación web).
- Pasarelas de cobro monetario de multas.
- Escaneo de códigos de barra por hardware óptico físico.

---

## 4. Reglas de Negocio (RN)

### RN1 — Ejemplares e Inventario
Cada recurso bibliográfico (Título) puede contener uno o más ejemplares físicos. Cada ejemplar posee un código alfanumérico identificador único y un estado operativo que solo puede ser:
- `DISPONIBLE`: Apto para nuevo préstamo en mostrador o asignación de reserva.
- `PRESTADO`: En posesión de un lector con préstamo activo vigente.
- `RESERVADO`: Apartado en mostrador para un usuario específico durante su ventana de retiro de 48 hs.
- `EN_REPARACION`: No disponible para préstamo por rotura o deterioro.
- `DADO_DE_BAJA`: Retirado definitivamente del catálogo por pérdida o daño irreparable.

### RN2 — Cupo Máximo de Préstamos Simultáneos
- Un usuario con rol `ALUMNO` puede tener un máximo de **2 préstamos activos** en simultáneo.
- Un usuario con rol `DOCENTE` puede tener un máximo de **4 préstamos activos** en simultáneo.
- El sistema debe rechazar cualquier solicitud de préstamo que supere este límite.

### RN3 — Plazos de Duración del Préstamo
- Para `ALUMNO`: El plazo de préstamo es de **7 días corridos** contados desde la fecha de registro.
- Para `DOCENTE`: El plazo de préstamo es de **14 días corridos** contados desde la fecha de registro.
- La fecha límite de devolución vence a las 23:59:59 del día de vencimiento.

### RN4 — Detección de Mora y Bloqueo Preventivo
Si un préstamo alcanza el fin de su fecha límite sin que se haya registrado su devolución en el sistema:
1. El préstamo cambia de estado a `VENCIDO`.
2. El usuario pasa automáticamente al estado `BLOQUEADO_POR_MORA`.
3. Mientras se encuentre en este estado, el usuario tiene bloqueada la posibilidad de solicitar nuevos préstamos, renovar otros préstamos o realizar reservas.

### RN5 — Sanción Automática Acumulativa por Entrega Tardía
Al devolverse un ejemplar cuyo préstamo se encontraba `VENCIDO`, el sistema calcula una suspensión temporal obligatoria:
$$\text{Días de suspensión} = \text{Días de retraso} \times 2$$
- Los días de retraso se computan en días corridos completos transcurridos entre la fecha de vencimiento y la fecha de devolución real.
- La suspensión inicia inmediatamente al registrar la devolución y rige hasta las 23:59:59 del último día de suspensión.
- Si el usuario incurre en entregas tardías múltiples, los días de sanción se acumulan cronológicamente. Durante la sanción, el usuario no puede solicitar préstamos ni reservas.

### RN6 — Condiciones para Renovación de Préstamos
Un lector puede solicitar la renovación de un préstamo activo cumpliendo rigurosamente todas las siguientes condiciones:
1. El préstamo no fue renovado previamente (máximo **1 renovación** por préstamo).
2. El préstamo **no está vencido** (se solicita antes o durante la fecha límite).
3. El usuario **no tiene sanciones activas** ni otros préstamos vencidos en su cuenta.
4. **No existen reservas activas** en cola sobre ese mismo título por parte de otros usuarios.
- Al aprobarse, la nueva fecha límite se extiende por el mismo período inicial del rol (7 días adicionales para alumnos, 14 para docentes) contados a partir de la fecha de vencimiento previa.

### RN7 — Solicitud de Reserva sobre Recursos Agotados
Un lector puede registrar una reserva sobre un título únicamente si:
1. La cantidad de ejemplares en estado `DISPONIBLE` para ese título es exactamente **0**.
2. El usuario no se encuentra sancionado ni bloqueado por mora.
3. El usuario no posee ya una reserva activa sobre el mismo título.
- Las reservas se ordenan estrictamente bajo criterio FIFO (*First In, First Out* — primero en solicitar, primero en la lista).

### RN8 — Asignación de Reserva y Ventana de Tolerancia (48 Horas)
Al registrarse la devolución de un ejemplar de un título que cuenta con reservas pendientes:
1. El ejemplar devuelto pasa automáticamente al estado `RESERVADO`.
2. Se asigna prioritariamente al primer usuario de la cola FIFO.
3. Se activa una **ventana de retiro de 48 horas corridas**.
4. Si el usuario no concreta el retiro presencial dentro de las 48 horas, la reserva pasa a estado `CADUCADA` y el sistema reasigna automáticamente el ejemplar al siguiente usuario en la cola. Si no hay más usuarios en espera, el ejemplar pasa a `DISPONIBLE`.

### RN9 — Verificación de Cupo en Retiro de Reserva
Al presentarse en mostrador a efectivizar el préstamo de un ejemplar reservado:
- El usuario debe tener cupo disponible según RN2.
- Si en ese momento ya tiene cubierto su cupo máximo (por otros préstamos en curso), el bibliotecario no puede otorgar el nuevo préstamo a menos que el usuario devuelva simultáneamente uno de sus materiales previos.

### RN10 — Cancelación Voluntaria de Reserva
Un lector puede cancelar voluntariamente una reserva activa desde su panel web en cualquier momento.
- Si el ejemplar ya estaba en estado `RESERVADO` asignado a dicho usuario (dentro de su ventana de 48 hs), el sistema cancela la reserva y ejecuta inmediatamente la reasignación al siguiente usuario en la cola FIFO o libera el ejemplar a `DISPONIBLE`.

### RN11 — Devolución con Deterioro Físico o Extravío
Si durante la devolución en mostrador el bibliotecario determina que el ejemplar sufrió daños que impiden su uso o el lector declara su extravío:
1. El ejemplar pasa al estado `EN_REPARACION` o `DADO_DE_BAJA` según corresponda.
2. El usuario recibe un `BLOQUEO_ADMINISTRATIVO`.
3. El usuario permanecerá inhabilitado para operar en el sistema hasta que el personal bibliotecario registre formalmente la regularización o reposición física del material.

---

## 5. Historias de Usuario (HU) y Criterios de Aceptación

### HU1: Búsqueda y consulta de catálogo
**Como** lector (alumno o docente),  
**Quiero** buscar libros por título, autor o categoría y filtrar por disponibilidad,  
**Para** saber si el material que necesito está disponible de inmediato o si debo reservarlo.  
- **Reglas vinculadas:** RN1, RN7.

#### Criterio 1.1: Búsqueda con stock disponible
- **Dado** que existen 2 ejemplares de *"Física Universitaria"* en estado `DISPONIBLE`,
- **Cuando** el alumno ingresa el término "Física" en el buscador,
- **Entonces** el sistema lista el recurso mostrando stock disponible de 2 unidades e indica la opción de retiro presencial en mostrador.

#### Criterio 1.2: Búsqueda de recurso agotado
- **Dado** que todos los ejemplares de *"Don Quijote de la Mancha"* están en estado `PRESTADO`,
- **Cuando** un docente consulta dicho título,
- **Entonces** el sistema muestra stock disponible en 0 y habilita el botón "Solicitar Reserva".

---

### HU2: Registro de préstamo presencial en mostrador
**Como** bibliotecario,  
**Quiero** ingresar el código del ejemplar y el usuario del lector en mostrador,  
**Para** registrar un nuevo préstamo aplicando los cupos y plazos que corresponden por rol.  
- **Reglas vinculadas:** RN1, RN2, RN3, RN4.

#### Criterio 2.1: Préstamo exitoso a un alumno
- **Dado** que el alumno "Juan Pérez" tiene 1 préstamo activo, no tiene mora ni sanciones, y el ejemplar `LIB-042` está `DISPONIBLE`,
- **Cuando** el bibliotecario confirma el registro del préstamo,
- **Entonces** el sistema crea el préstamo con fecha de vencimiento a 7 días corridos, descuenta el ejemplar poniéndolo en estado `PRESTADO` y asocia el ejemplar al alumno.

#### Criterio 2.2: Rechazo por superación de cupo máximo
- **Dado** que la alumna "Lucía Morales" ya posee 2 préstamos activos en curso,
- **Cuando** el bibliotecario intenta registrar un tercer préstamo a su nombre,
- **Entonces** el sistema rechaza la operación, emite un mensaje de error indicando cupo máximo alcanzado (2 recursos) y mantiene el ejemplar como `DISPONIBLE`.

#### Criterio 2.3: Rechazo por usuario en mora o sancionado
- **Dado** que el usuario tiene un préstamo vencido no devuelto,
- **Cuando** el bibliotecario intenta registrarle un nuevo préstamo,
- **Entonces** el sistema bloquea la transacción informando que el usuario posee bloqueo preventivo por mora.

---

### HU3: Solicitud de renovación de préstamo en línea
**Como** alumno o docente con un préstamo vigente,  
**Quiero** solicitar la renovación de mi préstamo desde la plataforma web,  
**Para** extender el plazo de estudio sin tener que desplazarme físicamente a la biblioteca.  
- **Reglas vinculadas:** RN6.

#### Criterio 3.1: Renovación exitosa sin reservas previas
- **Dado** que un alumno tiene un préstamo con vencimiento el 20 de noviembre, nunca antes renovado, sin mora y sin reservas de terceros sobre ese título,
- **Cuando** el alumno presiona "Renovar Préstamo" en su panel,
- **Entonces** el sistema aprueba la extensión, actualiza la fecha de vencimiento al 27 de noviembre (7 días más) y marca el préstamo con 1 renovación consumida.

#### Criterio 3.2: Rechazo de renovación por reserva en espera
- **Dado** que existe una reserva en cola FIFO creada por otro usuario sobre el mismo título,
- **Cuando** el lector intenta renovar su préstamo vigente,
- **Entonces** el sistema deniega la renovación informando que existen usuarios en lista de espera y mantiene la fecha de vencimiento original.

#### Criterio 3.3: Rechazo por intento de segunda renovación
- **Dado** que un préstamo ya fue renovado una vez previamente,
- **Cuando** el usuario intenta renovarlo nuevamente,
- **Entonces** el sistema rechaza la solicitud indicando que se ha alcanzado el límite de 1 renovación por préstamo.

---

### HU4: Registro de devolución y cómputo de mora/sanción
**Como** bibliotecario,  
**Quiero** recibir el ejemplar físico e ingresar su devolución en el sistema,  
**Para** restablecer la disponibilidad del material y aplicar sanciones automáticas si hubo retraso o rotura.  
- **Reglas vinculadas:** RN1, RN4, RN5, RN8, RN11.

#### Criterio 4.1: Devolución a término y en buen estado
- **Dado** que un alumno entrega un ejemplar 2 días antes de la fecha límite en perfecto estado,
- **Cuando** el bibliotecario registra la devolución marcando estado físico "Óptimo",
- **Entonces** el préstamo finaliza con estado `DEVUELTO`, el alumno no recibe ninguna sanción y el ejemplar pasa a `DISPONIBLE` (o `RESERVADO` si hubiera lista de espera).

#### Criterio 4.2: Devolución con mora de 3 días
- **Dado** que un usuario devuelve un ejemplar con 3 días corridos de retraso respecto a su fecha límite,
- **Cuando** el bibliotecario confirma la devolución,
- **Entonces** el préstamo finaliza, se levanta el bloqueo preventivo por mora pero se genera una sanción de 6 días corridos de suspensión ($3 \times 2$), inhabilitando al usuario hasta cumplirse el período.

#### Criterio 4.3: Devolución con rotura o daño físico
- **Dado** que el ejemplar devuelto presenta páginas rotas o mojadas,
- **Cuando** el bibliotecario selecciona estado "Deteriorado",
- **Entonces** el ejemplar pasa a estado `EN_REPARACION` y el sistema asigna al usuario un `BLOQUEO_ADMINISTRATIVO` impidiendo toda transacción hasta su reposición física.

---

### HU5: Solicitud de reserva de título agotado
**Como** lector que no encontró ejemplares disponibles de un libro,  
**Quiero** unirme a la lista de espera de reservas,  
**Para** tener prioridad garantizada cuando algún ejemplar sea devuelto.  
- **Reglas vinculadas:** RN7, RN8.

#### Criterio 5.1: Ingreso exitoso a la cola de reserva
- **Dado** que el libro *"Química Orgánica"* tiene 0 ejemplares disponibles y el alumno no está sancionado,
- **Cuando** el alumno presiona "Reservar Título",
- **Entonces** el sistema crea la reserva en estado `PENDIENTE` en la última posición de la cola FIFO e informa la posición al usuario.

#### Criterio 5.2: Asignación automática tras devolución y apertura de ventana de 48 hs
- **Dado** que "María Gómez" es la primera en la cola de reserva de *"Química Orgánica"*,
- **Cuando** otro lector devuelve un ejemplar de dicho título,
- **Entonces** el ejemplar pasa a estado `RESERVADO`, la reserva de María pasa a `ASIGNADA` y se inicia una cuenta regresiva de 48 horas corridas para su retiro.

---

### HU6: Cancelación voluntaria de reserva
**Como** lector que ya no necesita el material que había reservado,  
**Quiero** cancelar mi reserva desde mi perfil web,  
**Para** no perjudicar a otros compañeros y liberar el ejemplar inmediatamente.  
- **Reglas vinculadas:** RN10.

#### Criterio 6.1: Cancelación de reserva asignada con reasignación inmediata
- **Dado** que un alumno tiene un ejemplar en estado `RESERVADO` asignado en sus 48 hs y existe otro usuario en la cola,
- **Cuando** el alumno presiona "Cancelar Reserva",
- **Entonces** el sistema cancela su reserva y reasigna automáticamente el ejemplar al siguiente usuario en la cola FIFO, reiniciando una nueva ventana de 48 hs para este último.

---

### HU7: Retiro presencial de ejemplar reservado
**Como** bibliotecario en mostrador,  
**Quiero** verificar y efectivizar la entrega de un ejemplar reservado,  
**Para** iniciar formalmente el préstamo al beneficiario de la reserva.  
- **Reglas vinculadas:** RN8, RN9.

#### Criterio 7.1: Retiro dentro de las 48 horas con cupo libre
- **Dado** que el usuario se presenta a retirar un ejemplar reservado dentro del plazo de 48 horas y tiene cupo disponible,
- **Cuando** el bibliotecario registra el retiro,
- **Entonces** la reserva pasa a estado `FINALIZADA`, el ejemplar pasa a `PRESTADO` y se inicia el préstamo según su rol.

#### Criterio 7.2: Caducidad automática por vencimiento de 48 horas
- **Dado** que pasaron más de 48 horas sin que el beneficiario se presentara a retirar el libro,
- **Cuando** el sistema procesa el control de reservas,
- **Entonces** la reserva pasa a `CADUCADA` y el ejemplar se asigna al siguiente en cola o vuelve a `DISPONIBLE`.

---

## 6. Casos Borde Contemplados

1. **Concurrencia de reservas simultáneas:** Dos usuarios intentan reservar el último ejemplar disponible al mismo milisegundo. *Resolución:* La transacción de base de datos utiliza bloqueo a nivel de fila (`SELECT ... FOR UPDATE`), asignando la reserva al primer commit y rechazando la segunda si el recurso ya no califica.
2. **Cierre de fin de semana o feriado en ventana de 48 hs:** La regla de negocio estipula 48 horas corridas de tolerancia para mantener una lógica predecible y testeable sin calendarios volátiles.
3. **Usuario con múltiples préstamos vencidos:** Si un usuario devuelve uno de los dos libros que tenía vencidos, se levanta la mora de ese libro y se acumula su sanción, pero el usuario **continúa bloqueado** porque aún mantiene en su poder un segundo préstamo en mora.
4. **Intento de renovación simultáneo con reserva entrante:** Si una reserva ingresa un instante antes de la solicitud de renovación, la renovación es rechazada inmediatamente por RN6.

---

## 7. Sección de Pendientes

- **Dudas de negocio abiertas:** 0 (Ninguna).
- **Reglas sin numerar:** 0 (Todas identificadas de RN1 a RN11).
- **Historias de usuario sin criterio de aceptación:** 0 (Todas bajo estándar Dado/Cuando/Entonces).
- **Estado final de la Spec:** **CERRADA Y LISTA PARA PLAN TÉCNICO**.
