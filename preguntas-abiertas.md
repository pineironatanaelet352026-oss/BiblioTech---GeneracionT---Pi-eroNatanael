# Preguntas Abiertas y Casos Especiales — BiblioTech

Este documento registra las dudas funcionales y casos límite identificados durante el análisis y su resolución formal acordada con el cliente.

> **Estado del Documento:** Todas las preguntas han sido evaluadas, respondidas y aprobadas. No quedan pendientes para la especificación del sistema.

---

### Pregunta 1 (PA-01) — CERRADA
- **Impacto:** **ALTO**
- **Regla/Área que afecta:** Devoluciones, Estado de Ejemplares y Sanciones Disciplinarias (RN1, RN11).
- **Duda funcional:** ¿Qué procedimiento técnico y de negocio debe aplicarse si un usuario devuelve un libro en estado deteriorado o declara haberlo extraviado?
- **Resolución adoptada:** El bibliotecario registra la devolución seleccionando `DETERIORADO` o `EXTRAVIADO`. El ejemplar pasa a estado `EN_REPARACION` o `DADO_DE_BAJA` y el sistema aplica un `BLOQUEO_ADMINISTRATIVO` al usuario que impide nuevos préstamos o reservas hasta que un bibliotecario registre formalmente la regularización/reposición del material.
- **Estado:** **RESUELTA Y DOCUMENTADA EN SPEC (RN11)**.

---

### Pregunta 2 (PA-02) — CERRADA
- **Impacto:** **MEDIO**
- **Regla/Área que afecta:** Asignación de Reservas y Gestión de Stocks (RN2, RN9).
- **Duda funcional:** Si un usuario tiene una reserva asignada (en su ventana de 48 hs), ¿debe verificar cupo máximo al momento del retiro en mostrador?
- **Resolución adoptada:** Sí. Al momento de efectivizar el préstamo presencialmente en mostrador, el usuario debe tener cupo disponible según su rol (máximo 2 para alumnos, 4 para docentes). Si tiene el cupo lleno, debe devolver uno de sus préstamos vigentes para poder retirar el ejemplar reservado; caso contrario, vencidas las 48 hs, la reserva caduca.
- **Estado:** **RESUELTA Y DOCUMENTADA EN SPEC (RN9)**.

---

### Pregunta 3 (PA-03) — CERRADA
- **Impacto:** **MEDIO**
- **Regla/Área que afecta:** Ciclo de Reservas y Cancelación voluntaria (RN10).
- **Duda funcional:** ¿Puede un lector cancelar voluntariamente una reserva que solicitó mientras está en cola o durante las 48 horas de asignación?
- **Resolución adoptada:** Sí. El lector puede cancelar su reserva desde su panel web. Si el ejemplar ya estaba en estado `RESERVADO` asignado a él, el sistema reasigna inmediatamente el ejemplar al siguiente usuario en la cola FIFO (iniciando sus 48 hs) o lo libera a estado `DISPONIBLE` si no hay más interesados.
- **Estado:** **RESUELTA Y DOCUMENTADA EN SPEC (RN10)**.

---

### Pregunta 4 (PA-04) — CERRADA
- **Impacto:** **BAJO**
- **Regla/Área que afecta:** Búsqueda y Navegación de Catálogo (RN1, HU1).
- **Duda funcional:** ¿Qué filtros de búsqueda deben estar disponibles en el frontend público?
- **Resolución adoptada:** Se implementa búsqueda combinada por texto libre (coincidencia en título o autor), filtro desplegable por categoría/género temático y conmutador booleano (checkbox) para "Solo recursos con stock disponible".
- **Estado:** **RESUELTA Y DOCUMENTADA EN SPEC (HU1)**.
