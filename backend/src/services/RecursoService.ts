import { query } from '../db/index.js';

export interface RecursoFiltros {
  buscar?: string;
  categoria?: string;
  solo_disponibles?: boolean;
}

// Mock inicial de recursos y ejemplares para tests locales o fallback
export let RECURSOS_MOCK = [
  {
    id: 1,
    titulo: 'Cien Años de Soledad',
    autor: 'Gabriel García Márquez',
    isbn: '978-0307474728',
    categoria: 'Literatura Latinoamericana',
    descripcion: 'Obra maestra de la literatura universal.',
    portada_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 2,
    titulo: 'Física Universitaria Volumen 1',
    autor: 'Sears & Zemansky',
    isbn: '978-6073221900',
    categoria: 'Ciencias Exactas',
    descripcion: 'Texto fundamental de mecánica y ondas.',
    portada_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 3,
    titulo: 'Química Orgánica',
    autor: 'Paula Yurkanis Bruice',
    isbn: '978-8478290741',
    categoria: 'Química',
    descripcion: 'Fundamentos modernos de reactividad química.',
    portada_url: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 4,
    titulo: 'Introducción a los Algoritmos',
    autor: 'Thomas Cormen',
    isbn: '978-0262033848',
    categoria: 'Tecnología',
    descripcion: 'Guía integral sobre diseño de algoritmos.',
    portada_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 5,
    titulo: 'Historia Universal Contemporánea',
    autor: 'María Ramírez',
    isbn: '978-9500732111',
    categoria: 'Historia',
    descripcion: 'Procesos geopolíticos de los siglos XX y XXI.',
    portada_url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=400'
  }
];

export let EJEMPLARES_MOCK = [
  { id: 1, recurso_id: 1, codigo_inventario: 'LIT-001-A', ubicacion_estante: 'Estante A-1', estado: 'DISPONIBLE' },
  { id: 2, recurso_id: 1, codigo_inventario: 'LIT-001-B', ubicacion_estante: 'Estante A-1', estado: 'PRESTADO' },
  { id: 3, recurso_id: 2, codigo_inventario: 'FIS-002-A', ubicacion_estante: 'Estante B-3', estado: 'DISPONIBLE' },
  { id: 4, recurso_id: 2, codigo_inventario: 'FIS-002-B', ubicacion_estante: 'Estante B-3', estado: 'DISPONIBLE' },
  { id: 5, recurso_id: 3, codigo_inventario: 'QUI-003-A', ubicacion_estante: 'Estante C-2', estado: 'PRESTADO' }, // 0 disponibles
  { id: 6, recurso_id: 4, codigo_inventario: 'TEC-004-A', ubicacion_estante: 'Estante D-5', estado: 'DISPONIBLE' },
  { id: 7, recurso_id: 5, codigo_inventario: 'HIS-005-A', ubicacion_estante: 'Taller Técnico', estado: 'EN_REPARACION' } // 0 disponibles
];

export class RecursoService {
  static async listarRecursos(filtros: RecursoFiltros = {}) {
    // Intentar consulta PostgreSQL
    try {
      let sql = `
        SELECT r.*,
               COUNT(e.id)::int AS ejemplares_totales,
               COUNT(CASE WHEN e.estado = 'DISPONIBLE' THEN 1 END)::int AS ejemplares_disponibles
        FROM recursos r
        LEFT JOIN ejemplares e ON r.id = e.recurso_id
        WHERE 1=1
      `;
      const params: any[] = [];
      let pIdx = 1;

      if (filtros.buscar) {
        sql += ` AND (LOWER(r.titulo) LIKE LOWER($${pIdx}) OR LOWER(r.autor) LIKE LOWER($${pIdx}))`;
        params.push(`%${filtros.buscar}%`);
        pIdx++;
      }

      if (filtros.categoria) {
        sql += ` AND LOWER(r.categoria) = LOWER($${pIdx})`;
        params.push(filtros.categoria);
        pIdx++;
      }

      sql += ` GROUP BY r.id ORDER BY r.titulo ASC`;

      const res = await query(sql, params);
      if (res && res.rows) {
        let rows = res.rows;
        if (filtros.solo_disponibles) {
          rows = rows.filter(r => r.ejemplares_disponibles > 0);
        }
        return rows;
      }
    } catch (e) {
      // Fallback a memoria
    }

    // Procesamiento en memoria
    let resultado = RECURSOS_MOCK.map(rec => {
      const ejemplares = EJEMPLARES_MOCK.filter(e => e.recurso_id === rec.id);
      const ejemplares_totales = ejemplares.length;
      const ejemplares_disponibles = ejemplares.filter(e => e.estado === 'DISPONIBLE').length;

      return {
        ...rec,
        ejemplares_totales,
        ejemplares_disponibles
      };
    });

    if (filtros.buscar) {
      const q = filtros.buscar.toLowerCase();
      resultado = resultado.filter(r => r.titulo.toLowerCase().includes(q) || r.autor.toLowerCase().includes(q));
    }

    if (filtros.categoria) {
      resultado = resultado.filter(r => r.categoria.toLowerCase() === filtros.categoria!.toLowerCase());
    }

    if (filtros.solo_disponibles) {
      resultado = resultado.filter(r => r.ejemplares_disponibles > 0);
    }

    return resultado;
  }

  static async obtenerPorId(id: number) {
    try {
      const res = await query('SELECT * FROM recursos WHERE id = $1', [id]);
      if (res && res.rows && res.rows.length > 0) {
        const recurso = res.rows[0];
        const resEj = await query('SELECT * FROM ejemplares WHERE recurso_id = $1 ORDER BY codigo_inventario ASC', [id]);
        return {
          ...recurso,
          ejemplares: resEj.rows
        };
      }
    } catch (e) {
      // fallback
    }

    const recurso = RECURSOS_MOCK.find(r => r.id === id);
    if (!recurso) {
      const err: any = new Error('Recurso bibliográfico no encontrado');
      err.status = 404;
      throw err;
    }

    const ejemplares = EJEMPLARES_MOCK.filter(e => e.recurso_id === id);
    return {
      ...recurso,
      ejemplares
    };
  }

  static async crearRecurso(datos: { titulo: string; autor: string; isbn?: string; categoria: string; descripcion?: string; portada_url?: string }) {
    if (!datos.titulo || !datos.autor || !datos.categoria) {
      const err: any = new Error('Título, autor y categoría son campos obligatorios');
      err.status = 400;
      throw err;
    }

    try {
      const res = await query(
        `INSERT INTO recursos (titulo, autor, isbn, categoria, descripcion, portada_url)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [datos.titulo, datos.autor, datos.isbn || null, datos.categoria, datos.descripcion || null, datos.portada_url || null]
      );
      if (res && res.rows && res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (e) {
      // fallback
    }

    const nuevo = {
      id: RECURSOS_MOCK.length + 1,
      titulo: datos.titulo,
      autor: datos.autor,
      isbn: datos.isbn || `978-00000000${RECURSOS_MOCK.length}`,
      categoria: datos.categoria,
      descripcion: datos.descripcion || '',
      portada_url: datos.portada_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'
    };
    RECURSOS_MOCK.push(nuevo);
    return nuevo;
  }

  static async agregarEjemplar(recursoId: number, datos: { codigo_inventario: string; ubicacion_estante: string }) {
    if (!datos.codigo_inventario || !datos.ubicacion_estante) {
      const err: any = new Error('Código de inventario y ubicación son obligatorios');
      err.status = 400;
      throw err;
    }

    // Verificar unicidad de código
    const existente = EJEMPLARES_MOCK.find(e => e.codigo_inventario === datos.codigo_inventario);
    if (existente) {
      const err: any = new Error('El código de inventario ya existe');
      err.status = 409;
      throw err;
    }

    const nuevo = {
      id: EJEMPLARES_MOCK.length + 1,
      recurso_id: recursoId,
      codigo_inventario: datos.codigo_inventario,
      ubicacion_estante: datos.ubicacion_estante,
      estado: 'DISPONIBLE'
    };
    EJEMPLARES_MOCK.push(nuevo);
    return nuevo;
  }
}
