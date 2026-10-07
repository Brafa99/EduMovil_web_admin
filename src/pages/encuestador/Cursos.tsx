import { useAuth } from '../../auth/AuthContext';
import { CURSOS, GESTIONES } from '../../mocks/data';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/Badge';

export default function EncuestadorCursos() {
  const { user } = useAuth();
  const cursos = CURSOS.filter(c => c.unidadEducativaId === user?.unidadEducativaId);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Cursos y Paralelos" description="Cursos de tu institución asignada" />
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cursos.map(c => {
            const gestion = GESTIONES.find(g => g.id === c.gestionId);
            return (
              <div key={c.id} className="border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-lg font-bold">{c.paralelo}</span>
                  <StatusBadge activo={c.activo} />
                </div>
                <h4 className="font-semibold text-slate-700 text-sm">{c.nombre}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{gestion?.nombre ?? 'Sin gestión'}</p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
                  <span className="text-sm font-bold text-slate-700">{c.totalEstudiantes ?? 0}</span>
                  <span className="text-xs text-slate-400">estudiantes</span>
                </div>
              </div>
            );
          })}
          {cursos.length === 0 && <p className="text-sm text-slate-400 col-span-3">No hay cursos registrados.</p>}
        </div>
      </div>
    </div>
  );
}
