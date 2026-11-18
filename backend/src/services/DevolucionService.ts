import { query } from '../db/index.js';
import { EJEMPLARES_MOCK } from './RecursoService.js';
import { USUARIOS_MOCK } from './AuthService.js';
import { PRESTAMOS_MOCK, RESERVAS_MOCK } from './PrestamoService.js';

export interface SancionItem {
  id: number;
  usuario_id: number;
  prestamo_id: number;
  dias_sancion: number;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
}

export let SANCIONES_MOCK: SancionItem[] = [];

export class DevolucionService {
  static async registrarDevolucion(
    prestamoId: number,
    estadoFisico: 'OPTIMO' | 'DETERIORADO' | 'EXTRAVIADO' = 'OPTIMO',
    bibliotecarioId: number
  ) {
    const prestamo = PRESTAMOS_MOCK.find(p => p.id === prestamoId);
    if (!prestamo) {
      const err: any = new Error('Préstamo no encontrado');
      err.status = 404;
      throw err;
    }

    if (prestamo.estado === 'DEVUELTO') {
      const err: any = new Error('El préstamo ya fue devuelto previamente');
      err.status = 400;
      throw err;
    }

    const ejemplar = EJEMPLARES_MOCK.find(e => e.id === prestamo.ejemplar_id);
    if (!ejemplar) {
      const err: any = new Error('Ejemplar asociado no encontrado');
      err.status = 404;
      throw err;
    }

    const usuario = USUARIOS_MOCK.find(u => u.id === prestamo.usuario_id);
    if (!usuario) {
      const err: any = new Error('Usuario asociado no encontrado');
      err.status = 404;
      throw err;
    }

    const ahora = new Date();
    prestamo.fecha_devolucion = ahora.toISOString();
    prestamo.estado = 'DEVUELTO';
    prestamo.estado_fisico_entrega = estadoFisico;

    // Calcular días corridos completos de retraso
    const fechaLimite = new Date(prestamo.fecha_limite);
    let diasRetraso = 0;
    if (ahora > fechaLimite) {
      const diffMs = ahora.getTime() - fechaLimite.getTime();
      diasRetraso = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
    prestamo.dias_retraso = diasRetraso;

    let sancionGenerada: SancionItem | null = null;

    // Cumple RN5: Sanción automática acumulativa por entrega tardía (2 días de suspensión por cada día de mora)
    if (diasRetraso > 0) {
      const diasSancion = diasRetraso * 2;
      const fechaFinSancion = new Date(ahora.getTime() + diasSancion * 24 * 60 * 60 * 1000);

      sancionGenerada = {
        id: SANCIONES_MOCK.length + 1,
        usuario_id: usuario.id,
        prestamo_id: prestamo.id,
        dias_sancion: diasSancion,
        fecha_inicio: ahora.toISOString(),
        fecha_fin: fechaFinSancion.toISOString(),
        motivo: `Mora de ${diasRetraso} día(s) en la devolución del ejemplar ${ejemplar.codigo_inventario}`
      };

      SANCIONES_MOCK.push(sancionGenerada);
      usuario.estado = 'SUSPENDIDO';
      usuario.fecha_fin_suspension = fechaFinSancion.toISOString();
    } else {
      // Si devolvió a término y no tiene otros préstamos vencidos, asegurar que no esté en mora
      const otrosVencidos = PRESTAMOS_MOCK.some(
        p => p.usuario_id === usuario.id && p.estado === 'ACTIVO' && new Date(p.fecha_limite) < ahora
      );
      if (!otrosVencidos && usuario.estado === 'BLOQUEADO_POR_MORA') {
        usuario.estado = 'ACTIVO';
      }
    }

    // Cumple RN11: Devolución con daño físico o extravío
    if (estadoFisico === 'DETERIORADO') {
      ejemplar.estado = 'EN_REPARACION';
      usuario.estado = 'BLOQUEADO_ADMINISTRATIVO';
    } else if (estadoFisico === 'EXTRAVIADO') {
      ejemplar.estado = 'DADO_DE_BAJA';
      usuario.estado = 'BLOQUEADO_ADMINISTRATIVO';
    } else {
      // Estado ÓPTIMO: Verificar si existen reservas en cola para este recurso (RN8)
      const reservaPendiente = RESERVAS_MOCK.find(
        r => r.recurso_id === ejemplar.recurso_id && r.estado === 'PENDIENTE'
      );

      if (reservaPendiente) {
        reservaPendiente.estado = 'ASIGNADA';
        reservaPendiente.ejemplar_asignado_id = ejemplar.id;
        reservaPendiente.fecha_asignacion = ahora.toISOString();
        reservaPendiente.fecha_limite_retiro = new Date(ahora.getTime() + 48 * 60 * 60 * 1000).toISOString();
        ejemplar.estado = 'RESERVADO';
      } else {
        ejemplar.estado = 'DISPONIBLE';
      }
    }

    return {
      prestamo,
      ejemplar_estado: ejemplar.estado,
      dias_retraso: diasRetraso,
      sancion: sancionGenerada,
      usuario_estado_actual: usuario.estado
    };
  }
}
