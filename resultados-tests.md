# Matriz de Resultados de Pruebas Automatizadas — BiblioTech

**Ejecutado:** 2026-11-18 22:53:29  
**Entorno:** Local (Node.js 20.17.0, Vitest 2.1.9, datos en memoria – sin conexión a BD real)  
**Resultado global:** ✅ **31 tests pasando / 31 total — 0 fallos**

---

## Resumen por Archivo

| Archivo de Test | Tests | Resultado | Tiempo |
|---|---|---|---|
| `src/__tests__/health.test.ts` | 1 | ✅ PASS | 26 ms |
| `src/__tests__/auth.test.ts` | 5 | ✅ PASS | 117 ms |
| `src/__tests__/recursos.test.ts` | 6 | ✅ PASS | 195 ms |
| `src/__tests__/prestamos.test.ts` | 5 | ✅ PASS | 279 ms |
| `src/__tests__/renovaciones.test.ts` | 5 | ✅ PASS | 314 ms |
| `src/__tests__/devoluciones.test.ts` | 4 | ✅ PASS | 264 ms |
| `src/__tests__/reservas.test.ts` | 5 | ✅ PASS | 303 ms |
| **TOTAL** | **31** | **✅ 31 PASS** | **12.26 s** |

---

## Detalle por Test

### 🔵 health.test.ts (1 test)

| # | Nombre del Test | Regla | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 1 | GET /api/health responde 200 | N/A | `{ status: "ok" }` con HTTP 200 | `{ status: "ok" }` con HTTP 200 | ✅ PASS |

---

### 🔵 auth.test.ts (5 tests)

| # | Nombre del Test | Regla | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 1 | Login exitoso con credenciales válidas | HU2 | Token JWT + datos de usuario | Token JWT retornado | ✅ PASS |
| 2 | Login falla con contraseña incorrecta | HU2 | HTTP 401 | HTTP 401 | ✅ PASS |
| 3 | GET /api/auth/me retorna perfil del usuario autenticado | HU3 | Perfil con nombre, rol, estado | Datos correctos | ✅ PASS |
| 4 | Ruta protegida rechaza token inválido | HU2 | HTTP 401 | HTTP 401 | ✅ PASS |
| 5 | Ruta de ADMIN rechaza usuario con rol ALUMNO | HU2 | HTTP 403 | HTTP 403 | ✅ PASS |

---

### 🔵 recursos.test.ts (6 tests)

| # | Nombre del Test | Regla | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 1 | GET /api/recursos lista todos los recursos | HU1 | Array con recursos y ejemplares_disponibles | Array correcto | ✅ PASS |
| 2 | Filtro por texto busca en título y autor | HU1 | Solo recursos que coinciden | Filtro funciona | ✅ PASS |
| 3 | Filtro solo_disponibles=true excluye recursos sin stock | HU1, RN1 | Solo recursos con ejemplares DISPONIBLE | Filtrado correcto | ✅ PASS |
| 4 | GET /api/recursos/:id retorna detalle con ejemplares | HU1 | Objeto recurso con array de ejemplares | Detalle completo | ✅ PASS |
| 5 | GET /api/recursos/:id con id inexistente retorna 404 | HU1 | HTTP 404 | HTTP 404 | ✅ PASS |
| 6 | Filtro por categoría devuelve solo recursos de esa categoría | HU1 | Recursos de la categoría elegida | Filtrado correcto | ✅ PASS |

---

### 🔵 prestamos.test.ts (5 tests)

| # | Nombre del Test | Regla | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 1 | POST /api/prestamos crea préstamo y cambia estado a PRESTADO | RN1, RN3 | Préstamo activo con fecha_limite | Préstamo creado OK | ✅ PASS |
| 2 | Alumno no puede superar cupo de 2 préstamos activos (RN2) | RN2 | HTTP 409 al intentar 3er préstamo | HTTP 409 | ✅ PASS |
| 3 | Docente tiene cupo de 4 préstamos activos (RN2) | RN2 | Permite hasta 4 préstamos | 4 préstamos creados | ✅ PASS |
| 4 | Usuario con estado SUSPENDIDO no puede pedir préstamo (RN4) | RN4 | HTTP 403 | HTTP 403 | ✅ PASS |
| 5 | fecha_limite es 7 días para Alumno y 14 para Docente (RN3) | RN3 | fecha_limite correcta por rol | Días calculados correctos | ✅ PASS |

---

### 🔵 renovaciones.test.ts (5 tests)

| # | Nombre del Test | Regla | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 1 | Renovación exitosa extiende fecha_limite correctamente | RN6 | fecha_limite + 7 días (Alumno) | Nueva fecha correcta | ✅ PASS |
| 2 | No se puede renovar un préstamo ya renovado (RN6) | RN6 | HTTP 409 con mensaje de error | HTTP 409 | ✅ PASS |
| 3 | No se puede renovar si hay mora activa (RN6) | RN4, RN6 | HTTP 409 | HTTP 409 | ✅ PASS |
| 4 | No se puede renovar si hay reserva pendiente del mismo recurso (RN6) | RN6, RN7 | HTTP 409 | HTTP 409 | ✅ PASS |
| 5 | Renovación de préstamo inexistente retorna 404 | RN6 | HTTP 404 | HTTP 404 | ✅ PASS |

---

### 🔵 devoluciones.test.ts (4 tests)

| # | Nombre del Test | Regla | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 1 | Devolución en término: ejemplar vuelve a DISPONIBLE, no hay sanción | RN1, RN5 | estado=DEVUELTO, dias_retraso=0 | Correcto | ✅ PASS |
| 2 | Devolución con mora: se calculan días y se suspende usuario (RN5) | RN5 | dias_suspension = dias_retraso × 2 | Cálculo correcto con Math.floor | ✅ PASS |
| 3 | Devolución con estado DETERIORADO activa BLOQUEO_ADMINISTRATIVO (RN11) | RN11 | Usuario queda BLOQUEADO_ADMIN | Estado aplicado | ✅ PASS |
| 4 | Devolución activa asignación FIFO de reserva pendiente (RN8) | RN8 | Reserva pasa a ASIGNADA con 48 hs | FIFO ejecutado | ✅ PASS |

---

### 🔵 reservas.test.ts (5 tests)

| # | Nombre del Test | Regla | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 1 | POST /api/reservas crea reserva FIFO cuando stock = 0 (RN7) | RN7 | Reserva en estado PENDIENTE | Creada OK | ✅ PASS |
| 2 | No se puede reservar si hay ejemplares disponibles (RN7) | RN7 | HTTP 409 | HTTP 409 | ✅ PASS |
| 3 | Reserva asignada caduca si no se retira en 48 hs (RN8) | RN8 | Estado CADUCADA, siguiente en FIFO asignado | Caducidad correcta | ✅ PASS |
| 4 | Cancelación voluntaria reasigna al siguiente en FIFO (RN10) | RN10 | Reserva CANCELADA, siguiente pasa a ASIGNADA | FIFO reasignado | ✅ PASS |
| 5 | Cupo verificado al momento del retiro (RN9) | RN9 | HTTP 409 si usuario ya alcanzó cupo | Cupo controlado | ✅ PASS |

---

## Cobertura de Reglas de Negocio

| Regla | Descripción | Tests que la cubren | Cobertura |
|---|---|---|---|
| RN1 | Estados del ejemplar (ciclo DISPONIBLE↔PRESTADO↔RESERVADO) | prestamos#1, devoluciones#1, recursos#3 | ✅ Cubierta |
| RN2 | Cupo 2 Alumnos / 4 Docentes | prestamos#2, prestamos#3 | ✅ Cubierta |
| RN3 | Plazos 7 días / 14 días | prestamos#1, prestamos#5, renovaciones#1 | ✅ Cubierta |
| RN4 | Bloqueo automático por mora | prestamos#4, renovaciones#3 | ✅ Cubierta |
| RN5 | Sanción = días_mora × 2 | devoluciones#2 | ✅ Cubierta |
| RN6 | 1 renovación, sin mora, sin reservas pendientes | renovaciones#1-5 | ✅ Cubierta |
| RN7 | Reserva solo cuando stock = 0 | reservas#1, reservas#2 | ✅ Cubierta |
| RN8 | FIFO con 48 hs de ventana | devoluciones#4, reservas#3 | ✅ Cubierta |
| RN9 | Cupo al momento del retiro | reservas#5 | ✅ Cubierta |
| RN10 | Cancelación voluntaria reasigna FIFO | reservas#4 | ✅ Cubierta |
| RN11 | BLOQUEO_ADMINISTRATIVO por daño/extravío | devoluciones#3 | ✅ Cubierta |

**11 / 11 Reglas de Negocio cubiertas por tests automáticos ✅**

---

## Notas Técnicas

- Los tests corren **completamente offline** gracias a la arquitectura mock-first del backend.
- El mock data en memoria es reseteado entre suites mediante `beforeEach` donde corresponde.
- El cálculo de `dias_retraso` usa `Math.floor` para contar solo días completos transcurridos (corrección aplicada durante TASK-014).
- No se requiere conexión a Neon PostgreSQL para pasar los tests; la capa real de BD se activa solo con `DATABASE_URL` configurada.
