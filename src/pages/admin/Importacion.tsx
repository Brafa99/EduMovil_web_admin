import {
  useState,
  useRef,
  useEffect,
} from 'react';

import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCcw,
  Download,
} from 'lucide-react';

import { PageHeader } from '../../components/ui/PageHeader';
import { Stepper } from '../../components/ui/Stepper';
import {
  FormField,
  Select,
} from '../../components/ui/FormField';

import {
  previewFile,
  autoMapColumns,
  validateImportedRows,
  executeImport,
  normalizeImportedRows,
} from '../../api/import.api';

import type {
  ImportPreview,
  ValidationResult,
  NormalizedStudent,
} from '../../api/import.api';

import {
  getInstituciones,
} from '../../api/instituciones.api';

import {
  getGestiones,
} from '../../api/gestiones.api';

import type {
  ImportResult,
  ImportRowError,
  UnidadEducativa,
  GestionAcademica,
} from '../../types';

import { useToast } from '../../hooks/useToast';

const STEPS = [
  { label: 'Seleccionar archivo' },
  { label: 'Vista previa' },
  { label: 'Mapear columnas' },
  { label: 'Validación' },
  { label: 'Confirmar' },
  { label: 'Resultado' },
];

const SYSTEM_FIELDS = [
  { key: 'nombres', label: 'Nombres *' },
  { key: 'apellidos', label: 'Apellidos *' },
  { key: 'ci', label: 'CI *' },
  {
    key: 'fechaNacimiento',
    label: 'Fecha de nacimiento *',
  },
  { key: 'curso', label: 'Curso' },
  { key: 'paralelo', label: 'Paralelo' },
  { key: 'genero', label: 'Género' },
  {
    key: 'padreNombres',
    label: 'Nombres del padre/tutor',
  },
  {
    key: 'padreApellidos',
    label: 'Apellidos del padre/tutor',
  },
  {
    key: 'padreCi',
    label: 'CI del padre/tutor',
  },
  {
    key: 'padreTelefono',
    label: 'Teléfono del padre/tutor',
  },
];

const ERROR_TYPE_ICONS = {
  error: (
    <X size={14} className="text-red-500" />
  ),
  advertencia: (
    <AlertTriangle
      size={14}
      className="text-amber-500"
    />
  ),
  duplicado: (
    <AlertCircle
      size={14}
      className="text-blue-500"
    />
  ),
};

export default function Importacion() {
  const { toast } = useToast();

  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);

  const [file, setFile] = useState<File | null>(null);

  const [dragging, setDragging] = useState(false);

  const [preview, setPreview] =
    useState<ImportPreview | null>(null);

  const [mapping, setMapping] =
    useState<Record<string, string>>({});

  const [validation, setValidation] =
    useState<ValidationResult | null>(null);

  const [result, setResult] =
    useState<ImportResult | null>(null);

  const [importedRows, setImportedRows] =
    useState<NormalizedStudent[]>([]);

  const [instituciones, setInstituciones] =
    useState<UnidadEducativa[]>([]);

  const [gestiones, setGestiones] =
    useState<GestionAcademica[]>([]);

  const [unidadEducativaId, setUnidadEducativaId] =
    useState('');

  const [gestionId, setGestionId] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [errorFilter, setErrorFilter] =
    useState<'all' | ImportRowError['tipo']>(
      'all',
    );

  const [error, setError] =
    useState('');

  /*
   * Cargar catálogos reales del backend.
   *
   * Esto NO significa que el Excel se suba al backend.
   * Solo usamos el backend para seleccionar la
   * institución y gestión sobre las que eventualmente
   * se hará la importación real.
   */
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [
          institucionesResponse,
          gestionesResponse,
        ] = await Promise.all([
          getInstituciones(),
          getGestiones(),
        ]);

        setInstituciones(
          institucionesResponse.data,
        );

        setGestiones(
          gestionesResponse.data,
        );
      } catch {
        toast(
          'No se pudieron cargar instituciones y gestiones',
          'error',
        );
      }
    };

    loadCatalogs();
  }, [toast]);

  const handleDrop = (
    e: React.DragEvent,
  ) => {
    e.preventDefault();
    setDragging(false);

    const f =
      e.dataTransfer.files[0];

    if (
      f &&
      /\.(xlsx|xls|csv)$/i.test(f.name)
    ) {
      setFile(f);
      setError('');
    } else {
      toast(
        'Formato no soportado. Usa .xlsx, .xls o .csv',
        'error',
      );
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const f = e.target.files?.[0];

    if (!f) return;

    if (
      !/\.(xlsx|xls|csv)$/i.test(f.name)
    ) {
      toast(
        'Formato no soportado. Usa .xlsx, .xls o .csv',
        'error',
      );
      return;
    }

    setFile(f);
    setError('');
  };

  const handleNext = async () => {
    /*
     * PASO 0
     * Leer Excel/CSV localmente.
     */
    if (step === 0) {
      if (!file) {
        toast(
          'Selecciona un archivo',
          'error',
        );
        return;
      }

      setLoading(true);
      setError('');

      try {
        const p = await previewFile(file);

        setPreview(p);

        const detectedMapping =
          autoMapColumns(
            p.columnas,
          );

        setMapping(
          detectedMapping,
        );

        setStep(1);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Error al leer el archivo';

        setError(message);

        toast(
          message,
          'error',
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    /*
     * PASO 1
     */
    if (step === 1) {
      setStep(2);
      return;
    }

    /*
     * PASO 2
     * Validar institución, gestión y columnas.
     */
    if (step === 2) {
      if (!unidadEducativaId) {
        toast(
          'Selecciona una institución',
          'error',
        );
        return;
      }

      if (!gestionId) {
        toast(
          'Selecciona una gestión académica',
          'error',
        );
        return;
      }

      const requiredFields = [
        'nombres',
        'apellidos',
        'ci',
        'fechaNacimiento',
      ];

      const missingFields =
        requiredFields.filter(
          (field) => !mapping[field],
        );

      if (missingFields.length > 0) {
        toast(
          `Mapea los campos obligatorios: ${missingFields.join(', ')}`,
          'error',
        );
        return;
      }

      if (!preview) {
        toast(
          'No existe información para validar',
          'error',
        );
        return;
      }

      setLoading(true);
      setError('');

      try {
        const v =
          validateImportedRows(
            preview.rows,
            mapping,
          );

        const normalized =
          normalizeImportedRows(
            preview.rows,
            mapping,
          );

        setValidation(v);
        setImportedRows(
          normalized,
        );

        setStep(3);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Error al validar';

        setError(message);

        toast(
          message,
          'error',
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    /*
     * PASO 3
     */
    if (step === 3) {
      setStep(4);
      return;
    }

    /*
     * PASO 4
     *
     * IMPORTACIÓN DEMO:
     * todavía no toca PostgreSQL.
     */
    if (step === 4) {
      if (!preview || !file) {
        toast(
          'No existe información para procesar',
          'error',
        );
        return;
      }

      setLoading(true);
      setError('');

      try {
        const r =
          await executeImport(
            preview.rows,
            mapping,
            unidadEducativaId,
            gestionId,
            file.name,
          );

        setResult(r);

        setImportedRows(
          normalizeImportedRows(
            preview.rows,
            mapping,
          ),
        );

        setStep(5);

        toast(
          'Datos preparados correctamente. Esta es una demo local.',
          'success',
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Error durante la preparación';

        setError(message);

        toast(
          message,
          'error',
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const reset = () => {
    setStep(0);
    setFile(null);
    setPreview(null);
    setMapping({});
    setValidation(null);
    setResult(null);
    setImportedRows([]);
    setUnidadEducativaId('');
    setGestionId('');
    setError('');
    setErrorFilter('all');

    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  const filteredErrors =
    validation?.errors.filter(
      (e) =>
        errorFilter === 'all' ||
        e.tipo === errorFilter,
    ) ?? [];

  const selectedInstitution =
    instituciones.find(
      (i) =>
        i.id === unidadEducativaId,
    );

  const selectedGestion =
    gestiones.find(
      (g) =>
        g.id === gestionId,
    );

  const availableGestiones =
    gestiones.filter(
      (g) =>
        !unidadEducativaId ||
        g.unidadEducativaId ===
          unidadEducativaId,
    );

  /*
   * Descargar errores como CSV.
   */
  const downloadErrors = () => {
    if (
      !validation ||
      validation.errors.length === 0
    ) {
      return;
    }

    const header =
      'Fila,Campo,Tipo,Mensaje,Valor original';

    const rows =
      validation.errors.map(
        (item) =>
          [
            item.fila,
            item.campo,
            item.tipo,
            item.mensaje,
            item.valorOriginal ?? '',
          ]
            .map(
              (value) =>
                `"${String(value).replace(
                  /"/g,
                  '""',
                )}"`,
            )
            .join(','),
      );

    const csv =
      '\uFEFF' +
      [header, ...rows].join('\n');

    const blob =
      new Blob(
        [csv],
        {
          type: 'text/csv;charset=utf-8;',
        },
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download =
      `errores-importacion-${Date.now()}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Importación Masiva"
        description="Importa estudiantes desde Excel o CSV en 6 pasos"
      />

      <div className="card p-5">
        <Stepper
          steps={STEPS}
          currentStep={step}
        />
      </div>

      <div className="card p-6">

        {/* =====================================================
            STEP 0
        ===================================================== */}
        {step === 0 && (
          <div className="space-y-6">
            <h3 className="section-title">
              Paso 1: Selecciona el archivo
            </h3>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() =>
                setDragging(false)
              }
              onDrop={handleDrop}
              onClick={() =>
                !file &&
                fileRef.current?.click()
              }
              className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${
                dragging
                  ? 'border-blue-400 bg-blue-50'
                  : file
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={
                  handleFileChange
                }
              />

              {file ? (
                <>
                  <FileSpreadsheet
                    size={48}
                    className="text-emerald-500"
                  />

                  <div className="text-center">
                    <p className="font-semibold text-slate-700">
                      {file.name}
                    </p>

                    <p className="text-sm text-slate-400 mt-0.5">
                      {(
                        file.size / 1024
                      ).toFixed(1)}{' '}
                      KB
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);

                      if (
                        fileRef.current
                      ) {
                        fileRef.current.value =
                          '';
                      }
                    }}
                    className="absolute top-3 right-3 btn-ghost p-1.5 text-slate-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background:
                        'rgba(27,111,255,0.1)',
                    }}
                  >
                    <Upload
                      size={28}
                      style={{
                        color:
                          'var(--color-blue)',
                      }}
                    />
                  </div>

                  <div className="text-center">
                    <p className="font-semibold text-slate-600">
                      Arrastra tu archivo aquí
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                      o haz clic para explorar
                    </p>

                    <p className="text-xs text-slate-300 mt-2">
                      Formatos aceptados:
                      {' '}
                      .xlsx, .xls, .csv
                    </p>
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle
                  size={17}
                  className="text-red-500 mt-0.5"
                />

                <p className="text-sm text-red-600">
                  {error}
                </p>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            STEP 1
        ===================================================== */}
        {step === 1 && preview && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="section-title">
                Paso 2: Vista previa del archivo
              </h3>

              <div className="flex gap-3 text-sm">
                <span className="font-semibold text-slate-700">
                  {preview.totalFilas} filas
                </span>

                <span className="text-slate-400">
                  ·
                </span>

                <span className="text-slate-600">
                  {preview.columnas.length}{' '}
                  columnas detectadas
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="data-table">
                <thead>
                  <tr>
                    {preview.columnas.map(
                      (column) => (
                        <th key={column}>
                          {column}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {preview.preview.map(
                    (row, index) => (
                      <tr key={index}>
                        {preview.columnas.map(
                          (column) => (
                            <td
                              key={column}
                            >
                              {row[column] ||
                                '—'}
                            </td>
                          ),
                        )}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-400">
              Mostrando primeras{' '}
              {preview.preview.length}{' '}
              filas de{' '}
              {preview.totalFilas}
            </p>
          </div>
        )}

        {/* =====================================================
            STEP 2
        ===================================================== */}
        {step === 2 && preview && (
          <div className="space-y-5">
            <h3 className="section-title">
              Paso 3: Mapeo de columnas
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Institución"
                required
              >
                <Select
                  value={
                    unidadEducativaId
                  }
                  onChange={(e) => {
                    setUnidadEducativaId(
                      e.target.value,
                    );
                    setGestionId('');
                  }}
                  placeholder="Seleccionar institución"
                >
                  {instituciones.map(
                    (institution) => (
                      <option
                        key={
                          institution.id
                        }
                        value={
                          institution.id
                        }
                      >
                        {institution.nombre}
                      </option>
                    ),
                  )}
                </Select>
              </FormField>

              <FormField
                label="Gestión académica"
                required
              >
                <Select
                  value={gestionId}
                  onChange={(e) =>
                    setGestionId(
                      e.target.value,
                    )
                  }
                  placeholder="Seleccionar gestión"
                >
                  {availableGestiones.map(
                    (gestion) => (
                      <option
                        key={gestion.id}
                        value={gestion.id}
                      >
                        {gestion.nombre}
                      </option>
                    ),
                  )}
                </Select>
              </FormField>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-600 mb-3">
                Mapeo de campos del sistema
                → columnas del archivo
              </p>

              <div className="space-y-2.5">
                {SYSTEM_FIELDS.map(
                  (field) => (
                    <div
                      key={field.key}
                      className="flex items-center gap-4"
                    >
                      <div className="w-52 shrink-0">
                        <span
                          className={`text-sm ${
                            field.label.includes(
                              '*',
                            )
                              ? 'font-semibold text-slate-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {field.label}
                        </span>
                      </div>

                      <div className="flex-1">
                        <Select
                          value={
                            mapping[
                              field.key
                            ] ?? ''
                          }
                          onChange={(e) =>
                            setMapping(
                              (current) => ({
                                ...current,
                                [field.key]:
                                  e.target
                                    .value,
                              }),
                            )
                          }
                          placeholder="Sin mapear"
                        >
                          {preview.columnas.map(
                            (column) => (
                              <option
                                key={
                                  column
                                }
                                value={
                                  column
                                }
                              >
                                {column}
                              </option>
                            ),
                          )}
                        </Select>
                      </div>

                      {mapping[
                        field.key
                      ] ? (
                        <CheckCircle2
                          size={16}
                          className="text-emerald-500 shrink-0"
                        />
                      ) : field.label.includes(
                          '*',
                        ) ? (
                        <AlertCircle
                          size={16}
                          className="text-amber-400 shrink-0"
                        />
                      ) : (
                        <span className="w-4" />
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-sm text-blue-700">
                <strong>Demo frontend:</strong>{' '}
                el archivo se procesa localmente
                en tu navegador. Todavía no se
                guardan estudiantes en PostgreSQL.
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            STEP 3
        ===================================================== */}
        {step === 3 && validation && (
          <div className="space-y-5">
            <h3 className="section-title">
              Paso 4: Resultado de validación
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Filas válidas',
                  value:
                    validation.validRows,
                  color: '#10b981',
                  bg: 'rgba(16,185,129,0.1)',
                },
                {
                  label: 'Filas inválidas',
                  value:
                    validation.invalidRows,
                  color: '#ef4444',
                  bg: 'rgba(239,68,68,0.1)',
                },
                {
                  label: 'Duplicados',
                  value:
                    validation.duplicateRows,
                  color: '#1B6FFF',
                  bg: 'rgba(27,111,255,0.1)',
                },
                {
                  label: 'Total errores',
                  value:
                    validation.errors.length,
                  color: '#f59e0b',
                  bg: 'rgba(245,158,11,0.1)',
                },
              ].map((summary) => (
                <div
                  key={summary.label}
                  className="p-3 rounded-xl border"
                  style={{
                    borderColor:
                      summary.color +
                      '30',
                    background:
                      summary.bg,
                  }}
                >
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color:
                        summary.color,
                    }}
                  >
                    {summary.value}
                  </p>

                  <p className="text-xs text-slate-600 mt-0.5">
                    {summary.label}
                  </p>
                </div>
              ))}
            </div>

            {validation.errors.length >
              0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-600">
                    Filtrar por tipo:
                  </span>

                  {(
                    [
                      'all',
                      'error',
                      'advertencia',
                      'duplicado',
                    ] as const
                  ).map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setErrorFilter(
                          type,
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        errorFilter ===
                        type
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {type ===
                      'all'
                        ? 'Todos'
                        : type
                            .charAt(
                              0,
                            )
                            .toUpperCase() +
                          type.slice(
                            1,
                          )}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Fila</th>
                        <th>Campo</th>
                        <th>Tipo</th>
                        <th>Mensaje</th>
                        <th>
                          Valor original
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredErrors.map(
                        (item, index) => (
                          <tr key={index}>
                            <td>
                              <span className="font-mono text-sm">
                                {item.fila}
                              </span>
                            </td>

                            <td className="font-medium">
                              {item.campo}
                            </td>

                            <td>
                              <span className="flex items-center gap-1.5">
                                {
                                  ERROR_TYPE_ICONS[
                                    item.tipo
                                  ]
                                }

                                <span className="text-xs">
                                  {item.tipo}
                                </span>
                              </span>
                            </td>

                            <td className="text-sm text-slate-600">
                              {item.mensaje}
                            </td>

                            <td>
                              <span className="font-mono text-xs text-slate-400">
                                {item.valorOriginal ||
                                  '—'}
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importedRows.length >
              0 && (
              <div className="border-t border-slate-100 pt-5">
                <p className="text-sm font-semibold text-slate-600 mb-3">
                  Registros normalizados
                </p>

                <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-72">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nombres</th>
                        <th>Apellidos</th>
                        <th>CI</th>
                        <th>Fecha nacimiento</th>
                        <th>Curso</th>
                        <th>Paralelo</th>
                      </tr>
                    </thead>

                    <tbody>
                      {importedRows.map(
                        (student, index) => (
                          <tr key={index}>
                            <td>
                              {student.nombres ||
                                '—'}
                            </td>
                            <td>
                              {student.apellidos ||
                                '—'}
                            </td>
                            <td>
                              {student.ci ||
                                '—'}
                            </td>
                            <td>
                              {student.fechaNacimiento ||
                                '—'}
                            </td>
                            <td>
                              {student.curso ||
                                '—'}
                            </td>
                            <td>
                              {student.paralelo ||
                                '—'}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            STEP 4
        ===================================================== */}
        {step === 4 && validation && (
          <div className="space-y-5">
            <h3 className="section-title">
              Paso 5: Confirmar preparación
            </h3>

            <div
              className="rounded-xl p-5"
              style={{
                background:
                  'rgba(27,111,255,0.05)',
                border:
                  '1px solid rgba(27,111,255,0.15)',
              }}
            >
              <p className="font-semibold text-slate-700 mb-3">
                Resumen de la operación
              </p>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>
                    Archivo:
                  </span>

                  <strong>
                    {file?.name}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span>
                    Institución:
                  </span>

                  <strong>
                    {selectedInstitution
                      ?.nombre ??
                      '—'}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span>
                    Gestión:
                  </span>

                  <strong>
                    {selectedGestion
                      ?.nombre ??
                      '—'}
                  </strong>
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                  <span>
                    Registros válidos:
                  </span>

                  <strong className="text-emerald-600">
                    {validation.validRows}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span>
                    Registros a omitir:
                  </span>

                  <strong className="text-amber-600">
                    {validation.duplicateRows}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span>
                    Registros con error:
                  </span>

                  <strong className="text-red-600">
                    {validation.invalidRows}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <AlertCircle
                size={18}
                className="text-blue-500 shrink-0 mt-0.5"
              />

              <p className="text-sm text-blue-700">
                <strong>
                  Modo demo:
                </strong>{' '}
                al continuar, los registros se
                normalizarán y quedarán disponibles
                localmente para revisar el flujo.
                Todavía no se crearán estudiantes
                en la base de datos.
              </p>
            </div>

            {validation.invalidRows >
              0 && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                <AlertTriangle
                  size={18}
                  className="text-amber-500 shrink-0 mt-0.5"
                />

                <p className="text-sm text-amber-700">
                  Hay{' '}
                  {validation.invalidRows}{' '}
                  registros con errores. Se
                  prepararán únicamente los válidos
                  ({validation.validRows}).
                </p>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            STEP 5
        ===================================================== */}
        {step === 5 && result && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {result.estado ===
              'completado' ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2
                    size={28}
                    className="text-emerald-500"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <AlertCircle
                    size={28}
                    className="text-amber-500"
                  />
                </div>
              )}

              <div>
                <h3 className="section-title">
                  {result.estado ===
                  'completado'
                    ? 'Datos preparados correctamente'
                    : 'Preparación parcial'}
                </h3>

                <p className="text-sm text-slate-500 mt-0.5">
                  Demo local ·{' '}
                  {new Date(
                    result.fecha,
                  ).toLocaleString(
                    'es-BO',
                  )}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-sm text-blue-700">
                Los datos fueron procesados
                localmente.{' '}
                <strong>
                  Todavía no se guardaron en PostgreSQL.
                </strong>
                {' '}
                En la siguiente etapa este mismo
                resultado podrá enviarse al backend.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Preparados',
                  value:
                    result.creados,
                  color: '#10b981',
                  bg: 'rgba(16,185,129,0.1)',
                },
                {
                  label: 'Actualizados',
                  value:
                    result.actualizados,
                  color: '#1B6FFF',
                  bg: 'rgba(27,111,255,0.1)',
                },
                {
                  label: 'Omitidos',
                  value:
                    result.omitidos,
                  color: '#f59e0b',
                  bg: 'rgba(245,158,11,0.1)',
                },
                {
                  label: 'Con error',
                  value:
                    result.errores,
                  color: '#ef4444',
                  bg: 'rgba(239,68,68,0.1)',
                },
              ].map((summary) => (
                <div
                  key={summary.label}
                  className="p-4 rounded-xl"
                  style={{
                    background:
                      summary.bg,
                  }}
                >
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color:
                        summary.color,
                    }}
                  >
                    {summary.value}
                  </p>

                  <p className="text-xs text-slate-600 mt-0.5">
                    {summary.label}
                  </p>
                </div>
              ))}
            </div>

            {importedRows.length >
              0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-600">
                  Estudiantes preparados
                </p>

                <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-80">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nombres</th>
                        <th>Apellidos</th>
                        <th>CI</th>
                        <th>Fecha nacimiento</th>
                        <th>Curso</th>
                        <th>Paralelo</th>
                      </tr>
                    </thead>

                    <tbody>
                      {importedRows.map(
                        (
                          student,
                          index,
                        ) => (
                          <tr key={index}>
                            <td>
                              {index + 1}
                            </td>

                            <td>
                              {
                                student.nombres
                              }
                            </td>

                            <td>
                              {
                                student.apellidos
                              }
                            </td>

                            <td>
                              {
                                student.ci
                              }
                            </td>

                            <td>
                              {
                                student.fechaNacimiento
                              }
                            </td>

                            <td>
                              {student.curso ||
                                '—'}
                            </td>

                            <td>
                              {student.paralelo ||
                                '—'}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {result.errores > 0 && (
                <button
                  className="btn-secondary"
                  onClick={
                    downloadErrors
                  }
                >
                  <Download size={16} />
                  Descargar reporte de errores
                </button>
              )}

              <button
                className="btn-primary"
                onClick={reset}
              >
                <RefreshCcw size={16} />
                Nueva importación
              </button>
            </div>
          </div>
        )}

        {/* =====================================================
            NAVIGATION
        ===================================================== */}
        {step < 5 && (
          <div className="flex justify-between mt-6 pt-5 border-t border-slate-100">
            <button
              className="btn-secondary"
              onClick={() =>
                step > 0
                  ? setStep(
                      (current) =>
                        current - 1,
                    )
                  : undefined
              }
              disabled={
                step === 0 ||
                loading
              }
            >
              Anterior
            </button>

            <button
              className="btn-primary"
              onClick={
                handleNext
              }
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </span>
              ) : step === 4 ? (
                'Preparar datos'
              ) : step === 3 ? (
                'Continuar'
              ) : (
                'Siguiente'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}