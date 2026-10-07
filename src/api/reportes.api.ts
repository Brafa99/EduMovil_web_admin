import type {
  Curso,
  Estudiante,
  GestionAcademica,
  Institucion,
  Materia,
  Nota,
} from '../types';

import { getCursos } from './cursos.api';
import { getEstudiantes } from './estudiantes.api';
import { getGestiones } from './gestiones.api';
import { getInstituciones } from './instituciones.api';
import { getMaterias } from './materias.api';
import { getNotas } from './notas.api';
import { IS_MOCK_MODE } from './client';
import { IMPORT_HISTORY } from '../mocks/data';

export interface ReporteResumen {
  totalEstudiantes: number;
  institucionesActivas: number;
  totalInstituciones: number;
  promedioAprobacion: number;
  totalImportaciones: number;
}

export interface InscripcionChartItem {
  gestion: string;
  estudiantes: number;
}

export interface RendimientoMateriaItem {
  subject: string;
  aprobados: number;
  reprobados: number;
  pendientes: number;
  total: number;
  porcentajeAprobacion: number;
}

export interface InstitucionChartItem {
  name: string;
  value: number;
  color: string;
}

export interface ReporteData {
  resumen: ReporteResumen;
  inscripciones: InscripcionChartItem[];
  rendimiento: RendimientoMateriaItem[];
  instituciones: InstitucionChartItem[];
  importaciones: typeof IMPORT_HISTORY;
}

export interface ReporteFiltros {
  institucionId?: string;
  gestionId?: string;
  trimestre?: 1 | 2 | 3;
}

interface CacheData {
  estudiantes: Estudiante[];
  instituciones: Institucion[];
  gestiones: GestionAcademica[];
  cursos: Curso[];
  materias: Materia[];
  notas: Nota[];
}

let cache: CacheData | null = null;

function getPaginatedData<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray((response as { data?: unknown }).data)
  ) {
    return (response as { data: T[] }).data;
  }

  return [];
}

function getGestionIdFromEstudiante(
  estudiante: Estudiante,
  cursos: Curso[],
): string | undefined {
  if (estudiante.gestionId) {
    return estudiante.gestionId;
  }

  if (estudiante.cursoActualId) {
    const curso = cursos.find(
      item => item.id === estudiante.cursoActualId,
    );

    return curso?.gestionId;
  }

  return undefined;
}

function getInstitucionIdFromEstudiante(
  estudiante: Estudiante,
  cursos: Curso[],
): string | undefined {
  if (estudiante.unidadEducativaId) {
    return estudiante.unidadEducativaId;
  }

  if (estudiante.cursoActualId) {
    const curso = cursos.find(
      item => item.id === estudiante.cursoActualId,
    );

    return curso?.unidadEducativaId;
  }

  return undefined;
}

function notaEstaAprobada(nota: Nota): boolean {
  if (typeof nota.puntaje === 'number') {
    return nota.puntaje >= 51;
  }

  return nota.estado === 'aprobado';
}

function notaEstaReprobada(nota: Nota): boolean {
  if (typeof nota.puntaje === 'number') {
    return nota.puntaje < 51;
  }

  return nota.estado === 'reprobado';
}

function getNombreMateria(
  nota: Nota,
  materias: Materia[],
): string {
  if (nota.materia?.nombre) {
    return nota.materia.nombre;
  }

  const materia = materias.find(
    item => item.id === nota.materiaId,
  );

  return materia?.nombre ?? 'Sin materia';
}

function getNombreGestion(
  gestionId: string | undefined,
  gestiones: GestionAcademica[],
): string {
  if (!gestionId) {
    return 'Sin gestión';
  }

  const gestion = gestiones.find(
    item => item.id === gestionId,
  );

  return gestion?.nombre ?? `Gestión ${gestion?.anio ?? ''}`.trim();
}

async function loadBaseData(): Promise<CacheData> {
  if (cache) {
    return cache;
  }

  const [
    estudiantesResponse,
    institucionesResponse,
    gestionesResponse,
    cursosResponse,
    materiasResponse,
    notasResponse,
  ] = await Promise.all([
    getEstudiantes(),
    getInstituciones(),
    getGestiones(),
    getCursos(),
    getMaterias(),
    getNotas(),
  ]);

  cache = {
    estudiantes: getPaginatedData<Estudiante>(estudiantesResponse),
    instituciones: getPaginatedData<Institucion>(institucionesResponse),
    gestiones: getPaginatedData<GestionAcademica>(gestionesResponse),
    cursos: getPaginatedData<Curso>(cursosResponse),
    materias: getPaginatedData<Materia>(materiasResponse),
    notas: getPaginatedData<Nota>(notasResponse),
  };

  return cache;
}

export function clearReportesCache(): void {
  cache = null;
}

export async function getReporteResumen(
  filtros: ReporteFiltros = {},
): Promise<ReporteResumen> {
  const data = await loadBaseData();

  let estudiantes = data.estudiantes;
  let notas = data.notas;

  if (filtros.institucionId) {
    estudiantes = estudiantes.filter(estudiante => {
      const institucionId = getInstitucionIdFromEstudiante(
        estudiante,
        data.cursos,
      );

      return institucionId === filtros.institucionId;
    });

    notas = notas.filter(nota => {
      const estudiante = data.estudiantes.find(
        item => item.id === nota.estudianteId,
      );

      if (!estudiante) return false;

      const institucionId = getInstitucionIdFromEstudiante(
        estudiante,
        data.cursos,
      );

      return institucionId === filtros.institucionId;
    });
  }

  if (filtros.gestionId) {
    estudiantes = estudiantes.filter(estudiante => {
      const gestionId = getGestionIdFromEstudiante(
        estudiante,
        data.cursos,
      );

      return gestionId === filtros.gestionId;
    });

    notas = notas.filter(nota => {
      const estudiante = data.estudiantes.find(
        item => item.id === nota.estudianteId,
      );

      if (!estudiante) return false;

      const gestionId = getGestionIdFromEstudiante(
        estudiante,
        data.cursos,
      );

      return gestionId === filtros.gestionId;
    });
  }

  if (filtros.trimestre) {
    notas = notas.filter(
      nota => nota.trimestre === filtros.trimestre,
    );
  }

  const institucionesActivas = data.instituciones.filter(
    institucion => institucion.activo,
  ).length;

  const notasEvaluables = notas.filter(
    nota =>
      nota.estado === 'aprobado' ||
      nota.estado === 'reprobado' ||
      typeof nota.puntaje === 'number',
  );

  const aprobadas = notasEvaluables.filter(nota =>
    notaEstaAprobada(nota),
  ).length;

  const promedioAprobacion =
    notasEvaluables.length > 0
      ? Math.round((aprobadas / notasEvaluables.length) * 100)
      : 0;

  return {
    totalEstudiantes: estudiantes.filter(
      estudiante => estudiante.activo,
    ).length,

    institucionesActivas,

    totalInstituciones: data.instituciones.length,

    promedioAprobacion,

    // Todavía no existe historial real de importaciones
    // en PostgreSQL.
    totalImportaciones: IS_MOCK_MODE
      ? IMPORT_HISTORY.length
      : IMPORT_HISTORY.length,
  };
}

export async function getInscripcionesPorGestion(
  filtros: ReporteFiltros = {},
): Promise<InscripcionChartItem[]> {
  const data = await loadBaseData();

  let estudiantes = data.estudiantes;

  if (filtros.institucionId) {
    estudiantes = estudiantes.filter(estudiante => {
      const institucionId = getInstitucionIdFromEstudiante(
        estudiante,
        data.cursos,
      );

      return institucionId === filtros.institucionId;
    });
  }

  const grouped = new Map<string, number>();

  for (const estudiante of estudiantes) {
    const gestionId = getGestionIdFromEstudiante(
      estudiante,
      data.cursos,
    );

    const nombreGestion = getNombreGestion(
      gestionId,
      data.gestiones,
    );

    grouped.set(
      nombreGestion,
      (grouped.get(nombreGestion) ?? 0) + 1,
    );
  }

  return Array.from(grouped.entries())
    .map(([gestion, estudiantes]) => ({
      gestion,
      estudiantes,
    }))
    .sort((a, b) => a.gestion.localeCompare(b.gestion));
}

export async function getRendimientoPorMateria(
  filtros: ReporteFiltros = {},
): Promise<RendimientoMateriaItem[]> {
  const data = await loadBaseData();

  let notas = data.notas;

  if (filtros.trimestre) {
    notas = notas.filter(
      nota => nota.trimestre === filtros.trimestre,
    );
  }

  if (filtros.institucionId) {
    notas = notas.filter(nota => {
      const estudiante = data.estudiantes.find(
        item => item.id === nota.estudianteId,
      );

      if (!estudiante) return false;

      const institucionId = getInstitucionIdFromEstudiante(
        estudiante,
        data.cursos,
      );

      return institucionId === filtros.institucionId;
    });
  }

  if (filtros.gestionId) {
    notas = notas.filter(nota => {
      const estudiante = data.estudiantes.find(
        item => item.id === nota.estudianteId,
      );

      if (!estudiante) return false;

      const gestionId = getGestionIdFromEstudiante(
        estudiante,
        data.cursos,
      );

      return gestionId === filtros.gestionId;
    });
  }

  const grouped = new Map<
    string,
    {
      aprobados: number;
      reprobados: number;
      pendientes: number;
    }
  >();

  for (const nota of notas) {
    const subject = getNombreMateria(nota, data.materias);

    if (!grouped.has(subject)) {
      grouped.set(subject, {
        aprobados: 0,
        reprobados: 0,
        pendientes: 0,
      });
    }

    const current = grouped.get(subject)!;

    if (notaEstaAprobada(nota)) {
      current.aprobados++;
    } else if (notaEstaReprobada(nota)) {
      current.reprobados++;
    } else {
      current.pendientes++;
    }
  }

  return Array.from(grouped.entries())
    .map(([subject, values]) => {
      const total =
        values.aprobados +
        values.reprobados +
        values.pendientes;

      return {
        subject,
        ...values,
        total,
        porcentajeAprobacion:
          total > 0
            ? Math.round((values.aprobados / total) * 100)
            : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export async function getEstudiantesPorInstitucion(
  filtros: ReporteFiltros = {},
): Promise<InstitucionChartItem[]> {
  const data = await loadBaseData();

  let estudiantes = data.estudiantes;

  if (filtros.gestionId) {
    estudiantes = estudiantes.filter(estudiante => {
      const gestionId = getGestionIdFromEstudiante(
        estudiante,
        data.cursos,
      );

      return gestionId === filtros.gestionId;
    });
  }

  const colors = [
    '#1B6FFF',
    '#00C8FF',
    '#FF5C1A',
    '#10b981',
    '#8b5cf6',
    '#f59e0b',
    '#ec4899',
    '#14b8a6',
  ];

  const grouped = new Map<string, number>();

  for (const estudiante of estudiantes) {
    const institucionId =
      getInstitucionIdFromEstudiante(
        estudiante,
        data.cursos,
      );

    if (!institucionId) continue;

    grouped.set(
      institucionId,
      (grouped.get(institucionId) ?? 0) + 1,
    );
  }

  return Array.from(grouped.entries())
    .map(([institucionId, value], index) => {
      const institucion = data.instituciones.find(
        item => item.id === institucionId,
      );

      return {
        name: institucion?.nombre ?? 'Sin institución',
        value,
        color: colors[index % colors.length],
      };
    })
    .sort((a, b) => b.value - a.value);
}

export async function getReportes(
  filtros: ReporteFiltros = {},
): Promise<ReporteData> {
  const [
    resumen,
    inscripciones,
    rendimiento,
    instituciones,
  ] = await Promise.all([
    getReporteResumen(filtros),
    getInscripcionesPorGestion(filtros),
    getRendimientoPorMateria(filtros),
    getEstudiantesPorInstitucion(filtros),
  ]);

  return {
    resumen,
    inscripciones,
    rendimiento,
    instituciones,
    importaciones: IMPORT_HISTORY,
  };
}