# BiblioTech — Sistema de Gestión de Préstamos para Biblioteca Escolar

> **Proyecto Final — Bootcamp IA-First (Generación T)**  
> Desarrollado por: **Natanael Piñero** (con asistencia de IA)  
> Repositorio público: [https://github.com/pineironatanaelet352026-oss/BiblioTech---GeneracionT---Pi-eroNatanael](https://github.com/pineironatanaelet352026-oss/BiblioTech---GeneracionT---Pi-eroNatanael)

---

## Objetivo del Proyecto

BiblioTech es una aplicación web full-stack diseñada para modernizar y transparentar la gestión de préstamos, devoluciones, sanciones y reservas en una biblioteca escolar. El sistema reemplaza los registros en papel o planillas manuales mediante la automatización estricta de **11 Reglas de Negocio (RN1–RN11)** y **7 Historias de Usuario (HU1–HU7)**, garantizando equidad en el acceso al material bibliográfico, trazabilidad completa de cada ejemplar y control automatizado de penalizaciones por mora o deterioro.

---

## Características Principales

1. **Gestión de Ejemplares Individuales (RN1):** Cada copia física de un libro posee su propio código de inventario y transita de forma estricta por los estados: `DISPONIBLE`, `PRESTADO`, `RESERVADO`, `EN_REPARACION` y `DADO_DE_BAJA`.
2. **Cupos Diferenciados por Rol (RN2):**
   - **Alumnos:** Hasta **2 libros** simultáneos.
   - **Docentes:** Hasta **4 libros** simultáneos.
3. **Plazos de Préstamo Diferenciados (RN3):**
   - **Alumnos:** **7 días corridos**.
   - **Docentes:** **14 días corridos**.
4. **Bloqueo Automático por Mora (RN4):** Usuarios con préstamos vencidos no pueden solicitar nuevos retiros ni renovar hasta regularizar su situación.
5. **Cálculo Matemático de Sanciones (RN5):** Suspensión temporal automática calculada como:
   $$\text{Días de Suspensión} = \text{Días de Mora} \times 2$$
6. **Renovación con Validación Estricta (RN6):** Máximo **1 sola renovación** por préstamo, siempre que no haya mora activa y no existan reservas pendientes de otros lectores.
7. **Cola de Espera FIFO con Tolerancia de 48 hs (RN7, RN8, RN10):**
   - Reservas habilitadas únicamente cuando el stock disponible es cero.
   - Asignación automática por orden estricto de llegada al producirse una devolución.
   - Ventana de retiro de **48 horas corridas** antes de caducar y reasignar al siguiente de la fila.
   - Reasignación inmediata en caso de cancelación voluntaria.
8. **Control de Cupo en Mostrador (RN9):** El cupo del lector se valida en el momento presencial del retiro del material reservado.
9. **Bloqueo Administrativo por Daño o Extravío (RN11):** Si el ejemplar se devuelve en estado `DETERIORADO` o `EXTRAVIADO`, se pasa el ejemplar a `EN_REPARACION` y se aplica un bloqueo administrativo al usuario hasta su reposición.

---

## Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript | Interfaz moderna, reactiva, fuertemente tipada y de carga instantánea. |
| **Estilos** | Tailwind CSS, Lucide Icons | Diseño responsive, accesible y componentes limpios sin librerías pesadas. |
| **Backend** | Node.js v20, Express, TypeScript | API RESTful modular, tipado estático robusto y separación por capas de servicio. |
| **Validaciones** | Zod | Validación de esquemas y tipos en tiempo de ejecución para requests HTTP. |
| **Autenticación** | JSON Web Tokens (JWT) | Autenticación stateless segura con control de acceso basado en roles (RBAC). |
| **Base de Datos** | PostgreSQL (Neon Cloud) | Motor relacional robusto con integridad referencial, tipos ENUM e índices FIFO. |
| **Testing** | Vitest, Supertest | Suite de 31 pruebas unitarias y de integración automáticas ejecutables offline. |
| **Despliegue** | Render (Backend) + Netlify (Frontend) | Infraestructura serverless y PaaS con HTTPS automático y despliegue continuo. |

---

## Arquitectura del Sistema

```
                      ┌──────────────────────────────────────────────┐
                      │              CLIENTE (BROWSER)               │
                      │   React + Vite + TypeScript + Tailwind CSS   │
                      │  [Catálogo]  [Panel Lector]  [Panel Admin]   │
                      └───────────────────────┬──────────────────────┘
                                              │ HTTPS / JSON / JWT
                                              ▼
                      ┌──────────────────────────────────────────────┐
                      │              BACKEND (EXPRESS)               │
                      │ ───────────────────────────────────────────  │
                      │  Middlewares: Auth (JWT), Roles, CORS        │
                      │  Rutas: /auth, /recursos, /prestamos, etc.   │
                      │  Servicios con Reglas de Negocio (RN1-RN11)  │
                      └───────────────┬──────────────────────────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
        ┌─────────────────────┐               ┌─────────────────────┐
        │  NEON POSTGRESQL    │  (Fallback)   │  IN-MEMORY MOCK DB  │
        │  Base relacional    │◄─────────────►│  Para desarrollo y  │
        │  en la nube         │               │  tests sin internet │
        └─────────────────────┘               └─────────────────────┘
```

---

## Puesta en Marcha en Entorno Local

### Prerrequisitos
- **Node.js** v20.x o superior
- **npm** v10.x o superior
- **Git**

### 1. Clonar el repositorio
```bash
git clone https://github.com/pineironatanaelet352026-oss/BiblioTech---GeneracionT---Pi-eroNatanael.git
cd BiblioTech---GeneracionT---Pi-eroNatanael
```

### 2. Configurar y levantar el Backend
```bash
cd backend
npm install

# Crear archivo de entorno a partir del ejemplo
cp .env.example .env

# Iniciar en modo desarrollo
npm run dev
```
El servidor backend quedará disponible en `http://localhost:3000`.  
Podés verificar la salud de la API abriendo `http://localhost:3000/api/health`.

### 3. Configurar y levantar el Frontend
En una nueva terminal:
```bash
cd frontend
npm install

# Iniciar servidor de desarrollo de Vite
npm run dev
```
La aplicación web quedará accesible en `http://localhost:5173`.

---

## Credenciales de Prueba Preconfiguradas

Para facilitar la evaluación de roles y reglas de negocio, el sistema incluye usuarios precargados (contraseña para todos: `password123`):

| Rol | Correo Electrónico | Contraseña | Permisos y Propósito de Prueba |
|---|---|---|---|
| **ADMIN** | `admin@bibliotech.edu` | `password123` | Mostrador de préstamos presenciales, recepción de devoluciones, auditoría de sanciones y entrega de reservas apartadas. |
| **ALUMNO** | `juan.perez@alumnos.edu` | `password123` | Lector con cupo de 2 libros, plazo de 7 días. Cuenta con un préstamo activo para pruebas. |
| **ALUMNO** | `lucia.morales@alumnos.edu` | `password123` | Alumna con cuenta limpia para probar reservas en cola FIFO o solicitud de préstamos. |
| **DOCENTE** | `martin.sosa@docentes.edu` | `password123` | Docente con cupo extendido de 4 libros y plazo de 14 días. |

---

## Ejecución de Pruebas Automatizadas

El proyecto cuenta con **31 pruebas automatizadas** que cubren el 100% de las 11 Reglas de Negocio.

```bash
cd backend
npm test
```

### Resultado esperado:
```
 ✓ src/__tests__/health.test.ts (1 test)
 ✓ src/__tests__/auth.test.ts (5 tests)
 ✓ src/__tests__/recursos.test.ts (6 tests)
 ✓ src/__tests__/prestamos.test.ts (5 tests)
 ✓ src/__tests__/renovaciones.test.ts (5 tests)
 ✓ src/__tests__/devoluciones.test.ts (4 tests)
 ✓ src/__tests__/reservas.test.ts (5 tests)

 Test Files  7 passed (7)
      Tests  31 passed (31)
   Duration  1.86s
```

La matriz completa de pruebas y resultados detallados se encuentra documentada en [`resultados-tests.md`](./resultados-tests.md).

---

## Enlaces del Proyecto

- **Repositorio GitHub:** [https://github.com/pineironatanaelet352026-oss/BiblioTech---GeneracionT---Pi-eroNatanael](https://github.com/pineironatanaelet352026-oss/BiblioTech---GeneracionT---Pi-eroNatanael)
- **Colección de Postman:** [`backend/bibliotech.postman_collection.json`](./backend/bibliotech.postman_collection.json)
- **Guía de Despliegue en la Nube:** [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- **Informe Final y Planificación:** [`informe-final.md`](./informe-final.md)
