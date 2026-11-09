import type {
  Materia,
  PaginatedResponse,
  Curso,
  Profesor,
} from '../types';
import { apiRequest, IS_MOCK_MODE } from './client';
// import { MATERIAS } from '../mocks/data';

type CursoResumen = Pick<Curso, 'id' | 'nombre'>;

type ProfesorResumen = Pick<
  Profesor,
  'profesorCi' | 'nombres' | 'apellidos'
>;

export interface CatalogoTemaResumen {
  id: string;
  nombre: string;
  descripcion?: string | null;
  orden: number;
  activo: boolean;
}

export interface CatalogoMateriaResumen {
  id: string;
  nombre: string;
  descripcion?: string | null;
  temas: CatalogoTemaResumen[];
}

interface BackendMateria {
  id: string;
  nombreMateria: string;
  descripcion?: string | null;
  cursoId?: string | null;
  profesorCi?: string | null;
  unidadEducativaId: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  catalogoMateriaId?: string | null;

  curso?: {
    id: string;
    nombre: string;
  } | null;

  profesor?: {
    ci: string;
    nombres: string;
    apellidos: string;
  } | null;

  catalogoMateria?: {
    id: string;
    nombre: string;
    descripcion?: string | null;
    temas?: Array<{
      id: string;
      nombre: string;
      descripcion?: string | null;
      orden: number;
      activo: boolean;
    }>;
  } | null;

  _count?: {
    notas?: number;
    practicas?: number;
  };
}

function mapCurso(
  curso?: BackendMateria['curso'] | null
): CursoResumen | undefined {
  if (!curso) return undefined;

  return {
    id: curso.id,
    nombre: curso.nombre,
  };
}

function mapProfesor(
  profesor?: BackendMateria['profesor'] | null
): ProfesorResumen | undefined {
  if (!profesor) return undefined;

  return {
    profesorCi: profesor.ci,
    nombres: profesor.nombres,
    apellidos: profesor.apellidos,
  };
}

function mapMateria(materia: BackendMateria): Materia {
  return {
    id: materia.id,
    nombre: materia.nombreMateria,
    cursoId: materia.cursoId ?? '',
    curso: mapCurso(materia.curso),
    profesorCi: materia.profesorCi ?? undefined,
    profesor: mapProfesor(materia.profesor),
    activo: materia.activo,
    createdAt: materia.createdAt,
    updatedAt: materia.updatedAt,

    catalogoMateriaId:
      materia.catalogoMateriaId ?? undefined,

    catalogoMateria: materia.catalogoMateria
      ? {
          id: materia.catalogoMateria.id,
          nombre: materia.catalogoMateria.nombre,
          descripcion:
            materia.catalogoMateria.descripcion ?? null,
          temas:
            materia.catalogoMateria.temas?.map(tema => ({
              id: tema.id,
              nombre: tema.nombre,
              descripcion: tema.descripcion ?? null,
              orden: tema.orden,
              activo: tema.activo,
            })) ?? [],
        }
      : undefined,
  };
}

export interface CreateMateriaPayload {
  nombre: string;
  cursoId: string;
  profesorCi?: string;
  activo: boolean;
  catalogoMateriaId: string;
  unidadEducativaId: string;
}

export async function getMaterias(params?: {
  search?: string;
  cursoId?: string;
}): Promise<PaginatedResponse<Materia>> {

  // Traer todas las materias sin paginación truncada
  const response = await apiRequest<BackendMateria[]>('/materias?limit=100');

  let data = response.map(mapMateria);

  if (params?.search) {
    const q = params.search.toLowerCase();
    data = data.filter(m => m.nombre.toLowerCase().includes(q));
  }

  if (params?.cursoId) {
    data = data.filter(m => m.cursoId === params.cursoId);
  }

  return {
    data,
    total: data.length,
    page: 1,
    limit: data.length,
  };
}

export async function createMateria(
  data: CreateMateriaPayload
): Promise<Materia> {


  const payload = {
    nombreMateria: data.nombre,
    cursoId: data.cursoId,
    profesorCi: data.profesorCi || undefined,
    unidadEducativaId: data.unidadEducativaId,
    catalogoMateriaId: data.catalogoMateriaId, // <-- Agregado al body del POST
    activo: data.activo,
  };

  const response = await apiRequest<BackendMateria>(
    '/materias',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  return mapMateria(response);
}

export async function updateMateria(
  id: string,
  data: Partial<Materia> & {
    unidadEducativaId?: string;
  }
): Promise<Materia> {


  const payload: Record<string, unknown> = {};

  if (data.nombre !== undefined) {
    payload.nombreMateria = data.nombre;
  }

  if (data.cursoId !== undefined) {
    payload.cursoId = data.cursoId || null;
  }

  if (data.profesorCi !== undefined) {
    payload.profesorCi = data.profesorCi || null;
  }

  if (data.unidadEducativaId !== undefined) {
    payload.unidadEducativaId = data.unidadEducativaId;
  }

  // <-- NUEVO BLOQUE: Evalúa y agrega el catálogo al PATCH -->
  if (data.catalogoMateriaId !== undefined) {
    payload.catalogoMateriaId = data.catalogoMateriaId || null;
  }

  if (data.activo !== undefined) {
    payload.activo = data.activo;
  }

  const response = await apiRequest<BackendMateria>(
    `/materias/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );

  return mapMateria(response);
}