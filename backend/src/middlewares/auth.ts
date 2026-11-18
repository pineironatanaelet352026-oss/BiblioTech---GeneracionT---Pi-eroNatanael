import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_jwt_para_firmar_tokens_ejemplo_seguro_12345';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    dni: string;
    email: string;
    rol: 'ADMIN' | 'ALUMNO' | 'DOCENTE';
    nombre: string;
    apellido: string;
  };
}

export const autenticarToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Acceso no autorizado: Token de sesión ausente'
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      data: null,
      error: 'Token inválido o expirado'
    });
  }
};

export const requerirRol = (rolesPermitidos: Array<'ADMIN' | 'ALUMNO' | 'DOCENTE'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Permisos insuficientes para realizar esta operación'
      });
    }
    next();
  };
};
