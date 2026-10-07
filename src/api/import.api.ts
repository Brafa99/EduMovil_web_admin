import * as XLSX from 'xlsx';
import type { ImportResult, ImportRowError } from '../types';

export interface ImportPreview {
  totalFilas: number;
  columnas: string[];
  preview: Record<string, string>[];
  rows: Record<string, string>[];
}

export interface ValidationResult {
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: ImportRowError[];
}

export interface NormalizedStudent {
  nombres: string;
  apellidos: string;
  ci: string;
  fechaNacimiento: string;
  curso?: string;
  paralelo?: string;
  genero?: string;
  padreNombres?: string;
  padreApellidos?: string;
  padreCi?: string;
  padreTelefono?: string;
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).trim();
}

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export async function previewFile(file: File): Promise<ImportPreview> {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
  });

  if (!workbook.SheetNames.length) {
    throw new Error('El archivo no contiene hojas.');
  }

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    firstSheet,
    {
      defval: '',
      raw: false,
    },
  );

  if (!rawRows.length) {
    throw new Error('El archivo no contiene registros.');
  }

  const columnas = Object.keys(rawRows[0]);

  const rows = rawRows.map((row) => {
    const normalized: Record<string, string> = {};

    for (const [key, value] of Object.entries(row)) {
      normalized[key] = normalizeValue(value);
    }

    return normalized;
  });

  return {
    totalFilas: rows.length,
    columnas,
    preview: rows.slice(0, 10),
    rows,
  };
}

export function autoMapColumns(
  columnas: string[],
): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const columna of columnas) {
    const header = normalizeHeader(columna);

    // Padres/tutores primero para evitar falsos mapeos.

    if (
      header.includes('nombre padre') ||
      header.includes('nombres padre') ||
      header.includes('nombre tutor') ||
      header.includes('nombres tutor')
    ) {
      mapping.padreNombres = columna;
      continue;
    }

    if (
      header.includes('apellido padre') ||
      header.includes('apellidos padre') ||
      header.includes('apellido tutor') ||
      header.includes('apellidos tutor')
    ) {
      mapping.padreApellidos = columna;
      continue;
    }

    if (
      header.includes('ci padre') ||
      header.includes('cedula padre') ||
      header.includes('ci tutor') ||
      header.includes('cedula tutor')
    ) {
      mapping.padreCi = columna;
      continue;
    }

    if (
      header.includes('telefono padre') ||
      header.includes('telefono tutor') ||
      header.includes('celular padre') ||
      header.includes('celular tutor')
    ) {
      mapping.padreTelefono = columna;
      continue;
    }

    if (
      header === 'nombres' ||
      header === 'nombre' ||
      header === 'nombres estudiante' ||
      header === 'nombre estudiante'
    ) {
      mapping.nombres = columna;
      continue;
    }

    if (
      header === 'apellidos' ||
      header === 'apellido' ||
      header === 'apellidos estudiante' ||
      header === 'apellido estudiante'
    ) {
      mapping.apellidos = columna;
      continue;
    }

    if (
      header === 'ci' ||
      header === 'cedula' ||
      header === 'c.i.' ||
      header === 'ci estudiante' ||
      header === 'cedula estudiante'
    ) {
      mapping.ci = columna;
      continue;
    }

    if (
      header.includes('fecha nacimiento') ||
      header.includes('fecha de nacimiento') ||
      header === 'nacimiento'
    ) {
      mapping.fechaNacimiento = columna;
      continue;
    }

    if (
      header === 'curso' ||
      header.includes('curso actual') ||
      header.includes('grado')
    ) {
      mapping.curso = columna;
      continue;
    }

    if (header.includes('paralelo')) {
      mapping.paralelo = columna;
      continue;
    }

    if (
      header === 'genero' ||
      header === 'género' ||
      header === 'sexo'
    ) {
      mapping.genero = columna;
      continue;
    }
  }

  return mapping;
}

function normalizeDate(value: string): string {
  if (!value) return '';

  const clean = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  const slash = clean.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  );

  if (slash) {
    const [, day, month, year] = slash;

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const dash = clean.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  );

  if (dash) {
    const [, day, month, year] = dash;

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return clean;
}

function getMappedValue(
  row: Record<string, string>,
  mapping: Record<string, string>,
  field: string,
): string {
  const column = mapping[field];

  if (!column) return '';

  return normalizeValue(row[column]);
}

export function normalizeImportedRows(
  rows: Record<string, string>[],
  mapping: Record<string, string>,
): NormalizedStudent[] {
  return rows.map((row) => ({
    nombres: getMappedValue(row, mapping, 'nombres'),
    apellidos: getMappedValue(row, mapping, 'apellidos'),
    ci: getMappedValue(row, mapping, 'ci'),
    fechaNacimiento: normalizeDate(
      getMappedValue(row, mapping, 'fechaNacimiento'),
    ),
    curso:
      getMappedValue(row, mapping, 'curso') || undefined,
    paralelo:
      getMappedValue(row, mapping, 'paralelo') || undefined,
    genero:
      getMappedValue(row, mapping, 'genero') || undefined,
    padreNombres:
      getMappedValue(row, mapping, 'padreNombres') || undefined,
    padreApellidos:
      getMappedValue(row, mapping, 'padreApellidos') || undefined,
    padreCi:
      getMappedValue(row, mapping, 'padreCi') || undefined,
    padreTelefono:
      getMappedValue(row, mapping, 'padreTelefono') || undefined,
  }));
}

export function validateImportedRows(
  rows: Record<string, string>[],
  mapping: Record<string, string>,
): ValidationResult {
  const errors: ImportRowError[] = [];
  const normalizedRows = normalizeImportedRows(rows, mapping);

  const requiredFields = [
    {
      key: 'nombres',
      label: 'Nombres',
    },
    {
      key: 'apellidos',
      label: 'Apellidos',
    },
    {
      key: 'ci',
      label: 'CI',
    },
    {
      key: 'fechaNacimiento',
      label: 'Fecha Nacimiento',
    },
  ];

  for (let index = 0; index < normalizedRows.length; index++) {
    const row = normalizedRows[index];
    const fila = index + 2;

    for (const field of requiredFields) {
      const value =
        row[field.key as keyof NormalizedStudent];

      if (!value) {
        errors.push({
          fila,
          campo: field.label,
          mensaje: `El campo ${field.label} es obligatorio`,
          tipo: 'error',
          valorOriginal: '',
        });
      }
    }

    if (row.fechaNacimiento) {
      const date = new Date(
        `${row.fechaNacimiento}T00:00:00`,
      );

      if (Number.isNaN(date.getTime())) {
        errors.push({
          fila,
          campo: 'Fecha Nacimiento',
          mensaje: 'Formato de fecha inválido',
          tipo: 'error',
          valorOriginal: row.fechaNacimiento,
        });
      }
    }
  }

  // Detectar CI duplicados dentro del propio archivo.
  const ciMap = new Map<string, number[]>();

  normalizedRows.forEach((row, index) => {
    if (!row.ci) return;

    const current = ciMap.get(row.ci) ?? [];
    current.push(index + 2);
    ciMap.set(row.ci, current);
  });

  let duplicateRows = 0;

  for (const [ci, filas] of ciMap.entries()) {
    if (filas.length <= 1) continue;

    duplicateRows += filas.length - 1;

    for (const fila of filas.slice(1)) {
      errors.push({
        fila,
        campo: 'CI',
        mensaje: `CI duplicado dentro del archivo: ${ci}`,
        tipo: 'duplicado',
        valorOriginal: ci,
      });
    }
  }

  const invalidRows = new Set(
    errors
      .filter((error) => error.tipo === 'error')
      .map((error) => error.fila),
  );

  const validRows =
    normalizedRows.length - invalidRows.size;

  return {
    validRows,
    invalidRows: invalidRows.size,
    duplicateRows,
    errors,
  };
}

export async function executeImport(
  rows: Record<string, string>[],
  mapping: Record<string, string>,
  unidadEducativaId: string,
  gestionId: string,
  fileName: string,
): Promise<ImportResult> {
  const validation = validateImportedRows(
    rows,
    mapping,
  );

  const normalizedRows = normalizeImportedRows(
    rows,
    mapping,
  );

  const result: ImportResult = {
    id: `demo-import-${Date.now()}`,
    fecha: new Date().toISOString(),
    archivo: fileName,
    tipo: 'estudiantes',
    totalFilas: normalizedRows.length,
    creados: validation.validRows,
    actualizados: 0,
    omitidos: validation.duplicateRows,
    errores: validation.invalidRows,
    estado:
      validation.invalidRows > 0 ||
      validation.duplicateRows > 0
        ? 'parcial'
        : 'completado',
    unidadEducativaId,
    gestionId,
    usuarioId: 'demo-local',
  };

  // Solo persistencia local para la demo.
  sessionStorage.setItem(
    'edumovil_demo_import',
    JSON.stringify({
      result,
      rows: normalizedRows,
      validation,
    }),
  );

  return result;
}