import { useEffect, useState } from 'react';
import { Edit2, PowerOff, Power, Eye, Trash2, X, Link as LinkIcon, Unlink } from 'lucide-react';
import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { useToast } from '../../hooks/useToast';
import type { Padre } from '../../types';
import { useAuth } from '../../auth/AuthContext';
import { getEstudiantes } from '../../api/estudiantes.api';
import type { Estudiante, UnidadEducativa, Curso } from '../../types';
import { apiRequest } from '../../api/client';
import { createPadre, updatePadre, getPadres, vincularPadreEstudiante, desvincularPadreEstudiante } from '../../api/padres.api';
import { getInstituciones } from '../../api/instituciones.api';
import { getCursos } from '../../api/cursos.api';

const RELACION_LABELS: Record<string, string> = { padre: 'Padre', madre: 'Madre', tutor: 'Tutor/a', otro: 'Otro' };
const EMPTY = { ci: '', nombres: '', apellidos: '', telefono: '', email: '', relacion: 'padre' as Padre['relacion'], activo: true };

export default function Padres() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [instituciones, setInstituciones] = useState<UnidadEducativa[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [estudianteId, setEstudianteId] = useState('');
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [modal, setModal] = useState<{ open: boolean; data?: Padre }>({ open: false });
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<Padre | null>(null);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [detailModalItem, setDetailModalItem] = useState<any>(null);
  const [linkModalItem, setLinkModalItem] = useState<any>(null);

  const cargarDatosCompletos = async () => {
    setLoadingEstudiantes(true);
    try {
      const [resEstudiantes, resInstituciones, resCursos] = await Promise.all([
        getEstudiantes(),
        getInstituciones(),
        getCursos(),
      ]);

      setEstudiantes(resEstudiantes.data.filter(e => e.activo));
      setInstituciones(resInstituciones.data);
      setCursos(resCursos.data);
    } catch (error) {
      console.error('Error al cargar datos base:', error);
      toast('No se pudieron cargar algunos datos', 'error');
    } finally {
      setLoadingEstudiantes(false);
    }
  };

  // 🔥 SOLUCIÓN: Cargar los datos automáticamente al entrar a la página
  useEffect(() => {
    void cargarDatosCompletos();
  }, []);

const handleSave = async () => {
if (!modal.data && !estudianteId) {
  toast('Selecciona el estudiante relacionado', 'error');
  return;
}

  if (!form.ci || !form.nombres || !form.apellidos || !form.telefono) {
    toast('CI, nombres, apellidos y teléfono son requeridos', 'error');
    return;

  }

  setSaving(true);

  try {
    if (modal.data) {
  await updatePadre(modal.data.id, form);
  toast('Tutor actualizado', 'success');
    } else {
      // 1. Buscamos el estudiante seleccionado
      const estudianteSeleccionado = estudiantes.find(
        e => e.id === estudianteId
      );

      if (!estudianteSeleccionado?.unidadEducativaId) {
        toast('El estudiante seleccionado no tiene una unidad educativa válida', 'error');
        return;
      }

      // 2. Preparamos el payload (SIN estudianteId, como pide el backend)
      const payload = {
        ...form,
        unidadEducativaId: estudianteSeleccionado.unidadEducativaId,
      };

      // 3. Creamos al padre en la base de datos y guardamos su respuesta
      const nuevoPadre = await createPadre(payload);

      // 4. 🔥 MAGIA: Lo vinculamos inmediatamente al estudiante
      try {
        await vincularPadreEstudiante(estudianteSeleccionado.id, nuevoPadre.id);
        toast('Tutor registrado y vinculado exitosamente', 'success');
      } catch (linkError) {
        console.error('Error vinculando:', linkError);
        toast('Tutor creado, pero hubo un error al vincularlo al estudiante', 'error');
      }
    }

    setModal({ open: false });
    setRefresh(r => r + 1);

  } catch (error) {
    console.error('Error al guardar tutor:', error);
    toast('Error al guardar tutor', 'error');
  } finally {
    setSaving(false);
  }
};


  const estudiantesFiltrados = estudiantes.filter(estudiante => {
    const busqueda = busquedaEstudiante.trim().toLowerCase();

    // 1. Filtro de búsqueda por texto (Nombre, CI, RUDE)
    const coincideTexto = !busqueda ||
      `${estudiante.nombres} ${estudiante.apellidos}`.toLowerCase().includes(busqueda) ||
      estudiante.ci.toLowerCase().includes(busqueda) ||
      (estudiante.codigoRude ?? '').toLowerCase().includes(busqueda);

    // 2. Filtro de Institución (Solo si estamos en el modal de Vincular)
    const coincideInstitucion = linkModalItem
      ? estudiante.unidadEducativaId === linkModalItem.unidadEducativaId
      : true;

    // 3. Filtro para ocultar a los hijos que ya están vinculados actualmente
    const yaVinculado = linkModalItem?.estudiantes?.some((e: any) => e.id === estudiante.id);

    return coincideTexto && coincideInstitucion && !yaVinculado;
  });


  // EFECTO MÁGICO: Si la búsqueda da 1 solo estudiante exacto, lo auto-selecciona
  useEffect(() => {
    if (busquedaEstudiante.trim() !== '' && estudiantesFiltrados.length === 1) {
      setEstudianteId(estudiantesFiltrados[0].id);
    }
  }, [busquedaEstudiante, estudiantesFiltrados]);

  const handleDeleteDefinitivo = async () => {
    if (!confirmDelete) return;
    try {
      await apiRequest(`/padres/${confirmDelete.id}`, { method: 'DELETE' });
      toast('Tutor eliminado correctamente', 'success');
      setRefresh(r => r + 1);
    } catch (error) {
      console.error(error);
      toast('Error al eliminar al tutor', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleDesvincular = async (estudianteId: string, padreId: string) => {
    if (!window.confirm('¿Estás seguro de desvincular a este estudiante?')) return;

    try {
      await desvincularPadreEstudiante(estudianteId, padreId);
      toast('Estudiante desvinculado correctamente', 'success');

      // Actualizamos la ficha localmente para que el estudiante desaparezca sin cerrar el modal
      setDetailModalItem((prev: any) => ({
        ...prev,
        estudiantes: prev.estudiantes.filter((e: any) => e.id !== estudianteId)
      }));
      setRefresh(r => r + 1);
    } catch (error) {
      console.error(error);
      toast('Error al desvincular al estudiante', 'error');
    }
  };

  return (
    <>
      <CrudPage<Padre>
        title="Padres y Tutores"
        description="Responsables registrados vinculados a estudiantes"
        refreshTrigger={refresh}
        fetchData={({ search }) => getPadres({ search }).then(r => r)}
        keyExtractor={r => r.id}
        onAdd={() => {
          setForm(EMPTY);
          setEstudianteId('');
          setBusquedaEstudiante('');
          setModal({ open: true });
          void cargarDatosCompletos(); // <--- AQUÍ
        }}
        addLabel="Nuevo tutor"
        columns={[
          { key: 'ci', label: 'CI', render: r => <span className="font-mono text-xs bg-slate-50 px-2 py-1 rounded">{r.ci}</span> },
          { key: 'nombre', label: 'Nombre completo', render: r => <div><p className="font-semibold text-slate-700 text-sm">{r.nombres} {r.apellidos}</p><p className="text-xs text-slate-400">{r.email ?? '—'}</p></div> },
          { key: 'telefono', label: 'Teléfono', render: r => r.telefono },
          { key: 'relacion', label: 'Relación', render: r => <Badge variant="blue">{RELACION_LABELS[r.relacion]}</Badge> },
          { key: 'activo', label: 'Estado', render: r => <StatusBadge activo={r.activo} /> },
          { key: 'actions', label: '', render: r => (
            <ActionsMenu items={[
              { label: 'Ver Ficha', icon: <Eye size={14} />, onClick: () => setDetailModalItem(r) },
              { label: 'Editar', icon: <Edit2 size={14} />, onClick: () => { setForm({ ci: r.ci, nombres: r.nombres, apellidos: r.apellidos, telefono: r.telefono, email: r.email ?? '', relacion: r.relacion, activo: r.activo }); setModal({ open: true, data: r }); } },
              {
                label: 'Vincular otro hijo', icon: <LinkIcon size={14} />, onClick: () => {
                  setEstudianteId('');
                  setBusquedaEstudiante('');
                  setLinkModalItem(r);
                  void cargarDatosCompletos(); // <--- Y AQUÍ
                }
              },
              { label: r.activo ? 'Desactivar' : 'Activar', icon: r.activo ? <PowerOff size={14} /> : <Power size={14} />, onClick: () => setConfirmToggle(r), variant: r.activo ? 'danger' : 'default' },
              { label: 'Eliminar', icon: <Trash2 size={14} />, onClick: () => setConfirmDelete(r), variant: 'danger' },
            ]} />
          )},
        ]}
      />
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar tutor' : 'Nuevo tutor'}
        footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button></>}>
        <div className="space-y-4">
          

{!modal.data && (
  <div className="space-y-2">
    <label className="block text-sm font-medium">
      Buscar estudiante
    </label>

    <input
      type="text"
      value={busquedaEstudiante}
      onChange={e => setBusquedaEstudiante(e.target.value)}
      placeholder="Nombre, apellido, CI o código RUDE..."
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
    />

    <label className="block text-sm font-medium">
      Seleccionar estudiante
    </label>

    <select
      value={estudianteId}
      onChange={e => setEstudianteId(e.target.value)}
      disabled={loadingEstudiantes}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
    >
      <option value="">
        {loadingEstudiantes
          ? 'Cargando estudiantes...'
          : estudiantesFiltrados.length === 0
            ? 'No se encontraron estudiantes'
            : 'Seleccionar estudiante'}
      </option>

      {estudiantesFiltrados.map(estudiante => (
        <option key={estudiante.id} value={estudiante.id}>
          {estudiante.nombres} {estudiante.apellidos}
          {' — CI: '}
          {estudiante.ci || 'Sin CI'}
          {' — RUDE: '}
          {estudiante.codigoRude || 'Sin RUDE'}
        </option>
      ))}
    </select>

    {estudianteId && (
      <p className="text-xs text-gray-500">
        Estudiante seleccionado: {
          estudiantes.find(e => e.id === estudianteId)?.nombres
        } {
          estudiantes.find(e => e.id === estudianteId)?.apellidos
        }
      </p>
    )}
  </div>
)}
          <FormField label="CI" required><Input value={form.ci} onChange={e => setForm(f => ({ ...f, ci: e.target.value }))} placeholder="9100001" disabled={!!modal.data} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombres" required><Input value={form.nombres} onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))} placeholder="Juan Carlos" /></FormField>
            <FormField label="Apellidos" required><Input value={form.apellidos} onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))} placeholder="Mamani Flores" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Teléfono" required><Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="71234567" /></FormField>
            <FormField label="Relación con el estudiante">
              <Select value={form.relacion} onChange={e => setForm(f => ({ ...f, relacion: e.target.value as Padre['relacion'] }))}>
                {Object.entries(RELACION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Email"><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="padre@email.com" /></FormField>
        </div>
      </Modal>
      <ConfirmDialog open={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={async () => { if (!confirmToggle) return; await updatePadre(confirmToggle.id, { activo: !confirmToggle.activo }); toast('Estado actualizado', 'success'); setRefresh(r => r + 1); setConfirmToggle(null); }} title="Cambiar estado" message={`¿Cambiar estado de ${confirmToggle?.nombres} ${confirmToggle?.apellidos}?`} confirmLabel="Confirmar" />
     

      {/* MODAL: ELIMINAR TUTOR */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar Tutor?</h3>
            <p className="text-gray-600 text-sm mb-6">
              Estás a punto de eliminar a <strong>{confirmDelete.nombres} {confirmDelete.apellidos}</strong>. Se perderá el acceso a la app móvil de este tutor.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={handleDeleteDefinitivo} className="rounded-lg bg-red-600 hover:bg-red-700 px-5 py-2 text-sm text-white shadow-sm transition">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER FICHA DEL TUTOR */}
      {detailModalItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="relative h-20 bg-gradient-to-r from-blue-700 to-indigo-800">
              <div className="absolute top-4 right-4 flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold shadow-sm ${detailModalItem.activo ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {detailModalItem.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>
                <button onClick={() => setDetailModalItem(null)} className="bg-black/20 hover:bg-black/40 text-white rounded-full p-1 transition">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="px-6 pb-6 relative">
              <div className="relative -mt-10 mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-white bg-slate-100 shadow-md flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-400">
                    {detailModalItem.nombres.charAt(0)}{detailModalItem.apellidos.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-slate-800">{detailModalItem.nombres} {detailModalItem.apellidos}</h3>
                <p className="text-sm font-medium text-blue-600 uppercase">{detailModalItem.relacion}</p>
                <p className="text-sm text-slate-500 mt-1">CI: {detailModalItem.ci} | Cel: {detailModalItem.telefono}</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 mb-3">Estudiantes Vinculados</h4>
                <div className="flex flex-col gap-3">
                  {detailModalItem.estudiantes && detailModalItem.estudiantes.length > 0 ? (
                    detailModalItem.estudiantes.map((est: any) => {
                      // Cruzamos el ID con nuestra lista completa descargada para obtener todos sus datos
                      const fullEst = estudiantes.find(e => e.id === est.id) || est;

                      return (
                        <div key={est.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group transition-all hover:border-blue-300">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {fullEst.nombres} {fullEst.apellidos}
                              </p>
                              {/* Datos Académicos Extra (Búsqueda cruzada) */}
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {fullEst.unidadEducativa?.nombre ??
                                  instituciones.find(i => i.id === fullEst.unidadEducativaId)?.nombre ??
                                  'Institución sin asignar'}
                                {' • '}
                                {(() => {
                                  const curso = cursos.find(c => c.id === fullEst.cursoActualId);
                                  if (!curso) return 'Curso sin asignar';
                                  const nombreIncluyeParalelo = curso.paralelo && curso.nombre.trim().toLowerCase().endsWith(curso.paralelo.trim().toLowerCase());
                                  return nombreIncluyeParalelo ? curso.nombre : `${curso.nombre} — Paralelo ${curso.paralelo || ''}`;
                                })()}
                              </p>
                            </div>

                            {/* Botón Desvincular */}
                            <button
                              onClick={() => handleDesvincular(est.id, detailModalItem.id)}
                              title="Desvincular estudiante"
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                            >
                              <Unlink size={16} />
                            </button>
                          </div>

                          {/* Badges de Identidad y Estado */}
                          <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                            <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                              CI: {fullEst.ci || 'N/A'}
                            </span>
                            {fullEst.codigoRude && (
                              <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                RUDE: {fullEst.codigoRude}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded border ${fullEst.activo ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                              {fullEst.activo ? 'ESTADO: ACTIVO' : 'ESTADO: BLOQUEADO'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-slate-500 italic">No hay estudiantes vinculados a este tutor.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VINCULAR A OTRO ESTUDIANTE */}
      <Modal open={!!linkModalItem} onClose={() => setLinkModalItem(null)} title="Vincular a estudiante"
        footer={<>
          <button className="btn-secondary" onClick={() => setLinkModalItem(null)}>Cancelar</button>
          <button className="btn-primary" onClick={async () => {
            if (!estudianteId) return toast('Selecciona un estudiante', 'error');
            try {
              await vincularPadreEstudiante(estudianteId, linkModalItem.id);
              toast('Estudiante vinculado correctamente', 'success');
              setLinkModalItem(null);
              setRefresh(r => r + 1);
            } catch (error) { toast('Error al vincular estudiante', 'error'); }
          }}>Vincular</button>
        </>}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 mb-4">
            Selecciona el nuevo estudiante que deseas vincular al tutor <strong>{linkModalItem?.nombres} {linkModalItem?.apellidos}</strong>.
          </p>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Buscar estudiante</label>
            <input type="text" value={busquedaEstudiante} onChange={e => setBusquedaEstudiante(e.target.value)} placeholder="Nombre, apellido, CI o RUDE..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <select value={estudianteId} onChange={e => setEstudianteId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mt-2">
              <option value="">Seleccionar estudiante</option>
              {estudiantesFiltrados.map(est => (
                <option key={est.id} value={est.id}>{est.nombres} {est.apellidos} — CI: {est.ci}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      
    </>
  );
}
