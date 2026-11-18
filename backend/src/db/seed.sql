-- Datos Semilla de Prueba — BiblioTech
-- Usuarios, Recursos, Ejemplares y Estados para validar RN1 a RN11

-- 1. Inserción de Usuarios de Prueba
-- Contraseña simulada para todos: 'password123'
INSERT INTO usuarios (dni, nombre, apellido, email, password_hash, rol, estado) VALUES
('ADMIN01', 'Laura', 'González', 'admin@bibliotech.edu', '$2b$10$wT8B1vDkF9CZy5JkL7X2.uW0E8IeG3kM6P9qL1vR4sT7yU0wX2Z3a', 'ADMIN', 'ACTIVO'),
('ALUMNO01', 'Juan', 'Pérez', 'juan.perez@alumnos.edu', '$2b$10$wT8B1vDkF9CZy5JkL7X2.uW0E8IeG3kM6P9qL1vR4sT7yU0wX2Z3a', 'ALUMNO', 'ACTIVO'),
('ALUMNO02', 'Lucía', 'Morales', 'lucia.morales@alumnos.edu', '$2b$10$wT8B1vDkF9CZy5JkL7X2.uW0E8IeG3kM6P9qL1vR4sT7yU0wX2Z3a', 'ALUMNO', 'ACTIVO'),
('DOCENTE01', 'Martín', 'Sosa', 'martin.sosa@docentes.edu', '$2b$10$wT8B1vDkF9CZy5JkL7X2.uW0E8IeG3kM6P9qL1vR4sT7yU0wX2Z3a', 'DOCENTE', 'ACTIVO');

-- 2. Inserción de Recursos Bibliográficos (Títulos)
INSERT INTO recursos (titulo, autor, isbn, categoria, descripcion, portada_url) VALUES
('Cien Años de Soledad', 'Gabriel García Márquez', '978-0307474728', 'Literatura Latinoamericana', 'Obra maestra de la literatura universal que narra la historia de la familia Buendía en Macondo.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'),
('Física Universitaria Volumen 1', 'Sears & Zemansky', '978-6073221900', 'Ciencias Exactas', 'Texto de referencia fundamental para el aprendizaje de mecánica, ondas y termodinámica.', 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&q=80&w=400'),
('Química Orgánica', 'Paula Yurkanis Bruice', '978-8478290741', 'Química', 'Fundamentos modernos de reactividad química, estructura molecular y mecanismos de reacción.', 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&q=80&w=400'),
('Introducción a los Algoritmos', 'Thomas Cormen', '978-0262033848', 'Tecnología', 'Guía integral y rigurosa sobre diseño y análisis de estructuras de datos y algoritmos computacionales.', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=400'),
('Historia Universal Contemporánea', 'María Ramírez', '978-9500732111', 'Historia', 'Análisis detallado de los procesos geopolíticos y sociales de los siglos XX y XXI.', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=400');

-- 3. Inserción de Ejemplares Físicos (Instancias de Títulos)
-- Cien Años de Soledad: 2 ejemplares (1 DISPONIBLE, 1 PRESTADO para probar)
INSERT INTO ejemplares (recurso_id, codigo_inventario, ubicacion_estante, estado) VALUES
(1, 'LIT-001-A', 'Estante A-1', 'DISPONIBLE'),
(1, 'LIT-001-B', 'Estante A-1', 'PRESTADO');

-- Física Universitaria: 2 ejemplares (ambos DISPONIBLES)
INSERT INTO ejemplares (recurso_id, codigo_inventario, ubicacion_estante, estado) VALUES
(2, 'FIS-002-A', 'Estante B-3', 'DISPONIBLE'),
(2, 'FIS-002-B', 'Estante B-3', 'DISPONIBLE');

-- Química Orgánica: 1 único ejemplar (PRESTADO para probar la cola de reservas con stock 0 - RN7)
INSERT INTO ejemplares (recurso_id, codigo_inventario, ubicacion_estante, estado) VALUES
(3, 'QUI-003-A', 'Estante C-2', 'PRESTADO');

-- Introducción a los Algoritmos: 1 ejemplar DISPONIBLE
INSERT INTO ejemplares (recurso_id, codigo_inventario, ubicacion_estante, estado) VALUES
(4, 'TEC-004-A', 'Estante D-5', 'DISPONIBLE');

-- Historia Universal: 1 ejemplar EN_REPARACION (para probar RN1 y exclusión de préstamos)
INSERT INTO ejemplares (recurso_id, codigo_inventario, ubicacion_estante, estado) VALUES
(5, 'HIS-005-A', 'Taller Técnico', 'EN_REPARACION');

-- 4. Préstamo Inicial Activo para Pruebas (Juan Pérez tiene prestado Química Orgánica)
INSERT INTO prestamos (ejemplar_id, usuario_id, bibliotecario_id, fecha_prestamo, fecha_limite, estado) VALUES
(4, 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', 'ACTIVO');
