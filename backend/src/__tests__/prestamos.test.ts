import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { PRESTAMOS_MOCK } from '../services/PrestamoService.js';
import { EJEMPLARES_MOCK } from '../services/RecursoService.js';
import { USUARIOS_MOCK } from '../services/AuthService.js';

describe('Servicio de Préstamos — RN1, RN2, RN3, RN4 y HU2 (TASK-012)', () => {
  let adminToken: string;
  let alumnoToken: string;

  beforeEach(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bibliotech.edu', password: 'password123' });
    adminToken = adminLogin.body.data.token;

    const alumnoLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'juan.perez@alumnos.edu', password: 'password123' });
    alumnoToken = alumnoLogin.body.data.token;
  });

  it('POST /api/prestamos debería crear un préstamo para Alumno con plazo exacto de 7 días corridos (RN3)', async () => {
    // Alumno 3 (Lucía Morales) pide ejemplar 3 (Física Universitaria A)
    const res = await request(app)
      .post('/api/prestamos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        usuario_id: 3,
        ejemplar_id: 3
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.usuario_nombre).toBe('Lucía Morales');
    expect(res.body.data.estado).toBe('ACTIVO');

    // Comprobar diferencia de fecha límite (7 días = 7 * 24 * 60 * 60 * 1000 ms aprox)
    const fPrestamo = new Date(res.body.data.fecha_prestamo).getTime();
    const fLimite = new Date(res.body.data.fecha_limite).getTime();
    const diasDiferencia = Math.round((fLimite - fPrestamo) / (1000 * 60 * 60 * 24));
    expect(diasDiferencia).toBe(7);

    // Comprobar que el ejemplar pasó a estado PRESTADO (RN1)
    const ej = EJEMPLARES_MOCK.find(e => e.id === 3);
    expect(ej?.estado).toBe('PRESTADO');
  });

  it('POST /api/prestamos debería crear un préstamo para Docente con plazo exacto de 14 días corridos (RN3)', async () => {
    // Docente 4 (Martín Sosa) pide ejemplar 4 (Física Universitaria B)
    const res = await request(app)
      .post('/api/prestamos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        usuario_id: 4,
        ejemplar_id: 4
      });

    expect(res.status).toBe(201);
    const fPrestamo = new Date(res.body.data.fecha_prestamo).getTime();
    const fLimite = new Date(res.body.data.fecha_limite).getTime();
    const diasDiferencia = Math.round((fLimite - fPrestamo) / (1000 * 60 * 60 * 24));
    expect(diasDiferencia).toBe(14);
  });

  it('POST /api/prestamos debería rechazar si un ALUMNO ya tiene 2 préstamos activos (RN2 - Límite de cupo)', async () => {
    // Lucía Morales ya tiene 1 (ejemplar 3). Le asignamos un segundo (ejemplar 6):
    await request(app)
      .post('/api/prestamos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ usuario_id: 3, ejemplar_id: 6 });

    // Intento de 3er préstamo -> Debe rechazar con 409
    const res = await request(app)
      .post('/api/prestamos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ usuario_id: 3, ejemplar_id: 1 });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Cupo máximo alcanzado (2 préstamos simultáneos');
  });

  it('POST /api/prestamos debería rechazar si el usuario tiene un préstamo vencido (RN4 - Mora activa)', async () => {
    // Forzamos un préstamo vencido a Juan Pérez
    const fechaAyer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    PRESTAMOS_MOCK.push({
      id: 999,
      ejemplar_id: 1,
      usuario_id: 2, // Juan Pérez
      bibliotecario_id: 1,
      fecha_prestamo: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      fecha_limite: fechaAyer, // Vencido
      fecha_devolucion: null,
      renovaciones_realizadas: 0,
      estado: 'ACTIVO',
      estado_fisico_entrega: null,
      dias_retraso: 1
    });

    // Intentar registrar un nuevo préstamo para Juan
    const res = await request(app)
      .post('/api/prestamos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ usuario_id: 2, ejemplar_id: 1 });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Mora activa');
  });

  it('POST /api/prestamos debería rechazar si un ALUMNO intenta registrar un préstamo (Permiso solo ADMIN)', async () => {
    const res = await request(app)
      .post('/api/prestamos')
      .set('Authorization', `Bearer ${alumnoToken}`)
      .send({ usuario_id: 2, ejemplar_id: 1 });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Permisos insuficientes');
  });
});
