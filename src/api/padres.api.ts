import type { Estudiante, Padre, PaginatedResponse } from '../types';
import { apiRequest, IS_MOCK_MODE } from './client';

interface BackendEstudianteRelacionado {
  estudianteId: string;
  padreId: string;
  esConvivente: boolean;
  createdAt: string;
  estudiante?: {
    id: string;
    nombres: string;
    apellidos: string;
    codigoRude?: string | null;
  } | null;
}

interface BackendPadre {
  id: string;
  ci: string;
  nombres: string;
  apellidos: string;
  parentesco: 'PADRE' | 'MADRE' | 'TUTOR' | 'OTRO';
  telefono?: string | null;
  email?: string | null;
  ocupacion?: string | null;
  direccion?: string | null;
  unidadEducativaId: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  estudiantes?: BackendEstudianteRelacionado[];
}

function mapEstudiante(
  estudiante?: BackendEstudianteRelacionado['estudiante'] | null
): Estudiante | undefined {
  if (!estudiante) return undefined;

  return {
    id: estudiante.id,
    ci: '',
    nombres: estudiante.nombres,
    apellidos: estudiante.apellidos,
    fechaNacimiento: '',
    unidadEducativaId: '',
    gestionId: '',
    activo: true,
    createdAt: '',
    updatedAt: '',
  };
}

function mapRelacion(
  parentesco: BackendPadre['parentesco']
): Padre['relacion'] {
  switch (parentesco) {
    case 'MADRE':
      return 'madre';

    case 'TUTOR':
      return 'tutor';

    case 'OTRO':
      return 'otro';

    case 'PADRE':
    default:
      return 'padre';
  }
}

function mapRelacionToBackend(
  relacion: Padre['relacion']
): BackendPadre['parentesco'] {
  switch (relacion) {
    case 'madre':
      return 'MADRE';

    case 'tutor':
      return 'TUTOR';

    case 'otro':
      return 'OTRO';

    case 'padre':
    default:
      return 'PADRE';
  }
}

function mapPadre(padre: BackendPadre): Padre {
  const estudiantes = padre.estudiantes
    ?.map((relacion) => mapEstudiante(relacion.estudiante))
    .filter(
      (estudiante): estudiante is Estudiante => Boolean(estudiante)
    );

  return {
  id: padre.id,
  ci: padre.ci,
  nombres: padre.nombres,
  apellidos: padre.apellidos,
  telefono: padre.telefono ?? '',
  email: padre.email ?? undefined,
  ocupacion: padre.ocupacion ?? undefined,
  direccion: padre.direccion ?? undefined,
  relacion: mapRelacion(padre.parentesco),
  activo: padre.activo,
  estudiantes,
  createdAt: padre.createdAt,
  updatedAt: padre.updatedAt,
};

}

export async function getPadres(
  params?: { search?: string }
): Promise<PaginatedResponse<Padre>> {
  
  const response = await apiRequest<BackendPadre[]>('/padres');

  let data = response.map(mapPadre);

  if (params?.search) {
    const q = params.search.toLowerCase();

    data = data.filter(
      (p) =>
        p.nombres.toLowerCase().includes(q) ||
        p.apellidos.toLowerCase().includes(q) ||
        p.ci.includes(q)
    );
  }

  return {
    data,
    total: data.length,
    page: 1,
    limit: data.length || 20,
  };
}

export interface CreatePadrePayload {
  ci: string;
  nombres: string;
  apellidos: string;
  relacion: Padre['relacion'];
  telefono?: string;
  email?: string;
  ocupacion?: string;
  direccion?: string;
  unidadEducativaId: string;
  activo: boolean;
}

export async function createPadre(
  data: CreatePadrePayload
): Promise<Padre> {

 const payload = {
  ci: data.ci.trim(),
  nombres: data.nombres.trim(),
  apellidos: data.apellidos.trim(),
  parentesco: mapRelacionToBackend(data.relacion),
  telefono: data.telefono?.trim() || undefined,
  email: data.email?.trim() || undefined,
  ocupacion: data.ocupacion?.trim() || undefined,
  direccion: data.direccion?.trim() || undefined,
  unidadEducativaId: data.unidadEducativaId,
  activo: data.activo,
};

  const response = await apiRequest<BackendPadre>(
    '/padres',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  return mapPadre(response);
}

export interface UpdatePadrePayload {
  ci?: string;
  nombres?: string;
  apellidos?: string;
  relacion?: Padre['relacion'];
  telefono?: string;
  email?: string;
  ocupacion?: string;
  direccion?: string;
  activo?: boolean;
}

export async function updatePadre(
  id: string,
  data: UpdatePadrePayload
): Promise<Padre> {
  

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

  if (data.relacion !== undefined) {
    payload.parentesco = mapRelacionToBackend(data.relacion);
  }

  if (data.telefono !== undefined) {
    payload.telefono = data.telefono.trim() || null;
  }

  if (data.email !== undefined) {
    payload.email = data.email.trim() || null;
  }

  if (data.ocupacion !== undefined) {
    payload.ocupacion = data.ocupacion.trim() || null;
  }

  if (data.direccion !== undefined) {
    payload.direccion = data.direccion.trim() || null;
  }

  if (data.activo !== undefined) {
    payload.activo = data.activo;
  }

  const response = await apiRequest<BackendPadre>(
    `/padres/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );

  return mapPadre(response);
}