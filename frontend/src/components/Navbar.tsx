import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, UserCheck, ShieldAlert, LogOut, Library, BookmarkCheck } from 'lucide-react';

export type VistaTipo = 'catalogo' | 'mis-prestamos' | 'admin' | 'login';

interface NavbarProps {
  vistaActual: VistaTipo;
  setVistaActual: (vista: VistaTipo) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ vistaActual, setVistaActual }) => {
  const { usuario, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo y Marca */}
          <div 
            onClick={() => setVistaActual('catalogo')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                Biblio<span className="text-brand-600">Tech</span>
              </span>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Mediateca Escolar
              </span>
            </div>
          </div>

          {/* Navegación Principal */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setVistaActual('catalogo')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                vistaActual === 'catalogo'
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Library className="w-4 h-4" />
              Catálogo
            </button>

            {usuario && (
              <button
                onClick={() => setVistaActual('mis-prestamos')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  vistaActual === 'mis-prestamos'
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BookmarkCheck className="w-4 h-4" />
                Mis Préstamos y Reservas
              </button>
            )}

            {usuario?.rol === 'ADMIN' && (
              <button
                onClick={() => setVistaActual('admin')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  vistaActual === 'admin'
                    ? 'bg-amber-50 text-amber-800 font-semibold border border-amber-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-4 h-4 text-amber-600" />
                Mostrador Bibliotecario
              </button>
            )}
          </nav>

          {/* Estado de Sesión */}
          <div className="flex items-center gap-3">
            {usuario ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900">
                    {usuario.nombre} {usuario.apellido}
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      usuario.rol === 'ADMIN' ? 'bg-amber-100 text-amber-800' :
                      usuario.rol === 'DOCENTE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {usuario.rol}
                    </span>
                    {usuario.estado !== 'ACTIVO' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 flex items-center gap-0.5">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        {usuario.estado.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Cerrar Sesión"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setVistaActual('login')}
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-all shadow-brand-500/20 hover:shadow-md"
              >
                Iniciar Sesión
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
