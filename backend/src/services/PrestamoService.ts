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

export interface ReservaItem {
  id: number;
  recurso_id: number;
  usuario_id: number;
  ejemplar_asignado_id: number | null;
  fecha_solicitud: string;
  fecha_asignacion: string | null;
  fecha_limite_retiro: string | null;
  estado: 'PENDIENTE' | 'ASIGNADA' | 'FINALIZADA' | 'CADUCADA' | 'CANCELADA';
}

export let RESERVAS_MOCK: ReservaItem[] = [];

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
    const usuario = USUARIOS_MOCK.find(u => u.id === usuarioId);
    if (!usuario) {
      const err: any = new Error('Usuario no encontrado');
      err.status = 404;
      throw err;
    }

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

    const prestamosActivos = PRESTAMOS_MOCK.filter(p => p.usuario_id === usuarioId && p.estado === 'ACTIVO');
    const cupoMaximo = this.obtenerCupoMaximoPorRol(usuario.rol);

    if (prestamosActivos.length >= cupoMaximo) {
      const err: any = new Error(`Operación rechazada: Cupo máximo alcanzado (${cupoMaximo} préstamos simultáneos para rol ${usuario.rol})`);
      err.status = 409;
      throw err;
    }

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

    const diasPrestamo = this.obtenerDiasPlazoPorRol(usuario.rol);
    const fechaLimite = new Date(ahora.getTime() + diasPrestamo * 24 * 60 * 60 * 1000);

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

  // Cumple RN6: Lógica de renovación de préstamos
  static async renovarPrestamo(prestamoId: number, usuarioSolicitanteId: number, rolSolicitante: string) {
    const prestamo = PRESTAMOS_MOCK.find(p => p.id === prestamoId);
    if (!prestamo) {
      const err: any = new Error('Préstamo no encontrado');
      err.status = 404;
      throw err;
    }

    // Validación de permisos: un lector solo puede renovar su propio préstamo
    if (rolSolicitante !== 'ADMIN' && prestamo.usuario_id !== usuarioSolicitanteId) {
      const err: any = new Error('Permisos insuficientes: No puedes renovar el préstamo de otro usuario');
      err.status = 403;
      throw err;
    }

    if (prestamo.estado !== 'ACTIVO') {
      const err: any = new Error(`No se puede renovar un préstamo en estado ${prestamo.estado}`);
      err.status = 400;
      throw err;
    }

    // Cumple RN6.1: Máximo 1 renovación permitida
    if (prestamo.renovaciones_realizadas >= 1) {
      const err: any = new Error('Operación rechazada: Se ha alcanzado el límite máximo de 1 renovación para este préstamo');
      err.status = 409;
      throw err;
    }

    // Cumple RN6.2: El préstamo no debe estar vencido al momento de la solicitud
    const ahora = new Date();
    const fechaLimiteActual = new Date(prestamo.fecha_limite);
    if (fechaLimiteActual < ahora) {
      const err: any = new Error('Operación rechazada: No se puede renovar un préstamo que ya se encuentra vencido (en mora)');
      err.status = 409;
      throw err;
    }

    // Cumple RN6.3: El usuario no debe tener sanciones ni otros préstamos vencidos
    const usuario = USUARIOS_MOCK.find(u => u.id === prestamo.usuario_id);
    if (usuario && (usuario.estado === 'BLOQUEADO_POR_MORA' || usuario.estado === 'SUSPENDIDO' || usuario.estado === 'BLOQUEADO_ADMINISTRATIVO')) {
      const err: any = new Error(`Operación rechazada: El usuario posee un bloqueo o suspensión activa (${usuario.estado})`);
      err.status = 403;
      throw err;
    }

    // Cumple RN6.4: No deben existir reservas activas en cola sobre este título por otros usuarios
    const ejemplar = EJEMPLARES_MOCK.find(e => e.id === prestamo.ejemplar_id);
    if (ejemplar) {
      const tieneReservasEnEspera = RESERVAS_MOCK.some(
        r => r.recurso_id === ejemplar.recurso_id && 
             (r.estado === 'PENDIENTE' || r.estado === 'ASIGNADA') &&
             r.usuario_id !== prestamo.usuario_id
      );

      if (tieneReservasEnEspera) {
        const err: any = new Error('Operación rechazada: No se puede renovar porque existen reservas activas en cola de espera para este título');
        err.status = 409;
        throw err;
      }
    }

    // Extender la fecha límite por el período original del rol (7 días para alumno, 14 para docente)
    const rolUsuario = usuario ? usuario.rol : 'ALUMNO';
    const diasExtension = this.obtenerDiasPlazoPorRol(rolUsuario);
    const nuevaFechaLimite = new Date(fechaLimiteActual.getTime() + diasExtension * 24 * 60 * 60 * 1000);

    prestamo.fecha_limite = nuevaFechaLimite.toISOString();
    prestamo.renovaciones_realizadas += 1;

    return {
      ...prestamo,
      dias_extendidos: diasExtension,
      mensaje: `Préstamo renovado exitosamente por ${diasExtension} días adicionales`
    };
  }

  static async listarPrestamos(usuarioId?: number, rol?: string) {
    let lista = PRESTAMOS_MOCK;
    if (rol !== 'ADMIN' && usuarioId) {
      lista = lista.filter(p => p.usuario_id === usuarioId);
    }

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
