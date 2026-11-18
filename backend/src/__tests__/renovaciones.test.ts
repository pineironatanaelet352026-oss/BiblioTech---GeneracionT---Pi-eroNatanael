import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { PRESTAMOS_MOCK, RESERVAS_MOCK } from '../services/PrestamoService.js';

describe('Servicio de Renovaciones — RN6 y HU3 (TASK-013)', () => {
  let alumnoToken: string;
  let otroAlumnoToken: string;
  let adminToken: string;

  beforeEach(async () => {
    // Limpiar reservas y restaurar estado de préstamos para isolation
    RESERVAS_MOCK.length = 0;

    const login1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'juan.perez@alumnos.edu', password: 'password123' });
    alumnoToken = login1.body.data.token;

    const login2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'lucia.morales@alumnos.edu', password: 'password123' });
    otroAlumnoToken = login2.body.data.token;

    const loginAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bibliotech.edu', password: 'password123' });
    adminToken = loginAdmin.body.data.token;
  });

  it('POST /api/prestamos/:id/renovar debería permitir 1 renovación válida extendiendo la fecha límite en 7 días (RN6)', async () => {
    // Préstamo 1 pertenece a Juan Pérez (vence en 7 días y tiene 0 renovaciones)
    const fechaOriginal = new Date(PRESTAMOS_MOCK[0].fecha_limite).getTime();

    const res = await request(app)
      .post('/api/prestamos/1/renovar')
      .set('Authorization', `Bearer ${alumnoToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.renovaciones_realizadas).toBe(1);

    const fechaNueva = new Date(res.body.data.fecha_limite).getTime();
    const diasAgregados = Math.round((fechaNueva - fechaOriginal) / (1000 * 60 * 60 * 24));
    expect(diasAgregados).toBe(7);
  });

  it('POST /api/prestamos/:id/renovar debería rechazar un segundo intento de renovación (RN6.1)', async () => {
    // Ya tiene 1 renovación consumida
    const res = await request(app)
      .post('/api/prestamos/1/renovar')
      .set('Authorization', `Bearer ${alumnoToken}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('límite máximo de 1 renovación');
  });

  it('POST /api/prestamos/:id/renovar debería rechazar la renovación si el préstamo está vencido (RN6.2)', async () => {
    // Creamos un préstamo vencido para Juan
    const prestamoVencidoId = PRESTAMOS_MOCK.length + 1;
    PRESTAMOS_MOCK.push({
      id: prestamoVencidoId,
      ejemplar_id: 1,
      usuario_id: 2,
      bibliotecario_id: 1,
      fecha_prestamo: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      fecha_limite: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Vencido hace 3 días
      fecha_devolucion: null,
      renovaciones_realizadas: 0,
      estado: 'ACTIVO',
      estado_fisico_entrega: null,
      dias_retraso: 3
    });

    const res = await request(app)
      .post(`/api/prestamos/${prestamoVencidoId}/renovar`)
      .set('Authorization', `Bearer ${alumnoToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('se encuentra vencido (en mora)');
  });

  it('POST /api/prestamos/:id/renovar debería rechazar la renovación si otro usuario tiene una reserva activa sobre el título (RN6.4, HU3)', async () => {
    // Creamos un nuevo préstamo no vencido y con 0 renovaciones
    const nuevoId = PRESTAMOS_MOCK.length + 1;
    PRESTAMOS_MOCK.push({
      id: nuevoId,
      ejemplar_id: 6, // TEC-004-A (Recurso 4: Introducción a los Algoritmos)
      usuario_id: 2, // Juan Pérez
      bibliotecario_id: 1,
      fecha_prestamo: new Date().toISOString(),
      fecha_limite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      fecha_devolucion: null,
      renovaciones_realizadas: 0,
      estado: 'ACTIVO',
      estado_fisico_entrega: null,
      dias_retraso: 0
    });

    // Lucía Morales (usuario 3) reserva el Recurso 4
    RESERVAS_MOCK.push({
      id: 1,
      recurso_id: 4,
      usuario_id: 3,
      ejemplar_asignado_id: null,
      fecha_solicitud: new Date().toISOString(),
      fecha_asignacion: null,
      fecha_limite_retiro: null,
      estado: 'PENDIENTE'
    });

    // Juan Pérez intenta renovar el Recurso 4 -> Debe ser rechazado porque Lucía lo está esperando
    const res = await request(app)
      .post(`/api/prestamos/${nuevoId}/renovar`)
      .set('Authorization', `Bearer ${alumnoToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('existen reservas activas en cola de espera');
  });

  it('POST /api/prestamos/:id/renovar debería impedir que un lector renueve el préstamo de otro usuario (Permisos)', async () => {
    // Lucía intenta renovar el préstamo de Juan
    const res = await request(app)
      .post('/api/prestamos/1/renovar')
      .set('Authorization', `Bearer ${otroAlumnoToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('No puedes renovar el préstamo de otro usuario');
  });
});
