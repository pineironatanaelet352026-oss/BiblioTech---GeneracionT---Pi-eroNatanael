import { Router, Response, NextFunction } from 'express';
import { PrestamoService } from '../services/PrestamoService.js';
import { autenticarToken, requerirRol, type AuthRequest } from '../middlewares/auth.js';

const router = Router();

// GET /api/prestamos (Lectores ven los propios, ADMIN ve todos)
router.get('/', autenticarToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const usuarioId = req.user!.id;
    const rol = req.user!.rol;
    const prestamos = await PrestamoService.listarPrestamos(usuarioId, rol);
    res.status(200).json({
      success: true,
      data: prestamos,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/prestamos (Solo ADMIN - Registro presencial en mostrador)
router.post('/', autenticarToken, requerirRol(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { usuario_id, ejemplar_id } = req.body;
    const bibliotecarioId = req.user!.id;

    if (!usuario_id || !ejemplar_id) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'usuario_id y ejemplar_id son obligatorios'
      });
    }

    const nuevoPrestamo = await PrestamoService.registrarPrestamo(
      parseInt(usuario_id, 10),
      parseInt(ejemplar_id, 10),
      bibliotecarioId
    );

    res.status(201).json({
      success: true,
      data: nuevoPrestamo,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/prestamos/:id/renovar (Lector o ADMIN - Cumple RN6 y HU3)
router.post('/:id/renovar', autenticarToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prestamoId = parseInt(req.params.id, 10);
    const usuarioId = req.user!.id;
    const rol = req.user!.rol;

    const resultado = await PrestamoService.renovarPrestamo(prestamoId, usuarioId, rol);

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
