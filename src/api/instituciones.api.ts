import type { UnidadEducativa, PaginatedResponse } from '../types';
import { apiRequest, IS_MOCK_MODE } from './client';
import { INSTITUCIONES } from '../mocks/data';

export interface InstitucionPayload {
  nombre: string;
  descripcion?: string;
  codigoInstitucional?: string;
  tipoInstitucion?: 'PUBLICA' | 'PRIVADA' | 'CONVENIO';
  nivelesEducativos?: (
    | 'INICIAL'
    | 'PRIMARIA'
    | 'SECUNDARIA'
    | 'TECNICO'
  )[];

  director?: string;
  encargador?: string;
  email?: string;
  telefono?: string;
  telefonoAlternativo?: string;
  sitioWeb?: string;

  direccion?: string;
  departamento?: string;
  provincia?: string;
  municipio?: string;
  zona?: string;
  latitud?: number | null;
  longitud?: number | null;

  numeroAlumnos?: number;
  cantidadMaximaAlumnos?: number;
  turnos?: string[];

  imagenPrincipalUrl?: string | null;
  imagenPortadaUrl?: string | null;
  imagenes?: string[];

  activo: boolean;
}

interface BackendUnidadEducativa {
  id: string;
  nombre: string;
  descripcion: string | null;
  director: string | null;
  encargador: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  numeroAlumnos: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    cursos?: number;
    profesores?: number;
    materias?: number;
  };

  codigoInstitucional?: string | null;
  tipoInstitucion?: 'PUBLICA' | 'PRIVADA' | 'CONVENIO' | null;
  nivelesEducativos?: (
    | 'INICIAL'
    | 'PRIMARIA'
    | 'SECUNDARIA'
    | 'TECNICO'
  )[] | null;
  telefonoAlternativo?: string | null;
  sitioWeb?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  municipio?: string | null;
  zona?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  cantidadMaximaAlumnos?: number | null;
  turnos?: string[] | null;
  imagenPrincipalUrl?: string | null;
  imagenPortadaUrl?: string | null;
  imagenes?: string[] | null;
}

function mapUnidadEducativa(
  item: BackendUnidadEducativa,
): UnidadEducativa {
  return {
    id: item.id,
    nombre: item.nombre,

    // Estos campos existen actualmente en el tipo del frontend,
    // pero todavía no existen en el modelo backend.
    tipo: 'unidad_educativa',
    ciudad: '',

    direccion: item.direccion ?? undefined,
    telefono: item.telefono ?? undefined,
    activo: item.activo,
    
    codigoInstitucional: item.codigoInstitucional ?? undefined,
    tipoInstitucion: item.tipoInstitucion ?? undefined,
    nivelesEducativos: item.nivelesEducativos ?? undefined,

    director: item.director ?? undefined,
    encargador: item.encargador ?? undefined,
    email: item.email ?? undefined,
    telefonoAlternativo: item.telefonoAlternativo ?? undefined,
    sitioWeb: item.sitioWeb ?? undefined,

    departamento: item.departamento ?? '',
    provincia: item.provincia ?? undefined,
    municipio: item.municipio ?? undefined,
    zona: item.zona ?? undefined,
    latitud: item.latitud ?? null,
    longitud: item.longitud ?? null,

    numeroAlumnos: item.numeroAlumnos,
    cantidadMaximaAlumnos: item.cantidadMaximaAlumnos ?? undefined,
    turnos: item.turnos ?? undefined,

    imagenPrincipalUrl: item.imagenPrincipalUrl ?? null,
    imagenPortadaUrl: item.imagenPortadaUrl ?? null,
    imagenes: item.imagenes ?? [],

    totalEstudiantes: item.numeroAlumnos,
    totalCursos: item._count?.cursos ?? 0,

    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function getInstituciones(
  params?: {
    page?: number;
    limit?: number;
    search?: string;
  },
): Promise<PaginatedResponse<UnidadEducativa>> {

  if (IS_MOCK_MODE) {
    let data = [...INSTITUCIONES];

    if (params?.search) {
      const q = params.search.toLowerCase();

      data = data.filter(
        i =>
          i.nombre.toLowerCase().includes(q) ||
          i.ciudad.toLowerCase().includes(q),
      );
    }

    return {
      data,
      total: data.length,
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    };
  }

  const response = await apiRequest<BackendUnidadEducativa[]>(
    '/unidades-educativas',
  );

  let data = response.map(mapUnidadEducativa);

  if (params?.search) {
    const q = params.search.toLowerCase();

    data = data.filter(
      i =>
        i.nombre.toLowerCase().includes(q) ||
        i.direccion?.toLowerCase().includes(q),
    );
  }

  return {
    data,
    total: data.length,
    page: params?.page ?? 1,
    limit: params?.limit ?? (data.length || 20),
  };
}

export async function getInstitucion(
  id: string,
): Promise<UnidadEducativa> {

  if (IS_MOCK_MODE) {
    const item = INSTITUCIONES.find(i => i.id === id);

    if (!item) {
      throw {
        statusCode: 404,
        message: 'Institución no encontrada',
      };
    }

    return item;
  }

  const response = await apiRequest<BackendUnidadEducativa>(
    `/unidades-educativas/${id}`,
  );

  return mapUnidadEducativa(response);
}


export async function createInstitucion(
  data: InstitucionPayload,
): Promise<UnidadEducativa> {
  if (IS_MOCK_MODE) {
    const ahora = new Date().toISOString();

    const nuevo: UnidadEducativa = {
      ...data,
      id: `inst-${Date.now()}`,
      tipo: 'unidad_educativa',
      ciudad: data.municipio ?? '',
      departamento: data.departamento ?? '',
      totalEstudiantes: data.numeroAlumnos ?? 0,
      totalCursos: 0,
      createdAt: ahora,
      updatedAt: ahora,
    };

    INSTITUCIONES.push(nuevo);
    return nuevo;
  }

  const payload = {
    ...data,
  };

  const response = await apiRequest<BackendUnidadEducativa>(
    '/unidades-educativas',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  return mapUnidadEducativa(response);
}

export async function updateInstitucion(
  id: string,
  data: Partial<InstitucionPayload>,
): Promise<UnidadEducativa> {
  if (IS_MOCK_MODE) {
    const idx = INSTITUCIONES.findIndex(i => i.id === id);

    if (idx === -1) {
      throw {
        statusCode: 404,
        message: 'Institución no encontrada',
      };
    }

    INSTITUCIONES[idx] = {
      ...INSTITUCIONES[idx],
      ...data,
      ciudad: data.municipio ?? INSTITUCIONES[idx].ciudad,
      departamento:
        data.departamento ?? INSTITUCIONES[idx].departamento,
      totalEstudiantes:
        data.numeroAlumnos ?? INSTITUCIONES[idx].totalEstudiantes,
      updatedAt: new Date().toISOString(),
    };

    return INSTITUCIONES[idx];
  }

  const payload = { ...data };

  const response = await apiRequest<BackendUnidadEducativa>(
    `/unidades-educativas/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );

  return mapUnidadEducativa(response);
}