import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { PRESTAMOS_MOCK, RESERVAS_MOCK } from '../services/PrestamoService.js';
import { EJEMPLARES_MOCK } from '../services/RecursoService.js';
import { USUARIOS_MOCK } from '../services/AuthService.js';
import { SANCIONES_MOCK } from '../services/DevolucionService.js';

describe('Servicio de Devoluciones y Sanciones — RN4, RN5, RN11 y HU4 (TASK-014)', () => {
  let adminToken: string;
  let alumnoToken: string;

  beforeEach(async () => {
    SANCIONES_MOCK.length = 0;
    RESERVAS_MOCK.length = 0;

    const loginAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bibliotech.edu', password: 'password123' });
    adminToken = loginAdmin.body.data.token;

    const loginAlumno = await request(app)
      .post('/api/auth/login')
      .send({ email: 'juan.perez@alumnos.edu', password: 'password123' });
    alumnoToken = loginAlumno.body.data.token;
  });

  it('POST /api/prestamos/:id/devolver debería registrar entrega a término, liberar ejemplar y no sancionar (HU4.1)', async () => {
    // Crear un préstamo vigente a término
    const idPrestamo = PRESTAMOS_MOCK.length + 1;
    PRESTAMOS_MOCK.push({
      id: idPrestamo,
      ejemplar_id: 1, // LIT-001-A
      usuario_id: 2, // Juan Pérez
      bibliotecario_id: 1,
      fecha_prestamo: new Date().toISOString(),
      fecha_limite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Vence en 5 días
      fecha_devolucion: null,
      renovaciones_realizadas: 0,
      estado: 'ACTIVO',
      estado_fisico_entrega: null,
      dias_retraso: 0
    });
    EJEMPLARES_MOCK.find(e => e.id === 1)!.estado = 'PRESTADO';

    const res = await request(app)
      .post(`/api/prestamos/${idPrestamo}/devolver`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado_fisico: 'OPTIMO' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.prestamo.estado).toBe('DEVUELTO');
    expect(res.body.data.dias_retraso).toBe(0);
    expect(res.body.data.sancion).toBeNull();
    expect(res.body.data.ejemplar_estado).toBe('DISPONIBLE');
  });

  it('POST /api/prestamos/:id/devolver con mora debería calcular suspensión de 2 días por día de retraso (RN5, HU4.2)', async () => {
    // Préstamo vencido hace 3 días corridos
    const idPrestamo = PRESTAMOS_MOCK.length + 1;
    const fechaVencida = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    PRESTAMOS_MOCK.push({
      id: idPrestamo,
      ejemplar_id: 3, // FIS-002-A
      usuario_id: 2, // Juan Pérez
      bibliotecario_id: 1,
      fecha_prestamo: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      fecha_limite: fechaVencida,
      fecha_devolucion: null,
      renovaciones_realizadas: 0,
      estado: 'ACTIVO',
      estado_fisico_entrega: null,
      dias_retraso: 0
    });

    const res = await request(app)
      .post(`/api/prestamos/${idPrestamo}/devolver`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado_fisico: 'OPTIMO' });

    expect(res.status).toBe(200);
    expect(res.body.data.dias_retraso).toBe(3);
    // Cumple RN5: 3 días de mora * 2 = 6 días de suspensión
    expect(res.body.data.sancion).not.toBeNull();
    expect(res.body.data.sancion.dias_sancion).toBe(6);
    expect(res.body.data.usuario_estado_actual).toBe('SUSPENDIDO');
  });

  it('POST /api/prestamos/:id/devolver con daño físico debería pasar ejemplar a EN_REPARACION y aplicar BLOQUEO_ADMINISTRATIVO (RN11, HU4.3)', async () => {
    const idPrestamo = PRESTAMOS_MOCK.length + 1;
    PRESTAMOS_MOCK.push({
      id: idPrestamo,
      ejemplar_id: 4, // FIS-002-B
      usuario_id: 3, // Lucía Morales
      bibliotecario_id: 1,
      fecha_prestamo: new Date().toISOString(),
      fecha_limite: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      fecha_devolucion: null,
      renovaciones_realizadas: 0,
      estado: 'ACTIVO',
      estado_fisico_entrega: null,
      dias_retraso: 0
    });

    const res = await request(app)
      .post(`/api/prestamos/${idPrestamo}/devolver`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado_fisico: 'DETERIORADO' });

    expect(res.status).toBe(200);
    expect(res.body.data.ejemplar_estado).toBe('EN_REPARACION');
    expect(res.body.data.usuario_estado_actual).toBe('BLOQUEADO_ADMINISTRATIVO');
  });

  it('POST /api/prestamos/:id/devolver debería rechazar si un ALUMNO intenta registrar la devolución (Permiso solo ADMIN)', async () => {
    const res = await request(app)
      .post('/api/prestamos/1/devolver')
      .set('Authorization', `Bearer ${alumnoToken}`)
      .send({ estado_fisico: 'OPTIMO' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Permisos insuficientes');
  });
});
