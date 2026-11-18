import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { RESERVAS_MOCK, PRESTAMOS_MOCK } from '../services/PrestamoService.js';
import { EJEMPLARES_MOCK } from '../services/RecursoService.js';

describe('Servicio de Reservas — RN7, RN8, RN9, RN10, HU5, HU6 y HU7 (TASK-015)', () => {
  let alumnoToken: string;
  let otroAlumnoToken: string;
  let adminToken: string;

  beforeEach(async () => {
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

  it('POST /api/reservas debería permitir reservar solo si el stock disponible es 0 (RN7, HU5.1)', async () => {
    // Recurso 3 (Química Orgánica) tiene su único ejemplar PRESTADO (stock disp = 0)
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${otroAlumnoToken}`)
      .send({ recurso_id: 3 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recurso_id).toBe(3);
    expect(res.body.data.estado).toBe('PENDIENTE');
    expect(res.body.data.posicion_en_cola).toBe(1);
  });

  it('POST /api/reservas debería rechazar si el recurso TIENE ejemplares disponibles en mostrador (RN7.1)', async () => {
    // Recurso 2 (Física Universitaria) tiene ejemplares disponibles
    const ej2 = EJEMPLARES_MOCK.find(e => e.recurso_id === 2);
    if (ej2) ej2.estado = 'DISPONIBLE';

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${otroAlumnoToken}`)
      .send({ recurso_id: 2 });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('No se requiere reserva, retíralo directamente');
  });

  it('POST /api/reservas debería rechazar reserva duplicada activa del mismo usuario (RN7.3)', async () => {
    // Lucía ya reservó el recurso 3 en el test anterior o la agregamos:
    RESERVAS_MOCK.push({
      id: 1,
      recurso_id: 3,
      usuario_id: 3,
      ejemplar_asignado_id: null,
      fecha_solicitud: new Date().toISOString(),
      fecha_asignacion: null,
      fecha_limite_retiro: null,
      estado: 'PENDIENTE'
    });

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${otroAlumnoToken}`)
      .send({ recurso_id: 3 });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('Ya posees una reserva activa');
  });

  it('DELETE /api/reservas/:id debería cancelar voluntariamente y reasignar de inmediato al siguiente (RN10, HU6)', async () => {
    // Asignamos ejemplar 5 a la reserva de Lucía con 48 hs de ventana
    RESERVAS_MOCK.push({
      id: 10,
      recurso_id: 3,
      usuario_id: 3, // Lucía
      ejemplar_asignado_id: 5,
      fecha_solicitud: new Date().toISOString(),
      fecha_asignacion: new Date().toISOString(),
      fecha_limite_retiro: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      estado: 'ASIGNADA'
    });

    // Juan Pérez es el siguiente en cola FIFO
    RESERVAS_MOCK.push({
      id: 11,
      recurso_id: 3,
      usuario_id: 2, // Juan
      ejemplar_asignado_id: null,
      fecha_solicitud: new Date().toISOString(),
      fecha_asignacion: null,
      fecha_limite_retiro: null,
      estado: 'PENDIENTE'
    });

    // Lucía cancela su reserva
    const res = await request(app)
      .delete('/api/reservas/10')
      .set('Authorization', `Bearer ${otroAlumnoToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.reserva.estado).toBe('CANCELADA');
    expect(res.body.data.reasignado_a_siguiente).toBe(true);

    // Comprobar que la reserva de Juan pasó inmediatamente a ASIGNADA con sus 48 hs
    const reservaJuan = RESERVAS_MOCK.find(r => r.id === 11);
    expect(reservaJuan?.estado).toBe('ASIGNADA');
    expect(reservaJuan?.ejemplar_asignado_id).toBe(5);
  });

  it('POST /api/reservas/:id/retirar debería validar cupo del usuario antes de otorgar el libro reservado (RN9, HU7)', async () => {
    // Lucía tiene una reserva asignada
    RESERVAS_MOCK.push({
      id: 20,
      recurso_id: 3,
      usuario_id: 3, // Lucía
      ejemplar_asignado_id: 5,
      fecha_solicitud: new Date().toISOString(),
      fecha_asignacion: new Date().toISOString(),
      fecha_limite_retiro: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      estado: 'ASIGNADA'
    });

    // Simulamos que Lucía ya tiene 2 libros prestados activos (cupo lleno para Alumno)
    PRESTAMOS_MOCK.length = 0;
    PRESTAMOS_MOCK.push(
      { id: 101, ejemplar_id: 1, usuario_id: 3, bibliotecario_id: 1, fecha_prestamo: new Date().toISOString(), fecha_limite: new Date(Date.now() + 5*24*60*60*1000).toISOString(), fecha_devolucion: null, renovaciones_realizadas: 0, estado: 'ACTIVO', estado_fisico_entrega: null, dias_retraso: 0 },
      { id: 102, ejemplar_id: 2, usuario_id: 3, bibliotecario_id: 1, fecha_prestamo: new Date().toISOString(), fecha_limite: new Date(Date.now() + 5*24*60*60*1000).toISOString(), fecha_devolucion: null, renovaciones_realizadas: 0, estado: 'ACTIVO', estado_fisico_entrega: null, dias_retraso: 0 }
    );

    // Al presentarse a retirar, el bibliotecario intenta confirmar -> Rechaza por RN9 (debe devolver uno primero)
    const res = await request(app)
      .post('/api/reservas/20/retirar')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('Operación rechazada por cupo (RN9)');
  });
});
