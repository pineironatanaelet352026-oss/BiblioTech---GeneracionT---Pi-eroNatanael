import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

export interface Usuario {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'ADMIN' | 'ALUMNO' | 'DOCENTE';
  estado: 'ACTIVO' | 'BLOQUEADO_POR_MORA' | 'BLOQUEADO_ADMINISTRATIVO' | 'SUSPENDIDO';
  fecha_fin_suspension: string | null;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  actualizarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('bibliotech_token'));
  const [cargando, setCargando] = useState<boolean>(true);

  const actualizarPerfil = async () => {
    try {
      const perfil = await apiRequest<Usuario>('/api/auth/perfil');
      setUsuario(perfil);
    } catch (err) {
      console.warn('Sesión expirada o inválida');
      logout();
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (token) {
      actualizarPerfil();
    } else {
      setCargando(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; usuario: Usuario }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('bibliotech_token', res.token);
    setToken(res.token);
    setUsuario(res.usuario);
  };

  const logout = () => {
    localStorage.removeItem('bibliotech_token');
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, cargando, login, logout, actualizarPerfil }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
