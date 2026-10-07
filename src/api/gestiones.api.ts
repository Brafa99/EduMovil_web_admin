import type { GestionAcademica, PaginatedResponse } from '../types';
import { apiRequest, IS_MOCK_MODE } from './client';
import { GESTIONES } from '../mocks/data';

interface BackendGestion {
  id: string;
  anio: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  activa: boolean;
  unidadEducativaId: string | null;
  createdAt: string;
  updatedAt: string;

  unidadEducativa?: {
    id: string;
    nombre: string;
  } | null;

  _count?: {
    cursos?: number;
  };
}

function mapGestion(item: BackendGestion): GestionAcademica {
  return {
    id: item.id,
    anio: item.anio,

    // El backend no tiene "nombre"; lo derivamos para la UI.
    nombre: `Gestión ${item.anio}`,

    fechaInicio: item.fechaInicio ?? '',
    fechaFin: item.fechaFin ?? '',

    // Backend: activa → Frontend: activo
    activo: item.activa,

    unidadEducativaId: item.unidadEducativaId ?? '',

    unidadEducativa: item.unidadEducativa
      ? {
          id: item.unidadEducativa.id,
          nombre: item.unidadEducativa.nombre,
          tipo: 'unidad_educativa',
          ciudad: '',
          departamento: '',
          activo: true,
          createdAt: '',
          updatedAt: '',
        }
      : undefined,

    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/**
 * Payload que realmente acepta el backend para crear/actualizar
 * una gestión académica.
 *
 * No usamos GestionAcademica aquí porque ese tipo contiene
 * campos exclusivos de la UI como "nombre" y usa "activo"
 * en lugar de "activa".
 */
export interface CreateGestionPayload {
  anio: number;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  unidadEducativaId: string;
}

export async function getGestiones(
  params?: { search?: string },
): Promise<PaginatedResponse<GestionAcademica>> {
  if (IS_MOCK_MODE) {
    let data = [...GESTIONES];

    if (params?.search) {
      const q = params.search.toLowerCase();

      data = data.filter(
        g => g.nombre.toLowerCase().includes(q),
      );
    }

    return {
      data,
      total: data.length,
      page: 1,
      limit: 20,
    };
  }

  const response = await apiRequest<BackendGestion[]>(
    '/gestiones',
  );

  let data = response.map(mapGestion);

  if (params?.search) {
    const q = params.search.toLowerCase();

    data = data.filter(
      g =>
        g.nombre.toLowerCase().includes(q) ||
        String(g.anio).includes(q),
    );
  }

  return {
    data,
    total: data.length,
    page: 1,
    limit: data.length || 20,
  };
}


export async function createGestion(
  data: CreateGestionPayload,
): Promise<GestionAcademica> {
  if (IS_MOCK_MODE) {
    const nuevo: GestionAcademica = {
      id: `gest-${Date.now()}`,
      anio: data.anio,
      nombre: `Gestión ${data.anio}`,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      activo: data.activa,
      unidadEducativaId: data.unidadEducativaId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    GESTIONES.push(nuevo);

    return nuevo;
  }

  const payload = {
    ...data,
    fechaInicio: normalizarFechaISO(data.fechaInicio),
    fechaFin: normalizarFechaISO(data.fechaFin),
  };

  const response = await apiRequest<BackendGestion>(
    '/gestiones',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  return mapGestion(response);
}


export async function updateGestion(
  id: string,
  data: Partial<CreateGestionPayload>,
): Promise<GestionAcademica> {
  if (IS_MOCK_MODE) {
    const idx = GESTIONES.findIndex(
      g => g.id === id,
    );

    if (idx === -1) {
      throw {
        statusCode: 404,
        message: 'Gestión no encontrada',
      };
    }

    const current = GESTIONES[idx];

    GESTIONES[idx] = {
      ...current,
      ...(data.anio !== undefined && {
        anio: data.anio,
        nombre: `Gestión ${data.anio}`,
      }),
      ...(data.fechaInicio !== undefined && {
        fechaInicio: data.fechaInicio,
      }),
      ...(data.fechaFin !== undefined && {
        fechaFin: data.fechaFin,
      }),
      ...(data.activa !== undefined && {
        activo: data.activa,
      }),
      ...(data.unidadEducativaId !== undefined && {
        unidadEducativaId: data.unidadEducativaId,
      }),
      updatedAt: new Date().toISOString(),
    };

    return GESTIONES[idx];
  }

  const payload = {
    ...data,
    ...(data.fechaInicio !== undefined && {
      fechaInicio: normalizarFechaISO(data.fechaInicio),
    }),
    ...(data.fechaFin !== undefined && {
      fechaFin: normalizarFechaISO(data.fechaFin),
    }),
  };

  const response = await apiRequest<BackendGestion>(
    `/gestiones/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );

  return mapGestion(response);
}

function normalizarFechaISO(fecha: string): string {
  // Si ya incluye hora y zona horaria, conservar la fecha como ISO.
  if (fecha.includes('T')) {
    return new Date(fecha).toISOString();
  }

  // Si viene como YYYY-MM-DD, interpretarla en UTC.
  return new Date(`${fecha}T00:00:00.000Z`).toISOString();
}