import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, BookOpen, CheckCircle, Clock, AlertCircle, X, BookmarkPlus } from 'lucide-react';

export interface Ejemplar {
  id: number;
  codigo_inventario: string;
  ubicacion_estante: string;
  estado: 'DISPONIBLE' | 'PRESTADO' | 'RESERVADO' | 'EN_REPARACION' | 'DADO_DE_BAJA';
}

export interface Recurso {
  id: number;
  titulo: string;
  autor: string;
  isbn: string;
  categoria: string;
  descripcion: string;
  portada_url: string;
  ejemplares_totales: number;
  ejemplares_disponibles: number;
  ejemplares?: Ejemplar[];
}

export const Catalogo: React.FC = () => {
  const { usuario } = useAuth();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('');
  const [soloDisponibles, setSoloDisponibles] = useState<boolean>(false);

  const [recursoSeleccionado, setRecursoSeleccionado] = useState<Recurso | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string>('');
  const [errorAccion, setErrorAccion] = useState<string>('');

  const cargarRecursos = async () => {
    setCargando(true);
    try {
      const queryParams = new URLSearchParams();
      if (busqueda.trim()) queryParams.append('buscar', busqueda.trim());
      if (categoria) queryParams.append('categoria', categoria);
      if (soloDisponibles) queryParams.append('solo_disponibles', 'true');

      const data = await apiRequest<Recurso[]>(`/api/recursos?${queryParams.toString()}`);
      setRecursos(data);
    } catch (err: any) {
      console.error('Error al cargar catálogo:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRecursos();
  }, [categoria, soloDisponibles]);

  const handleBuscarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cargarRecursos();
  };

  const verDetalle = async (id: number) => {
    try {
      const detalle = await apiRequest<Recurso>(`/api/recursos/${id}`);
      setRecursoSeleccionado(detalle);
      setErrorAccion('');
      setMensajeExito('');
    } catch (err: any) {
      setErrorAccion(err.message || 'No se pudo cargar el detalle');
    }
  };

  const handleReservar = async (recursoId: number) => {
    setErrorAccion('');
    setMensajeExito('');

    if (!usuario) {
      setErrorAccion('Debes iniciar sesión para solicitar una reserva');
      return;
    }

    try {
      const res = await apiRequest('/api/reservas', {
        method: 'POST',
        body: JSON.stringify({ recurso_id: recursoId })
      });

      setMensajeExito(`¡Reserva confirmada! Posición en cola de espera: #${res.posicion_en_cola}`);
      cargarRecursos();
      if (recursoSeleccionado) {
        verDetalle(recursoId);
      }
    } catch (err: any) {
      setErrorAccion(err.message || 'Error al procesar la reserva');
    }
  };

  const categoriasDisponibles = [
    'Literatura Latinoamericana',
    'Ciencias Exactas',
    'Química',
    'Tecnología',
    'Historia'
  ];

  return (
    <div className="space-y-6">
      
      {/* Notificaciones de Éxito o Error */}
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
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>{errorAccion}</span>
          </div>
          <button onClick={() => setErrorAccion('')} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda (HU1) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        
        {/* Input de Búsqueda */}
        <form onSubmit={handleBuscarSubmit} className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por título, autor o palabra clave..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </form>

        {/* Filtro por Categoría */}
        <div className="sm:w-64 relative">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          >
            <option value="">Todas las categorías</option>
            {categoriasDisponibles.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
        </div>

        {/* Checkbox Solo Disponibles (HU1) */}
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none py-1">
          <input
            type="checkbox"
            checked={soloDisponibles}
            onChange={(e) => setSoloDisponibles(e.target.checked)}
            className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
          />
          <span>Solo con stock disponible</span>
        </label>

        <button
          onClick={cargarRecursos}
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          Filtrar
        </button>
      </div>

      {/* Grid de Recursos Bibliográficos */}
      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-4">
              <div className="h-44 bg-slate-200 rounded-xl"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : recursos.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No se encontraron materiales</h3>
          <p className="text-xs text-slate-500 mt-1">Probá cambiando los términos de búsqueda o quitando los filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recursos.map((rec) => {
            const tieneDisponibles = rec.ejemplares_disponibles > 0;

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Portada e Insignias */}
                <div className="h-48 overflow-hidden relative bg-slate-100 cursor-pointer" onClick={() => verDetalle(rec.id)}>
                  <img
                    src={rec.portada_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'}
                    alt={rec.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-sm text-slate-700">
                      {rec.categoria}
                    </span>
                    {tieneDisponibles ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {rec.ejemplares_disponibles} disp.
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500 text-white shadow-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Agotado
                      </span>
                    )}
                  </div>
                </div>

                {/* Contenido de la Tarjeta */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 
                      onClick={() => verDetalle(rec.id)}
                      className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors cursor-pointer line-clamp-1"
                    >
                      {rec.titulo}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mb-2">{rec.autor}</p>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                      {rec.descripcion}
                    </p>
                  </div>

                  {/* Acciones y Botones */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => verDetalle(rec.id)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Ver Ejemplares ({rec.ejemplares_totales})
                    </button>

                    {/* Botón de Reserva con RN7: Habilitado solo si ejemplares_disponibles === 0 */}
                    {!tieneDisponibles && (
                      <button
                        onClick={() => handleReservar(rec.id)}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                        title="Unirse a la lista de espera FIFO"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        Reservar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle de Ejemplares (RN1) */}
      {recursoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            
            <button
              onClick={() => setRecursoSeleccionado(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-4 items-start mb-6">
              <img
                src={recursoSeleccionado.portada_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'}
                alt={recursoSeleccionado.titulo}
                className="w-20 h-28 object-cover rounded-xl shadow-sm border border-slate-200"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  {recursoSeleccionado.categoria}
                </span>
                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {recursoSeleccionado.titulo}
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {recursoSeleccionado.autor}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  ISBN: {recursoSeleccionado.isbn || 'N/A'}
                </p>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Copias Físicas e Inventario (RN1)
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {recursoSeleccionado.ejemplares && recursoSeleccionado.ejemplares.length > 0 ? (
                recursoSeleccionado.ejemplares.map((ej) => (
                  <div
                    key={ej.id}
                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800">{ej.codigo_inventario}</span>
                      <span className="block text-[11px] text-slate-500">Ubicación: {ej.ubicacion_estante}</span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      ej.estado === 'DISPONIBLE' ? 'bg-emerald-100 text-emerald-800' :
                      ej.estado === 'PRESTADO' ? 'bg-blue-100 text-blue-800' :
                      ej.estado === 'RESERVADO' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {ej.estado.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No hay ejemplares registrados para este título.</p>
              )}
            </div>

            {/* Acción de Reserva dentro del Modal si no hay disponibles */}
            {recursoSeleccionado.ejemplares_disponibles === 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleReservar(recursoSeleccionado.id)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  Solicitar Reserva de este Título (RN7)
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
