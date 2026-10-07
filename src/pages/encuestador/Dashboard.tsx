import { GraduationCap, ClipboardList, CheckCircle2, Upload, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuth } from '../../auth/AuthContext';
import { INSTITUCIONES, GESTIONES, ESTUDIANTES, ACTIVITY } from '../../mocks/data';

const progressData = [
  { dia: 'Lun', registros: 8 },
  { dia: 'Mar', registros: 12 },
  { dia: 'Mié', registros: 5 },
  { dia: 'Jue', registros: 15 },
  { dia: 'Vie', registros: 9 },
  { dia: 'Sáb', registros: 3 },
];

export default function EncuestadorDashboard() {
  const { user } = useAuth();
  const institucion = INSTITUCIONES.find(i => i.id === user?.unidadEducativaId);
  const gestion = GESTIONES.find(g => g.unidadEducativaId === user?.unidadEducativaId && g.activo);
  const misEstudiantes = ESTUDIANTES.filter(e => e.unidadEducativaId === user?.unidadEducativaId && e.activo);
  const conTutor = misEstudiantes.filter(e => e.padreId).length;
  const sinTutor = misEstudiantes.length - conTutor;
  const progreso = misEstudiantes.length > 0 ? Math.round((conTutor / misEstudiantes.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Welcome + institution */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, var(--color-navy), var(--color-navy-700))' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Bienvenido,</p>
            <h2 className="text-xl font-bold text-white mt-0.5">{user?.nombres} {user?.apellidos}</h2>
            {institucion && (
              <p className="text-sm mt-1 font-medium" style={{ color: 'var(--color-cyan)' }}>{institucion.nombre}</p>
            )}
            {gestion && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{gestion.nombre} · {gestion.fechaInicio} — {gestion.fechaFin}</p>}
          </div>
          <Link to="/encuestador/estudiantes" className="btn-primary self-start sm:self-center">
            <Plus size={16} /> Registrar estudiante
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <GraduationCap size={20} />, label: 'Estudiantes registrados', value: misEstudiantes.length, color: '#1B6FFF', bg: 'rgba(27,111,255,0.1)' },
          { icon: <CheckCircle2 size={20} />, label: 'Registros completos', value: conTutor, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { icon: <AlertCircle size={20} />, label: 'Sin tutor registrado', value: sinTutor, color: '#FF5C1A', bg: 'rgba(255,92,26,0.1)' },
          { icon: <ClipboardList size={20} />, label: 'Pendientes de revisión', value: Math.max(0, sinTutor - 2), color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        ].map(s => (
          <div key={s.label} className="metric-card">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Progreso de recolección</h3>
          <span className="text-sm font-bold" style={{ color: 'var(--color-blue)' }}>{progreso}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{ width: `${progreso}%`, background: 'linear-gradient(90deg, var(--color-blue), var(--color-cyan))' }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">{conTutor} de {misEstudiantes.length} registros con tutor/padre vinculado</p>
      </div>

      {/* Activity chart + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="section-title mb-1">Actividad semanal</h3>
          <p className="text-xs text-slate-400 mb-4">Registros por día</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={progressData} barSize={20}>
              <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="registros" name="Registros" fill="#1B6FFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">Acciones rápidas</h3>
          <div className="space-y-2">
            {[
              { label: 'Registrar nuevo estudiante', icon: <Plus size={16} />, to: '/encuestador/estudiantes', color: '#1B6FFF', bg: 'rgba(27,111,255,0.1)' },
              { label: 'Importar datos masivos', icon: <Upload size={16} />, to: '/encuestador/importacion', color: '#FF5C1A', bg: 'rgba(255,92,26,0.1)' },
              { label: 'Ver registros incompletos', icon: <AlertCircle size={16} />, to: '/encuestador/estudiantes', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            ].map(action => (
              <Link key={action.to + action.label} to={action.to}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: action.bg, color: action.color }}>{action.icon}</div>
                <span className="text-sm font-medium text-slate-600">{action.label}</span>
                <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Actividad reciente</h3>
        <div className="divide-y divide-slate-50">
          {ACTIVITY.filter(a => a.tipo === 'registro_estudiante' || a.tipo === 'importacion').slice(0, 4).map(item => (
            <div key={item.id} className="flex items-start gap-3 py-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(27,111,255,0.1)' }}>
                {item.tipo === 'importacion' ? <Upload size={14} style={{ color: 'var(--color-blue)' }} /> : <GraduationCap size={14} style={{ color: 'var(--color-blue)' }} />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">{item.descripcion}</p>
                <p className="text-xs text-slate-400 mt-0.5">{new Date(item.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'long' })}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
