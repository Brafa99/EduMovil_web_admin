import type {
  Estudiante,
  Materia,
  Nota,
  PaginatedResponse,
} from '../types';
import { apiRequest, IS_MOCK_MODE } from './client';

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
  

  const response = await apiRequest<BackendNota>(
    `/notas/${id}`,
  );

  return mapNota(response);
}

export async function createNota(
  data: CreateNotaPayload,
): Promise<Nota> {


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
 
  await apiRequest<void>(
    `/notas/${id}`,
    {
      method: 'DELETE',
    },
  );
}