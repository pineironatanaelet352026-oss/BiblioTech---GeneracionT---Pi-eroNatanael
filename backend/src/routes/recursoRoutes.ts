import { Router, Request, Response, NextFunction } from 'express';
import { RecursoService } from '../services/RecursoService.js';
import { autenticarToken, requerirRol } from '../middlewares/auth.js';

const router = Router();

// GET /api/recursos (Público con filtros)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { buscar, categoria, solo_disponibles } = req.query;
    const recursos = await RecursoService.listarRecursos({
      buscar: buscar ? String(buscar) : undefined,
      categoria: categoria ? String(categoria) : undefined,
      solo_disponibles: solo_disponibles === 'true'
    });
    res.status(200).json({
      success: true,
      data: recursos,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/recursos/:id (Público - Detalle y lista de ejemplares)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const recurso = await RecursoService.obtenerPorId(id);
    res.status(200).json({
      success: true,
      data: recurso,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/recursos (Solo ADMIN - Alta de título)
router.post('/', autenticarToken, requerirRol(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nuevoRecurso = await RecursoService.crearRecurso(req.body);
    res.status(201).json({
      success: true,
      data: nuevoRecurso,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/recursos/:id/ejemplares (Solo ADMIN - Agregar ejemplar)
router.post('/:id/ejemplares', autenticarToken, requerirRol(['ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recursoId = parseInt(req.params.id, 10);
    const nuevoEjemplar = await RecursoService.agregarEjemplar(recursoId, req.body);
    res.status(201).json({
      success: true,
      data: nuevoEjemplar,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

export default router;
