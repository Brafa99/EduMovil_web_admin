import { useEffect, useState } from 'react';
import { Edit2, PowerOff, Power, Eye, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { CrudPage } from '../../components/ui/CrudPage';
import { Badge, StatusBadge} from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
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
            render: r => (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-400">
                No disponible
              </span>
            ),
          },
          {
            key: 'activo',
            label: 'Estado',
            render: r => (
              <StatusBadge activo={r.activo} />
            ),
          },
          {
            key: 'actions',
            label: '',
            render: r => (
              <ActionsMenu
                items={[
               
               /*   
               
               {
                    label: 'Ver detalle',
                    icon: <Eye size={14} />,
                    onClick: () => {},
                  },

               */

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
  label: r.activo ? 'Bloquear' : 'Activar',
  icon: r.activo ? (
    <PowerOff size={14} />
  ) : (
    <Power size={14} />
  ),
  onClick: () => setConfirmToggle(r),
  variant: r.activo ? 'danger' : 'default',
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
                    gestionId:
                      e.target.value,
                    cursoActualId: '',
                  }))
                }
                placeholder="Seleccionar gestión"
                disabled={loadingOptions}
              >
                {gestionesFiltradas.map(
                  g => (
                    <option
                      key={g.id}
                      value={g.id}
                    >
                      {g.nombre}
                    </option>
                  )
                )}
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
    </>   
  );
}