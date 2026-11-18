# Reglamento de Trabajo de Agentes (AGENTS.md) — BiblioTech

Este documento define el marco de gobierno, las reglas de colaboración, las fuentes de verdad y la distribución de responsabilidades del equipo de desarrollo para el proyecto BiblioTech (Bootcamp IA-First).

---

## 1. Identidad del Proyecto y Fuentes de Verdad

- **Proyecto:** BiblioTech — Plataforma de Gestión de Préstamos, Devoluciones, Reservas y Sanciones para Biblioteca y Mediateca Escolar.
- **Autoría:** Proyecto individual desarrollado y defendido por Camila.
- **Jerarquía de Fuentes de Verdad:**
  1. `Consignas Proyecto Final.pdf`: Requisitos obligatorios de la cátedra del Bootcamp.
  2. `spec.md`: Reglas de negocio numeradas (RN1 a RN11) e Historias de Usuario (HU1 a HU7) con criterios de aceptación Dado/Cuando/Entonces.
  3. `plan.md`: Arquitectura del sistema, modelo relacional de datos y especificación de endpoints.
  4. `decisiones.md`: Registro de definiciones tomadas con el cliente.
  5. `tasks.md`: Plan de ejecución ordenado por dependencias atómicas.

> **Regla de Oro:** Ningún agente puede modificar requisitos, agregar reglas arbitrarias ni alterar las tecnologías pactadas sin previa justificación y aprobación explícita de Camila.

---

## 2. Stack Tecnológico Unificado

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Lucide Icons.
- **Backend:** Node.js (LTS), Express, TypeScript, Zod (validación), pg (cliente PostgreSQL).
- **Base de Datos:** PostgreSQL en la nube (Neon Serverless).
- **Testing:** Vitest / Jest, Supertest para endpoints de API.
- **Despliegue:** Render (Backend), Netlify (Frontend), Neon (Base de Datos).
- **Control de Versiones:** Git con rama principal `main` en repositorio público de GitHub.

---

## 3. Reglas Generales de Trabajo y Calidad

1. **Un commit por tarea:** No se acumulan múltiples tareas en un único commit gigante. Cada commit debe corresponder a un identificador concreto de `tasks.md`.
2. **Ciclo de Desarrollo Rojo-Verde-Refactor:**
   - El **Tester** define y escribe las pruebas primero (Rojo).
   - El **Desarrollador** implementa la solución mínima necesaria para hacer pasar las pruebas (Verde).
   - El **Revisor** audita calidad, estándares y seguridad antes de aprobar el commit (Refactor).
3. **Seguridad Absoluta:**
   - Queda terminantemente prohibido incluir contraseñas, tokens JWT o cadenas de conexión en archivos comiteables.
   - `.env` debe permanecer estrictamente ignorado por `.gitignore`.
   - Se provee únicamente `.env.example` con valores de plantilla ficticios.
4. **Trazabilidad:** Cada regla de negocio (RN) debe ser rastreable en el código fuente mediante comentarios explícitos que refieran a su identificador (ej. `// Cumple RN2: Límite de cupo por rol`).

---

## 4. Equipo de Agentes y Responsabilidades

### 4.1. Analista Funcional / Product Owner
- **Responsabilidad:** Garantizar que la implementación se ajuste al 100% a las historias de usuario y reglas de negocio descritas en `spec.md`.
- **Entregables:** `idea.md`, `glosario.md`, `decisiones.md`, `spec.md`.

### 4.2. Arquitecto de Software
- **Responsabilidad:** Diseñar la estructura de carpetas, definir los contratos de datos (interfaces TypeScript, esquemas SQL) y asegurar el desacoplamiento entre capas.
- **Entregables:** `plan.md`, `schema.sql`, configuración de entornos y scripts de inicio.

### 4.3. Desarrollador Backend
- **Responsabilidad:** Implementar las migraciones de base de datos, middlewares de autenticación y validación con Zod, y los servicios de dominio que aplican las reglas RN1 a RN11.
- **Entregables:** Código TypeScript en directorio `backend/`.

### 4.4. Desarrollador Frontend
- **Responsabilidad:** Crear las vistas responsive en React, componentes accesibles, formularios validados en cliente y la integración con la API REST. No deben existir botones simulados o decorativos.
- **Entregables:** Código TypeScript/JSX en directorio `frontend/`.

### 4.5. Tester (QA Automation)
- **Responsabilidad:** Escribir los casos de prueba unitarios, de integración y de casos límite para cada regla de negocio, verificando que los tests fallen antes de la implementación y pasen después. Documentar la colección de Postman.
- **Entregables:** Archivos `*.test.ts` en `backend/` y `frontend/`, y `bibliotech.postman_collection.json`.

### 4.6. Revisor de Código y Seguridad
- **Responsabilidad:** Inspeccionar cada diff antes del commit. Comprobar que no existan credenciales expuestas, que los tipos de TypeScript sean estrictos y que `tasks.md` se actualice con el estado y hash del commit.
- **Entregables:** Aprobación de tareas en `tasks.md` y auditoría de seguridad.
