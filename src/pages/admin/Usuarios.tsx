import { useState, useEffect } from 'react';
import { Edit2, PowerOff, Power, KeyRound, DollarSign, Trash2 } from 'lucide-react';
import { CrudPage } from '../../components/ui/CrudPage';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  resetPassword,
  deleteUsuario,
} from '../../api/usuarios.api';
import { getInstituciones } from '../../api/instituciones.api';
import { useToast } from '../../hooks/useToast';
import type { UsuarioWeb } from '../../types';

const EMPTY = {
  codigo: '',
  nombres: '',
  apellidos: '',
  email: '',
  celular: '',
  rol: 'ENCUESTADOR' as UsuarioWeb['rol'],
  activo: true,
  unidadEducativaId: '',
  password: '',
};

const getRolReal = (u: any): string =>
  String(u?.roles?.[0]?.rol?.nombre || u?.rol || '').toUpperCase();

export default function Usuarios() {
  const { toast } = useToast();
  const [refresh, setRefresh] = useState(0);
  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [resetTarget, setResetTarget] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [tipoAsignacion, setTipoAsignacion] = useState<'LIBRE' | 'ESPECIFICO'>('LIBRE');
  const [searchInstitucion, setSearchInstitucion] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadColegios = async () => {
      try {
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
        console.error('Error cargando instituciones:', error);
      }
    };
    loadColegios();
    return () => {
      mounted = false;
    };
  }, []);

  const handleGenerarCodigo = () => {
    if (!form.nombres.trim()) {
      toast('Ingresa al menos el nombre para generar el código', 'error');
      return;
    }
    const iniciales =
      `${form.nombres.trim().substring(0, 3)}${form.apellidos.trim().substring(0, 2)}`.toUpperCase() ||
      'USR';
    const randomNum = Math.floor(100 + Math.random() * 900);
    setForm((f) => ({ ...f, codigo: `PROM-${iniciales}${randomNum}` }));
  };

  const handleSave = async () => {
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.email.trim()) {
      toast('Completa nombres, apellidos y email', 'error');
      return;
    }
    if (!modal.data && !form.password.trim()) {
      toast('La contraseña es requerida para nuevos usuarios', 'error');
      return;
    }

    setSaving(true);
    try {
      const nombreCompleto = `${form.nombres.trim()} ${form.apellidos.trim()}`.trim();
      const usernameLimpio = (
        form.codigo.trim() || form.email.split('@')[0].substring(0, 30)
      )
        .toLowerCase()
        .trim();

      const rolBackend =
        form.rol === 'ADMIN'
          ? 'ADMIN_SISTEMA'
          : form.rol === 'SUPERADMIN'
            ? 'SUPER_ADMIN'
            : form.rol;

      const celularLimpio = form.celular.trim();

      const payload: Record<string, any> = {
        username: usernameLimpio,
        nombre: nombreCompleto,
        email: form.email.trim().toLowerCase(),
        celular: celularLimpio ? celularLimpio : null,
        rol: rolBackend,
        estado: form.activo ? 'ACTIVO' : 'INACTIVO',
        ...(form.unidadEducativaId ? { unidadEducativaId: form.unidadEducativaId } : { unidadEducativaId: null }),
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
      setRefresh((r) => r + 1);
    } catch {
      toast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CrudPage<any>
        title="CRM de Fuerza de Ventas (Usuarios)"
        description="Administra los administradores del sistema y la red de Promotores (Encuestadores) que afilian colegios."
        refreshTrigger={refresh}
        fetchData={({ search }) =>
          getUsuarios({ search }).then((res: any) => {
            const lista = Array.isArray(res) ? res : res.data || [];
            const q = (search || '').trim().toLowerCase();

            const filtrada = !q
              ? lista
              : lista.filter((u: any) => {
                  const nombre = String(u.nombre || '').toLowerCase();
                  const username = String(u.username || '').toLowerCase();
                  const codigo = String(u.codigo || '').toLowerCase();
                  const email = String(u.email || '').toLowerCase();
                  const celular = String(u.celular || u.telefono || '').toLowerCase();
                  const rolNombre = getRolReal(u).toLowerCase();
                  const colegio = String(u.unidadEducativa?.nombre || '').toLowerCase();
                  const estado = String(u.estado || '').toLowerCase();

                  return (
                    nombre.includes(q) ||
                    username.includes(q) ||
                    codigo.includes(q) ||
                    email.includes(q) ||
                    celular.includes(q) ||
                    rolNombre.includes(q) ||
                    colegio.includes(q) ||
                    estado.includes(q)
                  );
                });

            return {
              data: filtrada,
              total: filtrada.length,
            };
          })
        }
        keyExtractor={(r) => r.id}
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
            label: 'Código Referencial',
            render: (r: any) => {
              const nombreRol = getRolReal(r);
              const usernameCode = r.username ? String(r.username).toUpperCase() : 'SIN-CODIGO';

              if (nombreRol === 'SUPER_ADMIN' || nombreRol === 'SUPERADMIN') {
                return (
                  <span className="text-purple-600 font-mono text-xs font-semibold">
                    ROOT-{usernameCode}
                  </span>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded text-xs font-mono font-bold tracking-wider">
                    {usernameCode}
                  </span>
                </div>
              );
            },
          },
          {
            key: 'nombre',
            label: 'Nombre Completo',
            render: (r: any) => {
              const nombreCompleto =
                r.nombre?.trim() ||
                [r.nombres, r.apellidos].filter(Boolean).join(' ').trim() ||
                r.username ||
                'Sin nombre';

              return (
                <span className="font-semibold text-slate-800 text-sm">
                  {nombreCompleto}
                </span>
              );
            },
          },
          {
            key: 'contacto',
            label: 'Contacto',
            render: (r: any) => {
              const celular = r.celular || r.telefono || '';

              return (
                <div className="space-y-0.5">
                  {r.email ? (
                    <p className="text-xs text-slate-700">{r.email}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">Sin correo</p>
                  )}
                  {celular ? (
                    <p className="text-xs text-slate-600 font-mono">📱 {celular}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">Sin celular registrado</p>
                  )}
                </div>
              );
            },
          },
          {
            key: 'rol',
            label: 'Rol Logístico',
            render: (r: any) => {
              const nombreRol = getRolReal(r) || 'DESCONOCIDO';

              if (nombreRol === 'SUPER_ADMIN' || nombreRol === 'SUPERADMIN') {
                return (
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">
                    SUPER ADMIN
                  </span>
                );
              }
              if (nombreRol === 'ENCUESTADOR') {
                return (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">
                    ENCUESTADOR / PROMOTOR
                  </span>
                );
              }
              if (nombreRol === 'ADMIN_SISTEMA' || nombreRol === 'ADMIN') {
                return (
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-bold">
                    ADMIN (SISTEMA)
                  </span>
                );
              }
              return (
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-bold">
                  {nombreRol}
                </span>
              );
            },
          },
          {
            key: 'colegio',
            label: 'Colegio Asignado',
            render: (r: any) => {
              const nombreRol = getRolReal(r);

              if (r.unidadEducativa) {
                return (
                  <span className="text-slate-700 font-medium text-sm">
                    {r.unidadEducativa.nombre}
                  </span>
                );
              }

              if (
                nombreRol === 'SUPER_ADMIN' ||
                nombreRol === 'SUPERADMIN' ||
                nombreRol === 'ADMIN_SISTEMA' ||
                nombreRol === 'ADMIN'
              ) {
                return <span className="text-slate-400 italic text-xs">No aplica (Global)</span>;
              }

              return <span className="text-blue-500 font-medium text-xs">🚀 Fuerza Libre (Ventas)</span>;
            },
          },
          {
            key: 'estado',
            label: 'Estado Contrato',
            render: (r: any) => {
              const estaActivo = r.estado ? r.estado === 'ACTIVO' : Boolean(r.activo);
              return (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    estaActivo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {estaActivo ? 'Activo' : 'Bloqueado'}
                </span>
              );
            },
          },
          {
            key: 'actions',
            label: '',
            render: (r: any) => {
              const estaActivo = r.estado ? r.estado === 'ACTIVO' : Boolean(r.activo);

              return (
                <ActionsMenu
                  items={[
                    {
                      label: 'Ver Comisiones',
                      icon: <DollarSign size={14} />,
                      onClick: () => toast('Módulo de comisiones en construcción', 'info'),
                    },
                    {
                      label: 'Editar',
                      icon: <Edit2 size={14} />,
                      onClick: () => {
                        if (!r) return;

                        const partesNombre = String(
                          r.nombre || [r.nombres, r.apellidos].filter(Boolean).join(' ') || r.username || ''
                        )
                          .trim()
                          .split(/\s+/);
                        const nombresIni = partesNombre[0] || '';
                        const apellidosIni = partesNombre.slice(1).join(' ');

                        const rolActual = getRolReal(r) || 'ENCUESTADOR';
                        const rolForm =
                          rolActual === 'SUPER_ADMIN' || rolActual === 'SUPERADMIN'
                            ? 'SUPERADMIN'
                            : rolActual === 'ADMIN_SISTEMA' || rolActual === 'ADMIN'
                              ? 'ADMIN'
                              : rolActual;

                        setForm({
                          codigo: String(r.username || r.codigo || ''),
                          nombres: nombresIni,
                          apellidos: apellidosIni,
                          email: String(r.email || ''),
                          celular: String(r.celular || r.telefono || ''),
                          rol: rolForm as UsuarioWeb['rol'],
                          activo: estaActivo,
                          unidadEducativaId: r.unidadEducativaId ?? '',
                          password: '',
                        });
                        setTipoAsignacion(r.unidadEducativaId ? 'ESPECIFICO' : 'LIBRE');
                        setSearchInstitucion('');
                        setModal({ open: true, data: r });
                      },
                    },
                    {
                      label: 'Reset Password',
                      icon: <KeyRound size={14} />,
                      onClick: () => {
                        setResetTarget(r);
                        setNewPassword('');
                      },
                    },
                    {
                      label: estaActivo ? 'Despedir / Bloquear' : 'Recontratar / Activar',
                      icon: estaActivo ? <PowerOff size={14} /> : <Power size={14} />,
                      onClick: () => setConfirmToggle(r),
                      variant: estaActivo ? 'danger' : 'default',
                    },
                    {
                      label: 'Eliminar',
                      icon: <Trash2 size={14} />,
                      onClick: () => setConfirmDelete(r),
                      variant: 'danger',
                    },
                  ]}
                />
              );
            },
          },
        ]}
      />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.data ? 'Editar Personal' : 'Registrar Nuevo Personal'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal({ open: false })}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombres" required>
              <Input
                value={form.nombres || ''}
                onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))}
              />
            </FormField>
            <FormField label="Apellidos" required>
              <Input
                value={form.apellidos || ''}
                onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Rol Logístico" required>
              <Select
                value={form.rol || ''}
                onChange={(e) =>
                  setForm((f) => ({
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

            <FormField
              label={
                form.rol === 'ENCUESTADOR'
                  ? 'Código Referral (Para Comisiones)'
                  : 'Código Admin'
              }
              required
            >
              <div className="flex gap-2">
                <Input
                  value={form.codigo || ''}
                  onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                  placeholder={form.rol === 'ENCUESTADOR' ? 'Ej: PROM-JUAN12' : 'ADM-001'}
                  disabled={!!modal.data}
                  className="w-full"
                />
                {!modal.data && form.rol === 'ENCUESTADOR' && (
                  <button
                    onClick={handleGenerarCodigo}
                    className="px-3 py-2 bg-slate-100 border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                    type="button"
                  >
                    Generar
                  </button>
                )}
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" required>
              <Input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </FormField>
            <FormField label="Celular / WhatsApp">
              <Input
                type="tel"
                value={form.celular || ''}
                onChange={(e) => setForm((f) => ({ ...f, celular: e.target.value }))}
                placeholder="Ej: 71234567"
              />
            </FormField>
          </div>

          {form.rol === 'ENCUESTADOR' && (
            <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
              <h4 className="font-semibold text-sm text-slate-700">
                Modalidad y Alcance de Trabajo
              </h4>

              <FormField label="Tipo de Asignación">
                <Select
                  value={tipoAsignacion}
                  onChange={(e) => {
                    const val = e.target.value as 'LIBRE' | 'ESPECIFICO';
                    setTipoAsignacion(val);
                    if (val === 'LIBRE') {
                      setForm((f) => ({ ...f, unidadEducativaId: '' }));
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
                    onChange={(e) => {
                      setSearchInstitucion(e.target.value);
                      setForm((f) => ({ ...f, unidadEducativaId: '' }));
                    }}
                    className="mb-2 text-sm"
                    disabled={saving}
                  />
                  <Select
                    value={form.unidadEducativaId || ''}
                    onChange={(e) => setForm((f) => ({ ...f, unidadEducativaId: e.target.value }))}
                    disabled={saving}
                  >
                    <option value="" disabled>
                      Seleccione de la lista filtrada...
                    </option>
                    {instituciones
                      .filter((i) => {
                        if (!searchInstitucion) return true;
                        return i.nombre
                          ?.toLowerCase()
                          .includes(searchInstitucion.toLowerCase().trim());
                      })
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nombre}
                        </option>
                      ))}
                  </Select>
                </FormField>
              )}
            </div>
          )}

          {!modal.data && (
            <FormField label="Contraseña inicial" required>
              <Input
                type="password"
                value={form.password || ''}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
              />
            </FormField>
          )}
        </div>
      </Modal>

      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Resetear contraseña"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setResetTarget(null)}>
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                if (!resetTarget || !newPassword) return;
                await resetPassword(resetTarget.id, newPassword);
                toast('Contraseña actualizada', 'success');
                setResetTarget(null);
              }}
            >
              Actualizar
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Nueva contraseña para{' '}
            <strong>{resetTarget?.nombre || resetTarget?.username || 'usuario'}</strong>:
          </p>
          <FormField label="Nueva contraseña" required>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={async () => {
          if (!confirmToggle) return;
          const estaActivo = confirmToggle.estado
            ? confirmToggle.estado === 'ACTIVO'
            : Boolean(confirmToggle.activo);

          await updateUsuario(confirmToggle.id, {
            estado: estaActivo ? 'INACTIVO' : 'ACTIVO',
          } as any);

          toast('Estado de contrato actualizado', 'success');
          setRefresh((r) => r + 1);
          setConfirmToggle(null);
        }}
        title="Cambiar Estado Laboral"
        message={`¿Deseas ${
          (confirmToggle?.estado ? confirmToggle.estado === 'ACTIVO' : confirmToggle?.activo)
            ? 'bloquear/desactivar'
            : 'activar'
        } a ${confirmToggle?.nombre || confirmToggle?.username || 'este usuario'}?`}
        confirmLabel="Confirmar"
        variant={
          (confirmToggle?.estado ? confirmToggle.estado === 'ACTIVO' : confirmToggle?.activo)
            ? 'danger'
            : 'warning'
        }
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          try {
            await deleteUsuario(confirmDelete.id);
            toast('Usuario eliminado permanentemente', 'success');
            setRefresh((r) => r + 1);
          } catch {
            toast('Error al eliminar', 'error');
          } finally {
            setConfirmDelete(null);
          }
        }}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar permanentemente a ${
          confirmDelete?.nombre || confirmDelete?.username || 'este usuario'
        }? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        variant="danger"
      />
    </>
  );
}