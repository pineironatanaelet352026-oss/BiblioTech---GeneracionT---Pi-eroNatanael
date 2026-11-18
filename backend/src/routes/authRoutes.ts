import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import { autenticarToken, requerirRol, type AuthRequest } from '../middlewares/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const resultado = await AuthService.login(email, password);
    res.status(200).json({
      success: true,
      data: resultado,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/perfil (Protegido)
router.get('/perfil', autenticarToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const perfil = await AuthService.obtenerPerfil(userId);
    res.status(200).json({
      success: true,
      data: perfil,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/usuarios (Protegido, solo ADMIN)
router.get('/usuarios', autenticarToken, requerirRol(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarios = await AuthService.listarUsuarios();
    res.status(200).json({
      success: true,
      data: usuarios,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

export default router;
