import type {
  Curso,
  GestionAcademica,
  PaginatedResponse,
  Profesor,
  UnidadEducativa,
} from '../types';
import { apiRequest, IS_MOCK_MODE } from './client';
import { CURSOS } from '../mocks/data';
import { getProfesores } from './profesores.api';

interface BackendCurso {
  id: string;
  nombre: string;
  ciclo: 'PRIMARIA' | 'SECUNDARIA';
  grado?: number | null;
  paralelo?: string | null;
  turno?: string | null;
  numeroAlumnos: number;

  jefeCursoId?: string | null;
  gestionId?: string | null;
  unidadEducativaId: string;
  activo?: boolean;

  createdAt: string;
  updatedAt: string;

  jefeCurso?: {
    id: string;
    nombres: string;
    apellidos: string;
  } | null;

  gestion?: {
    id: string;
    anio: number;
  } | null;

  unidadEducativa?: {
    id: string;
    nombre: string;
  } | null;

  _count?: {
    estudiantes?: number;
    materias?: number;
  };
}

function mapUnidadEducativa(
  unidad?: BackendCurso['unidadEducativa'] | null,
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

function mapGestion(
  gestion?: BackendCurso['gestion'] | null,
): GestionAcademica | undefined {
  if (!gestion) return undefined;

  return {
    id: gestion.id,
    anio: gestion.anio,
    nombre: `Gestión ${gestion.anio}`,
    fechaInicio: '',
    fechaFin: '',
    activo: true,
    unidadEducativaId: '',
    createdAt: '',
    updatedAt: '',
  };
}

/**
 * Convierte la información del jefe de curso que devuelve
 * el backend al modelo Profesor del frontend.
 *
 * El backend de /cursos devuelve el UUID del profesor,
 * pero no necesariamente su CI.
 *
 * Por eso el CI se completa desde el listado de profesores.
 */
function mapProfesor(
  profesor: BackendCurso['jefeCurso'],
  profesores: Profesor[],
): Profesor | undefined {
  if (!profesor) return undefined;

  const profesorCompleto = profesores.find(
    item => item.id === profesor.id,
  );

  return {
    id: profesor.id,
    profesorCi: profesorCompleto?.profesorCi ?? '',
    nombres: profesor.nombres,
    apellidos: profesor.apellidos,
    telefono: profesorCompleto?.telefono,
    email: profesorCompleto?.email,
    activo: profesorCompleto?.activo ?? true,
    unidadEducativaId:
      profesorCompleto?.unidadEducativaId ?? '',
    unidadEducativa:
      profesorCompleto?.unidadEducativa,
    createdAt:
      profesorCompleto?.createdAt ?? '',
    updatedAt:
      profesorCompleto?.updatedAt ?? '',
  };
}

function mapCurso(
  curso: BackendCurso,
  profesores: Profesor[] = [],
): Curso {
  const profesorTutor = mapProfesor(
    curso.jefeCurso,
    profesores,
  );

  return {
  id: curso.id,
  nombre: curso.nombre,
  paralelo: curso.paralelo ?? '',
  nivel: curso.ciclo,
  grado: curso.grado ?? null,
  turno: curso.turno ?? null,

    gestionId: curso.gestionId ?? '',
    gestion: mapGestion(curso.gestion),

    unidadEducativaId:
      curso.unidadEducativaId,

    unidadEducativa:
      mapUnidadEducativa(
        curso.unidadEducativa,
      ),

    profesorCiTutor:
      profesorTutor?.profesorCi || undefined,

    profesorTutor,

    totalEstudiantes:
      curso._count?.estudiantes ??
      curso.numeroAlumnos ??
      0,

    activo: curso.activo ?? true,

    createdAt: curso.createdAt,
    updatedAt: curso.updatedAt,
  };
}

/**
 * Busca el UUID real del profesor utilizando
 * el CI que maneja el frontend.
 *
 * Frontend:
 * profesorCiTutor = "1234567"
 *
 * Backend:
 * jefeCursoId = "UUID-DEL-PROFESOR"
 */
async function resolveProfesorIdByCi(
  profesorCi?: string,
): Promise<string | undefined> {
  if (!profesorCi) return undefined;

  const response = await getProfesores({
    search: profesorCi,
  });

  const profesor = response.data.find(
    item => item.profesorCi === profesorCi,
  );

  if (!profesor) {
    throw {
      statusCode: 400,
      message: `No se encontró el docente con CI ${profesorCi}`,
    };
  }

  return profesor.id;
}

function getGradoFromNombre(
  nombre: string,
): number | undefined {
  const match = nombre.match(/\d+/);

  if (!match) return undefined;

  const grado = Number(match[0]);

  return Number.isFinite(grado)
    ? grado
    : undefined;
}

export async function getCursos(
  params?: {
    search?: string;
    unidadEducativaId?: string;
  },
): Promise<PaginatedResponse<Curso>> {
  if (IS_MOCK_MODE) {
    let data = [...CURSOS];

    if (params?.search) {
      const q = params.search.toLowerCase();

      data = data.filter(
        c =>
          c.nombre
            .toLowerCase()
            .includes(q) ||
          c.paralelo
            .toLowerCase()
            .includes(q),
      );
    }

    if (params?.unidadEducativaId) {
      data = data.filter(
        c =>
          c.unidadEducativaId ===
          params.unidadEducativaId,
      );
    }

    return {
      data,
      total: data.length,
      page: 1,
      limit: 20,
    };
  }

  const [
    response,
    profesoresResponse,
  ] = await Promise.all([
    apiRequest<BackendCurso[]>(
      '/cursos',
    ),
    getProfesores(),
  ]);

  let data = response.map(curso =>
    mapCurso(
      curso,
      profesoresResponse.data,
    ),
  );

  if (params?.search) {
    const q = params.search.toLowerCase();

    data = data.filter(
      c =>
        c.nombre
          .toLowerCase()
          .includes(q) ||
        c.paralelo
          .toLowerCase()
          .includes(q),
    );
  }

  if (params?.unidadEducativaId) {
    data = data.filter(
      c =>
        c.unidadEducativaId ===
        params.unidadEducativaId,
    );
  }

  return {
    data,
    total: data.length,
    page: 1,
    limit: data.length || 20,
  };
}


export interface CreateCursoPayload {
  nombre: string;
  nivel: 'PRIMARIA' | 'SECUNDARIA';
  grado: number;
  paralelo: string;
  turno: 'mañana' | 'tarde' | 'noche';
  gestionId: string;
  unidadEducativaId: string;
  profesorCiTutor?: string;
  activo: boolean;
}

export async function createCurso(
  data: CreateCursoPayload,
): Promise<Curso> {
  if (IS_MOCK_MODE) {
    const nuevo: Curso = {
      id: `curso-${Date.now()}`,
      nombre: data.nombre,
      paralelo: data.paralelo,
      nivel: data.nivel,
      gestionId: data.gestionId,
      unidadEducativaId:
        data.unidadEducativaId,
      profesorCiTutor:
        data.profesorCiTutor ||
        undefined,
      activo: data.activo,
      totalEstudiantes: 0,
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    };

    CURSOS.push(nuevo);

    return nuevo;
  }

  const jefeCursoId =
    await resolveProfesorIdByCi(
      data.profesorCiTutor,
    );

  const payload = {
  nombre: data.nombre,
  ciclo: data.nivel,
  grado: data.grado,
  paralelo: data.paralelo,
  turno: data.turno,
  gestionId: data.gestionId,
  unidadEducativaId: data.unidadEducativaId,
  jefeCursoId: jefeCursoId ?? undefined,
};

  const response =
    await apiRequest<BackendCurso>(
      '/cursos',
      {
        method: 'POST',
        body: JSON.stringify(
          payload,
        ),
      },
    );

  /*
   * El POST puede devolver el curso
   * recién creado. Para mapear correctamente
   * el profesor necesitamos el listado actual.
   */
  const profesoresResponse =
    await getProfesores();

  return mapCurso(
    response,
    profesoresResponse.data,
  );
}

export async function updateCurso(
  id: string,
  data: Partial<CreateCursoPayload>,
): Promise<Curso> {
  if (IS_MOCK_MODE) {
    const idx = CURSOS.findIndex(
      c => c.id === id,
    );

    if (idx === -1) {
      throw {
        statusCode: 404,
        message: 'Curso no encontrado',
      };
    }

    CURSOS[idx] = {
      ...CURSOS[idx],
      ...data,
      updatedAt:
        new Date().toISOString(),
    };

    return CURSOS[idx];
  }

  const payload: Record<
    string,
    unknown
  > = {};

 if (data.nombre !== undefined) {
  payload.nombre = data.nombre;
}

if (data.grado !== undefined) {
  payload.grado = data.grado;
}

if (data.nivel !== undefined) {
  payload.ciclo = data.nivel;
}

if (data.paralelo !== undefined) {
  payload.paralelo = data.paralelo;
}

if (data.turno !== undefined) {
  payload.turno = data.turno;
}

  if (data.gestionId !== undefined) {
    payload.gestionId =
      data.gestionId || null;
  }

  if (
    data.unidadEducativaId !==
    undefined
  ) {
    payload.unidadEducativaId =
      data.unidadEducativaId;
  }

  if (
    data.profesorCiTutor !==
    undefined
  ) {
    const jefeCursoId =
      await resolveProfesorIdByCi(
        data.profesorCiTutor,
      );

    payload.jefeCursoId =
      jefeCursoId ?? null;
  }

  if (data.activo !== undefined) {
    payload.activo = data.activo;
  }

  const response =
    await apiRequest<BackendCurso>(
      `/cursos/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(
          payload,
        ),
      },
    );

  const profesoresResponse =
    await getProfesores();

  return mapCurso(
    response,
    profesoresResponse.data,
  );
}