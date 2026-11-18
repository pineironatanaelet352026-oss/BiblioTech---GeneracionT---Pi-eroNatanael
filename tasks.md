# Plan de Tareas del Proyecto (tasks.md) — BiblioTech

Este documento contiene el desglose secuencial de tareas pequeñas, ordenadas por dependencias estrictas. Al entregar el proyecto, todas las tareas deben figurar en estado `COMPLETADA` y respaldadas por su hash de commit correspondiente.

---

## FASE 0 a FASE 5 — Definición, Especificación y Planificación (Completadas)

- [x] **TASK-001**: Auditoría inicial del entorno, repositorio y lectura de consignas.
  - **Agente:** Analista / Arquitecto
  - **RN/HU:** N/A (Fase 0)
  - **Dependencia:** Ninguna
  - **Criterio de finalización:** Diagnóstico presentado sin modificar código.
  - **Commit:** N/A (Auditoría de solo lectura)
  - **Estado:** `COMPLETADA`

- [x] **TASK-002**: Inicialización del repositorio Git local y configuración de `.gitignore`.
  - **Agente:** Arquitecto
  - **RN/HU:** N/A (Fase 2)
  - **Dependencia:** TASK-001
  - **Criterio de finalización:** Repositorio inicializado en rama main con exclusión de secretos y dependencias.
  - **Commit:** `e1e3e5c`
  - **Estado:** `COMPLETADA`

- [x] **TASK-003**: Creación de documentación funcional inicial (`idea.md`, `decisiones.md`, `glosario.md`, `preguntas-abiertas.md`).
  - **Agente:** Analista
  - **RN/HU:** N/A (Fase 2)
  - **Dependencia:** TASK-002
  - **Criterio de finalización:** Cuatro documentos funcionales creados y alineados con la visión de la biblioteca escolar.
  - **Commit:** `6920dde`
  - **Estado:** `COMPLETADA`

- [x] **TASK-004**: Elaboración de la especificación definitiva (`spec.md`) con 11 RNs, 7 HUs y cierre de preguntas abiertas.
  - **Agente:** Analista
  - **RN/HU:** RN1 a RN11, HU1 a HU7 (Fase 3)
  - **Dependencia:** TASK-003
  - **Criterio de finalización:** Spec completa con criterios Dado/Cuando/Entonces y 0 pendientes.
  - **Commit:** `6e6bf9f`
  - **Estado:** `COMPLETADA`

- [x] **TASK-005**: Diseño de la arquitectura y plan técnico (`plan.md`).
  - **Agente:** Arquitecto
  - **RN/HU:** Todas (Fase 4)
  - **Dependencia:** TASK-004
  - **Criterio de finalización:** Modelo relacional, catálogo de endpoints REST, matriz de trazabilidad y estrategia cloud.
  - **Commit:** `a545694`
  - **Estado:** `COMPLETADA`

- [x] **TASK-006**: Definición del reglamento de agentes (`AGENTS.md`) y plan de tareas (`tasks.md`).
  - **Agente:** Arquitecto / Revisor
  - **RN/HU:** Todas (Fase 5)
  - **Dependencia:** TASK-005
  - **Criterio de finalización:** Roles asignados y tareas desglosadas con dependencias.
  - **Commit:** `e4e6054`
  - **Estado:** `COMPLETADA`

---

## FASE 6 — Configuración del Entorno y Base de Datos

- [x] **TASK-007**: Configurar estructura modular del proyecto (`backend/` y `frontend/`) y variables de entorno seguras (`.env.example`).
  - **Agente:** Arquitecto
  - **RN/HU:** N/A (Configuración de entorno)
  - **Dependencia:** TASK-006
  - **Criterio de finalización:** Directorios base creados, `package.json` base, `.env.example` completo sin secretos.
  - **Commit:** `52dcaab`
  - **Estado:** `COMPLETADA`

- [x] **TASK-008**: Crear script SQL de esquema (`schema.sql`) y datos iniciales de prueba (`seed.sql`).
  - **Agente:** Arquitecto / Desarrollador Backend
  - **RN/HU:** RN1
  - **Dependencia:** TASK-007
  - **Criterio de finalización:** Script DDL ejecutable con ENUMs, tablas, claves foráneas y datos de usuarios (Admin, Alumno, Docente), recursos y ejemplares.
  - **Commit:** `f9748fa`
  - **Estado:** `COMPLETADA`

---

## FASE 7 — Desarrollo Backend y Lógica de Negocio (TDD)

- [x] **TASK-009**: Configurar servidor Express con TypeScript, pooling de base de datos PostgreSQL y middleware CORS seguro.
  - **Agente:** Desarrollador Backend
  - **RN/HU:** N/A (Infraestructura de backend)
  - **Dependencia:** TASK-008
  - **Criterio de finalización:** Servidor levanta en `http://localhost:3000`, test de salud `GET /api/health` responde 200 OK.
  - **Commit:** `b6e4300`
  - **Estado:** `COMPLETADA`

- [x] **TASK-010**: Implementar módulo de Autenticación, JWT y control de perfiles.
  - **Agente:** Tester / Desarrollador Backend / Revisor
  - **RN/HU:** HU2 (Identificación de usuarios y roles)
  - **Dependencia:** TASK-009
  - **Criterio de finalización:** Tests de login exitoso y credenciales inválidas pasan; generación de token JWT firmado.
  - **Commit:** `c10c784`
  - **Estado:** `COMPLETADA`

- [x] **TASK-011**: Implementar Catálogo de Recursos y Ejemplares (Endpoints y consultas con filtros).
  - **Agente:** Tester / Desarrollador Backend / Revisor
  - **RN/HU:** RN1, HU1
  - **Dependencia:** TASK-010
  - **Criterio de finalización:** Tests unitarios y de endpoint `GET /api/recursos` pasando (filtros por texto, categoría y disponibilidad).
  - **Commit:** `008a7b6`
  - **Estado:** `COMPLETADA`

- [x] **TASK-012**: Implementar Servicio de Préstamos: validación de cupos por rol y plazos.
  - **Agente:** Tester / Desarrollador Backend / Revisor
  - **RN/HU:** RN2, RN3, RN4, HU2
  - **Dependencia:** TASK-011
  - **Criterio de finalización:** Tests para rechazo por cupo excedido (2 alumnos, 4 docentes) y rechazo por mora aprobados; registro exitoso con cálculo exacto de días corridos.
  - **Commit:** `adefcc4`
  - **Estado:** `COMPLETADA`

- [ ] **TASK-013**: Implementar Servicio de Renovaciones de Préstamos.
  - **Agente:** Tester / Desarrollador Backend / Revisor
  - **RN/HU:** RN6, HU3
  - **Dependencia:** TASK-012
  - **Criterio de finalización:** Tests que aprueban 1 renovación válida y rechazan segunda renovación, préstamo vencido o con reservas existentes.
  - **Commit:**
  - **Estado:** `PENDIENTE`

- [ ] **TASK-014**: Implementar Servicio de Devoluciones y Motor de Sanciones por Mora o Deterioro.
  - **Agente:** Tester / Desarrollador Backend / Revisor
  - **RN/HU:** RN4, RN5, RN11, HU4
  - **Dependencia:** TASK-013
  - **Criterio de finalización:** Tests que comprueban cálculo de suspensión ($2 \times \text{días}$), levantamiento de mora y asignación de bloqueo administrativo por daño.
  - **Commit:**
  - **Estado:** `PENDIENTE`

- [ ] **TASK-015**: Implementar Servicio de Reservas: cola FIFO, asignación automática (48 hs) y cancelación.
  - **Agente:** Tester / Desarrollador Backend / Revisor
  - **RN/HU:** RN7, RN8, RN9, RN10, HU5, HU6, HU7
  - **Dependencia:** TASK-014
  - **Criterio de finalización:** Tests de reserva solo con stock 0, asignación prioritaria en devolución, retiro con verificación de cupo y cancelación con reasignación inmediata.
  - **Commit:**
  - **Estado:** `PENDIENTE`

- [ ] **TASK-016**: Exportar y documentar colección de pruebas de endpoints en Postman.
  - **Agente:** Tester
  - **RN/HU:** Todas
  - **Dependencia:** TASK-015
  - **Criterio de finalización:** Archivo `bibliotech.postman_collection.json` con variables de entorno y assertions automáticos para cada endpoint.
  - **Commit:**
  - **Estado:** `PENDIENTE`

---

## FASE 8 — Desarrollo Frontend (React + TypeScript)

- [ ] **TASK-017**: Inicializar aplicación React con Vite, TypeScript, Tailwind CSS y cliente de API configurado.
  - **Agente:** Desarrollador Frontend
  - **RN/HU:** N/A (Infraestructura Frontend)
  - **Dependencia:** TASK-015
  - **Criterio de finalización:** App levanta con Vite, layout responsive con navegación y barra de estado de autenticación.
  - **Commit:**
  - **Estado:** `PENDIENTE`

- [ ] **TASK-018**: Desarrollar vista de Catálogo y Búsqueda con tarjetas interactivas y detalle de ejemplares.
  - **Agente:** Desarrollador Frontend
  - **RN/HU:** RN1, HU1
  - **Dependencia:** TASK-017
  - **Criterio de finalización:** Filtros en tiempo real, badges de disponibilidad, sin botones simulados.
  - **Commit:**
  - **Estado:** `PENDIENTE`

- [ ] **TASK-019**: Desarrollar Panel del Lector (Préstamos activos, botón de renovación y gestión de reservas con cuenta regresiva de 48 hs).
  - **Agente:** Desarrollador Frontend
  - **RN/HU:** RN3, RN6, RN7, RN8, RN10, HU3, HU5, HU6
  - **Dependencia:** TASK-018
  - **Criterio de finalización:** Acciones reales de renovación y cancelación con feedback inmediato y alertas de mora/suspensión.
  - **Commit:**
  - **Estado:** `PENDIENTE`

- [ ] **TASK-020**: Desarrollar Panel de Administración del Bibliotecario (Mostrador de Préstamos, Devoluciones con estado físico y control de reservas).
  - **Agente:** Desarrollador Frontend
  - **RN/HU:** RN1, RN2, RN4, RN5, RN9, RN11, HU2, HU4, HU7
  - **Dependencia:** TASK-019
  - **Criterio de finalización:** Formularios de préstamo presencial con validación de cupo, registro de devolución con cálculo visible de sanción y efectivización de reservas.
  - **Commit:**
  - **Estado:** `PENDIENTE`

---

## FASE 9 a FASE 13 — Calidad, Despliegue y Entrega

- [ ] **TASK-021**: Suite completa de tests de integración frontend-backend y pruebas de casos límite.
  - **Agente:** Tester / Revisor
  - **RN/HU:** Todas
  - **Dependencia:** TASK-020
  - **Criterio de finalización:** 100% de tests automáticos en verde ejecutados en consola.
  - **Commit:**
  - **Estado:** `PENDIENTE`

- [ ] **TASK-022**: Configuración y despliegue en la nube (Neon PostgreSQL, Render Backend, Netlify Frontend).
  - **Agente:** Arquitecto / Revisor
  - **RN/HU:** N/A (Despliegue)
  - **Dependencia:** TASK-021
  - **Criterio de finalización:** Backend y Frontend accesibles públicamente con HTTPS y CORS restringido.
  - **Commit:**
  - **Estado:** `PENDIENTE`

- [ ] **TASK-023**: Creación del README definitivo e Informe Final de Planificación y Pruebas.
  - **Agente:** Analista / Arquitecto / Tester
  - **RN/HU:** Todas
  - **Dependencia:** TASK-022
  - **Criterio de finalización:** `README.md` con enlaces públicos verificados e `informe-final.md` con justificación del orden de tareas y matriz de resultados de pruebas.
  - **Commit:**
  - **Estado:** `PENDIENTE`

- [ ] **TASK-024**: Auditoría final de entrega contra la checklist de la consigna.
  - **Agente:** Revisor / Product Owner
  - **RN/HU:** Todas
  - **Dependencia:** TASK-023
  - **Criterio de finalización:** Verificación punto por punto de la consigna oficial, 100% de tareas comiteadas y marcadas como completadas.
  - **Commit:**
  - **Estado:** `PENDIENTE`
