import type {
  Profesor,
  PaginatedResponse,
  UnidadEducativa,
} from '../types';
import { apiRequest, IS_MOCK_MODE } from './client';
import { PROFESORES } from '../mocks/data';

interface BackendProfesor {
  id: string;
  ci: string;
  nombres: string;
  apellidos: string;
  titulo?: string | null;
  email?: string | null;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  activo: boolean;
  unidadEducativaId?: string | null;
  createdAt: string;
  updatedAt: string;

  unidadEducativa?: {
    id: string;
    nombre: string;
  } | null;

  _count?: {
    materias?: number;
    cursosComoJefe?: number;
  };
}

function mapUnidadEducativa(
  unidad?: BackendProfesor['unidadEducativa'] | null
): UnidadEducativa | undefined {
  if (!unidad) return undefined;

  return {
    id: unidad.id,
    nombre: unidad.nombre,
    tipo: 'unidad_educativa',
    ciudad: '',
    departamento: '',
    activo: true,
    createdAt: '',
    updatedAt: '',
  };
}

function mapProfesor(profesor: BackendProfesor): Profesor {
  return {
    id: profesor.id,
    profesorCi: profesor.ci,
    nombres: profesor.nombres,
    apellidos: profesor.apellidos,
    telefono: profesor.telefono ?? undefined,
    email: profesor.email ?? undefined,
    activo: profesor.activo,
    unidadEducativaId:
      profesor.unidadEducativaId ?? '',
    unidadEducativa: mapUnidadEducativa(
      profesor.unidadEducativa
    ),
    createdAt: profesor.createdAt,
    updatedAt: profesor.updatedAt,
  };
}

export async function getProfesores(
  params?: { search?: string }
): Promise<PaginatedResponse<Profesor>> {
  if (IS_MOCK_MODE) {
    let data = [...PROFESORES];

    if (params?.search) {
      const q = params.search.toLowerCase();

      data = data.filter(
        p =>
          p.nombres.toLowerCase().includes(q) ||
          p.apellidos.toLowerCase().includes(q) ||
          p.profesorCi.includes(q)
      );
    }

    return {
      data,
      total: data.length,
      page: 1,
      limit: 20,
    };
  }

  const response =
    await apiRequest<BackendProfesor[]>(
      '/profesores'
    );

  let data = response.map(mapProfesor);

  if (params?.search) {
    const q = params.search.toLowerCase();

    data = data.filter(
      p =>
        p.nombres.toLowerCase().includes(q) ||
        p.apellidos.toLowerCase().includes(q) ||
        p.profesorCi.includes(q)
    );
  }

  return {
    data,
    total: data.length,
    page: 1,
    limit: data.length || 20,
  };
}

export async function createProfesor(
  data: Omit<
    Profesor,
    'id' |
    'createdAt' |
    'updatedAt' |
    'unidadEducativa' |
    'materias'
  >
): Promise<Profesor> {
  
if (IS_MOCK_MODE) {
  const nuevo: Profesor = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  PROFESORES.push(nuevo);
  return nuevo;
}

  const payload = {
    ci: data.profesorCi,
    nombres: data.nombres,
    apellidos: data.apellidos,
    telefono: data.telefono || undefined,
    email: data.email || undefined,
    activo: data.activo,
    unidadEducativaId:
      data.unidadEducativaId || undefined,
  };

  const response =
    await apiRequest<BackendProfesor>(
      '/profesores',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

  return mapProfesor(response);
}


export async function updateProfesor(
  id: string,
  data: Partial<Profesor>
): Promise<Profesor> {
  if (IS_MOCK_MODE) {
    const idx = PROFESORES.findIndex(
      p => p.id === id
    );

    if (idx === -1) {
      throw {
        statusCode: 404,
        message: 'Profesor no encontrado',
      };
    }

    PROFESORES[idx] = {
      ...PROFESORES[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return PROFESORES[idx];
  }

  const payload: Record<string, unknown> = {};

  if (data.profesorCi !== undefined) {
    payload.ci = data.profesorCi;
  }

  if (data.nombres !== undefined) {
    payload.nombres = data.nombres;
  }

  if (data.apellidos !== undefined) {
    payload.apellidos = data.apellidos;
  }

  if (data.telefono !== undefined) {
    payload.telefono = data.telefono || null;
  }

  if (data.email !== undefined) {
    payload.email = data.email || null;
  }

  if (data.activo !== undefined) {
    payload.activo = data.activo;
  }

  if (data.unidadEducativaId !== undefined) {
    payload.unidadEducativaId =
      data.unidadEducativaId || null;
  }

  const response =
    await apiRequest<BackendProfesor>(
      `/profesores/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );

  return mapProfesor(response);
}