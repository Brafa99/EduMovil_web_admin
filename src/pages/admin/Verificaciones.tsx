import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, ShieldCheck, ExternalLink, Building2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { useToast } from '../../hooks/useToast';
import {
  verificacionesApi,
  type EstudiantePendienteVerificacion,
} from '../../api/verificaciones.api';
import { getInstituciones } from '../../api/instituciones.api';
import { getCursos } from '../../api/cursos.api';
import type { Curso, UnidadEducativa } from '../../types';

export default function Verificaciones() {
  const { toast } = useToast();

  const [items, setItems] = useState<EstudiantePendienteVerificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [incluirIndependientes, setIncluirIndependientes] = useState(true);

  const [instituciones, setInstituciones] = useState<UnidadEducativa[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);

  const [selected, setSelected] = useState<EstudiantePendienteVerificacion | null>(null);
  const [decision, setDecision] = useState<'VERIFICADO' | 'RECHAZADO'>('VERIFICADO');
  const [unidadEducativaId, setUnidadEducativaId] = useState('');
  const [cursoActualId, setCursoActualId] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [saving, setSaving] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [pendientes, instRes, cursosRes] = await Promise.all([
        verificacionesApi.listarPendientes(incluirIndependientes),
        getInstituciones(),
        getCursos({}),
      ]);
      setItems(pendientes);
      setInstituciones(instRes.data ?? []);
      setCursos(cursosRes.data ?? []);
    } catch (error) {
      console.error('Error cargando verificaciones:', error);
      toast('No se pudieron cargar las solicitudes de verificación', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [incluirIndependientes]);

  const abrirModal = (
    est: EstudiantePendienteVerificacion,
    tipo: 'VERIFICADO' | 'RECHAZADO',
  ) => {
    setSelected(est);
    setDecision(tipo);
    setUnidadEducativaId(est.unidadEducativa?.id ?? '');
    setCursoActualId(est.cursoActual?.id ?? '');
    setMotivoRechazo('');
  };

  const handleResolver = async () => {
    if (!selected) return;
    if (decision === 'RECHAZADO' && !motivoRechazo.trim()) {
      toast('Debes indicar el motivo del rechazo', 'error');
      return;
    }

    setSaving(true);
    try {
      await verificacionesApi.resolver(selected.id, {
        decision,
        motivoRechazo: decision === 'RECHAZADO' ? motivoRechazo.trim() : undefined,
        unidadEducativaId: decision === 'VERIFICADO' && unidadEducativaId ? unidadEducativaId : undefined,
        cursoActualId: decision === 'VERIFICADO' && cursoActualId ? cursoActualId : undefined,
      });

      toast(
        decision === 'VERIFICADO'
          ? 'Estudiante verificado correctamente'
          : 'Solicitud rechazada',
        'success',
      );
      setSelected(null);
      cargarDatos();
    } catch (error) {
      console.error(error);
      toast('No se pudo procesar la verificación', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cursosFiltrados = cursos.filter(
    c => !unidadEducativaId || c.unidadEducativaId === unidadEducativaId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={26} />
            Verificación de Estudiantes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aprueba o rechaza auto-registros de la app móvil y revisa colegios sugeridos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={incluirIndependientes}
              onChange={e => setIncluirIndependientes(e.target.checked)}
              className="rounded text-blue-600"
            />
            Mostrar independientes / colegios sugeridos
          </label>
          <button
            onClick={cargarDatos}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Cargando solicitudes...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No hay estudiantes pendientes de verificación por el momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Estudiante</th>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Colegio / Sugerido</th>
                  <th className="px-4 py-3 font-semibold">Comprobante</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(est => (
                  <tr key={est.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">
                        {est.nombres} {est.apellidos}
                      </div>
                      <div className="text-xs text-slate-500">
                        {est.email || est.ci || 'Sin correo/CI'} · {est.cicloSugerido || est.cursoActual?.ciclo || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-700">
                        {est.codigoEdumovil || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          est.estadoVerificacion === 'PENDIENTE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {est.estadoVerificacion}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700 font-medium">
                        {est.unidadEducativa?.nombre || '—'}
                      </div>
                      {est.colegioSugeridoNombre && (
                        <div className="text-xs text-indigo-700 flex items-center gap-1 mt-0.5">
                          <Building2 size={12} />
                          Sugerido: {est.colegioSugeridoNombre}
                          {est.colegioSugeridoCiudad ? ` (${est.colegioSugeridoCiudad})` : ''}
                        </div>
                      )}
                      {(est.cursoActual?.nombre || est.gradoSugerido) && (
                        <div className="text-xs text-slate-500">
                          Curso: {est.cursoActual?.nombre || est.gradoSugerido}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {est.comprobanteUrl ? (
                        <a
                          href={est.comprobanteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                        >
                          Ver foto <ExternalLink size={13} />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Sin comprobante</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => abrirModal(est, 'VERIFICADO')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <CheckCircle2 size={14} /> Aprobar
                        </button>
                        <button
                          onClick={() => abrirModal(est, 'RECHAZADO')}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <XCircle size={14} /> Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!selected}
        onClose={() => !saving && setSelected(null)}
        title={
          decision === 'VERIFICADO'
            ? `Aprobar a ${selected?.nombres} ${selected?.apellidos}`
            : `Rechazar a ${selected?.nombres} ${selected?.apellidos}`
        }
        footer={
          <>
            <button className="btn-secondary" onClick={() => setSelected(null)} disabled={saving}>
              Cancelar
            </button>
            <button
              className={
                decision === 'VERIFICADO'
                  ? 'btn-primary'
                  : 'px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold'
              }
              onClick={handleResolver}
              disabled={saving}
            >
              {saving
                ? 'Procesando...'
                : decision === 'VERIFICADO'
                  ? 'Confirmar aprobación'
                  : 'Confirmar rechazo'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {decision === 'VERIFICADO' ? (
            <>
              <p className="text-sm text-slate-600">
                Confirma o asigna el colegio y curso oficial. Al aprobar, el comprobante se elimina automáticamente por privacidad.
              </p>
              <FormField label="Institución oficial">
                <Select
                  value={unidadEducativaId}
                  onChange={e => {
                    setUnidadEducativaId(e.target.value);
                    setCursoActualId('');
                  }}
                >
                  <option value="">Mantener actual</option>
                  {instituciones.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nombre}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Curso oficial">
                <Select
                  value={cursoActualId}
                  onChange={e => setCursoActualId(e.target.value)}
                  disabled={!unidadEducativaId}
                >
                  <option value="">Sin curso asignado</option>
                  {cursosFiltrados.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </Select>
              </FormField>
            </>
          ) : (
            <FormField label="Motivo del rechazo (se mostrará al estudiante)" required>
              <Input
                value={motivoRechazo}
                onChange={e => setMotivoRechazo(e.target.value)}
                placeholder="Ej: La foto de la libreta no es legible o no coincide con el colegio"
              />
            </FormField>
          )}
        </div>
      </Modal>
    </div>
  );
}