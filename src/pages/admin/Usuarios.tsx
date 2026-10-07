import { useState } from 'react';
import { Edit2, PowerOff, Power, KeyRound } from 'lucide-react';
import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { getUsuarios, createUsuario, updateUsuario, resetPassword } from '../../api/usuarios.api';
import { INSTITUCIONES } from '../../mocks/data';
import { useToast } from '../../hooks/useToast';
import type { UsuarioWeb } from '../../types';

const EMPTY = { codigo: '', nombres: '', apellidos: '', email: '', rol: 'ENCUESTADOR' as UsuarioWeb['rol'], activo: true, unidadEducativaId: '', password: '' };

export default function Usuarios() {
  const { toast } = useToast();
  const [refresh, setRefresh] = useState(0);
  const [modal, setModal] = useState<{ open: boolean; data?: UsuarioWeb }>({ open: false });
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<UsuarioWeb | null>(null);
  const [resetTarget, setResetTarget] = useState<UsuarioWeb | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleSave = async () => {
    if (!form.codigo || !form.nombres || !form.apellidos || !form.email) { toast('Completa todos los campos requeridos', 'error'); return; }
    if (!modal.data && !form.password) { toast('La contraseña es requerida para nuevos usuarios', 'error'); return; }
    setSaving(true);
    try {
      if (modal.data) { await updateUsuario(modal.data.id, { ...form }); toast('Usuario actualizado', 'success'); }
      else { await createUsuario({ ...form }); toast('Usuario creado', 'success'); }
      setModal({ open: false }); setRefresh(r => r + 1);
    } catch { toast('Error al guardar', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <CrudPage<UsuarioWeb>
        title="Usuarios Web"
        description="Administra los usuarios con acceso al sistema"
        refreshTrigger={refresh}
        fetchData={({ search }) => getUsuarios({ search }).then(r => r)}
        keyExtractor={r => r.id}
        onAdd={() => { setForm(EMPTY); setModal({ open: true }); }}
        addLabel="Nuevo usuario"
        columns={[
          { key: 'codigo', label: 'Código', render: r => <span className="font-mono text-xs bg-slate-50 px-2 py-1 rounded font-semibold">{r.codigo}</span> },
          { key: 'nombre', label: 'Nombre', render: r => <div><p className="font-semibold text-slate-700 text-sm">{r.nombres} {r.apellidos}</p><p className="text-xs text-slate-400">{r.email}</p></div> },
          { key: 'rol', label: 'Rol', render: r => <Badge variant={r.rol === 'ADMIN' ? 'blue' : 'cyan'}>{r.rol}</Badge> },
          { key: 'institucion', label: 'Institución', render: r => INSTITUCIONES.find(i => i.id === r.unidadEducativaId)?.nombre?.split(' ').slice(0, 3).join(' ') ?? '—' },
          { key: 'ultimoAcceso', label: 'Último acceso', render: r => r.ultimoAcceso ? new Date(r.ultimoAcceso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—' },
          { key: 'activo', label: 'Estado', render: r => <StatusBadge activo={r.activo} /> },
          { key: 'actions', label: '', render: r => (
            <ActionsMenu items={[
              { label: 'Editar', icon: <Edit2 size={14} />, onClick: () => { setForm({ codigo: r.codigo, nombres: r.nombres, apellidos: r.apellidos, email: r.email, rol: r.rol, activo: r.activo, unidadEducativaId: r.unidadEducativaId ?? '', password: '' }); setModal({ open: true, data: r }); } },
              { label: 'Resetear contraseña', icon: <KeyRound size={14} />, onClick: () => { setResetTarget(r); setNewPassword(''); } },
              { label: r.activo ? 'Desactivar' : 'Activar', icon: r.activo ? <PowerOff size={14} /> : <Power size={14} />, onClick: () => setConfirmToggle(r), variant: r.activo ? 'danger' : 'default' },
            ]} />
          )},
        ]}
      />

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar usuario' : 'Nuevo usuario'}
        footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Código de acceso" required><Input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="ADM-001" disabled={!!modal.data} /></FormField>
            <FormField label="Rol" required>
              <Select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value as UsuarioWeb['rol'] }))}>
                <option value="ADMIN">ADMIN</option>
                <option value="ENCUESTADOR">ENCUESTADOR</option>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombres" required><Input value={form.nombres} onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))} /></FormField>
            <FormField label="Apellidos" required><Input value={form.apellidos} onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))} /></FormField>
          </div>
          <FormField label="Email" required><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></FormField>
          {form.rol === 'ENCUESTADOR' && (
            <FormField label="Institución asignada">
              <Select value={form.unidadEducativaId} onChange={e => setForm(f => ({ ...f, unidadEducativaId: e.target.value }))} placeholder="Seleccionar institución">
                {INSTITUCIONES.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
              </Select>
            </FormField>
          )}
          {!modal.data && (
            <FormField label="Contraseña inicial" required><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 8 caracteres" /></FormField>
          )}
        </div>
      </Modal>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title="Resetear contraseña" size="sm"
        footer={<><button className="btn-secondary" onClick={() => setResetTarget(null)}>Cancelar</button><button className="btn-primary" onClick={async () => { if (!resetTarget || !newPassword) return; await resetPassword(resetTarget.id, newPassword); toast('Contraseña actualizada', 'success'); setResetTarget(null); }}>Actualizar</button></>}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Nueva contraseña para <strong>{resetTarget?.nombres} {resetTarget?.apellidos}</strong>:</p>
          <FormField label="Nueva contraseña" required><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" /></FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={async () => { if (!confirmToggle) return; await updateUsuario(confirmToggle.id, { activo: !confirmToggle.activo }); toast('Estado actualizado', 'success'); setRefresh(r => r + 1); setConfirmToggle(null); }} title="Cambiar estado" message={`¿Cambiar estado de ${confirmToggle?.nombres} ${confirmToggle?.apellidos}?`} confirmLabel="Confirmar" variant={confirmToggle?.activo ? 'danger' : 'warning'} />
    </>
  );
}
