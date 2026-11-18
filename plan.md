# Plan Técnico y Arquitectura de Software — BiblioTech

**Versión:** 1.0.0  
**Estado:** Aprobado para Implementación  
**Fuente de verdad técnica:** spec.md (RN1 a RN11, HU1 a HU7)

---

## 1. Arquitectura General del Sistema

El sistema implementa una **arquitectura desacoplada en tres capas (Three-Tier Client-Server Architecture)** con separación estricta de responsabilidades:

1. **Capa de Presentación (Frontend SPA):** Single Page Application desarrollada en React con TypeScript, empaquetada con Vite y estilizada con Tailwind CSS. Se aloja como sitio estático en Netlify.
2. **Capa de Lógica de Negocio y API (Backend RESTful):** Servidor HTTP construido en Node.js con Express y TypeScript. Diseñado en arquitectura por capas:
   - *Controladores (Controllers):* Manejo del protocolo HTTP, parsing y respuestas.
   - *Validadores (Middleware con Zod):* Validación de tipos, esquemas y sanitización de datos de entrada.
   - *Servicios de Dominio (Services):* Implementación estricta y aislada de las 11 reglas de negocio (RN1 a RN11).
   - *Acceso a Datos (Repositories/DAO):* Consultas SQL parametrizadas para PostgreSQL.
   Se aloja como servicio web en Render.
3. **Capa de Persistencia (Base de Datos Relacional):** Instancia gestionada de PostgreSQL alojada en Neon Serverless Cloud, con claves foráneas, restricciones de unicidad y transacciones ACID con aislamiento de lectura y bloqueo de concurrencia (`SELECT ... FOR UPDATE`).

```
┌────────────────────────────────┐
│     Frontend (Netlify)         │
│   React 18 + TS + Tailwind     │
└───────────────┬────────────────┘
                │ HTTPS / JSON (CORS restringido)
                ▼
┌────────────────────────────────┐
│      Backend (Render)          │
│   Node.js + Express + TS       │
│  ┌──────────────────────────┐  │
│  │   Zod Middleware         │  │
│  ├──────────────────────────┤  │
│  │   Domain Services        │  │
│  │   (RN1 a RN11)           │  │
│  ├──────────────────────────┤  │
│  │   Data Access Layer      │  │
│  └────────────┬─────────────┘  │
└───────────────┼────────────────┘
                │ TCP / SSL (pg connection pool)
                ▼
┌────────────────────────────────┐
│   Database (Neon PostgreSQL)   │
│   Relational Schema + ACID     │
└────────────────────────────────┘
```

---

## 2. Tecnologías Elegidas y Justificación

| Componente | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + TypeScript** | Proporciona reactividad fluida, tipado estático seguro que previene errores en tiempo de compilación y alineación total con lo solicitado en la cátedra del Bootcamp. |
| **Frontend Build Tool** | **Vite** | Tiempos de arranque instantáneos en desarrollo, HMR ultrarrápido y generación de bundles altamente optimizados para producción en Netlify. |
| **Estilos** | **Tailwind CSS** | Utilidades CSS para un diseño limpio, moderno, completamente responsive (móvil, tablet, escritorio) y sin overhead de hojas de estilo desordenadas. |
| **Backend Runtime** | **Node.js (LTS v20+)** | Entorno asíncrono no bloqueante de alto rendimiento para I/O y APIs RESTful. |
| **Backend Framework** | **Express.js + TypeScript** | Minimalista, maduro, extensible mediante middlewares y tipado de extremo a extremo garantizado. |
| **Validación de Datos** | **Zod** | Inferencia de tipos estáticos en TypeScript a partir de esquemas de validación de entrada en tiempo de ejecución. Previene inyección de payloads corruptos. |
| **Base de Datos** | **PostgreSQL (Neon)** | Soporte nativo para integridad referencial estricta, restricciones compuestas, tipos ENUM, fechas con zona horaria y transacciones atómicas indispensables para evitar sobreventas o préstamos dobles en simultáneo. |
| **Testing** | **Vitest / Jest + Supertest** | Entorno rápido para pruebas unitarias de lógica pura de servicios y pruebas de integración de endpoints HTTP. |

---

## 3. Modelo de Datos Relacional (PostgreSQL)

### 3.1. Tipos Enumerados (ENUMs)
```sql
CREATE TYPE rol_usuario AS ENUM ('ADMIN', 'ALUMNO', 'DOCENTE');
CREATE TYPE estado_usuario AS ENUM ('ACTIVO', 'BLOQUEADO_POR_MORA', 'BLOQUEADO_ADMINISTRATIVO', 'SUSPENDIDO');
CREATE TYPE estado_ejemplar AS ENUM ('DISPONIBLE', 'PRESTADO', 'RESERVADO', 'EN_REPARACION', 'DADO_DE_BAJA');
CREATE TYPE estado_prestamo AS ENUM ('ACTIVO', 'DEVUELTO', 'VENCIDO');
CREATE TYPE estado_reserva AS ENUM ('PENDIENTE', 'ASIGNADA', 'FINALIZADA', 'CADUCADA', 'CANCELADA');
CREATE TYPE estado_fisico_devolucion AS ENUM ('OPTIMO', 'DETERIORADO', 'EXTRAVIADO');
```

### 3.2. Definición de Tablas y Relaciones

#### Tabla: `usuarios`
- `id` (SERIAL PRIMARY KEY)
- `dni` (VARCHAR(20) UNIQUE NOT NULL)
- `nombre` (VARCHAR(100) NOT NULL)
- `apellido` (VARCHAR(100) NOT NULL)
- `email` (VARCHAR(150) UNIQUE NOT NULL)
- `password_hash` (VARCHAR(255) NOT NULL)
- `rol` (rol_usuario NOT NULL DEFAULT 'ALUMNO')
- `estado` (estado_usuario NOT NULL DEFAULT 'ACTIVO')
- `fecha_fin_suspension` (TIMESTAMP WITH TIME ZONE NULL)
- `creado_en` (TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)

#### Tabla: `recursos` (Catálogo / Títulos)
- `id` (SERIAL PRIMARY KEY)
- `titulo` (VARCHAR(200) NOT NULL)
- `autor` (VARCHAR(150) NOT NULL)
- `isbn` (VARCHAR(20) UNIQUE NULL)
- `categoria` (VARCHAR(100) NOT NULL)
- `descripcion` (TEXT NULL)
- `portada_url` (VARCHAR(500) NULL)
- `creado_en` (TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)

#### Tabla: `ejemplares` (Copias físicas individuales)
- `id` (SERIAL PRIMARY KEY)
- `recurso_id` (INT NOT NULL REFERENCES recursos(id) ON DELETE RESTRICT)
- `codigo_inventario` (VARCHAR(50) UNIQUE NOT NULL)
- `ubicacion_estante` (VARCHAR(50) NOT NULL)
- `estado` (estado_ejemplar NOT NULL DEFAULT 'DISPONIBLE')
- `actualizado_en` (TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)

#### Tabla: `prestamos`
- `id` (SERIAL PRIMARY KEY)
- `ejemplar_id` (INT NOT NULL REFERENCES ejemplares(id) ON DELETE RESTRICT)
- `usuario_id` (INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT)
- `bibliotecario_id` (INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT)
- `fecha_prestamo` (TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP)
- `fecha_limite` (TIMESTAMP WITH TIME ZONE NOT NULL)
- `fecha_devolucion` (TIMESTAMP WITH TIME ZONE NULL)
- `renovaciones_realizadas` (INT NOT NULL DEFAULT 0)
- `estado` (estado_prestamo NOT NULL DEFAULT 'ACTIVO')
- `estado_fisico_entrega` (estado_fisico_devolucion NULL)
- `dias_retraso` (INT NOT NULL DEFAULT 0)

#### Tabla: `reservas` (Cola FIFO)
- `id` (SERIAL PRIMARY KEY)
- `recurso_id` (INT NOT NULL REFERENCES recursos(id) ON DELETE RESTRICT)
- `usuario_id` (INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT)
- `ejemplar_asignado_id` (INT NULL REFERENCES ejemplares(id) ON DELETE SET NULL)
- `fecha_solicitud` (TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP)
- `fecha_asignacion` (TIMESTAMP WITH TIME ZONE NULL)
- `fecha_limite_retiro` (TIMESTAMP WITH TIME ZONE NULL) -- Ventana 48 hs
- `estado` (estado_reserva NOT NULL DEFAULT 'PENDIENTE')

#### Tabla: `sanciones`
- `id` (SERIAL PRIMARY KEY)
- `usuario_id` (INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT)
- `prestamo_id` (INT NOT NULL REFERENCES prestamos(id) ON DELETE RESTRICT)
- `dias_sancion` (INT NOT NULL)
- `fecha_inicio` (TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP)
- `fecha_fin` (TIMESTAMP WITH TIME ZONE NOT NULL)
- `motivo` (TEXT NOT NULL)

---

## 4. Endpoints de la API REST

Todos los endpoints que modifican estado responden con formato estándar JSON:
`{ "success": boolean, "data": any, "error": string | null }`

### 4.1. Autenticación y Usuarios
- `POST /api/auth/login`: Autenticación con email/contraseña y entrega de token JWT + datos de perfil.
- `GET /api/auth/perfil`: Datos del usuario autenticado (incluye estado de sanciones y mora).
- `GET /api/usuarios`: [Solo ADMIN] Listado de lectores con filtros de estado y mora.

### 4.2. Catálogo y Recursos
- `GET /api/recursos`: Listado público con filtros (`buscar`, `categoria`, `solo_disponibles`). Retorna metadatos del recurso, total de ejemplares y cantidad de ejemplares disponibles.
- `GET /api/recursos/:id`: Detalle del recurso y listado de sus ejemplares físicos.
- `POST /api/recursos`: [Solo ADMIN] Alta de nuevo título bibliográfico.
- `POST /api/recursos/:id/ejemplares`: [Solo ADMIN] Registro de un nuevo ejemplar físico individual.

### 4.3. Préstamos
- `GET /api/prestamos`: Listado de préstamos (filtrable por usuario o estado; lectores solo ven los propios, ADMIN ve todos).
- `POST /api/prestamos`: [Solo ADMIN] Registro de préstamo presencial en mostrador.
  - *Body:* `{ "usuario_id": number, "ejemplar_id": number }`
  - *Validaciones:* RN1, RN2, RN3, RN4.
- `POST /api/prestamos/:id/renovar`: Solicitud de renovación (Lector o Admin).
  - *Validaciones:* RN6.
- `POST /api/prestamos/:id/devolver`: [Solo ADMIN] Registro de devolución presencial.
  - *Body:* `{ "estado_fisico": "OPTIMO" | "DETERIORADO" | "EXTRAVIADO" }`
  - *Validaciones:* RN4, RN5, RN8, RN11.

### 4.4. Reservas
- `GET /api/reservas`: Listado de reservas activas del usuario o cola completa para ADMIN.
- `POST /api/reservas`: Solicitud de incorporación a cola de reserva para título sin stock.
  - *Body:* `{ "recurso_id": number }`
  - *Validaciones:* RN7.
- `DELETE /api/reservas/:id`: Cancelación voluntaria de reserva.
  - *Validaciones:* RN10.
- `POST /api/reservas/:id/retirar`: [Solo ADMIN] Efectivización presencial del retiro del libro apartado.
  - *Validaciones:* RN8, RN9.

---

## 5. Matriz de Trazabilidad: ¿Dónde se implementa cada Regla de Negocio?

| Regla de Negocio | Capa Principal de Implementación | Componente / Archivo | Mecanismo de Garantía |
| :--- | :--- | :--- | :--- |
| **RN1** (Identificación y estados de ejemplares) | DB y Backend Service | `schema.sql`, `EjemplarService.ts` | Tipo ENUM estricto en DB y validación en transacciones antes de conmutar estados. |
| **RN2** (Cupos máximos: 2 Alumnos / 4 Docentes) | Backend Domain Service | `PrestamoService.ts` | Conteo de préstamos activos en DB previo al insert; rechazo con código `409 Conflict` si excede el límite del rol. |
| **RN3** (Plazos: 7 días Alumnos / 14 días Docentes) | Backend Domain Service | `PrestamoService.ts` | Cálculo matemático de `fecha_limite = fecha_actual + INTERVAL '7 days'` o `'14 days'` al momento de la inserción. |
| **RN4** (Detección de Mora y Bloqueo preventivo) | Backend Service y DB Query | `UsuarioService.ts`, `PrestamoService.ts` | Verificación en tiempo real: si existe algún préstamo con `fecha_limite < NOW()` y `estado = 'ACTIVO'`, el usuario queda bloqueado para toda operación. |
| **RN5** (Sanción por mora: $2 \times \text{días de retraso}$) | Backend Domain Service | `DevolucionService.ts`, `SancionService.ts` | En la devolución tardía, se calculan días completos de retraso y se inserta registro en `sanciones` con `fecha_fin = NOW() + (dias_retraso * 2 days)`. |
| **RN6** (Condiciones de renovación: 1 vez, sin mora, sin reservas) | Backend Domain Service | `PrestamoService.ts` | Validación atómica: `renovaciones_realizadas < 1`, `fecha_limite >= NOW()`, usuario sin sanciones y `COUNT(reservas pendientes para recurso) = 0`. |
| **RN7** (Reserva solo con stock 0 y cola FIFO) | Backend Domain Service | `ReservaService.ts` | Verifica que `COUNT(ejemplares DISPONIBLE) = 0` y que el usuario no tenga reservas duplicadas; inserta con timestamp para respetar orden FIFO. |
| **RN8** (Asignación automática y ventana de 48 hs) | Backend Domain Service | `DevolucionService.ts` | Al devolver un ejemplar, si hay reservas `PENDIENTE`, asigna el ejemplar a la reserva más antigua y fija `fecha_limite_retiro = NOW() + INTERVAL '48 hours'`. |
| **RN9** (Verificación de cupo al retirar reserva) | Backend Domain Service | `PrestamoService.ts` | Al efectivizar el retiro de mostrador, se reevalúa RN2; si el usuario tiene cupo lleno, se exige devolver uno previo. |
| **RN10** (Cancelación de reserva y reasignación inmediata) | Backend Domain Service | `ReservaService.ts` | Al cancelar, si el ejemplar estaba en estado `RESERVADO`, se consulta de inmediato el siguiente en la cola FIFO para transferirlo o liberarlo a `DISPONIBLE`. |
| **RN11** (Devolución deteriorada/extraviada y bloqueo) | Backend Domain Service | `DevolucionService.ts` | Si el estado físico devuelto es `DETERIORADO` o `EXTRAVIADO`, el ejemplar cambia de estado y el usuario recibe `BLOQUEADO_ADMINISTRATIVO`. |

---

## 6. Seguridad y Manejo de Variables de Entorno

1. **Variables de Entorno Estrictas:**
   - En ningún caso se comitean credenciales.
   - Se creará `.env.example` en la raíz del backend con variables modelo:
     - `PORT=3000`
     - `DATABASE_URL=postgresql://user:password@host/db?sslmode=require`
     - `JWT_SECRET=super_secret_jwt_key_example`
     - `FRONTEND_URL=https://bibliotech-demo.netlify.app`
2. **CORS Seguro:**
   - Express configurado para restringir orígenes permitidos únicamente al dominio del frontend desplegado en Netlify y `http://localhost:5173` en desarrollo.
3. **Validación y Sanitización:**
   - Todos los bodies de requests pasan por schemas de Zod antes de alcanzar la capa de servicio.
4. **Prevención de Inyecciones:**
   - 100% de las consultas a base de datos utilizan parámetros enlazados (`$1, $2, ...`) a través del driver `pg`. No se concatenan cadenas SQL.

---

## 7. Estrategia de Despliegue en la Nube

1. **Base de Datos (Neon PostgreSQL):**
   - Instancia creada con SSL obligatorio (`sslmode=require`).
   - Script `schema.sql` y `seed.sql` ejecutables de forma idempotente para inicializar tablas y datos de prueba.
2. **Backend (Render):**
   - Publicación como *Web Service*.
   - Comando de compilación: `npm install && npm run build`.
   - Comando de arranque: `npm start` (ejecuta `node dist/server.js`).
   - Carga de variables de entorno seguras desde el panel de Render.
3. **Frontend (Netlify):**
   - Publicación como *Single Page Application*.
   - Comando de compilación: `npm install && npm run build`.
   - Directorio de publicación: `dist`.
   - Archivo `_redirects` (`/* /index.html 200`) para compatibilidad con React Router.
   - Variable de entorno `VITE_API_URL` apuntando a la URL pública del backend en Render.
