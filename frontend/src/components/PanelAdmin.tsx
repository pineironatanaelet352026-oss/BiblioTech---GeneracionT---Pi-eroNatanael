import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Usuario } from '../context/AuthContext';
import { Recurso, Ejemplar } from './Catalogo';
import { UserCheck, BookOpen, AlertTriangle, CheckCircle, RotateCcw, PackageCheck, X, ArrowRight } from 'lucide-react';

interface PrestamoAdmin {
  id: number;
  ejemplar_id: number;
  recurso_titulo: string;
  ejemplar_codigo: string;
  usuario_nombre: string;
  usuario_rol: string;
  usuario_id: number;
  fecha_prestamo: string;
  fecha_limite: string;
  estado: 'ACTIVO' | 'DEVUELTO' | 'VENCIDO';
}

interface ReservaAdmin {
  id: number;
  recurso_titulo: string;
  usuario_nombre: string;
  usuario_id: number;
  ejemplar_codigo: string | null;
  fecha_limite_retiro: string | null;
  estado: 'PENDIENTE' | 'ASIGNADA' | 'FINALIZADA' | 'CADUCADA' | 'CANCELADA';
}

export const PanelAdmin: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [prestamosActivos, setPrestamosActivos] = useState<PrestamoAdmin[]>([]);
  const [reservasAsignadas, setReservasAsignadas] = useState<ReservaAdmin[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Estados del Formulario de Nuevo Préstamo
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState<string>('');
  const [recursoSeleccionadoId, setRecursoSeleccionadoId] = useState<string>('');
  const [ejemplarSeleccionadoId, setEjemplarSeleccionadoId] = useState<string>('');
  const [ejemplaresDisponibles, setEjemplaresDisponibles] = useState<Ejemplar[]>([]);

  // Estados de Devolución
  const [estadoFisicoMap, setEstadoFisicoMap] = useState<Record<number, 'OPTIMO' | 'DETERIORADO' | 'EXTRAVIADO'>>({});

  const [mensajeExito, setMensajeExito] = useState<string>('');
  const [errorAccion, setErrorAccion] = useState<string>('');

  const cargarDatosAdmin = async () => {
    setCargando(true);
    try {
      const [dataUsuarios, dataRecursos, dataPrestamos, dataReservas] = await Promise.all([
        apiRequest<Usuario[]>('/api/auth/usuarios'),
        apiRequest<Recurso[]>('/api/recursos'),
        apiRequest<PrestamoAdmin[]>('/api/prestamos'),
        apiRequest<ReservaAdmin[]>('/api/reservas')
      ]);

      // Solo lectores (Alumnos y Docentes)
      setUsuarios(dataUsuarios.filter(u => u.rol !== 'ADMIN'));
      setRecursos(dataRecursos);
      setPrestamosActivos(dataPrestamos.filter(p => p.estado === 'ACTIVO'));
      setReservasAsignadas(dataReservas.filter(r => r.estado === 'ASIGNADA'));
    } catch (err: any) {
      console.error('Error al cargar panel de administración:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosAdmin();
  }, []);

  // Al elegir un recurso, buscar sus ejemplares DISPONIBLES (RN1)
  useEffect(() => {
    if (!recursoSeleccionadoId) {
      setEjemplaresDisponibles([]);
      setEjemplarSeleccionadoId('');
      return;
    }

    const buscarEjemplares = async () => {
      try {
        const detalle = await apiRequest<Recurso>(`/api/recursos/${recursoSeleccionadoId}`);
        const disponibles = (detalle.ejemplares || []).filter(e => e.estado === 'DISPONIBLE');
        setEjemplaresDisponibles(disponibles);
        if (disponibles.length > 0) {
          setEjemplarSeleccionadoId(String(disponibles[0].id));
        } else {
          setEjemplarSeleccionadoId('');
        }
      } catch (e) {
        setEjemplaresDisponibles([]);
      }
    };

    buscarEjemplares();
  }, [recursoSeleccionadoId]);

  // Manejar Registro de Nuevo Préstamo (HU2, RN1, RN2, RN3, RN4)
  const handleCrearPrestamo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAccion('');
    setMensajeExito('');

    if (!usuarioSeleccionadoId || !ejemplarSeleccionadoId) {
      setErrorAccion('Debes seleccionar un lector y una copia física disponible');
      return;
    }

    try {
      const res = await apiRequest('/api/prestamos', {
        method: 'POST',
        body: JSON.stringify({
          usuario_id: parseInt(usuarioSeleccionadoId, 10),
          ejemplar_id: parseInt(ejemplarSeleccionadoId, 10)
        })
      });

      setMensajeExito(`¡Préstamo concedido con éxito a ${res.usuario_nombre}! Código: ${res.ejemplar_codigo}`);
      setRecursoSeleccionadoId('');
      setEjemplarSeleccionadoId('');
      cargarDatosAdmin();
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al registrar el préstamo');
    }
  };

  // Manejar Registro de Devolución (HU4, RN4, RN5, RN11)
  const handleDevolucion = async (prestamoId: number) => {
    setErrorAccion('');
    setMensajeExito('');

    const estadoFisico = estadoFisicoMap[prestamoId] || 'OPTIMO';

    try {
      const res = await apiRequest(`/api/prestamos/${prestamoId}/devolver`, {
        method: 'POST',
        body: JSON.stringify({ estado_fisico: estadoFisico })
      });

      let detalle = 'Devolución procesada correctamente.';
      if (res.dias_retraso > 0) {
        detalle += ` Se detectaron ${res.dias_retraso} días de retraso. Sanción aplicada (RN5): ${res.sancion.dias_sancion} días de suspensión.`;
      }
      if (estadoFisico !== 'OPTIMO') {
        detalle += ` Material devuelto en estado ${estadoFisico}. Se aplicó Bloqueo Administrativo al usuario (RN11).`;
      }

      setMensajeExito(detalle);
      cargarDatosAdmin();
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al registrar devolución');
    }
  };

  // Manejar Retiro de Reserva Asignada (HU7, RN8, RN9)
  const handleRetirarReserva = async (reservaId: number) => {
    setErrorAccion('');
    setMensajeExito('');

    try {
      const res = await apiRequest(`/api/reservas/${reservaId}/retirar`, {
        method: 'POST'
      });
      setMensajeExito(res.mensaje || 'Reserva efectivizada en préstamo activo');
      cargarDatosAdmin();
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al efectivizar retiro de reserva');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Alertas */}
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

      {/* Sección 1: Mostrador de Nuevo Préstamo Presencial (HU2) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserCheck className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900">Mostrador de Préstamos Presenciales (HU2)</h2>
        </div>

        <form onSubmit={handleCrearPrestamo} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          
          {/* Selector de Lector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Seleccionar Lector (Alumno o Docente)
            </label>
            <select
              value={usuarioSeleccionadoId}
              onChange={(e) => setUsuarioSeleccionadoId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-brand-500"
              required
            >
              <option value="">-- Seleccionar Lector --</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.apellido}, {u.nombre} ({u.rol}) - {u.estado}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Recurso */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Seleccionar Título
            </label>
            <select
              value={recursoSeleccionadoId}
              onChange={(e) => setRecursoSeleccionadoId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-brand-500"
              required
            >
              <option value="">-- Seleccionar Título --</option>
              {recursos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.titulo} ({r.ejemplares_disponibles} disp.)
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Ejemplar Físico (RN1) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Copia Física Disponible (RN1)
            </label>
            <select
              value={ejemplarSeleccionadoId}
              onChange={(e) => setEjemplarSeleccionadoId(e.target.value)}
              disabled={ejemplaresDisponibles.length === 0}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
              required
            >
              {ejemplaresDisponibles.length === 0 ? (
                <option value="">Sin copias disponibles</option>
              ) : (
                ejemplaresDisponibles.map((ej) => (
                  <option key={ej.id} value={ej.id}>
                    {ej.codigo_inventario} - {ej.ubicacion_estante}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={!usuarioSeleccionadoId || !ejemplarSeleccionadoId}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Confirmar Préstamo en Mostrador
            </button>
          </div>

        </form>
      </div>

      {/* Sección 2: Devoluciones en Mostrador y Sanciones (HU4) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Recepción de Devoluciones y Auditoría (HU4)</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">{prestamosActivos.length} activos</span>
        </div>

        {cargando ? (
          <p className="text-xs text-slate-400">Cargando...</p>
        ) : prestamosActivos.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No hay préstamos pendientes de devolución.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {prestamosActivos.map((p) => {
              const estaVencido = new Date() > new Date(p.fecha_limite);

              return (
                <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{p.recurso_titulo}</h4>
                    <span className="text-xs text-slate-500 block">
                      Lector: <strong className="text-slate-700">{p.usuario_nombre}</strong> ({p.usuario_rol}) • Copia: <code className="text-brand-600 font-bold">{p.ejemplar_codigo}</code>
                    </span>
                    <span className={`text-[11px] font-semibold ${estaVencido ? 'text-rose-600' : 'text-slate-500'}`}>
                      Límite: {new Date(p.fecha_limite).toLocaleDateString()} {estaVencido && '• [EN MORA ACTIVA]'}
                    </span>
                  </div>

                  {/* Acciones de Devolución con Estado Físico (RN11) */}
                  <div className="flex items-center gap-2">
                    <select
                      value={estadoFisicoMap[p.id] || 'OPTIMO'}
                      onChange={(e) => setEstadoFisicoMap({ ...estadoFisicoMap, [p.id]: e.target.value as any })}
                      className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                    >
                      <option value="OPTIMO">Óptimo (Limpio)</option>
                      <option value="DETERIORADO">Deteriorado (Rotura)</option>
                      <option value="EXTRAVIADO">Extraviado (Pérdida)</option>
                    </select>

                    <button
                      onClick={() => handleDevolucion(p.id)}
                      className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors shadow-sm"
                    >
                      Registrar Devolución
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sección 3: Retiro de Reservas Asignadas (HU7, RN8, RN9) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Reservas Apartadas para Retiro en 48 hs (HU7, RN8)</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">{reservasAsignadas.length} listas</span>
        </div>

        {cargando ? (
          <p className="text-xs text-slate-400">Cargando...</p>
        ) : reservasAsignadas.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No hay reservas asignadas esperando retiro en este momento.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reservasAsignadas.map((r) => (
              <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{r.recurso_titulo}</h4>
                  <span className="text-xs text-slate-500 block">
                    Beneficiario: <strong className="text-slate-700">{r.usuario_nombre}</strong> • Copia reservada: <code className="text-emerald-700 font-bold">{r.ejemplar_codigo}</code>
                  </span>
                  {r.fecha_limite_retiro && (
                    <span className="text-[11px] text-amber-700 font-semibold block">
                      Tolerancia de retiro hasta: {new Date(r.fecha_limite_retiro).toLocaleString()}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleRetirarReserva(r.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Efectivizar Retiro y Entregar (RN9)
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
