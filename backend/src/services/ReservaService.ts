import { query } from '../db/index.js';
import { EJEMPLARES_MOCK, RECURSOS_MOCK } from './RecursoService.js';
import { USUARIOS_MOCK } from './AuthService.js';
import { RESERVAS_MOCK, PRESTAMOS_MOCK, PrestamoService, type ReservaItem } from './PrestamoService.js';

export class ReservaService {
  // Cumple RN7: Solicitud de reserva sobre recursos agotados
  static async solicitarReserva(usuarioId: number, recursoId: number) {
    const usuario = USUARIOS_MOCK.find(u => u.id === usuarioId);
    if (!usuario) {
      const err: any = new Error('Usuario no encontrado');
      err.status = 404;
      throw err;
    }

    // Validar estado de sanciones o mora del usuario
    if (usuario.estado === 'BLOQUEADO_POR_MORA' || usuario.estado === 'SUSPENDIDO' || usuario.estado === 'BLOQUEADO_ADMINISTRATIVO') {
      const err: any = new Error(`Operación rechazada: El usuario posee un bloqueo o suspensión activa (${usuario.estado})`);
      err.status = 403;
      throw err;
    }

    const recurso = RECURSOS_MOCK.find(r => r.id === recursoId);
    if (!recurso) {
      const err: any = new Error('Recurso bibliográfico no encontrado');
      err.status = 404;
      throw err;
    }

    // Cumple RN7.1: Stock de ejemplares disponibles debe ser 0
    const ejemplaresDisponibles = EJEMPLARES_MOCK.filter(
      e => e.recurso_id === recursoId && e.estado === 'DISPONIBLE'
    );

    if (ejemplaresDisponibles.length > 0) {
      const err: any = new Error(
        `Operación rechazada: Hay ${ejemplaresDisponibles.length} ejemplar(es) disponible(s) en mostrador. No se requiere reserva, retíralo directamente.`
      );
      err.status = 409;
      throw err;
    }

    // Cumple RN7.3: No tener reserva activa duplicada sobre el mismo título
    const reservaExistente = RESERVAS_MOCK.find(
      r => r.recurso_id === recursoId && 
           r.usuario_id === usuarioId && 
           (r.estado === 'PENDIENTE' || r.estado === 'ASIGNADA')
    );

    if (reservaExistente) {
      const err: any = new Error('Operación rechazada: Ya posees una reserva activa para este recurso');
      err.status = 409;
      throw err;
    }

    const nuevaReserva: ReservaItem = {
      id: RESERVAS_MOCK.length + 1,
      recurso_id: recursoId,
      usuario_id: usuarioId,
      ejemplar_asignado_id: null,
      fecha_solicitud: new Date().toISOString(),
      fecha_asignacion: null,
      fecha_limite_retiro: null,
      estado: 'PENDIENTE'
    };

    RESERVAS_MOCK.push(nuevaReserva);

    // Calcular posición en la cola FIFO
    const posicionEnCola = RESERVAS_MOCK.filter(
      r => r.recurso_id === recursoId && r.estado === 'PENDIENTE'
    ).length;

    return {
      ...nuevaReserva,
      recurso_titulo: recurso.titulo,
      posicion_en_cola: posicionEnCola
    };
  }

  // Cumple RN10 / HU6: Cancelación voluntaria de reserva con reasignación inmediata
  static async cancelarReserva(reservaId: number, usuarioSolicitanteId: number, rolSolicitante: string) {
    const reserva = RESERVAS_MOCK.find(r => r.id === reservaId);
    if (!reserva) {
      const err: any = new Error('Reserva no encontrada');
      err.status = 404;
      throw err;
    }

    if (rolSolicitante !== 'ADMIN' && reserva.usuario_id !== usuarioSolicitanteId) {
      const err: any = new Error('Permisos insuficientes: No puedes cancelar la reserva de otro usuario');
      err.status = 403;
      throw err;
    }

    if (reserva.estado !== 'PENDIENTE' && reserva.estado !== 'ASIGNADA') {
      const err: any = new Error(`No se puede cancelar una reserva en estado ${reserva.estado}`);
      err.status = 400;
      throw err;
    }

    const estadoPrevio = reserva.estado;
    const ejemplarAsignadoId = reserva.ejemplar_asignado_id;
    reserva.estado = 'CANCELADA';

    // Si la reserva estaba asignada con un ejemplar apartado, reasignar inmediatamente en cola FIFO (RN10)
    let reasignadoA: ReservaItem | null = null;
    if (estadoPrevio === 'ASIGNADA' && ejemplarAsignadoId) {
      const ejemplar = EJEMPLARES_MOCK.find(e => e.id === ejemplarAsignadoId);
      const siguienteEnCola = RESERVAS_MOCK.find(
        r => r.recurso_id === reserva.recurso_id && r.estado === 'PENDIENTE'
      );

      const ahora = new Date();
      if (siguienteEnCola && ejemplar) {
        siguienteEnCola.estado = 'ASIGNADA';
        siguienteEnCola.ejemplar_asignado_id = ejemplar.id;
        siguienteEnCola.fecha_asignacion = ahora.toISOString();
        siguienteEnCola.fecha_limite_retiro = new Date(ahora.getTime() + 48 * 60 * 60 * 1000).toISOString();
        ejemplar.estado = 'RESERVADO';
        reasignadoA = siguienteEnCola;
      } else if (ejemplar) {
        ejemplar.estado = 'DISPONIBLE';
      }
    }

    return {
      reserva,
      reasignado_a_siguiente: reasignadoA !== null,
      mensaje: 'Reserva cancelada exitosamente'
    };
  }

  // Cumple RN8, RN9, HU7: Retiro presencial de ejemplar reservado en mostrador
  static async retirarReserva(reservaId: number, bibliotecarioId: number) {
    const reserva = RESERVAS_MOCK.find(r => r.id === reservaId);
    if (!reserva) {
      const err: any = new Error('Reserva no encontrada');
      err.status = 404;
      throw err;
    }

    if (reserva.estado !== 'ASIGNADA' || !reserva.ejemplar_asignado_id) {
      const err: any = new Error('La reserva no tiene un ejemplar asignado listo para retirar');
      err.status = 400;
      throw err;
    }

    // Verificar si caducó la ventana de 48 hs
    const ahora = new Date();
    if (reserva.fecha_limite_retiro && new Date(reserva.fecha_limite_retiro) < ahora) {
      reserva.estado = 'CADUCADA';
      const ejemplar = EJEMPLARES_MOCK.find(e => e.id === reserva.ejemplar_asignado_id);
      if (ejemplar) ejemplar.estado = 'DISPONIBLE';
      const err: any = new Error('Operación rechazada: La ventana de retiro de 48 horas ha caducado');
      err.status = 409;
      throw err;
    }

    // Cumple RN9: Verificar que el usuario tenga cupo libre al momento de retirar en mostrador
    const usuario = USUARIOS_MOCK.find(u => u.id === reserva.usuario_id);
    if (!usuario) {
      const err: any = new Error('Usuario no encontrado');
      err.status = 404;
      throw err;
    }

    const cupoMaximo = PrestamoService.obtenerCupoMaximoPorRol(usuario.rol);
    const prestamosActivos = PRESTAMOS_MOCK.filter(p => p.usuario_id === usuario.id && p.estado === 'ACTIVO');

    if (prestamosActivos.length >= cupoMaximo) {
      const err: any = new Error(
        `Operación rechazada por cupo (RN9): El usuario ya posee ${prestamosActivos.length} préstamos activos de ${cupoMaximo} permitidos. Debe devolver uno antes de retirar el material reservado.`
      );
      err.status = 409;
      throw err;
    }

    // Efectivizar el retiro: pasa a préstamo activo y finaliza la reserva
    const ejemplar = EJEMPLARES_MOCK.find(e => e.id === reserva.ejemplar_asignado_id);
    if (ejemplar) {
      ejemplar.estado = 'PRESTADO';
    }

    const diasPrestamo = PrestamoService.obtenerDiasPlazoPorRol(usuario.rol);
    const fechaLimite = new Date(ahora.getTime() + diasPrestamo * 24 * 60 * 60 * 1000);

    const nuevoPrestamo = {
      id: PRESTAMOS_MOCK.length + 1,
      ejemplar_id: reserva.ejemplar_asignado_id,
      usuario_id: reserva.usuario_id,
      bibliotecario_id: bibliotecarioId,
      fecha_prestamo: ahora.toISOString(),
      fecha_limite: fechaLimite.toISOString(),
      fecha_devolucion: null,
      renovaciones_realizadas: 0,
      estado: 'ACTIVO' as const,
      estado_fisico_entrega: null,
      dias_retraso: 0
    };

    PRESTAMOS_MOCK.push(nuevoPrestamo);
    reserva.estado = 'FINALIZADA';

    return {
      prestamo: nuevoPrestamo,
      reserva,
      mensaje: 'Ejemplar retirado y préstamo iniciado exitosamente'
    };
  }

  static async listarReservas(usuarioId?: number, rol?: string) {
    let lista = RESERVAS_MOCK;
    if (rol !== 'ADMIN' && usuarioId) {
      lista = lista.filter(r => r.usuario_id === usuarioId);
    }

    return lista.map(r => {
      const recurso = RECURSOS_MOCK.find(rec => rec.id === r.recurso_id);
      const usuario = USUARIOS_MOCK.find(u => u.id === r.usuario_id);
      const ejemplar = r.ejemplar_asignado_id ? EJEMPLARES_MOCK.find(e => e.id === r.ejemplar_asignado_id) : null;

      return {
        ...r,
        recurso_titulo: recurso ? recurso.titulo : 'Desconocido',
        usuario_nombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Desconocido',
        ejemplar_codigo: ejemplar ? ejemplar.codigo_inventario : null
      };
    });
  }
}
