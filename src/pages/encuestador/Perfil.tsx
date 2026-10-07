import { useState } from 'react';
import { User, Mail, Shield, Building2, Key } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { INSTITUCIONES } from '../../mocks/data';
import { PageHeader } from '../../components/ui/PageHeader';
import { FormField, Input } from '../../components/ui/FormField';
import { useToast } from '../../hooks/useToast';

export default function EncuestadorPerfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const institucion = INSTITUCIONES.find(i => i.id === user?.unidadEducativaId);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) { toast('Las contraseñas no coinciden', 'error'); return; }
    if (passwordForm.newPass.length < 8) { toast('La contraseña debe tener al menos 8 caracteres', 'error'); return; }
    toast('Contraseña actualizada correctamente', 'success');
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Mi Perfil" description="Información de tu cuenta" />

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: 'linear-gradient(135deg, var(--color-blue), var(--color-cyan))' }}
          >
            {user?.nombres?.[0]}{user?.apellidos?.[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{user?.nombres} {user?.apellidos}</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mt-1" style={{ background: 'rgba(0,200,255,0.1)', color: '#00C8FF' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Encuestador
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { icon: <User size={16} />, label: 'Código de acceso', value: user?.codigo ?? '—' },
            { icon: <Shield size={16} />, label: 'Rol', value: user?.rol ?? '—' },
            { icon: <Mail size={16} />, label: 'Email', value: user?.email ?? '—' },
            { icon: <Building2 size={16} />, label: 'Institución asignada', value: institucion?.nombre ?? 'Sin institución asignada' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 bg-blue-50 shrink-0">{item.icon}</div>
              <div>
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key size={18} className="text-blue-500" />
          <h3 className="section-title">Cambiar contraseña</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <FormField label="Contraseña actual" required>
            <Input type="password" value={passwordForm.current} onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nueva contraseña" required>
              <Input type="password" value={passwordForm.newPass} onChange={e => setPasswordForm(f => ({ ...f, newPass: e.target.value }))} placeholder="Mínimo 8 caracteres" />
            </FormField>
            <FormField label="Confirmar contraseña" required>
              <Input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
            </FormField>
          </div>
          <button type="submit" className="btn-primary">Actualizar contraseña</button>
        </form>
      </div>
    </div>
  );
}
