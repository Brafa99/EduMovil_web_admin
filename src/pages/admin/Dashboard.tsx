import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  UserPlus,
  BarChart3,
  ArrowRight,
  Activity,
  Layers3,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { MetricCard } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';

import { getInstituciones } from '../../api/instituciones.api';
import { getEstudiantes } from '../../api/estudiantes.api';
import { getProfesores } from '../../api/profesores.api';
import { getCursos } from '../../api/cursos.api';
import { getMaterias } from '../../api/materias.api';

import type {
  UnidadEducativa,
  Estudiante,
  Profesor,
  Curso,
  Materia,
} from '../../types';

import { useToast } from '../../hooks/useToast';

type DashboardActivity = {
  id: string;
  tipo:
    | 'institucion'
    | 'estudiante'
    | 'profesor'
    | 'curso';
  descripcion: string;
  entidad: string;
  fecha: string;
};

const CHART_COLORS = [
  '#1B6FFF',
  '#00C8FF',
  '#8b5cf6',
  '#FF5C1A',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#6366f1',
];

function ActivityTypeLabel({
  tipo,
}: {
  tipo: DashboardActivity['tipo'];
}) {
  const map: Record<
    DashboardActivity['tipo'],
    {
      label: string;
      color:
        | 'blue'
        | 'cyan'
        | 'green'
        | 'orange'
        | 'gray';
    }
  > = {
    institucion: {
      label: 'Institución',
      color: 'blue',
    },
    estudiante: {
      label: 'Estudiante',
      color: 'cyan',
    },
    profesor: {
      label: 'Profesor',
      color: 'green',
    },
    curso: {
      label: 'Curso',
      color: 'orange',
    },
  };

  const cfg = map[tipo];

  return (
    <Badge variant={cfg.color}>
      {cfg.label}
    </Badge>
  );
}

const QUICK_ACTIONS = [
  {
    label: 'Registrar estudiante',
    icon: UserPlus,
    to: '/admin/estudiantes',
    color: '#1B6FFF',
    bg: 'rgba(27,111,255,0.1)',
  },
  {
    label: 'Crear materia',
    icon: FileText,
    to: '/admin/materias',
    color: '#00C8FF',
    bg: 'rgba(0,200,255,0.1)',
  },
  {
    label: 'Crear tema',
    icon: Layers3,
    to: '/admin/temas',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
  },
  {
    label: 'Ver reportes',
    icon: BarChart3,
    to: '/admin/reportes',
    color: '#FF5C1A',
    bg: 'rgba(255,92,26,0.1)',
  },
];

function formatMonthLabel(
  date: Date
): string {
  return new Intl.DateTimeFormat(
    'es-BO',
    {
      month: 'short',
    }
  )
    .format(date)
    .replace('.', '')
    .replace(/^./, letter =>
      letter.toUpperCase()
    );
}

function getMonthKey(
  date: Date
): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}

function getLastSixMonths() {
  const result: {
    key: string;
    mes: string;
  }[] = [];

  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1
    );

    result.push({
      key: getMonthKey(date),
      mes: formatMonthLabel(date),
    });
  }

  return result;
}

export default function AdminDashboard() {
  const { toast } = useToast();

  const [loading, setLoading] =
    useState(true);

  const [instituciones, setInstituciones] =
    useState<UnidadEducativa[]>([]);

  const [estudiantes, setEstudiantes] =
    useState<Estudiante[]>([]);

  const [profesores, setProfesores] =
    useState<Profesor[]>([]);

  const [cursos, setCursos] =
    useState<Curso[]>([]);

  const [materias, setMaterias] =
    useState<Materia[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        const [
          institucionesResponse,
          estudiantesResponse,
          profesoresResponse,
          cursosResponse,
          materiasResponse,
        ] = await Promise.all([
          getInstituciones(),
          getEstudiantes(),
          getProfesores(),
          getCursos(),
          getMaterias(),
        ]);

        setInstituciones(
          institucionesResponse.data
        );

        setEstudiantes(
          estudiantesResponse.data
        );

        setProfesores(
          profesoresResponse.data
        );

        setCursos(
          cursosResponse.data
        );

        setMaterias(
          materiasResponse.data
        );
      } catch (error) {
        console.error(
          'Error cargando dashboard:',
          error
        );

        toast(
          'No se pudieron cargar los datos del dashboard',
          'error'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [toast]);

  const institucionesActivas =
    useMemo(
      () =>
        instituciones.filter(
          item => item.activo
        ),
      [instituciones]
    );

  const estudiantesActivos =
    useMemo(
      () =>
        estudiantes.filter(
          item => item.activo
        ),
      [estudiantes]
    );

  const profesoresActivos =
    useMemo(
      () =>
        profesores.filter(
          item => item.activo
        ),
      [profesores]
    );

  const cursosActivos =
    useMemo(
      () =>
        cursos.filter(
          item => item.activo
        ),
      [cursos]
    );

  const materiasActivas =
    useMemo(
      () =>
        materias.filter(
          item => item.activo
        ),
      [materias]
    );

  const totalTemas =
    useMemo(
      () =>
        materiasActivas.reduce(
          (total, materia) =>
            total +
            (materia.catalogoMateria?.temas
              ?.filter(
                tema => tema.activo
              ).length ?? 0),
          0
        ),
      [materiasActivas]
    );

  /**
   * Distribución actual de estudiantes
   * por institución.
   */
  const institutionPieData =
    useMemo(() => {
      const counter =
        new Map<string, number>();

      estudiantesActivos.forEach(
        estudiante => {
          const nombre =
            instituciones.find(
              institucion =>
                institucion.id ===
                estudiante.unidadEducativaId
            )?.nombre ??
            'Sin institución';

          counter.set(
            nombre,
            (counter.get(nombre) ?? 0) + 1
          );
        }
      );

      return Array.from(
        counter.entries()
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(
          ([name, value], index) => ({
            name,
            value,
            color:
              CHART_COLORS[
                index %
                  CHART_COLORS.length
              ],
          })
        );
    }, [
      estudiantesActivos,
      instituciones,
    ]);

  /**
   * Distribución actual de estudiantes
   * por curso.
   */
  const courseChartData =
    useMemo(() => {
      return cursosActivos
        .map(curso => ({
          curso: curso.paralelo
            ? `${curso.nombre} ${curso.paralelo}`
            : curso.nombre,
          estudiantes:
            estudiantesActivos.filter(
              estudiante =>
                estudiante.cursoActualId ===
                curso.id
            ).length,
        }))
        .sort(
          (a, b) =>
            b.estudiantes -
            a.estudiantes
        )
        .slice(0, 10);
    }, [
      cursosActivos,
      estudiantesActivos,
    ]);

  /**
   * Registros reales de estudiantes
   * en los últimos 6 meses.
   */
  const enrollmentChartData =
    useMemo(() => {
      const months =
        getLastSixMonths();

      const counters = new Map<
        string,
        number
      >();

      months.forEach(month => {
        counters.set(month.key, 0);
      });

      estudiantes.forEach(
        estudiante => {
          if (!estudiante.createdAt) {
            return;
          }

          const date = new Date(
            estudiante.createdAt
          );

          if (
            Number.isNaN(
              date.getTime()
            )
          ) {
            return;
          }

          const key =
            getMonthKey(date);

          if (counters.has(key)) {
            counters.set(
              key,
              (counters.get(key) ?? 0) +
                1
            );
          }
        }
      );

      return months.map(
        month => ({
          mes: month.mes,
          estudiantes:
            counters.get(
              month.key
            ) ?? 0,
        })
      );
    }, [estudiantes]);

  /**
   * Actividad reciente basada en
   * registros reales del sistema.
   */
  const recentActivity =
    useMemo<DashboardActivity[]>(
      () => {
        const activity: DashboardActivity[] =
          [];

        instituciones.forEach(
          institucion => {
            activity.push({
              id: `institucion-${institucion.id}`,
              tipo: 'institucion',
              descripcion:
                'Institución registrada',
              entidad:
                institucion.nombre,
              fecha:
                institucion.createdAt,
            });
          }
        );

        estudiantes.forEach(
          estudiante => {
            activity.push({
              id: `estudiante-${estudiante.id}`,
              tipo: 'estudiante',
              descripcion:
                'Estudiante registrado',
              entidad: `${estudiante.nombres} ${estudiante.apellidos}`,
              fecha:
                estudiante.createdAt,
            });
          }
        );

        profesores.forEach(
          profesor => {
            activity.push({
              id: `profesor-${profesor.id}`,
              tipo: 'profesor',
              descripcion:
                'Profesor registrado',
              entidad: `${profesor.nombres} ${profesor.apellidos}`,
              fecha:
                profesor.createdAt,
            });
          }
        );

        cursos.forEach(
          curso => {
            activity.push({
              id: `curso-${curso.id}`,
              tipo: 'curso',
              descripcion:
                'Curso registrado',
              entidad:
                curso.paralelo
                  ? `${curso.nombre} — Paralelo ${curso.paralelo}`
                  : curso.nombre,
              fecha:
                curso.createdAt,
            });
          }
        );

        return activity
          .filter(item => item.fecha)
          .sort(
            (a, b) =>
              new Date(
                b.fecha
              ).getTime() -
              new Date(
                a.fecha
              ).getTime()
          )
          .slice(0, 8);
      },
      [
        instituciones,
        estudiantes,
        profesores,
        cursos,
      ]
    );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#1B6FFF] border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">
            Cargando dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-screen-2xl">

      {/* =========================
          MÉTRICAS
      ========================== */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

        <MetricCard
          icon={
            <Building2 size={20} />
          }
          label="Instituciones"
          value={
            institucionesActivas.length
          }
          trend="Actual"
          color="#1B6FFF"
          bg="rgba(27,111,255,0.1)"
        />

        <MetricCard
          icon={
            <GraduationCap
              size={20}
            />
          }
          label="Estudiantes"
          value={
            estudiantesActivos.length
          }
          trend="Actual"
          color="#00C8FF"
          bg="rgba(0,200,255,0.1)"
        />

        <MetricCard
          icon={<Users size={20} />}
          label="Profesores"
          value={
            profesoresActivos.length
          }
          trend="Actual"
          color="#8b5cf6"
          bg="rgba(139,92,246,0.1)"
        />

        <MetricCard
          icon={
            <BookOpen size={20} />
          }
          label="Cursos"
          value={cursosActivos.length}
          trend="Actual"
          color="#FF5C1A"
          bg="rgba(255,92,26,0.1)"
        />

        <MetricCard
          icon={
            <FileText size={20} />
          }
          label="Materias"
          value={materiasActivas.length}
          trend="Actual"
          color="#10b981"
          bg="rgba(16,185,129,0.1)"
        />

        <MetricCard
          icon={
            <Layers3 size={20} />
          }
          label="Temas"
          value={totalTemas}
          trend="Curriculares"
          color="#f59e0b"
          bg="rgba(245,158,11,0.1)"
        />
      </div>

      {/* =========================
          REGISTROS + INSTITUCIONES
      ========================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">
                Registros de estudiantes
              </h3>

              <p className="text-xs text-slate-400 mt-0.5">
                Registros reales por mes —
                últimos 6 meses
              </p>
            </div>
          </div>

          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <AreaChart
              data={
                enrollmentChartData
              }
            >
              <defs>
                <linearGradient
                  id="dashboardEnrollment"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#1B6FFF"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor="#1B6FFF"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="mes"
                tick={{
                  fontSize: 12,
                  fill: '#94a3b8',
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 12,
                  fill: '#94a3b8',
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(
                  value
                ) => [
                  `${value} estudiantes`,
                  'Registros',
                ]}
                contentStyle={{
                  borderRadius: 10,
                  border:
                    '1px solid #e2e8f0',
                  fontSize: 12,
                }}
              />

              <Area
                type="monotone"
                dataKey="estudiantes"
                name="Estudiantes"
                stroke="#1B6FFF"
                strokeWidth={2}
                fill="url(#dashboardEnrollment)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-1">
            Estudiantes por institución
          </h3>

          <p className="text-xs text-slate-400 mb-4">
            Distribución actual
          </p>

          {institutionPieData.length > 0 ? (
            <>
              <ResponsiveContainer
                width="100%"
                height={180}
              >
                <PieChart>
                  <Pie
                    data={
                      institutionPieData
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {institutionPieData.map(
                      entry => (
                        <Cell
                          key={
                            entry.name
                          }
                          fill={
                            entry.color
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(
                      value
                    ) => [
                      `${value} estudiantes`,
                      'Total',
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
                {institutionPieData.map(
                  item => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            background:
                              item.color,
                          }}
                        />

                        <span className="text-slate-600 truncate max-w-36">
                          {item.name}
                        </span>
                      </div>

                      <span className="font-semibold text-slate-700">
                        {item.value}
                      </span>
                    </div>
                  )
                )}
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
              No hay estudiantes registrados.
            </div>
          )}
        </div>
      </div>

      {/* =========================
          CURSOS + ACCIONES
      ========================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">
                Estudiantes por curso
              </h3>

              <p className="text-xs text-slate-400 mt-0.5">
                Distribución actual según
                curso asignado
              </p>
            </div>
          </div>

          {courseChartData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={220}
            >
              <BarChart
                data={courseChartData}
                barSize={18}
              >
                <XAxis
                  dataKey="curso"
                  tick={{
                    fontSize: 10,
                    fill: '#94a3b8',
                  }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                    fill: '#94a3b8',
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(
                    value
                  ) => [
                    `${value} estudiantes`,
                    'Estudiantes',
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border:
                      '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                />

                <Bar
                  dataKey="estudiantes"
                  name="Estudiantes"
                  fill="#00C8FF"
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
              No hay cursos registrados.
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">
            Acciones rápidas
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(
              action => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all text-center group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{
                      background:
                        action.bg,
                      color:
                        action.color,
                    }}
                  >
                    <action.icon
                      size={18}
                    />
                  </div>

                  <span className="text-xs font-medium text-slate-600 leading-tight">
                    {action.label}
                  </span>
                </Link>
              )
            )}
          </div>

          <Link
            to="/admin/importacion"
            className="btn-primary w-full justify-center mt-4"
          >
            <Upload size={16} />
            Importación masiva
          </Link>
        </div>
      </div>

      {/* =========================
          ACTIVIDAD REAL
      ========================== */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity
              size={18}
              style={{
                color:
                  'var(--color-blue)',
              }}
            />

            <div>
              <h3 className="section-title">
                Registros recientes
              </h3>

              <p className="text-xs text-slate-400">
                Últimos registros encontrados
                en el sistema
              </p>
            </div>
          </div>

          <Link
            to="/admin/estudiantes"
            className="btn-ghost text-xs flex items-center gap-1"
            style={{
              color:
                'var(--color-blue)',
            }}
          >
            Ver estudiantes
            <ArrowRight size={13} />
          </Link>
        </div>

        {recentActivity.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {recentActivity.map(
              item => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-3"
                >
                  <div className="shrink-0 mt-0.5">
                    <ActivityTypeLabel
                      tipo={item.tipo}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-snug">
                      {item.descripcion}
                    </p>

                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {item.entidad}
                    </p>
                  </div>

                  <time className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                    {new Date(
                      item.fecha
                    ).toLocaleDateString(
                      'es-BO',
                      {
                        day: '2-digit',
                        month: 'short',
                      }
                    )}
                  </time>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-slate-400">
            No hay registros recientes.
          </div>
        )}
      </div>
    </div>
  );
}