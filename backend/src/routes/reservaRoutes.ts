import { Router, Response, NextFunction } from 'express';
import { ReservaService } from '../services/ReservaService.js';
import { autenticarToken, requerirRol, type AuthRequest } from '../middlewares/auth.js';

const router = Router();

// GET /api/reservas (Lectores ven las suyas, ADMIN ve todas)
router.get('/', autenticarToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const usuarioId = req.user!.id;
    const rol = req.user!.rol;
    const reservas = await ReservaService.listarReservas(usuarioId, rol);
    res.status(200).json({
      success: true,
      data: reservas,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/reservas (Lector solicita reserva de recurso agotado - RN7, HU5)
router.post('/', autenticarToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { recurso_id } = req.body;
    const usuarioId = req.user!.id;

    if (!recurso_id) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'recurso_id es obligatorio'
      });
    }

    const nuevaReserva = await ReservaService.solicitarReserva(usuarioId, parseInt(recurso_id, 10));
    res.status(201).json({
      success: true,
      data: nuevaReserva,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/reservas/:id (Cancelación voluntaria por lector - RN10, HU6)
router.delete('/:id', autenticarToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reservaId = parseInt(req.params.id, 10);
    const usuarioId = req.user!.id;
    const rol = req.user!.rol;

    const resultado = await ReservaService.cancelarReserva(reservaId, usuarioId, rol);
    res.status(200).json({
      success: true,
      data: resultado,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/reservas/:id/retirar (Solo ADMIN - Retiro en mostrador - RN8, RN9, HU7)
router.post('/:id/retirar', autenticarToken, requerirRol(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reservaId = parseInt(req.params.id, 10);
    const bibliotecarioId = req.user!.id;

    const resultado = await ReservaService.retirarReserva(reservaId, bibliotecarioId);
    res.status(200).json({
      success: true,
      data: resultado,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

export default router;
