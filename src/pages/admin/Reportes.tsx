import {
  Download,
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Filter,
  RefreshCw,
} from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';

import {
  getReportes,
  type ReporteData,
  type ReporteFiltros,
} from '../../api/reportes.api';

import { getInstituciones } from '../../api/instituciones.api';
import { getGestiones } from '../../api/gestiones.api';

import type {
  GestionAcademica,
  UnidadEducativa,
} from '../../types';

const ESTADO_COLORS = {
  completado: 'green',
  parcial: 'orange',
  fallido: 'red',
} as const;

function downloadCsv(
  filename: string,
  rows: Record<string, unknown>[],
): void {
  if (rows.length === 0) {
    return;
  }

  const headers = Object.keys(rows[0]);

  const escapeValue = (value: unknown): string => {
    const text = String(value ?? '');

    if (
      text.includes(',') ||
      text.includes('"') ||
      text.includes('\n')
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(header => escapeValue(row[header]))
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob(
    [csv],
    { type: 'text/csv;charset=utf-8;' },
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export default function Reportes() {
  const [reportes, setReportes] =
    useState<ReporteData | null>(null);

  const [instituciones, setInstituciones] =
    useState<UnidadEducativa[]>([]);

  const [gestiones, setGestiones] =
    useState<GestionAcademica[]>([]);

  const [institucionId, setInstitucionId] =
    useState('');

  const [gestionId, setGestionId] =
    useState('');

  const [trimestre, setTrimestre] =
    useState<'all' | '1' | '2' | '3'>('all');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const filtros = useMemo<ReporteFiltros>(() => {
    return {
      institucionId:
        institucionId || undefined,

      gestionId:
        gestionId || undefined,

      trimestre:
        trimestre === 'all'
          ? undefined
          : Number(trimestre) as 1 | 2 | 3,
    };
  }, [
    institucionId,
    gestionId,
    trimestre,
  ]);

  async function cargarCatalogos() {
    try {
      const [
        institucionesResponse,
        gestionesResponse,
      ] = await Promise.all([
        getInstituciones(),
        getGestiones(),
      ]);

      setInstituciones(
        institucionesResponse.data ?? [],
      );

      setGestiones(
        gestionesResponse.data ?? [],
      );
    } catch (err) {
      console.error(
        'Error cargando catálogos de reportes:',
        err,
      );
    }
  }

  async function cargarReportes() {
    try {
      setLoading(true);
      setError(null);

      const data = await getReportes(filtros);

      setReportes(data);
    } catch (err) {
      console.error(
        'Error cargando reportes:',
        err,
      );

      setError(
        'No se pudieron cargar los datos del reporte.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void cargarCatalogos();
  }, []);

  useEffect(() => {
    void cargarReportes();
  }, [filtros]);

  function limpiarFiltros() {
    setInstitucionId('');
    setGestionId('');
    setTrimestre('all');
  }

  function exportarTodo() {
    if (!reportes) return;

    const rows = [
      {
        indicador: 'Total estudiantes',
        valor: reportes.resumen.totalEstudiantes,
      },
      {
        indicador: 'Instituciones activas',
        valor: reportes.resumen.institucionesActivas,
      },
      {
        indicador: 'Total instituciones',
        valor: reportes.resumen.totalInstituciones,
      },
      {
        indicador: 'Promedio aprobación',
        valor: `${reportes.resumen.promedioAprobacion}%`,
      },
      {
        indicador: 'Importaciones',
        valor: reportes.resumen.totalImportaciones,
      },
    ];

    downloadCsv(
      'edumovil-reporte-resumen.csv',
      rows,
    );
  }

  function exportarRendimiento() {
    if (!reportes) return;

    downloadCsv(
      'edumovil-rendimiento.csv',
      reportes.rendimiento.map(item => ({
        materia: item.subject,
        aprobados: item.aprobados,
        reprobados: item.reprobados,
        pendientes: item.pendientes,
        total: item.total,
        porcentaje_aprobacion:
          `${item.porcentajeAprobacion}%`,
      })),
    );
  }

  function exportarInstituciones() {
    if (!reportes) return;

    downloadCsv(
      'edumovil-estudiantes-institucion.csv',
      reportes.instituciones.map(item => ({
        institucion: item.name,
        estudiantes: item.value,
      })),
    );
  }

  function exportarInscripciones() {
    if (!reportes) return;

    downloadCsv(
      'edumovil-inscripciones.csv',
      reportes.inscripciones.map(item => ({
        gestion: item.gestion,
        estudiantes: item.estudiantes,
      })),
    );
  }

  const enrollmentChartData =
    reportes?.inscripciones ?? [];

  const performanceChartData =
    reportes?.rendimiento ?? [];

  const institutionPieData =
    reportes?.instituciones ?? [];

  return (
    <div className="space-y-6 max-w-screen-2xl">

      <PageHeader
        title="Reportes"
        description="Estadísticas y análisis del sistema EduMovil"
        actions={
          <div className="flex items-center gap-3">
            <button
              className="btn-secondary"
              onClick={limpiarFiltros}
              type="button"
            >
              <Filter size={16} />
              Limpiar filtros
            </button>

            <button
              className="btn-primary"
              onClick={exportarTodo}
              disabled={!reportes || loading}
              type="button"
            >
              <Download size={16} />
              Exportar resumen
            </button>
          </div>
        }
      />

      {/* Filters */}

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">
              Filtros del reporte
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Los indicadores y gráficos se recalculan
              con los datos actuales.
            </p>
          </div>

          <button
            className="btn-ghost"
            onClick={cargarReportes}
            disabled={loading}
            type="button"
            title="Actualizar"
          >
            <RefreshCw
              size={15}
              className={
                loading
                  ? 'animate-spin'
                  : ''
              }
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Institución
            </label>

            <select
              value={institucionId}
              onChange={event =>
                setInstitucionId(event.target.value)
              }
              className="input w-full"
            >
              <option value="">
                Todas las instituciones
              </option>

              {instituciones.map(institucion => (
                <option
                  key={institucion.id}
                  value={institucion.id}
                >
                  {institucion.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Gestión académica
            </label>

            <select
              value={gestionId}
              onChange={event =>
                setGestionId(event.target.value)
              }
              className="input w-full"
            >
              <option value="">
                Todas las gestiones
              </option>

              {gestiones.map(gestion => (
                <option
                  key={gestion.id}
                  value={gestion.id}
                >
                  {gestion.nombre ||
                    `Gestión ${gestion.anio}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Trimestre
            </label>

            <select
              value={trimestre}
              onChange={event =>
                setTrimestre(
                  event.target.value as
                    | 'all'
                    | '1'
                    | '2'
                    | '3',
                )
              }
              className="input w-full"
            >
              <option value="all">
                Todos los trimestres
              </option>

              <option value="1">
                Primer trimestre
              </option>

              <option value="2">
                Segundo trimestre
              </option>

              <option value="3">
                Tercer trimestre
              </option>
            </select>
          </div>

        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="card p-4 border border-red-200 bg-red-50">
          <p className="text-sm text-red-600">
            {error}
          </p>
        </div>
      )}

      {/* Summary cards */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {[
          {
            icon: <Users size={20} />,
            label: 'Total estudiantes',
            value:
              reportes?.resumen.totalEstudiantes
                .toLocaleString('es-BO') ?? '—',
            trend: 'Estudiantes activos',
            color: '#1B6FFF',
            bg: 'rgba(27,111,255,0.1)',
          },

          {
            icon: <Building2 size={20} />,
            label: 'Instituciones activas',
            value:
              reportes
                ? String(
                    reportes.resumen
                      .institucionesActivas,
                  )
                : '—',
            trend:
              reportes
                ? `De ${reportes.resumen.totalInstituciones} registradas`
                : 'Cargando...',
            color: '#00C8FF',
            bg: 'rgba(0,200,255,0.1)',
          },

          {
            icon: <BarChart3 size={20} />,
            label: 'Promedio aprobación',
            value:
              reportes
                ? `${reportes.resumen.promedioAprobacion}%`
                : '—',
            trend:
              trimestre === 'all'
                ? 'Todos los trimestres'
                : `Trimestre ${trimestre}`,
            color: '#10b981',
            bg: 'rgba(16,185,129,0.1)',
          },

          {
            icon: <TrendingUp size={20} />,
            label: 'Importaciones',
            value:
              reportes
                ? String(
                    reportes.resumen
                      .totalImportaciones,
                  )
                : '—',
            trend: 'Historial temporal',
            color: '#FF5C1A',
            bg: 'rgba(255,92,26,0.1)',
          },
        ].map(card => (
          <div
            key={card.label}
            className="metric-card"
          >
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: card.bg,
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
            </div>

            <div className="mt-3">
              <p
                className="text-2xl font-bold text-slate-800"
                style={{
                  letterSpacing: '-0.02em',
                }}
              >
                {loading
                  ? '...'
                  : card.value}
              </p>

              <p className="text-sm text-slate-500 mt-0.5">
                {card.label}
              </p>

              <p className="text-xs text-slate-400 mt-0.5">
                {card.trend}
              </p>
            </div>
          </div>
        ))}

      </div>

      {/* Charts */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Inscripciones */}

        <div className="card p-5">

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">
                Estudiantes por gestión
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Distribución de estudiantes según
                su gestión académica.
              </p>
            </div>

            <button
              className="btn-ghost text-xs flex items-center gap-1"
              onClick={exportarInscripciones}
              disabled={
                enrollmentChartData.length === 0
              }
              type="button"
            >
              <Download size={13} />
              Exportar
            </button>
          </div>

          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <LineChart
              data={enrollmentChartData}
            >
              <XAxis
                dataKey="gestion"
                tick={{
                  fontSize: 12,
                  fill: '#94a3b8',
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fontSize: 12,
                  fill: '#94a3b8',
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border:
                    '1px solid #e2e8f0',
                  fontSize: 12,
                }}
              />

              <Line
                type="monotone"
                dataKey="estudiantes"
                name="Estudiantes"
                stroke="#1B6FFF"
                strokeWidth={2.5}
                dot
              />
            </LineChart>
          </ResponsiveContainer>

          {!loading &&
            enrollmentChartData.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-8">
                No hay datos de estudiantes
                para los filtros seleccionados.
              </p>
            )}

        </div>

        {/* Rendimiento */}

        <div className="card p-5">

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">
                Rendimiento por materia
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Comparación entre aprobados,
                reprobados y pendientes.
              </p>
            </div>

            <button
              className="btn-ghost text-xs flex items-center gap-1"
              onClick={exportarRendimiento}
              disabled={
                performanceChartData.length === 0
              }
              type="button"
            >
              <Download size={13} />
              Exportar
            </button>
          </div>

          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <BarChart
              data={performanceChartData}
              barSize={12}
            >
              <XAxis
                dataKey="subject"
                tick={{
                  fontSize: 11,
                  fill: '#94a3b8',
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fontSize: 11,
                  fill: '#94a3b8',
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border:
                    '1px solid #e2e8f0',
                  fontSize: 12,
                }}
              />

              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: 12,
                }}
              />

              <Bar
                dataKey="aprobados"
                name="Aprobados"
                fill="#1B6FFF"
                radius={[
                  3,
                  3,
                  0,
                  0,
                ]}
              />

              <Bar
                dataKey="reprobados"
                name="Reprobados"
                fill="#FF5C1A"
                radius={[
                  3,
                  3,
                  0,
                  0,
                ]}
              />

              <Bar
                dataKey="pendientes"
                name="Pendientes"
                fill="#94a3b8"
                radius={[
                  3,
                  3,
                  0,
                  0,
                ]}
              />
            </BarChart>
          </ResponsiveContainer>

          {!loading &&
            performanceChartData.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-8">
                No hay notas para los filtros
                seleccionados.
              </p>
            )}

        </div>
      </div>

      {/* Institution distribution + import history */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Institutions */}

        <div className="card p-5">

          <div className="flex items-center justify-between mb-4">

            <div>
              <h3 className="section-title">
                Estudiantes por institución
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Distribución actual.
              </p>
            </div>

            <button
              className="btn-ghost text-xs"
              onClick={exportarInstituciones}
              disabled={
                institutionPieData.length === 0
              }
              type="button"
              title="Exportar"
            >
              <Download size={13} />
            </button>

          </div>

          <ResponsiveContainer
            width="100%"
            height={180}
          >
            <PieChart>
              <Pie
                data={institutionPieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {institutionPieData.map(
                  (entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={entry.color}
                    />
                  ),
                )}
              </Pie>

              <Tooltip
                formatter={(value) => [
                  `${value} estudiantes`,
                  'Cantidad',
                ]}
                contentStyle={{
                  borderRadius: 10,
                  border:
                    '1px solid #e2e8f0',
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2 mt-2">

            {institutionPieData.map(item => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background:
                        item.color,
                    }}
                  />

                  <span className="text-slate-600 truncate max-w-32">
                    {item.name}
                  </span>
                </div>

                <span className="font-semibold text-slate-700">
                  {item.value}
                </span>
              </div>
            ))}

          </div>

          {!loading &&
            institutionPieData.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-4">
                No hay datos disponibles.
              </p>
            )}

        </div>

        {/* Import history */}

        <div className="card p-5 lg:col-span-2">

          <div className="flex items-center justify-between mb-4">

            <div>
              <h3 className="section-title">
                Historial de importaciones
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Historial temporal mientras se
                implementa el módulo de importaciones
                en backend.
              </p>
            </div>

            <button
              className="btn-ghost text-xs flex items-center gap-1"
              type="button"
              onClick={() => {
                if (!reportes) return;

                downloadCsv(
                  'edumovil-importaciones.csv',
                  reportes.importaciones.map(
                    item => ({
                      archivo: item.archivo,
                      tipo: item.tipo,
                      creados: item.creados,
                      errores: item.errores,
                      fecha: item.fecha,
                      estado: item.estado,
                    }),
                  ),
                );
              }}
            >
              <Download size={13} />
              Exportar
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Tipo</th>
                  <th>Creados</th>
                  <th>Errores</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>

                {reportes?.importaciones.map(
                  imp => (
                    <tr key={imp.id}>

                      <td>
                        <span className="text-xs font-medium text-slate-700 max-w-40 truncate block">
                          {imp.archivo}
                        </span>
                      </td>

                      <td>
                        <Badge variant="blue">
                          {imp.tipo}
                        </Badge>
                      </td>

                      <td>
                        <span className="font-semibold text-emerald-600">
                          {imp.creados}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            imp.errores > 0
                              ? 'font-semibold text-red-500'
                              : 'text-slate-400'
                          }
                        >
                          {imp.errores}
                        </span>
                      </td>

                      <td className="text-xs text-slate-500">
                        {new Date(
                          imp.fecha,
                        ).toLocaleDateString(
                          'es-BO',
                        )}
                      </td>

                      <td>
                        <Badge
                          variant={
                            ESTADO_COLORS[
                              imp.estado
                            ]
                          }
                        >
                          {imp.estado}
                        </Badge>
                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      <p className="text-xs text-center text-slate-400 pb-2">
        Los indicadores académicos se calculan
        directamente a partir de los datos disponibles
        en el backend de EduMovil.
      </p>

    </div>
  );
}