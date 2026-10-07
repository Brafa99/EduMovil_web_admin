import type { Estudiante, PaginatedResponse } from '../types';
import { apiRequest, IS_MOCK_MODE } from './client';
import { ESTUDIANTES } from '../mocks/data';

interface BackendEstudiante {
  id: string;
  ci: string | null;
  nombres: string;
  apellidos: string;
  codigoRude: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  padreci: string | null;
  madreci: string | null;
  unidadEducativaId: string;
  cursoActualId: string | null;
  promedioActual: string | number | null;
  promedioEstimadoPostPracticas: string | number | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;

  cursoActual?: {
    id: string;
    nombre: string;
    ciclo: string;
    grado: number | null;
    paralelo: string | null;
    turno: string | null;
    numeroAlumnos: number;
    jefeCursoId: string | null;
    gestionId: string | null;
    unidadEducativaId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

function mapEstudiante(
  item: BackendEstudiante
): Estudiante {
  return {
    id: item.id,
    ci: item.ci ?? '',
    nombres: item.nombres,
    apellidos: item.apellidos,
    codigoRude: item.codigoRude ?? undefined,
    fechaNacimiento: item.fechaNacimiento ?? '',
    genero:
      item.genero === 'F'
        ? 'F'
        : item.genero === 'M'
          ? 'M'
          : undefined,

    cursoActualId:
      item.cursoActualId ?? undefined,

    paralelo:
      item.cursoActual?.paralelo ?? undefined,

    unidadEducativaId:
  item.cursoActual?.unidadEducativaId ??
  item.unidadEducativaId,

    gestionId:
      item.cursoActual?.gestionId ?? '',

    activo: item.activo,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function getEstudiantes(
  params?: {
    search?: string;
    cursoId?: string;
    unidadEducativaId?: string;
  }
): Promise<PaginatedResponse<Estudiante>> {
  if (IS_MOCK_MODE) {
    let data = [...ESTUDIANTES];

    if (params?.search) {
      const q = params.search.toLowerCase();

      data = data.filter(
        e =>
          e.nombres.toLowerCase().includes(q) ||
          e.apellidos.toLowerCase().includes(q) ||
          e.ci.includes(q)
      );
    }

    if (params?.cursoId) {
      data = data.filter(
        e => e.cursoActualId === params.cursoId
      );
    }

    if (params?.unidadEducativaId) {
      data = data.filter(
        e =>
          e.unidadEducativaId ===
          params.unidadEducativaId
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
  await apiRequest<BackendEstudiante[]>(
    '/estudiantes'
  );

console.log('Respuesta original del backend:', response);

let data = response.map(mapEstudiante);

console.log('Estudiantes después del mapeo:', data);

  if (params?.search) {
    const q = params.search.toLowerCase();

    data = data.filter(
      e =>
        e.nombres.toLowerCase().includes(q) ||
        e.apellidos.toLowerCase().includes(q) ||
        e.ci.toLowerCase().includes(q)
    );
  }

  if (params?.cursoId) {
    data = data.filter(
      e => e.cursoActualId === params.cursoId
    );
  }

  if (params?.unidadEducativaId) {
    data = data.filter(
      e =>
        e.unidadEducativaId ===
        params.unidadEducativaId
    );
  }

  return {
    data,
    total: data.length,
    page: 1,
    limit: data.length || 20,
  };
}

export interface CreateEstudiantePayload {
  ci: string;
  nombres: string;
  apellidos: string;
  codigoRude?: string;
  fechaNacimiento?: string;
  genero?: 'M' | 'F';
  direccion?: string;
  telefono?: string;
  email?: string;
  padreci?: string;
  madreci?: string;
  cursoActualId?: string;
  unidadEducativaId: string;
  activo: boolean;
}


function generarCodigoRude(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const aleatorio = Array.from(bytes, byte =>
    byte.toString(16).padStart(2, '0')
  ).join('').toUpperCase();

  return `EM-${aleatorio}`;
}


export async function createEstudiante(
  data: CreateEstudiantePayload
): Promise<Estudiante> {
  if (IS_MOCK_MODE) {
    const nuevo: Estudiante = {
      id: `est-${Date.now()}`,
      ci: data.ci,
      nombres: data.nombres,
      apellidos: data.apellidos,
      codigoRude: data.codigoRude?.trim() || generarCodigoRude(),
      fechaNacimiento:
        data.fechaNacimiento ?? '',
      genero: data.genero,
      cursoActualId:
        data.cursoActualId,
      unidadEducativaId: data.unidadEducativaId,
      gestionId: '',
      activo: data.activo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ESTUDIANTES.push(nuevo);

    return nuevo;
  }

const payload = {
  ci: data.ci,
  nombres: data.nombres,
  apellidos: data.apellidos,
  codigoRude: data.codigoRude?.trim() || generarCodigoRude(),
  fechaNacimiento: data.fechaNacimiento
    ? `${data.fechaNacimiento}T12:00:00.000Z`
    : undefined,
  genero: data.genero || undefined,
  direccion: data.direccion || undefined,
  telefono: data.telefono || undefined,
  email: data.email || undefined,
  padreci: data.padreci || undefined,
  madreci: data.madreci || undefined,
  cursoActualId: data.cursoActualId || undefined,
  unidadEducativaId: data.unidadEducativaId,
  activo: data.activo,
};

  const response =
    await apiRequest<BackendEstudiante>(
      '/estudiantes',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

  return mapEstudiante(response);
}

export async function updateEstudiante(
  id: string,
  data: Partial<Estudiante> & {
    codigoRude?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    padreci?: string;
    madreci?: string;
  }
): Promise<Estudiante> {
  if (IS_MOCK_MODE) {
    const idx = ESTUDIANTES.findIndex(
      e => e.id === id
    );

    if (idx === -1) {
      throw {
        statusCode: 404,
        message: 'Estudiante no encontrado',
      };
    }

    ESTUDIANTES[idx] = {
      ...ESTUDIANTES[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return ESTUDIANTES[idx];
  }

  const payload: Record<string, unknown> = {};

  if (data.ci !== undefined) {
    payload.ci = data.ci;
  }

  if (data.nombres !== undefined) {
    payload.nombres = data.nombres;
  }

  if (data.apellidos !== undefined) {
    payload.apellidos = data.apellidos;
  }

  if (data.codigoRude !== undefined) {
    payload.codigoRude =
      data.codigoRude || null;
  }

if (data.fechaNacimiento !== undefined) {
  payload.fechaNacimiento = data.fechaNacimiento
    ? `${data.fechaNacimiento}T12:00:00.000Z`
    : null;
}

  if (data.genero !== undefined) {
    payload.genero = data.genero || null;
  }

  if (data.direccion !== undefined) {
    payload.direccion =
      data.direccion || null;
  }

  if (data.telefono !== undefined) {
    payload.telefono =
      data.telefono || null;
  }

  if (data.email !== undefined) {
    payload.email =
      data.email || null;
  }

  if (data.padreci !== undefined) {
    payload.padreci =
      data.padreci || null;
  }

  if (data.madreci !== undefined) {
    payload.madreci =
      data.madreci || null;
  }

  if (data.cursoActualId !== undefined) {
    payload.cursoActualId =
      data.cursoActualId || null;
  }

  if (data.activo !== undefined) {
    payload.activo = data.activo;
  }

  const response =
    await apiRequest<BackendEstudiante>(
      `/estudiantes/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );

  return mapEstudiante(response);
}

export async function cambiarEstadoEstudiante(
  codigoRude: string,
  activar: boolean
): Promise<unknown> {
  return apiRequest<unknown>(
    '/estudiantes/bloquear',
    {
      method: 'PATCH',
      body: JSON.stringify({
        codigoRude,
        activar,
      }),
    }
  );
}