import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Integración - Endpoint de Salud (Healthcheck)', () => {
  it('GET /api/health debería responder con status 200 y mensaje de operatividad', async () => {
    const res = await request(app).get('/api/health');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      mensaje: 'BiblioTech API funcionando correctamente',
      version: '1.0.0'
    });
  });
});
