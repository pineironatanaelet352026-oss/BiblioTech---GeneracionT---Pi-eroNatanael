-- Esquema DDL de Base de Datos para PostgreSQL (Neon) — BiblioTech
-- Cumple con el modelo de datos definido en plan.md y spec.md

-- 1. Eliminación en cascada para scripts idempotentes (recreación limpia)
DROP TABLE IF EXISTS sanciones CASCADE;
DROP TABLE IF EXISTS reservas CASCADE;
DROP TABLE IF EXISTS prestamos CASCADE;
DROP TABLE IF EXISTS ejemplares CASCADE;
DROP TABLE IF EXISTS recursos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

DROP TYPE IF EXISTS estado_fisico_devolucion CASCADE;
DROP TYPE IF EXISTS estado_reserva CASCADE;
DROP TYPE IF EXISTS estado_prestamo CASCADE;
DROP TYPE IF EXISTS estado_ejemplar CASCADE;
DROP TYPE IF EXISTS estado_usuario CASCADE;
DROP TYPE IF EXISTS rol_usuario CASCADE;

-- 2. Creación de Tipos Enumerados (ENUMs)
CREATE TYPE rol_usuario AS ENUM ('ADMIN', 'ALUMNO', 'DOCENTE');
CREATE TYPE estado_usuario AS ENUM ('ACTIVO', 'BLOQUEADO_POR_MORA', 'BLOQUEADO_ADMINISTRATIVO', 'SUSPENDIDO');
CREATE TYPE estado_ejemplar AS ENUM ('DISPONIBLE', 'PRESTADO', 'RESERVADO', 'EN_REPARACION', 'DADO_DE_BAJA');
CREATE TYPE estado_prestamo AS ENUM ('ACTIVO', 'DEVUELTO', 'VENCIDO');
CREATE TYPE estado_reserva AS ENUM ('PENDIENTE', 'ASIGNADA', 'FINALIZADA', 'CADUCADA', 'CANCELADA');
CREATE TYPE estado_fisico_devolucion AS ENUM ('OPTIMO', 'DETERIORADO', 'EXTRAVIADO');

-- 3. Tabla: usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'ALUMNO',
    estado estado_usuario NOT NULL DEFAULT 'ACTIVO',
    fecha_fin_suspension TIMESTAMP WITH TIME ZONE NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla: recursos (Títulos / Obras)
CREATE TABLE recursos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    autor VARCHAR(150) NOT NULL,
    isbn VARCHAR(20) UNIQUE NULL,
    categoria VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    portada_url VARCHAR(500) NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla: ejemplares (Copias físicas individuales con RN1)
CREATE TABLE ejemplares (
    id SERIAL PRIMARY KEY,
    recurso_id INT NOT NULL REFERENCES recursos(id) ON DELETE RESTRICT,
    codigo_inventario VARCHAR(50) UNIQUE NOT NULL,
    ubicacion_estante VARCHAR(50) NOT NULL,
    estado estado_ejemplar NOT NULL DEFAULT 'DISPONIBLE',
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla: prestamos (Registra trazabilidad de RN2, RN3, RN4, RN6)
CREATE TABLE prestamos (
    id SERIAL PRIMARY KEY,
    ejemplar_id INT NOT NULL REFERENCES ejemplares(id) ON DELETE RESTRICT,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    bibliotecario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha_prestamo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_limite TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_devolucion TIMESTAMP WITH TIME ZONE NULL,
    renovaciones_realizadas INT NOT NULL DEFAULT 0,
    estado estado_prestamo NOT NULL DEFAULT 'ACTIVO',
    estado_fisico_entrega estado_fisico_devolucion NULL,
    dias_retraso INT NOT NULL DEFAULT 0
);

-- 7. Tabla: reservas (Cola FIFO y ventana 48 hs para RN7, RN8, RN9, RN10)
CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    recurso_id INT NOT NULL REFERENCES recursos(id) ON DELETE RESTRICT,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    ejemplar_asignado_id INT NULL REFERENCES ejemplares(id) ON DELETE SET NULL,
    fecha_solicitud TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_asignacion TIMESTAMP WITH TIME ZONE NULL,
    fecha_limite_retiro TIMESTAMP WITH TIME ZONE NULL,
    estado estado_reserva NOT NULL DEFAULT 'PENDIENTE'
);

-- 8. Tabla: sanciones (Historial de penalizaciones para RN5)
CREATE TABLE sanciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    prestamo_id INT NOT NULL REFERENCES prestamos(id) ON DELETE RESTRICT,
    dias_sancion INT NOT NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    motivo TEXT NOT NULL
);

-- 9. Índices para optimización de consultas concurrentes y FIFO
CREATE INDEX idx_ejemplares_recurso_estado ON ejemplares(recurso_id, estado);
CREATE INDEX idx_prestamos_usuario_estado ON prestamos(usuario_id, estado);
CREATE INDEX idx_reservas_recurso_fecha ON reservas(recurso_id, fecha_solicitud ASC) WHERE estado = 'PENDIENTE';
