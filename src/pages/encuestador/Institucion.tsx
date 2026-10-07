import { MapPin, Phone, Users, BookOpen, Calendar } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { INSTITUCIONES, GESTIONES, CURSOS, ESTUDIANTES } from '../../mocks/data';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/Badge';

export default function EncuestadorInstitucion() {
  const { user } = useAuth();
  const inst = INSTITUCIONES.find(i => i.id === user?.unidadEducativaId);
  const gestion = GESTIONES.find(g => g.unidadEducativaId === user?.unidadEducativaId && g.activo);
  const cursos = CURSOS.filter(c => c.unidadEducativaId === user?.unidadEducativaId && c.activo);
  const estudiantes = ESTUDIANTES.filter(e => e.unidadEducativaId === user?.unidadEducativaId && e.activo);

  if (!inst) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-400">No tienes una institución asignada.</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Institución Asignada" description="Información de tu institución de trabajo" />

      <div className="card overflow-hidden">
        <div className="p-6" style={{ background: 'linear-gradient(135deg, var(--color-navy), var(--color-navy-700))' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{inst.nombre}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-cyan)' }}>{inst.tipo.replace('_', ' ').toUpperCase()}</p>
            </div>
            <StatusBadge activo={inst.activo} />
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { icon: <MapPin size={16} />, label: 'Ubicación', value: `${inst.ciudad}, ${inst.departamento}` },
            { icon: <MapPin size={16} />, label: 'Dirección', value: inst.direccion ?? '—' },
            { icon: <Phone size={16} />, label: 'Teléfono', value: inst.telefono ?? '—' },
            { icon: <Calendar size={16} />, label: 'Gestión activa', value: gestion ? `${gestion.nombre} (${gestion.fechaInicio} — ${gestion.fechaFin})` : 'Sin gestión activa' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-blue-500 bg-blue-50">{item.icon}</div>
              <div>
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <Users size={20} />, label: 'Estudiantes activos', value: estudiantes.length, color: '#1B6FFF', bg: 'rgba(27,111,255,0.1)' },
          { icon: <BookOpen size={20} />, label: 'Cursos activos', value: cursos.length, color: '#00C8FF', bg: 'rgba(0,200,255,0.1)' },
          { icon: <Calendar size={20} />, label: 'Gestiones', value: GESTIONES.filter(g => g.unidadEducativaId === user?.unidadEducativaId).length, color: '#FF5C1A', bg: 'rgba(255,92,26,0.1)' },
        ].map(s => (
          <div key={s.label} className="metric-card">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-4">Cursos registrados</h3>
        {cursos.length === 0 ? (
          <p className="text-sm text-slate-400">No hay cursos activos.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {cursos.map(c => (
              <div key={c.id} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">{c.paralelo}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700 leading-snug">{c.nombre}</p>
                  <p className="text-xs text-slate-400">{c.totalEstudiantes ?? 0} est.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
