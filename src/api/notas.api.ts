import type {
  Estudiante,
  Materia,
  Nota,
  PaginatedResponse,
} from '../types';
import { apiRequest, IS_MOCK_MODE } from './client';
import { NOTAS } from '../mocks/data';

type BackendTrimestre = 'T1' | 'T2' | 'T3';

interface BackendNota {
  id: string;
  notaNumeral: number | string;
  notaLiteral?: string | null;
  trimestre: BackendTrimestre;
  observaciones?: string | null;
  materiaId: string;
  estudianteCi?: string | null;
  estudianteId?: string | null;
  cursoId: string;
  unidadEducativaId: string;
  createdAt: string;
  updatedAt: string;

  estudiante?: {
    id: string;
    nombres: string;
    apellidos: string;
    codigoRude?: string | null;
  } | null;

  materia?: {
    id: string;
    nombreMateria: string;
  } | null;

  curso?: {
    id: string;
    nombre: string;
  } | null;
}

export interface CreateNotaPayload {
  notaNumeral: number;
  trimestre?: BackendTrimestre;
  observaciones?: string | null;
  materiaId: string;
  estudianteId: string;
  cursoId?: string;
  unidadEducativaId?: string;
}

export interface UpdateNotaPayload {
  notaNumeral?: number;
  trimestre?: BackendTrimestre;
  observaciones?: string | null;
  materiaId?: string;
  estudianteId?: string;
  cursoId?: string;
  unidadEducativaId?: string;
}

function mapTrimestre(trimestre?: BackendTrimestre): 1 | 2 | 3 {
  switch (trimestre) {
    case 'T2':
      return 2;
    case 'T3':
      return 3;
    case 'T1':
    default:
      return 1;
  }
}

function mapEstado(
  notaLiteral?: string | null,
): Nota['estado'] {
  if (!notaLiteral) {
    return 'pendiente';
  }

  const literal = notaLiteral.toUpperCase().trim();

  if (literal === 'INSUFICIENTE') {
    return 'reprobado';
  }

  if (
    literal === 'SUFICIENTE' ||
    literal === 'BUENO' ||
    literal === 'EXCELENTE'
  ) {
    return 'aprobado';
  }

  return 'pendiente';
}

function mapEstudiante(
  estudiante?: BackendNota['estudiante'],
): Estudiante | undefined {
  if (!estudiante) {
    return undefined;
  }

  return {
    id: estudiante.id,
    ci: '',
    nombres: estudiante.nombres,
    apellidos: estudiante.apellidos,
    fechaNacimiento: '',
    cursoActualId: undefined,
    unidadEducativaId: '',
    gestionId: '',
    activo: true,
    createdAt: '',
    updatedAt: '',
  };
}

function mapMateria(
  materia?: BackendNota['materia'],
): Materia | undefined {
  if (!materia) {
    return undefined;
  }

  return {
    id: materia.id,
    nombre: materia.nombreMateria,
    cursoId: '',
    activo: true,
    createdAt: '',
    updatedAt: '',
  };
}

function mapNota(nota: BackendNota): Nota {
  const puntaje = Number(nota.notaNumeral);

  return {
    id: nota.id,
    estudianteId: nota.estudianteId ?? '',
    estudiante: mapEstudiante(nota.estudiante),
    materiaId: nota.materiaId,
    materia: mapMateria(nota.materia),

    /*
     * El backend no guarda gestionId directamente en Nota.
     * La relación real es:
     * Nota -> cursoId -> Curso -> gestionId
     *
     * Por ahora dejamos vacío para que la interfaz no falle.
     */
    gestionId: '',

    trimestre: mapTrimestre(nota.trimestre),
    puntaje: Number.isFinite(puntaje) ? puntaje : 0,
    estado: mapEstado(nota.notaLiteral),
    observacion: nota.observaciones ?? undefined,

    createdAt: nota.createdAt,
    updatedAt: nota.updatedAt,
  };
}

export async function getNotas(params?: {
  estudianteId?: string;
  materiaId?: string;
  cursoId?: string;
  unidadEducativaId?: string;
}): Promise<PaginatedResponse<Nota>> {
  if (IS_MOCK_MODE) {
    let data = [...NOTAS];

    if (params?.estudianteId) {
      data = data.filter(
        nota => nota.estudianteId === params.estudianteId,
      );
    }

    if (params?.materiaId) {
      data = data.filter(
        nota => nota.materiaId === params.materiaId,
      );
    }

    return {
      data,
      total: data.length,
      page: 1,
      limit: data.length || 20,
    };
  }

  const searchParams = new URLSearchParams();

  if (params?.estudianteId) {
    searchParams.set('estudianteId', params.estudianteId);
  }

  if (params?.materiaId) {
    searchParams.set('materiaId', params.materiaId);
  }

  if (params?.cursoId) {
    searchParams.set('cursoId', params.cursoId);
  }

  if (params?.unidadEducativaId) {
    searchParams.set(
      'unidadEducativaId',
      params.unidadEducativaId,
    );
  }

  const query = searchParams.toString();

  const response = await apiRequest<BackendNota[]>(
    query ? `/notas?${query}` : '/notas',
  );

  const data = Array.isArray(response)
    ? response.map(mapNota)
    : [];

  return {
    data,
    total: data.length,
    page: 1,
    limit: data.length || 20,
  };
}

export async function getNota(id: string): Promise<Nota> {
  if (IS_MOCK_MODE) {
    const nota = NOTAS.find(item => item.id === id);

    if (!nota) {
      throw {
        statusCode: 404,
        message: 'Nota no encontrada',
      };
    }

    return nota;
  }

  const response = await apiRequest<BackendNota>(
    `/notas/${id}`,
  );

  return mapNota(response);
}

export async function createNota(
  data: CreateNotaPayload,
): Promise<Nota> {
  if (IS_MOCK_MODE) {
    const now = new Date().toISOString();

    const nota: Nota = {
      id: `nota-${Date.now()}`,
      estudianteId: data.estudianteId,
      materiaId: data.materiaId,
      gestionId: '',
      trimestre:
        data.trimestre === 'T2'
          ? 2
          : data.trimestre === 'T3'
            ? 3
            : 1,
      puntaje: data.notaNumeral,
      estado:
        data.notaNumeral >= 51
          ? 'aprobado'
          : 'reprobado',
      observacion: data.observaciones ?? undefined,
      createdAt: now,
      updatedAt: now,
    };

    NOTAS.push(nota);

    return nota;
  }

  const response = await apiRequest<BackendNota>(
    '/notas',
    {
      method: 'POST',
      body: JSON.stringify({
        notaNumeral: data.notaNumeral,
        trimestre: data.trimestre ?? 'T1',
        observaciones: data.observaciones ?? undefined,
        materiaId: data.materiaId,
        estudianteId: data.estudianteId,
        cursoId: data.cursoId,
        unidadEducativaId: data.unidadEducativaId,
      }),
    },
  );

  return mapNota(response);
}

export async function updateNota(
  id: string,
  data: UpdateNotaPayload,
): Promise<Nota> {
  if (IS_MOCK_MODE) {
    const index = NOTAS.findIndex(
      nota => nota.id === id,
    );

    if (index === -1) {
      throw {
        statusCode: 404,
        message: 'Nota no encontrada',
      };
    }

    const actual = NOTAS[index];

    const updated: Nota = {
      ...actual,
      estudianteId:
        data.estudianteId ?? actual.estudianteId,
      materiaId:
        data.materiaId ?? actual.materiaId,
      trimestre:
        data.trimestre === 'T2'
          ? 2
          : data.trimestre === 'T3'
            ? 3
            : data.trimestre === 'T1'
              ? 1
              : actual.trimestre,
      puntaje:
        data.notaNumeral ?? actual.puntaje,
      estado:
        data.notaNumeral !== undefined
          ? data.notaNumeral >= 51
            ? 'aprobado'
            : 'reprobado'
          : actual.estado,
      observacion:
        data.observaciones !== undefined
          ? data.observaciones ?? undefined
          : actual.observacion,
      updatedAt: new Date().toISOString(),
    };

    NOTAS[index] = updated;

    return updated;
  }

  const response = await apiRequest<BackendNota>(
    `/notas/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );

  return mapNota(response);
}

export async function deleteNota(
  id: string,
): Promise<void> {
  if (IS_MOCK_MODE) {
    const index = NOTAS.findIndex(
      nota => nota.id === id,
    );

    if (index === -1) {
      throw {
        statusCode: 404,
        message: 'Nota no encontrada',
      };
    }

    NOTAS.splice(index, 1);
    return;
  }

  await apiRequest<void>(
    `/notas/${id}`,
    {
      method: 'DELETE',
    },
  );
}