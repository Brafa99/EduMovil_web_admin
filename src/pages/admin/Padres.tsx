import { useEffect, useState } from 'react';
import { Edit2, PowerOff, Power, Eye } from 'lucide-react';
import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { getPadres, createPadre, updatePadre } from '../../api/padres.api';
import { useToast } from '../../hooks/useToast';
import type { Padre } from '../../types';
import { useAuth } from '../../auth/AuthContext';
import { getEstudiantes } from '../../api/estudiantes.api';
import type { Estudiante } from '../../types';

const RELACION_LABELS: Record<string, string> = { padre: 'Padre', madre: 'Madre', tutor: 'Tutor/a', otro: 'Otro' };
const EMPTY = { ci: '', nombres: '', apellidos: '', telefono: '', email: '', relacion: 'padre' as Padre['relacion'], activo: true };

export default function Padres() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
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

  const cargarEstudiantes = async () => {
  setLoadingEstudiantes(true);

  try {
    const response = await getEstudiantes();
    setEstudiantes(response.data.filter(e => e.activo));
  } catch (error) {
    console.error('Error al cargar estudiantes:', error);
    toast('No se pudieron cargar los estudiantes', 'error');
  } finally {
    setLoadingEstudiantes(false);
  }
};

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
  const estudianteSeleccionado = estudiantes.find(
    e => e.id === estudianteId
  );

  if (!estudianteSeleccionado?.unidadEducativaId) {
    toast(
      'El estudiante seleccionado no tiene una unidad educativa válida',
      'error'
    );
    return;
  }

  const payload = {
    ...form,
    unidadEducativaId: estudianteSeleccionado.unidadEducativaId,
  };

  await createPadre(payload);
  toast('Padre/Madre o Tutor registrado', 'success');
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

  if (!busqueda) return true;

  const nombreCompleto =
    `${estudiante.nombres} ${estudiante.apellidos}`.toLowerCase();

  return (
    nombreCompleto.includes(busqueda) ||
    estudiante.ci.toLowerCase().includes(busqueda) ||
    (estudiante.codigoRude ?? '').toLowerCase().includes(busqueda)
  );
});

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
  void cargarEstudiantes();
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
              { label: 'Ver detalle', icon: <Eye size={14} />, onClick: () => {} },
              { label: 'Editar', icon: <Edit2 size={14} />, onClick: () => { setForm({ ci: r.ci, nombres: r.nombres, apellidos: r.apellidos, telefono: r.telefono, email: r.email ?? '', relacion: r.relacion, activo: r.activo }); setModal({ open: true, data: r }); } },
              { label: r.activo ? 'Desactivar' : 'Activar', icon: r.activo ? <PowerOff size={14} /> : <Power size={14} />, onClick: () => setConfirmToggle(r), variant: r.activo ? 'danger' : 'default' },
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
    </>
  );
}
