import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Módulo de Autenticación y JWT (TASK-010)', () => {
  it('POST /api/auth/login debería autenticar con credenciales válidas y devolver token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@bibliotech.edu',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.usuario.email).toBe('admin@bibliotech.edu');
    expect(res.body.data.usuario.rol).toBe('ADMIN');
    expect(res.body.data.usuario.password).toBeUndefined(); // Sin exponer contraseñas
  });

  it('POST /api/auth/login debería rechazar credenciales incorrectas con 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@bibliotech.edu',
        password: 'clave_invalida'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Credenciales incorrectas');
  });

  it('GET /api/auth/perfil debería denegar acceso sin token con 401', async () => {
    const res = await request(app).get('/api/auth/perfil');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/perfil debería retornar el perfil del usuario con token válido', async () => {
    // 1. Obtener token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'juan.perez@alumnos.edu',
        password: 'password123'
      });

    const token = loginRes.body.data.token;

    // 2. Acceder al perfil
    const perfilRes = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${token}`);

    expect(perfilRes.status).toBe(200);
    expect(perfilRes.body.success).toBe(true);
    expect(perfilRes.body.data.email).toBe('juan.perez@alumnos.edu');
    expect(perfilRes.body.data.rol).toBe('ALUMNO');
  });

  it('GET /api/auth/usuarios debería permitir acceso a ADMIN y prohibir a ALUMNO con 403', async () => {
    // Token de alumno
    const alumnoLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'juan.perez@alumnos.edu', password: 'password123' });
    
    const alumnoToken = alumnoLogin.body.data.token;

    const resForbidden = await request(app)
      .get('/api/auth/usuarios')
      .set('Authorization', `Bearer ${alumnoToken}`);

    expect(resForbidden.status).toBe(403);

    // Token de admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bibliotech.edu', password: 'password123' });
    
    const adminToken = adminLogin.body.data.token;

    const resAdmin = await request(app)
      .get('/api/auth/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resAdmin.status).toBe(200);
    expect(Array.isArray(resAdmin.body.data)).toBe(true);
  });
});
