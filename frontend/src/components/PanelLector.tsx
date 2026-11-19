import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BookMarked, Clock, CheckCircle, AlertTriangle, ShieldAlert, X, RefreshCw, Calendar, Trash2 } from 'lucide-react';

interface Prestamo {
  id: number;
  ejemplar_id: number;
  recurso_titulo: string;
  ejemplar_codigo: string;
  fecha_prestamo: string;
  fecha_limite: string;
  fecha_devolucion: string | null;
  renovaciones_realizadas: number;
  estado: 'ACTIVO' | 'DEVUELTO' | 'VENCIDO';
  dias_retraso: number;
}

interface Reserva {
  id: number;
  recurso_id: number;
  recurso_titulo: string;
  ejemplar_codigo: string | null;
  fecha_solicitud: string;
  fecha_asignacion: string | null;
  fecha_limite_retiro: string | null;
  estado: 'PENDIENTE' | 'ASIGNADA' | 'FINALIZADA' | 'CADUCADA' | 'CANCELADA';
}

export const PanelLector: React.FC = () => {
  const { usuario, actualizarPerfil } = useAuth();
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const [mensajeExito, setMensajeExito] = useState<string>('');
  const [errorAccion, setErrorAccion] = useState<string>('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [dataPrestamos, dataReservas] = await Promise.all([
        apiRequest<Prestamo[]>('/api/prestamos'),
        apiRequest<Reserva[]>('/api/reservas')
      ]);
      setPrestamos(dataPrestamos);
      setReservas(dataReservas);
    } catch (err: any) {
      console.error('Error al cargar panel de lector:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleRenovar = async (prestamoId: number) => {
    setErrorAccion('');
    setMensajeExito('');
    try {
      const res = await apiRequest(`/api/prestamos/${prestamoId}/renovar`, {
        method: 'POST'
      });
      setMensajeExito(res.mensaje || 'Préstamo renovado exitosamente');
      cargarDatos();
      actualizarPerfil();
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al renovar préstamo');
    }
  };

  const handleCancelarReserva = async (reservaId: number) => {
    setErrorAccion('');
    setMensajeExito('');
    try {
      const res = await apiRequest(`/api/reservas/${reservaId}`, {
        method: 'DELETE'
      });
      setMensajeExito(res.mensaje || 'Reserva cancelada exitosamente');
      cargarDatos();
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al cancelar reserva');
    }
  };

  const cupoMaximo = usuario?.rol === 'DOCENTE' ? 4 : 2;
  const prestamosActivos = prestamos.filter(p => p.estado === 'ACTIVO');
  const reservasActivas = reservas.filter(r => r.estado === 'PENDIENTE' || r.estado === 'ASIGNADA');

  return (
    <div className="space-y-8">
      
      {/* Mensajes de Estado */}
      {mensajeExito && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorAccion && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>{errorAccion}</span>
          </div>
          <button onClick={() => setErrorAccion('')} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Resumen del Lector (Cupos y Sanciones) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Lector Registrado
          </span>
          <h2 className="text-lg font-bold text-slate-900">{usuario?.nombre} {usuario?.apellido}</h2>
          <span className="text-xs text-slate-500 font-mono">{usuario?.email}</span>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Cupo de Préstamos (RN2)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-900">{prestamosActivos.length}</span>
            <span className="text-sm text-slate-500">/ {cupoMaximo} libros en uso ({usuario?.rol})</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full ${prestamosActivos.length >= cupoMaximo ? 'bg-amber-500' : 'bg-brand-500'}`}
              style={{ width: `${(prestamosActivos.length / cupoMaximo) * 100}%` }}
            ></div>
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Estado Disciplinario (RN4, RN5)
          </span>
          {usuario?.estado === 'ACTIVO' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Cuenta Habilitada (Sin mora)
            </span>
          ) : (
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                {usuario?.estado.replace(/_/g, ' ')}
              </span>
              {usuario?.fecha_fin_suspension && (
                <p className="text-[11px] text-rose-600 mt-1">
                  Suspensión activa hasta: {new Date(usuario.fecha_fin_suspension).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sección 1: Préstamos Activos (HU3, RN3, RN6) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">Mis Préstamos en Curso</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {prestamosActivos.length} material(es)
          </span>
        </div>

        {cargando ? (
          <p className="text-xs text-slate-400">Cargando préstamos...</p>
        ) : prestamosActivos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400">No tienes préstamos activos en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prestamosActivos.map((prestamo) => {
              const fLimite = new Date(prestamo.fecha_limite);
              const hoy = new Date();
              const estaVencido = hoy > fLimite;
              const yaRenovado = prestamo.renovaciones_realizadas >= 1;

              return (
                <div
                  key={prestamo.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    estaVencido ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{prestamo.recurso_titulo}</h4>
                      <span className="text-[11px] font-mono font-semibold text-slate-500">
                        Copia: {prestamo.ejemplar_codigo}
                      </span>
                    </div>

                    {estaVencido ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Vencido (En Mora)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        Vigente
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 mb-4">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Retirado: {new Date(prestamo.fecha_prestamo).toLocaleDateString()}
                    </p>
                    <p className={`flex items-center gap-1.5 font-semibold ${estaVencido ? 'text-rose-600' : 'text-slate-800'}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      Fecha límite de devolución: {fLimite.toLocaleDateString()}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Renovaciones utilizadas: {prestamo.renovaciones_realizadas} de 1 permitida (RN6)
                    </p>
                  </div>

                  {/* Botón de Renovación con RN6 */}
                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {yaRenovado ? 'Límite de renovación alcanzado' : estaVencido ? 'No renovable por mora' : 'Apto para extender plazo'}
                    </span>

                    <button
                      onClick={() => handleRenovar(prestamo.id)}
                      disabled={yaRenovado || estaVencido}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                        yaRenovado || estaVencido
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Renovar (+{usuario?.rol === 'DOCENTE' ? 14 : 7}d)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sección 2: Reservas Activas (HU5, HU6, RN8, RN10) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Mis Reservas en Espera (Cola FIFO)</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {reservasActivas.length} reserva(s)
          </span>
        </div>

        {cargando ? (
          <p className="text-xs text-slate-400">Cargando reservas...</p>
        ) : reservasActivas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400">No tienes reservas pendientes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reservasActivas.map((reserva) => {
              const estaAsignada = reserva.estado === 'ASIGNADA';

              return (
                <div
                  key={reserva.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    estaAsignada ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-slate-900">{reserva.recurso_titulo}</h4>
                    {estaAsignada ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                        ¡Listo para retirar!
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        En Cola de Espera
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 mb-4">
                    <p>Solicitada: {new Date(reserva.fecha_solicitud).toLocaleDateString()}</p>
                    
                    {estaAsignada && reserva.fecha_limite_retiro && (
                      <div className="p-2.5 bg-amber-100/70 border border-amber-200 rounded-xl text-amber-900 text-xs">
                        <span className="font-bold block">Ventana de Retiro (48 Horas - RN8):</span>
                        Tienes hasta el {new Date(reserva.fecha_limite_retiro).toLocaleString()} para retirar el libro en mostrador.
                      </div>
                    )}
                  </div>

                  {/* Cancelación Voluntaria (RN10, HU6) */}
                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-end">
                    <button
                      onClick={() => handleCancelarReserva(reserva.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Cancelar Reserva (RN10)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
