import { useState, useEffect } from 'react';
import { Edit2, PowerOff, Power, KeyRound, DollarSign, Trash2 } from 'lucide-react';
import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge, Badge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { getUsuarios, createUsuario, updateUsuario, resetPassword, deleteUsuario } from '../../api/usuarios.api';
import { getInstituciones } from '../../api/instituciones.api';
import { useToast } from '../../hooks/useToast';
import type { UsuarioWeb } from '../../types';

const EMPTY = {
  codigo: '',
  nombres: '',
  apellidos: '',
  email: '',
  rol: 'ENCUESTADOR' as UsuarioWeb['rol'],
  activo: true,
  unidadEducativaId: '',
  password: ''
};

export default function Usuarios() {
  const { toast } = useToast();
  const [refresh, setRefresh] = useState(0);
  const [modal, setModal] = useState<{ open: boolean; data?: UsuarioWeb }>({ open: false });
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<UsuarioWeb | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UsuarioWeb | null>(null);
  const [resetTarget, setResetTarget] = useState<UsuarioWeb | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [tipoAsignacion, setTipoAsignacion] = useState<'LIBRE' | 'ESPECIFICO'>('LIBRE');
  const [searchInstitucion, setSearchInstitucion] = useState('');

  // 1. CARGA DE COLEGIOS A PRUEBA DE BALAS Y TYPESCRIPT
  useEffect(() => {
    let mounted = true;
    const loadColegios = async () => {
      try {
        // Obligamos a TS a ignorar el formato estricto temporalmente
        const response: any = await getInstituciones();
        if (mounted) {
          let colegiosList: any[] = [];
          if (Array.isArray(response)) {
            colegiosList = response;
          } else if (response && Array.isArray(response.data)) {
            colegiosList = response.data;
          }
          setInstituciones(colegiosList);
        }
      } catch (error) {
        console.error("Error cargando instituciones:", error);
      }
    };
    loadColegios();
    return () => { mounted = false; };
  }, []);

  const handleGenerarCodigo = () => {
    if (!form.nombres || '') {
      toast('Ingresa al menos el nombre para generar el código', 'error');
      return;
    }
    const iniciales = (form.nombres.substring(0, 3) || '' + form.apellidos.substring(0, 2)).toUpperCase() || '';
    const randomNum = Math.floor(100 + Math.random() * 900);
    setForm(f => ({ ...f, codigo: `PROM-${iniciales}${randomNum}` }));
  };

  const handleSave = async () => {
    if (!form.nombres || !form.apellidos || !form.email) {
      toast('Completa todos los campos requeridos', 'error');
      return;
    }
    if (!modal.data && !form.password) {
      toast('La contraseña es requerida para nuevos usuarios', 'error');
      return;
    }

    setSaving(true);
    try {
     
      
      const nombreCompleto = `${form.nombres.trim()} ${form.apellidos.trim()}`.trim();
      const usernameLimpio = (
        form.codigo.trim() || form.email.split('@')[0].substring(0, 30)
      ).toLowerCase();

      const payload: Record<string, any> = {
        username: usernameLimpio,
        nombre: nombreCompleto,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim().toLowerCase(),
        rol: form.rol,
        estado: form.activo ? 'ACTIVO' : 'INACTIVO',
        ...(form.unidadEducativaId ? { unidadEducativaId: form.unidadEducativaId } : {}),
        ...(!modal.data && form.password.trim() ? { password: form.password.trim() } : {}),
      };


      if (modal.data) {
        await updateUsuario(modal.data.id, payload as any);
        toast('Usuario/Promotor actualizado', 'success');
      } else {
        await createUsuario(payload as any);
        toast('Usuario/Promotor registrado', 'success');
      }
      setModal({ open: false });
      setRefresh(r => r + 1);
    } catch {
      toast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CrudPage<UsuarioWeb>
        title="CRM de Fuerza de Ventas (Usuarios)"
        description="Administra los administradores del sistema y la red de Promotores (Encuestadores) que afilian colegios."
        refreshTrigger={refresh}

        // 3. FETCH PROTEGIDO PARA LA TABLA
        fetchData={({ search }) => getUsuarios({ search }).then((res: any) => ({
          data: Array.isArray(res) ? res : (res.data || []),
          total: Array.isArray(res) ? res.length : (res.total || 0)
        }))}

        keyExtractor={r => r.id}
        onAdd={() => {
          setForm(EMPTY);
          setTipoAsignacion('LIBRE');
          setSearchInstitucion('');
          setModal({ open: true });
        }}
        addLabel="Registrar Personal"
        columns={[
          { 
            key: 'codigo', 
            label: 'Código. Referencial', 
            render: (r: any) => {
              const nombreRol = r.roles?.[0]?.rol?.nombre || r.rol;
              const usernameCode = r.username ? r.username.toUpperCase() : 'SIN-CODIGO';

              // A los Super Admins les ponemos un prefijo de fundadores
              if (nombreRol === 'SUPER_ADMIN') {
                return <span className="text-purple-400 font-mono text-xs font-semibold">ROOT-{usernameCode}</span>;
              }
              
              // A los promotores les mostramos su código limpio y llamativo
              return (
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded text-xs font-mono font-bold tracking-wider">
                    {usernameCode}
                  </span>
                </div>
              );
            }
          },
          {
            key: 'nombre',
            label: 'Usuario y Contacto',
            render: r => (
              <div>
                <p className="font-semibold text-slate-700 text-sm">
                  {/* Mostramos el username que requiere NestJS */}
                  {(r as any).username || 'Usuario Nuevo'}
                </p>
                <p className="text-xs text-slate-400">{r.email}</p>
              </div>
            )
          },
          {
            key: 'rol',
            label: 'Rol Logístico',
            render: (r: any) => {
              // Extraemos el rol de la estructura de NestJS/Prisma
              const nombreRol = r.roles?.[0]?.rol?.nombre || r.rol || 'DESCONOCIDO';

              if (nombreRol === 'SUPER_ADMIN') {
                return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">SUPER ADMIN</span>;
              }
              if (nombreRol === 'ENCUESTADOR') {
                return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">ENCUESTADOR / PROMOTOR</span>;
              }
              if (nombreRol === 'ADMIN_SISTEMA') {
                return <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-bold">ADMIN (SISTEMA)</span>;
              }
              return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-bold">{nombreRol}</span>;
            }
          },
          {
            key: 'colegio',
            label: 'Colegio Asignado',
            render: (r: any) => {
              const nombreRol = r.roles?.[0]?.rol?.nombre || r.rol;

              // Si tiene colegio asignado, mostramos el nombre
              if (r.unidadEducativa) {
                return <span className="text-slate-700 font-medium text-sm">{r.unidadEducativa.nombre}</span>;
              }

              // Si es un alto mando, no aplica colegio
              if (nombreRol === 'SUPER_ADMIN' || nombreRol === 'ADMIN_SISTEMA') {
                return <span className="text-slate-400 italic text-xs">No aplica (Global)</span>;
              }

              // Si es encuestador y no tiene colegio, es fuerza libre
              return <span className="text-blue-500 font-medium text-xs">🚀 Fuerza Libre (Ventas)</span>;
            }
          },
          {
            key: 'estado',
            label: 'Estado Contrato',
            render: (r: any) => (
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                {r.estado === 'ACTIVO' ? 'Activo' : 'Bloqueado'}
              </span>
            )
          },
          {
            key: 'actions',
            label: '',
            render: r => (
              <ActionsMenu items={[
                {
                  label: 'Ver Comisiones',
                  icon: <DollarSign size={14} />,
                  onClick: () => toast('Módulo de comisiones en construcción', 'info')
                },
                {
                  label: 'Editar',
                  icon: <Edit2 size={14} />,
                  onClick: () => {
                    setForm({
                      codigo: r.codigo || '',
                      nombres: r.nombres,
                      apellidos: r.apellidos,
                      email: r.email,
                      rol: r.rol,
                      activo: r.activo,
                      unidadEducativaId: r.unidadEducativaId ?? '',
                      password: ''
                    });
                    setTipoAsignacion(r.unidadEducativaId ? 'ESPECIFICO' : 'LIBRE');
                    setSearchInstitucion('');
                    setModal({ open: true, data: r });
                  }
                },
                {
                  label: 'Reset Password',
                  icon: <KeyRound size={14} />,
                  onClick: () => { setResetTarget(r); setNewPassword(''); }
                },
                {
                  label: r.activo ? 'Despedir / Desactivar' : 'Recontratar / Activar',
                  icon: r.activo ? <PowerOff size={14} /> : <Power size={14} />,
                  onClick: () => setConfirmToggle(r),
                  variant: r.activo ? 'danger' : 'default'
                },
                {
                  label: 'Eliminar',
                  icon: <Trash2 size={14} />,
                  onClick: () => setConfirmDelete(r),
                  variant: 'danger'
                }
              ]} />
            )
          },
        ]}
      />

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar Personal' : 'Registrar Nuevo Personal'}
        footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombres" required>
              <Input value={form.nombres || ''} onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))} />
            </FormField>
            <FormField label="Apellidos" required>
              <Input value={form.apellidos || ''} onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Rol Logístico" required>
              <Select
  value={form.rol || ''}
  onChange={e =>
    setForm(f => ({
      ...f,
      rol: e.target.value as UsuarioWeb['rol'],
      codigo: e.target.value === 'ADMIN' ? '' : f.codigo || '',
    }))
  }
>
  <option value="ENCUESTADOR">ENCUESTADOR / PROMOTOR</option>
  <option value="ADMIN">ADMINISTRADOR</option>
  <option value="SUPERADMIN">SUPER ADMIN</option>
</Select>
            </FormField>

            <FormField label={form.rol === 'ENCUESTADOR' ? "Código Referral (Para Comisiones)" : "Código Admin"} required>
              <div className="flex gap-2">
                <Input value={form.codigo || ''} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder={form.rol === 'ENCUESTADOR' ? 'Ej: PROM-JUAN12' : 'ADM-001'} disabled={!!modal.data} className="w-full" />
                {!modal.data && form.rol === 'ENCUESTADOR' && (
                  <button onClick={handleGenerarCodigo} className="px-3 py-2 bg-slate-100 border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-200 transition" type="button">
                    Generar
                  </button>
                )}
              </div>
            </FormField>
          </div>

          <FormField label="Email" required><Input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></FormField>

          {form.rol === 'ENCUESTADOR' && (
            <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
              <h4 className="font-semibold text-sm text-slate-700">Modalidad y Alcance de Trabajo</h4>

              <FormField label="Tipo de Asignación">
                <Select
                  value={tipoAsignacion}
                  onChange={e => {
                    const val = e.target.value as 'LIBRE' | 'ESPECIFICO';
                    setTipoAsignacion(val);
                    if (val === 'LIBRE') {
                      setForm(f => ({ ...f, unidadEducativaId: '' }));
                    }
                  }}
                  disabled={saving}
                >
                  <option value="LIBRE">🚀 Fuerza de Ventas Libre (Múltiples colegios)</option>
                  <option value="ESPECIFICO">🏫 Asignado a un Colegio Específico</option>
                </Select>
              </FormField>

              {tipoAsignacion === 'ESPECIFICO' && (
                <FormField label="Buscar y Seleccionar Institución" required>
                  <Input
                    placeholder="🔍 Escribir nombre del colegio para filtrar..."
                    value={searchInstitucion}
                    onChange={e => {
                      setSearchInstitucion(e.target.value);
                      setForm(f => ({ ...f, unidadEducativaId: '' }));
                    }}
                    className="mb-2 text-sm"
                    disabled={saving}
                  />
                  <Select
                    value={form.unidadEducativaId || ''}
                    onChange={e => setForm(f => ({ ...f, unidadEducativaId: e.target.value }))}
                    disabled={saving}
                  >
                    <option value="" disabled>Seleccione de la lista filtrada...</option>
                    {instituciones
                      .filter(i => {
                        if (!searchInstitucion) return true;
                        return i.nombre?.toLowerCase().includes(searchInstitucion.toLowerCase().trim());
                      })
                      .map(i => (
                        <option key={i.id} value={i.id}>{i.nombre}</option>
                      ))
                    }
                  </Select>
                </FormField>
              )}
            </div>
          )}

          {!modal.data && (
            <FormField label="Contraseña inicial" required>
              <Input type="password" value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 8 caracteres" />
            </FormField>
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

      <ConfirmDialog 
        open={!!confirmToggle} 
        onClose={() => setConfirmToggle(null)} 
        onConfirm={async () => { 
          if (!confirmToggle) return; 
          
          // AQUÍ ESTÁ LA MAGIA: Mandamos 'estado' en lugar de 'activo'
          await updateUsuario(confirmToggle.id, { 
            estado: confirmToggle.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' 
          } as any); 
          
          toast('Estado de contrato actualizado', 'success'); 
          setRefresh(r => r + 1); 
          setConfirmToggle(null); 
        }} 
        title="Cambiar Estado Laboral" 
        message={`¿Deseas cambiar el estado contractual de este usuario?`} 
        confirmLabel="Confirmar" 
        // También actualizamos el color del botón basándonos en 'estado'
        variant={confirmToggle?.estado === 'ACTIVO' ? 'danger' : 'warning'} 
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          try {
            await deleteUsuario(confirmDelete.id);
            toast('Usuario eliminado permanentemente', 'success');
            setRefresh(r => r + 1);
          } catch (error) {
            toast('Error al eliminar', 'error');
          } finally {
            setConfirmDelete(null);
          }
        }}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar permanentemente a este usuario? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        variant="danger"
      />
    </>
  );
}