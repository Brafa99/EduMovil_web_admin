import type {
  Practica,
  PaginatedResponse,
} from '../types';

import {
  apiRequest,
  IS_MOCK_MODE,
} from './client';

import { PRACTICAS } from '../mocks/data';

type TrimestreBackend = 'T1' | 'T2' | 'T3';
type TrimestreFrontend = 1 | 2 | 3;

interface BackendPractica {
  id: string;
  titulo: string;
  puntaje: string | number | null;
  puntajeMax: string | number | null;
  fecha: string | null;
  estudianteId: string;
  materiaId: string;
  trimestre: TrimestreBackend;
  createdAt: string;
  updatedAt: string;

  estudiante?: {
    id: string;
    nombres: string;
    apellidos: string;
  } | null;

  materia?: {
    id: string;
    nombreMateria: string;
  } | null;
}

export interface CreatePracticaPayload {
  titulo: string;
  puntaje: number;
  puntajeMax?: number;
  fecha: string;
  estudianteId: string;
  materiaId: string;
  trimestre?: TrimestreFrontend;
}

function mapTrimestre(
  trimestre?: TrimestreBackend | null,
): TrimestreFrontend {
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

function mapTrimestreToBackend(
  trimestre?: TrimestreFrontend,
): TrimestreBackend {
  switch (trimestre) {
    case 2:
      return 'T2';
    case 3:
      return 'T3';
    case 1:
    default:
      return 'T1';
  }
}

function toNumber(
  value: string | number | null | undefined,
): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function mapPractica(
  item: BackendPractica,
): Practica {
  return {
    id: item.id,
    titulo: item.titulo,
    puntaje: toNumber(item.puntaje),
    fecha: item.fecha ?? '',

    estudianteId: item.estudianteId,

    estudiante: item.estudiante
      ? {
          id: item.estudiante.id,
          ci: '',
          nombres: item.estudiante.nombres,
          apellidos: item.estudiante.apellidos,
          fechaNacimiento: '',
          unidadEducativaId: '',
          gestionId: '',
          activo: true,
          createdAt: '',
          updatedAt: '',
        }
      : undefined,

    materiaId: item.materiaId,

    materia: item.materia
      ? {
          id: item.materia.id,
          nombre: item.materia.nombreMateria,
          cursoId: '',
          activo: true,
          createdAt: '',
          updatedAt: '',
        }
      : undefined,

    trimestre: mapTrimestre(item.trimestre),

    descripcion: undefined,
    estado: 'completado',

    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function getPracticas(
  params?: {
    search?: string;
    estudianteId?: string;
  },
): Promise<PaginatedResponse<Practica>> {
  if (IS_MOCK_MODE) {
    let data = [...PRACTICAS];

    if (params?.search) {
      const q = params.search.toLowerCase();

      data = data.filter(
        p =>
          p.titulo.toLowerCase().includes(q) ||
          p.estudiante?.nombres.toLowerCase().includes(q) ||
          p.estudiante?.apellidos.toLowerCase().includes(q) ||
          p.materia?.nombre.toLowerCase().includes(q),
      );
    }

    if (params?.estudianteId) {
      data = data.filter(
        p => p.estudianteId === params.estudianteId,
      );
    }

    return {
      data,
      total: data.length,
      page: 1,
      limit: 20,
    };
  }

  const response = await apiRequest<BackendPractica[]>(
    '/practicas',
  );

  let data = response.map(mapPractica);

  if (params?.search) {
    const q = params.search.toLowerCase();

    data = data.filter(
      p =>
        p.titulo.toLowerCase().includes(q) ||
        p.estudiante?.nombres.toLowerCase().includes(q) ||
        p.estudiante?.apellidos.toLowerCase().includes(q) ||
        p.materia?.nombre.toLowerCase().includes(q),
    );
  }

  if (params?.estudianteId) {
    data = data.filter(
      p => p.estudianteId === params.estudianteId,
    );
  }

  return {
    data,
    total: data.length,
    page: 1,
    limit: data.length || 20,
  };
}

export async function createPractica(
  data: CreatePracticaPayload,
): Promise<Practica> {
  if (IS_MOCK_MODE) {
    const now = new Date().toISOString();

    const nuevo: Practica = {
      id: `prac-${Date.now()}`,
      titulo: data.titulo.trim(),
      puntaje: Number(data.puntaje),
      fecha: data.fecha ?? '',
      estudianteId: data.estudianteId,
      materiaId: data.materiaId,
      trimestre: data.trimestre ?? 1,
      descripcion: undefined,
      estado: 'completado',
      createdAt: now,
      updatedAt: now,
    };

    PRACTICAS.push(nuevo);
    return nuevo;
  }

  const payload = {
    titulo: data.titulo.trim(),
    puntaje: Number(data.puntaje),

    ...(data.puntajeMax !== undefined && {
      puntajeMax: Number(data.puntajeMax),
    }),

    ...(data.fecha && {
      fecha: /^\d{4}-\d{2}-\d{2}$/.test(data.fecha)
        ? `${data.fecha}T12:00:00.000Z`
        : data.fecha,
    }),

    estudianteId: data.estudianteId,
    materiaId: data.materiaId,
    trimestre: mapTrimestreToBackend(data.trimestre),
  };

  const response = await apiRequest<BackendPractica>(
    '/practicas',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  return mapPractica(response);
}

export async function updatePractica(
  id: string,
  data: Partial<CreatePracticaPayload>,
): Promise<Practica> {
  if (IS_MOCK_MODE) {
    const idx = PRACTICAS.findIndex(p => p.id === id);

    if (idx === -1) {
      throw {
        statusCode: 404,
        message: 'Práctica no encontrada',
      };
    }

    const current = PRACTICAS[idx];

    PRACTICAS[idx] = {
      ...current,

      ...(data.titulo !== undefined && {
        titulo: data.titulo.trim(),
      }),

      ...(data.puntaje !== undefined && {
        puntaje: Number(data.puntaje),
      }),

      ...(data.fecha !== undefined && {
        fecha: data.fecha,
      }),

      ...(data.estudianteId !== undefined && {
        estudianteId: data.estudianteId,
      }),

      ...(data.materiaId !== undefined && {
        materiaId: data.materiaId,
      }),

      ...(data.trimestre !== undefined && {
        trimestre: data.trimestre,
      }),

      updatedAt: new Date().toISOString(),
    };

    return PRACTICAS[idx];
  }

  const payload = {
    ...(data.titulo !== undefined && {
      titulo: data.titulo.trim(),
    }),

    ...(data.puntaje !== undefined && {
      puntaje: Number(data.puntaje),
    }),

    ...(data.puntajeMax !== undefined && {
      puntajeMax: Number(data.puntajeMax),
    }),

    ...(data.fecha !== undefined && {
      fecha: data.fecha
        ? /^\d{4}-\d{2}-\d{2}$/.test(data.fecha)
          ? `${data.fecha}T12:00:00.000Z`
          : data.fecha
        : null,
    }),

    ...(data.estudianteId !== undefined && {
      estudianteId: data.estudianteId,
    }),

    ...(data.materiaId !== undefined && {
      materiaId: data.materiaId,
    }),

    ...(data.trimestre !== undefined && {
      trimestre: mapTrimestreToBackend(data.trimestre),
    }),
  };

  const response = await apiRequest<BackendPractica>(
    `/practicas/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );

  return mapPractica(response);
}
