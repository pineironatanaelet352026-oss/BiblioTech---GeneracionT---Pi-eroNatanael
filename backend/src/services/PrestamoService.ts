import { query } from '../db/index.js';
import { EJEMPLARES_MOCK, RECURSOS_MOCK } from './RecursoService.js';
import { USUARIOS_MOCK } from './AuthService.js';

export interface PrestamoItem {
  id: number;
  ejemplar_id: number;
  usuario_id: number;
  bibliotecario_id: number;
  fecha_prestamo: string;
  fecha_limite: string;
  fecha_devolucion: string | null;
  renovaciones_realizadas: number;
  estado: 'ACTIVO' | 'DEVUELTO' | 'VENCIDO';
  estado_fisico_entrega: 'OPTIMO' | 'DETERIORADO' | 'EXTRAVIADO' | null;
  dias_retraso: number;
}

export let PRESTAMOS_MOCK: PrestamoItem[] = [
  // Préstamo inicial activo (Juan Pérez tiene prestado Química Orgánica)
  {
    id: 1,
    ejemplar_id: 5, // QUI-003-A
    usuario_id: 2, // Juan Pérez (ALUMNO)
    bibliotecario_id: 1,
    fecha_prestamo: new Date().toISOString(),
    fecha_limite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    fecha_devolucion: null,
    renovaciones_realizadas: 0,
    estado: 'ACTIVO',
    estado_fisico_entrega: null,
    dias_retraso: 0
  }
];

export class PrestamoService {
  // RN2: Límite de cupo por rol
  static obtenerCupoMaximoPorRol(rol: string): number {
    if (rol === 'DOCENTE') return 4;
    return 2; // ALUMNO por defecto
  }

  // RN3: Plazo de préstamo en días corridos por rol
  static obtenerDiasPlazoPorRol(rol: string): number {
    if (rol === 'DOCENTE') return 14;
    return 7; // ALUMNO por defecto
  }

  static async registrarPrestamo(usuarioId: number, ejemplarId: number, bibliotecarioId: number) {
    // 1. Obtener usuario y validar estado
    const usuario = USUARIOS_MOCK.find(u => u.id === usuarioId);
    if (!usuario) {
      const err: any = new Error('Usuario no encontrado');
      err.status = 404;
      throw err;
    }

    // Cumple RN4: Verificación de sanciones o mora previa
    if (usuario.estado === 'BLOQUEADO_POR_MORA') {
      const err: any = new Error('Operación rechazada: El usuario posee un bloqueo preventivo por mora');
      err.status = 403;
      throw err;
    }
    if (usuario.estado === 'BLOQUEADO_ADMINISTRATIVO') {
      const err: any = new Error('Operación rechazada: El usuario posee un bloqueo administrativo por reposición pendiente');
      err.status = 403;
      throw err;
    }

    // Cumple RN4: Verificar si tiene algún préstamo vencido en curso
    const ahora = new Date();
    const tienePrestamoVencido = PRESTAMOS_MOCK.some(p => 
      p.usuario_id === usuarioId && 
      p.estado === 'ACTIVO' && 
      new Date(p.fecha_limite) < ahora
    );

    if (tienePrestamoVencido) {
      usuario.estado = 'BLOQUEADO_POR_MORA';
      const err: any = new Error('Operación rechazada: El usuario tiene préstamos con fecha límite vencida (Mora activa)');
      err.status = 403;
      throw err;
    }

    // Cumple RN2: Validar cupo máximo simultáneo por rol (2 para Alumno, 4 para Docente)
    const prestamosActivos = PRESTAMOS_MOCK.filter(p => p.usuario_id === usuarioId && p.estado === 'ACTIVO');
    const cupoMaximo = this.obtenerCupoMaximoPorRol(usuario.rol);

    if (prestamosActivos.length >= cupoMaximo) {
      const err: any = new Error(`Operación rechazada: Cupo máximo alcanzado (${cupoMaximo} préstamos simultáneos para rol ${usuario.rol})`);
      err.status = 409;
      throw err;
    }

    // 2. Obtener ejemplar y validar disponibilidad (RN1)
    const ejemplar = EJEMPLARES_MOCK.find(e => e.id === ejemplarId);
    if (!ejemplar) {
      const err: any = new Error('Ejemplar físico no encontrado');
      err.status = 404;
      throw err;
    }

    if (ejemplar.estado !== 'DISPONIBLE') {
      const err: any = new Error(`El ejemplar no está disponible para préstamo (Estado actual: ${ejemplar.estado})`);
      err.status = 409;
      throw err;
    }

    // Cumple RN3: Cálculo de fecha límite según rol (7 días Alumno, 14 días Docente)
    const diasPrestamo = this.obtenerDiasPlazoPorRol(usuario.rol);
    const fechaLimite = new Date(ahora.getTime() + diasPrestamo * 24 * 60 * 60 * 1000);

    // Actualizar estado del ejemplar (RN1)
    ejemplar.estado = 'PRESTADO';

    const nuevoPrestamo: PrestamoItem = {
      id: PRESTAMOS_MOCK.length + 1,
      ejemplar_id: ejemplarId,
      usuario_id: usuarioId,
      bibliotecario_id: bibliotecarioId,
      fecha_prestamo: ahora.toISOString(),
      fecha_limite: fechaLimite.toISOString(),
      fecha_devolucion: null,
      renovaciones_realizadas: 0,
      estado: 'ACTIVO',
      estado_fisico_entrega: null,
      dias_retraso: 0
    };

    PRESTAMOS_MOCK.push(nuevoPrestamo);

    return {
      ...nuevoPrestamo,
      usuario_nombre: `${usuario.nombre} ${usuario.apellido}`,
      ejemplar_codigo: ejemplar.codigo_inventario
    };
  }

  static async listarPrestamos(usuarioId?: number, rol?: string) {
    let lista = PRESTAMOS_MOCK;
    if (rol !== 'ADMIN' && usuarioId) {
      lista = lista.filter(p => p.usuario_id === usuarioId);
    }

    // Enriquecer con datos del título y ejemplar
    return lista.map(p => {
      const ejemplar = EJEMPLARES_MOCK.find(e => e.id === p.ejemplar_id);
      const recurso = ejemplar ? RECURSOS_MOCK.find(r => r.id === ejemplar.recurso_id) : null;
      const usuario = USUARIOS_MOCK.find(u => u.id === p.usuario_id);

      return {
        ...p,
        recurso_titulo: recurso ? recurso.titulo : 'Desconocido',
        ejemplar_codigo: ejemplar ? ejemplar.codigo_inventario : 'N/A',
        usuario_nombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Desconocido',
        usuario_rol: usuario ? usuario.rol : 'ALUMNO'
      };
    });
  }
}
