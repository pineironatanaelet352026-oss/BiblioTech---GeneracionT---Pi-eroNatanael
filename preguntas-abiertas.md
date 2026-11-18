# Preguntas Abiertas y Casos Especiales — BiblioTech

Este documento centraliza las dudas funcionales y casos límite identificados durante el análisis, indicando la regla que afectan y su nivel de impacto (ordenadas de mayor a menor). 

---

### Pregunta 1 (PA-01)
- **Impacto:** **ALTO**
- **Regla/Área que afecta:** Devoluciones, Estado de Ejemplares y Sanciones Disciplinarias.
- **Duda funcional:** ¿Qué procedimiento técnico y de negocio debe aplicarse si un usuario devuelve un libro en estado deteriorado o declara haberlo extraviado?
- **Impacto en el sistema:** Modifica el estado del ejemplar a `EN_REPARACION` o `DADO_DE_BAJA` y debe determinar si se aplica una sanción fija por daño o si se bloquea al usuario de forma indefinida hasta su reposición física.
- **Propuesta de solución preliminar:** El bibliotecario puede marcar la devolución con observación `DETERIORADO` o `EXTRAVIADO`. Esto aplica un estado de `BLOQUEO_ADMINISTRATIVO` que requiere intervención del bibliotecario para rehabilitar al usuario tras la reposición del material.
- **Estado:** Abierta / A validar para la Spec.

---

### Pregunta 2 (PA-02)
- **Impacto:** **MEDIO**
- **Regla/Área que afecta:** Asignación de Reservas y Gestión de Stocks.
- **Duda funcional:** Si un usuario tiene una reserva en espera asignada (en sus 48 hs de ventana de retiro), ¿ese ejemplar cuenta para el cupo máximo de préstamos del usuario (2 para alumnos / 4 para docentes) en ese instante, o recién cuando se efectiviza en mostrador?
- **Impacto en el sistema:** Si no se computa y el usuario tiene 2 libros prestados, al ir a retirar el tercero superaría su cupo máximo.
- **Propuesta de solución preliminar:** Para efectivizar el retiro en mostrador, el usuario debe tener cupo disponible. Si en ese momento ya tiene su cupo completo, el sistema le exige devolver uno de sus libros actuales para poder retirar el ejemplar reservado; de lo contrario, al vencer las 48 hs pierde la reserva.
- **Estado:** Abierta / A validar para la Spec.

---

### Pregunta 3 (PA-03)
- **Impacto:** **MEDIO**
- **Regla/Área que afecta:** Ciclo de Reservas y Cancelación voluntaria.
- **Duda funcional:** ¿Puede un lector cancelar voluntariamente una reserva que solicitó mientras está en cola o durante las 48 horas de asignación?
- **Impacto en el sistema:** Si cancela voluntariamente durante la ventana de asignación, el ejemplar debe reasignarse de inmediato al siguiente usuario en la cola FIFO sin esperar las 48 horas.
- **Propuesta de solución preliminar:** Sí, el lector puede cancelar su reserva desde su panel web en cualquier momento. Si el ejemplar ya estaba apartado para él, el sistema gatilla inmediatamente la asignación al siguiente en cola o lo libera a `DISPONIBLE`.
- **Estado:** Abierta / A validar para la Spec.

---

### Pregunta 4 (PA-04)
- **Impacto:** **BAJO**
- **Regla/Área que afecta:** Búsqueda y Navegación de Catálogo.
- **Duda funcional:** ¿Qué filtros de búsqueda deben estar disponibles en el frontend público?
- **Impacto en el sistema:** Define la complejidad de las consultas SQL y los parámetros del endpoint `GET /api/recursos`.
- **Propuesta de solución preliminar:** Búsqueda combinada por texto libre (coincidencia en título o autor), filtro por categoría/género temático y conmutador booleano para "Solo recursos con stock disponible".
- **Estado:** Abierta / A validar para la Spec.
