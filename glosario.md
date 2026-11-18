# Glosario de Términos — BiblioTech

Definición clara, concisa y sin ambigüedades de los conceptos centrales del dominio de BiblioTech.

- **Título / Obra:** Registro bibliográfico general que agrupa los metadatos de una obra intelectual (título, autor, editorial, ISBN, temática).
- **Ejemplar:** Cada copia física e individual de un título existente en el inventario, identificada por un código único y con un estado operativo propio.
- **Estado de Ejemplar:** Condición operativa de un ejemplar físico, categorizada en: `DISPONIBLE`, `PRESTADO`, `RESERVADO`, `EN_REPARACION` o `DADO_DE_BAJA`.
- **Lector:** Usuario registrado habilitado para retirar materiales, categorizado como `ALUMNO` o `DOCENTE`.
- **Bibliotecario / Administrador:** Usuario con privilegios de gestión de inventario, registro presencial de transacciones y administración de sanciones.
- **Préstamo:** Contrato temporal por el cual un lector retira un ejemplar físico específico bajo el compromiso de restituirlo antes de la fecha límite fijada.
- **Fecha Límite / Vencimiento:** Momento temporal exacto en el que expira el período legal de un préstamo (7 días corridos para alumnos, 14 para docentes).
- **Mora:** Estado de infracción que se activa en un préstamo cuando el lector no restituye el ejemplar llegada o superada la fecha de vencimiento.
- **Bloqueo por Mora:** Inhabilitación preventiva inmediata que impide al usuario solicitar nuevos préstamos, renovaciones o reservas mientras posea material en mora.
- **Devolución:** Acción presencial en mostrador donde el bibliotecario recibe el ejemplar, finaliza el préstamo y evalúa la puntualidad y estado del recurso.
- **Renovación:** Extensión temporal única del plazo de un préstamo por un período igual al original, solicitada antes del vencimiento y sujeta a que no existan reservas sobre la obra.
- **Sanción / Suspensión:** Período de inhabilitación temporal aplicado al usuario tras una entrega tardía, calculado a razón de 2 días de suspensión por cada día de mora transcurrido.
- **Reserva:** Solicitud en lista de espera realizada por un lector para acceder a un título cuyo stock disponible en el catálogo se encuentra en cero.
- **Cola FIFO de Reserva:** Estructura de prioridad (primero en llegar, primero en ser atendido) que determina el orden de asignación de ejemplares cuando son devueltos.
- **Ventana de Retiro:** Plazo de 48 horas corridas otorgado al usuario cuya reserva fue asignada para presentarse en biblioteca a retirar el ejemplar antes de que caduque su turno.
