import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import recursoRoutes from './routes/recursoRoutes.js';
import prestamoRoutes from './routes/prestamoRoutes.js';

const app = express();

// Configuración de CORS seguro
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por política CORS de BiblioTech'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Endpoint de salud
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    mensaje: 'BiblioTech API funcionando correctamente',
    version: '1.0.0'
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/recursos', recursoRoutes);
app.use('/api/prestamos', prestamoRoutes);

// Middleware global de manejo de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    data: null,
    error: err.message || 'Error interno del servidor'
  });
});

export default app;
