import { useEffect, useState } from 'react';
import { Edit2, PowerOff, Power, Eye, Upload, CheckCircle, AlertCircle, Trash2, X, Crown, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router';
import { CrudPage } from '../../components/ui/CrudPage';
import { Badge, StatusBadge} from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { apiRequest } from '../../api/client';
import {
  getEstudiantes,
  createEstudiante,
  updateEstudiante,
} from '../../api/estudiantes.api';
import {
  cambiarEstadoEstudiante,
  // Conserva aquí tus demás importaciones
} from '../../api/estudiantes.api';
import { getInstituciones } from '../../api/instituciones.api';
import { getGestiones } from '../../api/gestiones.api';
import { getCursos } from '../../api/cursos.api';
import { useToast } from '../../hooks/useToast';
import type {
  Estudiante,
  UnidadEducativa,
  GestionAcademica,
  Curso,
} from '../../types';

const EMPTY = {
  ci: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  genero: 'M' as 'M' | 'F',
  cursoActualId: '',
  paralelo: 'A',
  unidadEducativaId: '',
  gestionId: '',
  padreId: '',
  activo: true,
};

export default function Estudiantes() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [refresh, setRefresh] = useState(0);

  const [modal, setModal] = useState<{
    open: boolean;
    data?: Estudiante;
  }>({ open: false });

  const [form, setForm] =
    useState<typeof EMPTY>(EMPTY);

  const [saving, setSaving] = useState(false);

  const [confirmToggle, setConfirmToggle] =
    useState<Estudiante | null>(null);

  const [statusDialog, setStatusDialog] = useState<{
  type: 'success' | 'error';
  message: string;
} | null>(null);

  const [instituciones, setInstituciones] =
    useState<UnidadEducativa[]>([]);

  const [gestiones, setGestiones] =
    useState<GestionAcademica[]>([]);

  const [cursos, setCursos] =
    useState<Curso[]>([]);

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [detailModalItem, setDetailModalItem] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      setLoadingOptions(true);

      try {
        const [
          institucionesResponse,
          gestionesResponse,
          cursosResponse,
        ] = await Promise.all([
          getInstituciones(),
          getGestiones(),
          getCursos(),
        ]);

        if (!mounted) return;

        setInstituciones(institucionesResponse.data);
        setGestiones(gestionesResponse.data);
        setCursos(cursosResponse.data);
      } catch {
        if (mounted) {
          toast(
            'No se pudieron cargar las opciones',
            'error'
          );
        }
      } finally {
        if (mounted) {
          setLoadingOptions(false);
        }
      }
    }

    loadOptions();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const handleDeleteDefinitivo = async () => {
    if (!confirmDelete) return;

    try {
      // Usamos el UUID real del estudiante para eliminarlo de la BD
      await apiRequest(`/estudiantes/${confirmDelete.id}`, {
        method: 'DELETE'
      });

      setStatusDialog({
        type: 'success',
        message: 'Estudiante eliminado correctamente del sistema.',
      });
      setRefresh(r => r + 1);
    } catch (error) {
      console.error(error);
      setStatusDialog({
        type: 'error',
        message: 'Error al eliminar al estudiante. Verifica que no tenga notas o pagos asociados.',
      });
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleCambiarEstado = async () => {
  if (!confirmToggle) return;

  const estudiante = confirmToggle;

  if (!estudiante.codigoRude) {
    setConfirmToggle(null);
    setStatusDialog({
      type: 'error',
      message: 'El estudiante no tiene un código RUDE.',
    });
    return;
  }

  const activar = !estudiante.activo;

  try {
    await cambiarEstadoEstudiante(
      estudiante.codigoRude,
      activar
    );

    setConfirmToggle(null);
    setRefresh(prev => prev + 1);

    setStatusDialog({
      type: 'success',
      message: activar
        ? 'El estudiante se activó correctamente.'
        : 'El estudiante se bloqueó correctamente.',
    });
  } catch (error) {
    console.error('Error al cambiar el estado:', error);

    setConfirmToggle(null);
    setStatusDialog({
      type: 'error',
      message: 'No se pudo cambiar el estado del estudiante.',
    });
  }
};

  const handleSave = async () => {
    const esEdicion = Boolean(modal.data);

if (
  !form.ci.trim() ||
  !form.nombres.trim() ||
  !form.apellidos.trim()
) {
  toast('Completa los nombres y apellidos requeridos.', 'error');
  return;
}

if (
  !esEdicion &&
  (
    !form.fechaNacimiento ||
    !form.unidadEducativaId ||
    !form.gestionId
  )
) {
  toast('Completa todos los campos requeridos.', 'error');
  return;
}

    setSaving(true);

    try {
      const curso = cursos.find(
        c => c.id === form.cursoActualId
      );

      const payload = {
  ci: form.ci,
  nombres: form.nombres.trim(),
  apellidos: form.apellidos.trim(),
  fechaNacimiento: form.fechaNacimiento || undefined,
  genero: form.genero,
  cursoActualId: form.cursoActualId || undefined,
  unidadEducativaId: form.unidadEducativaId,
  activo: form.activo,
};

      if (modal.data) {
        await updateEstudiante(
          modal.data.id,
          payload
        );

        toast(
          'Estudiante actualizado',
          'success'
        );
      } else {
        await createEstudiante(payload);

        toast(
          'Estudiante registrado',
          'success'
        );
      }

      setModal({ open: false });
      setRefresh(r => r + 1);
    } catch {
      toast(
        'Error al guardar el estudiante',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const cursosFiltrados = cursos.filter(c => {
    if (
      form.unidadEducativaId &&
      c.unidadEducativaId !==
        form.unidadEducativaId
    ) {
      return false;
    }

    if (
      form.gestionId &&
      c.gestionId !== form.gestionId
    ) {
      return false;
    }

    return true;
  });

  const extraerTutores = (est: any) => {
    if (Array.isArray(est?.padres) && est.padres.length > 0) {
      return est.padres.map((item: any) => {
        const p = item?.padre ?? item;
        return {
          id: p?.id || item?.padreId,
          nombres: p?.nombres || '',
          apellidos: p?.apellidos || '',
          ci: p?.ci || '',
          telefono: p?.telefono || '',
          parentesco: p?.parentesco || p?.relacion || 'TUTOR',
          esConvivente: Boolean(item?.esConvivente ?? p?.esConvivente),
        };
      });
    }
    if (est?.padre) {
      return [
        {
          id: est.padre.id,
          nombres: est.padre.nombres || '',
          apellidos: est.padre.apellidos || '',
          ci: est.padre.ci || '',
          telefono: est.padre.telefono || '',
          parentesco: est.padre.parentesco || est.padre.relacion || 'TUTOR',
          esConvivente: true,
        },
      ];
    }
    return [];
  };

  const esPlusVigente = (est: any) => {
    if (!est?.esPlus) return false;
    if (!est?.plusHasta) return true;
    return new Date(est.plusHasta) > new Date();
  };

  const gestionesFiltradas = gestiones.filter(g => {
    if (
      !form.unidadEducativaId
    ) {
      return true;
    }

    return (
      g.unidadEducativaId ===
      form.unidadEducativaId
    );
  });

  return (
    <>
      <CrudPage<Estudiante>
        title="Estudiantes"
        description="Registro de estudiantes en el sistema"
        refreshTrigger={refresh}
        fetchData={({ search }) =>
          getEstudiantes({ search })
        }
        keyExtractor={r => r.id}
        onAdd={() => {
          setForm(EMPTY);
          setModal({ open: true });
        }}
        addLabel="Registrar estudiante"
        extraActions={
          <button
            className="btn-secondary"
            onClick={() =>
              navigate('/admin/importacion')
            }
          >
            <Upload size={16} />
            Importar
          </button>
        }
        columns={[
          {
            key: 'ci',
            label: 'CI',
            render: r => (
              <span className="font-mono text-xs bg-slate-50 px-2 py-1 rounded">
                {r.ci || '—'}
              </span>
            ),
          },
          {
            key: 'nombre',
            label: 'Estudiante',
            render: r => (
              <div>
                <p className="font-semibold text-slate-700 text-sm">
                  {r.nombres} {r.apellidos}
                </p>

                <p className="text-xs text-slate-400">
                  {r.fechaNacimiento
                    ? new Date(
                        r.fechaNacimiento
                      ).toLocaleDateString(
                        'es-BO'
                      )
                    : '—'}{' '}
                  ·{' '}
                  {r.genero === 'M'
                    ? 'Masculino'
                    : r.genero === 'F'
                      ? 'Femenino'
                      : '—'}
                </p>
              </div>
            ),
          },

{
  key: 'curso',
  label: 'Curso',
  render: r => {
    const curso = cursos.find(
      c => c.id === r.cursoActualId
    );

    if (!curso) return '—';

    const nombreIncluyeParalelo =
      curso.paralelo &&
      curso.nombre
        .trim()
        .toLowerCase()
        .endsWith(curso.paralelo.trim().toLowerCase());

    return (
      <span className="text-sm">
        {curso.nombre}
        {curso.paralelo && !nombreIncluyeParalelo && (
          <>
            {' '}
            <span className="font-semibold text-blue-600">
              {curso.paralelo}
            </span>
          </>
        )}
      </span>
    );
  },
},

          {
            key: 'institucion',
            label: 'Institución',
            render: r =>
              instituciones.find(
                i =>
                  i.id ===
                  r.unidadEducativaId
              )?.nombre ?? '—',
          },
          {
            key: 'padre',
            label: 'Tutor',
            render: r => {
              const tutores = extraerTutores(r);
              if (tutores.length > 0) {
                return (
                  <div className="flex flex-col gap-1">
                    {tutores.map((t: any, idx: number) => (
                      <span
                        key={t.id || idx}
                        className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap w-fit"
                      >
                        {t.nombres} {t.apellidos} ({String(t.parentesco).toUpperCase()})
                      </span>
                    ))}
                  </div>
                );
              }
              return (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-400">
                  Sin asignar
                </span>
              );
            },
          },
          {
            key: 'plan',
            label: 'Plan App',
            render: (r: any) => {
              const plus = esPlusVigente(r);
              return plus ? (
                <div className="flex flex-col">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 w-fit">
                    <Crown size={12} className="text-amber-600" /> PLUS
                  </span>
                  {r.plusHasta && (
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Hasta {new Date(r.plusHasta).toLocaleDateString('es-BO')}
                    </span>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Gratis (Demo)
                </span>
              );
            },
          },
          {
            key: 'activo',
            label: 'Cuenta',
            render: r => <StatusBadge activo={r.activo} />,
          },
          {
            key: 'actions',
            label: '',
            render: r => (
              <ActionsMenu
                items={[
               
                  {
                    label: 'Ver Ficha',
                    icon: <Eye size={14} />,
                    onClick: () => setDetailModalItem(r),
                  },

                  {
                    label: 'Editar',
                    icon: <Edit2 size={14} />,
                    onClick: () => {
                      setForm({
                        ci: r.ci,
                        nombres: r.nombres,
                        apellidos: r.apellidos,
                        fechaNacimiento:
                          r.fechaNacimiento,
                        genero:
                          r.genero ?? 'M',
                        cursoActualId:
                          r.cursoActualId ?? '',
                        paralelo:
                          r.paralelo ?? 'A',
                        unidadEducativaId:
                          r.unidadEducativaId,
                        gestionId:
                          r.gestionId,
                        padreId: '',
                        activo: r.activo,
                      });

                      setModal({
                        open: true,
                        data: r,
                      });
                    },
                  },
                  {
                    label: 'Gestionar Pago / Plus',
                    icon: <CreditCard size={14} />,
                    onClick: () => navigate('/admin/pagos'),
                  },
                  {
                    label: r.activo ? 'Bloquear' : 'Activar',
                    icon: r.activo ? (
                      <PowerOff size={14} />
                    ) : (
                      <Power size={14} />
                    ),
                    onClick: () => setConfirmToggle(r),
                    variant: r.activo ? 'danger' : 'default',
                  },
                  {
                    // NUEVO BOTÓN: ELIMINAR
                    label: 'Eliminar',
                    icon: <Trash2 size={14} />,
                    onClick: () => setConfirmDelete(r),
                    variant: 'danger',
                  },
                ]}
              />
            ),
          },
        ]}
      />

      <Modal
        open={modal.open}
        onClose={() =>
          setModal({ open: false })
        }
        title={
          modal.data
            ? 'Editar estudiante'
            : 'Registrar estudiante'
        }
        size="lg"
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() =>
                setModal({ open: false })
              }
            >
              Cancelar
            </button>

            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={
                saving || loadingOptions
              }
            >
              {saving
                ? 'Guardando...'
                : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Nombres"
              required
            >
              <Input
                value={form.nombres}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    nombres:
                      e.target.value,
                  }))
                }
                placeholder="Juan Carlos"
              />
            </FormField>

            <FormField
              label="Apellidos"
              required
            >
              <Input
                value={form.apellidos}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    apellidos:
                      e.target.value,
                  }))
                }
                placeholder="Mamani Flores"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="CI" required>
              <Input
                value={form.ci}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    ci: e.target.value,
                  }))
                }
                placeholder="8000001"
                disabled={!!modal.data}
              />
            </FormField>

            <FormField
              label="Fecha nacimiento"
              required
            >
              <Input
                type="date"
                value={form.fechaNacimiento}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    fechaNacimiento:
                      e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Género">
              <Select
                value={form.genero}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    genero:
                      e.target.value as
                        | 'M'
                        | 'F',
                  }))
                }
              >
                <option value="M">
                  Masculino
                </option>
                <option value="F">
                  Femenino
                </option>
              </Select>
            </FormField>
          </div>

          <FormField
            label="Institución"
            required
          >
            <Select
              value={
                form.unidadEducativaId
              }
              onChange={e =>
                setForm(f => ({
                  ...f,
                  unidadEducativaId:
                    e.target.value,
                  cursoActualId: '',
                  gestionId: '',
                }))
              }
              placeholder="Seleccionar institución"
              disabled={loadingOptions}
            >
              {instituciones.map(i => (
                <option
                  key={i.id}
                  value={i.id}
                >
                  {i.nombre}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Gestión académica"
              required
            >
              <Select
                value={form.gestionId}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    gestionId: e.target.value,
                    cursoActualId: '',
                  }))
                }
                placeholder="Seleccionar gestión"
                disabled={loadingOptions}
              >
                <option value="" disabled>Seleccionar gestión...</option>
                {gestionesFiltradas.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.nombre || `Gestión ${g.anio}`} {g.unidadEducativa?.nombre ? `- ${g.unidadEducativa.nombre}` : ''}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Curso">
              <Select
                value={
                  form.cursoActualId
                }
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    cursoActualId:
                      e.target.value,
                  }))
                }
                placeholder="Seleccionar curso"
                disabled={
                  loadingOptions ||
                  !form.unidadEducativaId
                }
              >
                {cursosFiltrados.map(
                  c => (                 
<option
  key={c.id}
  value={c.id}
>
  {c.paralelo &&
  !c.nombre.trim().toLowerCase().endsWith(c.paralelo.trim().toLowerCase())
    ? `${c.nombre} — Paralelo ${c.paralelo}`
    : c.nombre}
</option>
                  )
                )}
              </Select>
            </FormField>
          </div>
        </div>
      </Modal>

{/* Modal de confirmación para bloquear o activar */}
{confirmToggle && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
      <h2 className="text-lg font-semibold text-gray-900">
        {confirmToggle.activo
          ? 'Bloquear estudiante'
          : 'Activar estudiante'}
      </h2>

      <p className="mt-3 text-sm text-gray-600">
        ¿Estás seguro de que deseas{' '}
        {confirmToggle.activo ? 'bloquear' : 'activar'} a{' '}
        <strong>
          {confirmToggle.nombres} {confirmToggle.apellidos}
        </strong>?
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setConfirmToggle(null)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={() => void handleCambiarEstado()}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
            confirmToggle.activo
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {confirmToggle.activo ? 'Bloquear' : 'Activar'}
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal de resultado */}
{statusDialog && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
      <div
        className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
          statusDialog.type === 'success'
            ? 'bg-green-100 text-green-600'
            : 'bg-red-100 text-red-600'
        }`}
      >
        {statusDialog.type === 'success' ? (
          <CheckCircle size={26} />
        ) : (
          <AlertCircle size={26} />
        )}
      </div>

      <h2 className="text-lg font-semibold text-gray-900">
        {statusDialog.type === 'success'
          ? 'Operación completada'
          : 'No se pudo completar'}
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        {statusDialog.message}
      </p>

      <button
        type="button"
        onClick={() => setStatusDialog(null)}
        className="mt-6 rounded-lg bg-[#173F35] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Aceptar
      </button>
    </div>
  </div>
)}


      {/* MODAL: CONFIRMAR ELIMINACIÓN DEFINITIVA */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar Estudiante?</h3>
              <p className="text-gray-600 text-sm">
                Estás a punto de eliminar definitivamente a <strong>{confirmDelete.nombres} {confirmDelete.apellidos}</strong> (CI: {confirmDelete.ci}). Se perderá su acceso y registro en el curso. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200">
              <button onClick={() => setConfirmDelete(null)} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
                Cancelar
              </button>
              <button onClick={handleDeleteDefinitivo} className="rounded-lg bg-red-600 hover:bg-red-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition flex items-center gap-2">
                <Trash2 size={16} /> Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    {/* MODAL: VER FICHA DEL ESTUDIANTE (PERFIL) */}
      {detailModalItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">

            {/* Cabecera / Portada */}
            <div className="relative h-24 bg-gradient-to-r from-blue-600 to-indigo-700">
              <div className="absolute top-4 right-4 flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold shadow-sm ${detailModalItem.activo ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {detailModalItem.activo ? 'ACTIVO' : 'BLOQUEADO'}
                </span>
                <button onClick={() => setDetailModalItem(null)} className="bg-black/20 hover:bg-black/40 text-white rounded-full p-1 backdrop-blur-md transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Cuerpo del Perfil */}
            <div className="px-6 pb-6 relative">
              {/* Foto de Perfil (Avatar) */}
              <div className="relative -mt-12 mb-4 flex justify-between items-end">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 shadow-md flex items-center justify-center overflow-hidden">
                  {/* Aquí validaremos en el futuro: detailModalItem.foto_perfil_url */}
                  {detailModalItem.foto_perfil_url ? (
                    <img src={detailModalItem.foto_perfil_url} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-slate-400">
                      {detailModalItem.nombres.charAt(0)}{detailModalItem.apellidos.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Etiqueta real de Suscripción PLUS / Gratis */}
                <div className="mb-2">
                  {esPlusVigente(detailModalItem) ? (
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Crown size={13} className="text-amber-600" />
                      PLUS Activo
                      {detailModalItem.plusHasta
                        ? ` · Hasta ${new Date(detailModalItem.plusHasta).toLocaleDateString('es-BO')}`
                        : ''}
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      Plan Gratis (Solo Demo)
                    </span>
                  )}
                </div>
              </div>

              {/* Info Personal */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800 leading-tight">
                  {detailModalItem.nombres} {detailModalItem.apellidos}
                </h3>
                <p className="text-sm font-medium text-blue-600">
                  CI: {detailModalItem.ci} | {detailModalItem.genero === 'M' ? 'Masculino' : 'Femenino'}
                </p>
              </div>

              {/* Datos Académicos */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Información Académica</h4>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs">Institución</p>
                    <p className="font-semibold text-slate-700">
                      {detailModalItem.unidadEducativa?.nombre ??
                        instituciones.find(i => i.id === detailModalItem.unidadEducativaId)?.nombre ??
                        'No asignada'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Curso</p>
                    <p className="font-semibold text-slate-700">
                      {(() => {
                        const curso = cursos.find(c => c.id === detailModalItem.cursoActualId);
                        if (!curso) return 'Sin asignar';

                        const nombreIncluyeParalelo = curso.paralelo && curso.nombre.trim().toLowerCase().endsWith(curso.paralelo.trim().toLowerCase());

                        return nombreIncluyeParalelo
                          ? curso.nombre
                          : `${curso.nombre} — Paralelo ${curso.paralelo || ''}`;
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Fecha de Nacimiento</p>
                    <p className="font-medium text-slate-700">
                      {detailModalItem.fechaNacimiento ? new Date(detailModalItem.fechaNacimiento).toLocaleDateString('es-BO', { timeZone: 'UTC' }) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Gestión</p>
                    <p className="font-medium text-slate-700">
                      {detailModalItem.gestion?.nombre
                        ? `${detailModalItem.gestion.nombre} ${detailModalItem.gestion.unidadEducativa?.nombre ? `- ${detailModalItem.gestion.unidadEducativa.nombre}` : ''}`
                        : (detailModalItem.gestionId ? 'Asignada' : '—')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de Tutores */}
              <div className="flex flex-col gap-2">
                {(() => {
                  const tutores = extraerTutores(detailModalItem);
                  if (tutores.length === 0) {
                    return (
                      <p className="text-sm text-slate-500 italic">
                        No hay tutores asignados para este estudiante.
                      </p>
                    );
                  }
                  return tutores.map((tutor: any, idx: number) => (
                    <div
                      key={tutor.id || idx}
                      className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          {tutor.nombres} {tutor.apellidos}
                          {tutor.esConvivente && (
                            <span
                              className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full"
                              title="Vive con el estudiante"
                            >
                              🏠
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          CI: {tutor.ci || 'N/A'} | Cel: {tutor.telefono || '—'}
                        </p>
                      </div>
                      <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded uppercase">
                        {tutor.parentesco}
                      </span>
                    </div>
                  ));
                })()}
              </div>

            </div>
          </div>
        </div>
      )}

    </>   
  );
}