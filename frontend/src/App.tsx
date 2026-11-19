import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, type VistaTipo } from './components/Navbar';
import { Catalogo } from './components/Catalogo';
import { PanelLector } from './components/PanelLector';
import { PanelAdmin } from './components/PanelAdmin';
import { Users } from 'lucide-react';

const ContenidoApp: React.FC = () => {
  const [vistaActual, setVistaActual] = useState<VistaTipo>('catalogo');
  const { usuario, login, cargando } = useAuth();

  const [emailInput, setEmailInput] = useState('admin@bibliotech.edu');
  const [passwordInput, setPasswordInput] = useState('password123');
  const [errorLogin, setErrorLogin] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin('');
    try {
      await login(emailInput, passwordInput);
      setVistaActual('catalogo');
    } catch (err: any) {
      setErrorLogin(err.message || 'Error al iniciar sesión');
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar vistaActual={vistaActual} setVistaActual={setVistaActual} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Informativo de Reglas Activas */}
        <div className="mb-8 bg-gradient-to-r from-brand-900 via-sky-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <span className="bg-sky-500/20 text-sky-200 border border-sky-400/30 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
              Sistema de Reglas de Negocio Automatizado
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              Bienvenido a BiblioTech
            </h1>
            <p className="text-sky-100 text-sm sm:text-base leading-relaxed mb-6">
              Gestión equitativa de préstamos, colas de espera FIFO con 48 hs de tolerancia y cálculo automático de sanciones por mora.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <span className="text-sky-300 font-bold block mb-1">RN2 — Cupos</span>
                Alumnos: 2 libros<br/>Docentes: 4 libros
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <span className="text-sky-300 font-bold block mb-1">RN3 — Plazos</span>
                Alumnos: 7 días<br/>Docentes: 14 días
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <span className="text-sky-300 font-bold block mb-1">RN6 — Renovación</span>
                1 sola vez<br/>Sin mora ni reservas
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <span className="text-sky-300 font-bold block mb-1">RN5 — Sanción</span>
                Mora × 2 días<br/>Suspensión estricta
              </div>
            </div>
          </div>
        </div>

        {/* Modal / Vista de Login Rápido */}
        {vistaActual === 'login' && !usuario && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-200/80 my-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Acceso a BiblioTech</h2>
              <p className="text-xs text-slate-500 mt-1">Ingresá con las credenciales de prueba preconfiguradas</p>
            </div>

            {errorLogin && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorLogin}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm"
              >
                Ingresar al Sistema
              </button>

              <div className="pt-4 border-t border-slate-100">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                  Cuentas de Prueba Rápidas
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => { setEmailInput('admin@bibliotech.edu'); setPasswordInput('password123'); }}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmailInput('juan.perez@alumnos.edu'); setPasswordInput('password123'); }}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    Alumno
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmailInput('martin.sosa@docentes.edu'); setPasswordInput('password123'); }}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    Docente
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Vista de Catálogo (TASK-018 / RN1, HU1) */}
        {vistaActual === 'catalogo' && <Catalogo />}

        {/* Vista de Panel del Lector (TASK-019 / HU3, HU5, HU6, RN2, RN3, RN6, RN8, RN10) */}
        {vistaActual === 'mis-prestamos' && usuario && <PanelLector />}

        {/* Vista de Panel de Administración (TASK-020 / HU2, HU4, HU7, RN1, RN2, RN4, RN5, RN9, RN11) */}
        {vistaActual === 'admin' && usuario?.rol === 'ADMIN' && <PanelAdmin />}

      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        BiblioTech — Proyecto Final Bootcamp IA-First • Desarrollado por Camila
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ContenidoApp />
    </AuthProvider>
  );
};

export default App;
