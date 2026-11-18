import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Módulo de Catálogo y Recursos (TASK-011 / RN1, HU1)', () => {
  it('GET /api/recursos debería listar recursos con conteo de ejemplares totales y disponibles', async () => {
    const res = await request(app).get('/api/recursos');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const primerRecurso = res.body.data[0];
    expect(primerRecurso.titulo).toBeDefined();
    expect(primerRecurso.ejemplares_totales).toBeDefined();
    expect(primerRecurso.ejemplares_disponibles).toBeDefined();
  });

  it('GET /api/recursos con filtro buscar debería filtrar por título o autor (HU1)', async () => {
    const res = await request(app).get('/api/recursos?buscar=García Márquez');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].titulo).toBe('Cien Años de Soledad');
  });

  it('GET /api/recursos con filtro categoria debería retornar solo esa categoría (HU1)', async () => {
    const res = await request(app).get('/api/recursos?categoria=Ciencias Exactas');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].titulo).toBe('Física Universitaria Volumen 1');
  });

  it('GET /api/recursos con solo_disponibles=true debería excluir títulos sin ejemplares disponibles', async () => {
    const res = await request(app).get('/api/recursos?solo_disponibles=true');

    expect(res.status).toBe(200);
    // Química Orgánica y Historia Universal no tienen disponibles en el mock inicial
    const sinStock = res.body.data.find((r: any) => r.ejemplares_disponibles === 0);
    expect(sinStock).toBeUndefined();
  });

  it('GET /api/recursos/:id debería retornar el recurso y su lista de ejemplares físicos (RN1)', async () => {
    const res = await request(app).get('/api/recursos/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(1);
    expect(Array.isArray(res.body.data.ejemplares)).toBe(true);
    expect(res.body.data.ejemplares.length).toBe(2);
    expect(res.body.data.ejemplares[0].codigo_inventario).toBe('LIT-001-A');
  });

  it('POST /api/recursos debería requerir rol ADMIN y permitir crear nuevos títulos', async () => {
    // 1. Intentar sin token -> 401
    const resSinToken = await request(app)
      .post('/api/recursos')
      .send({ titulo: 'Libro Prueba', autor: 'Autor Prueba', categoria: 'General' });
    expect(resSinToken.status).toBe(401);

    // 2. Intentar con token de ALUMNO -> 403
    const loginAlumno = await request(app)
      .post('/api/auth/login')
      .send({ email: 'juan.perez@alumnos.edu', password: 'password123' });
    const alumnoToken = loginAlumno.body.data.token;

    const resForbidden = await request(app)
      .post('/api/recursos')
      .set('Authorization', `Bearer ${alumnoToken}`)
      .send({ titulo: 'Libro Alumno', autor: 'Anon', categoria: 'General' });
    expect(resForbidden.status).toBe(403);

    // 3. Crear con token de ADMIN -> 201
    const loginAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bibliotech.edu', password: 'password123' });
    const adminToken = loginAdmin.body.data.token;

    const resCreado = await request(app)
      .post('/api/recursos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        titulo: 'Clean Code',
        autor: 'Robert C. Martin',
        isbn: '978-0132350884',
        categoria: 'Tecnología',
        descripcion: 'Manual de estilo para desarrollo ágil de software.'
      });

    expect(resCreado.status).toBe(201);
    expect(resCreado.body.data.titulo).toBe('Clean Code');
  });
});
