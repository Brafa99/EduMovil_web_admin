import { useEffect, useState } from 'react';
import { Edit2, PowerOff, Power, Eye } from 'lucide-react';
import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { getCursos, createCurso, updateCurso } from '../../api/cursos.api';
import { getInstituciones } from '../../api/instituciones.api';
import { getGestiones } from '../../api/gestiones.api';
import { getProfesores } from '../../api/profesores.api';
import { useToast } from '../../hooks/useToast';
import type { Curso, GestionAcademica, Profesor, UnidadEducativa } from '../../types';

const EMPTY = {
  nombre: '',
  paralelo: 'A',
  nivel: 'SECUNDARIA' as 'PRIMARIA' | 'SECUNDARIA',
  grado: 1,
  turno: 'mañana' as 'mañana' | 'tarde' | 'noche',
  gestionId: '',
  unidadEducativaId: '',
  profesorCiTutor: '',
  activo: true,
};

export default function Cursos() {
  const { toast } = useToast();

  const [refresh, setRefresh] = useState(0);
  const [modal, setModal] = useState<{ open: boolean; data?: Curso }>({ open: false });
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<Curso | null>(null);

  const [instituciones, setInstituciones] = useState<UnidadEducativa[]>([]);
  const [gestiones, setGestiones] = useState<GestionAcademica[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      setLoadingOptions(true);

      try {
        const [institucionesResponse, gestionesResponse, profesoresResponse] =
          await Promise.all([
            getInstituciones(),
            getGestiones(),
            getProfesores(),
          ]);

        if (!mounted) return;

        setInstituciones(institucionesResponse.data);
        setGestiones(gestionesResponse.data);
        setProfesores(profesoresResponse.data);
      } catch (error) {
        console.error('Error cargando opciones de cursos:', error);

        if (mounted) {
          toast('No se pudieron cargar las opciones del formulario', 'error');
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

  const gestionesFiltradas = gestiones.filter(
    gestion =>
      !form.unidadEducativaId ||
      gestion.unidadEducativaId === form.unidadEducativaId,
  );

  const profesoresFiltrados = profesores.filter(profesor => {
    if (!profesor.activo) return false;

    return (
      !form.unidadEducativaId ||
      profesor.unidadEducativaId === form.unidadEducativaId
    );
  });

  const handleSave = async () => {
    if (
  !form.grado ||
  !form.paralelo ||
  !form.turno ||
  !form.gestionId ||
  !form.unidadEducativaId
) {
  toast('Completa los campos requeridos', 'error');
  return;
}

    const gestionSeleccionada = gestiones.find(
      gestion => gestion.id === form.gestionId,
    );

    if (
      gestionSeleccionada &&
      gestionSeleccionada.unidadEducativaId !== form.unidadEducativaId
    ) {
      toast(
        'La gestión seleccionada no pertenece a la institución elegida',
        'error',
      );
      return;
    }

    const profesorSeleccionado = profesores.find(
      profesor => profesor.profesorCi === form.profesorCiTutor,
    );

    setSaving(true);

    

try {
  const nombre = generarNombreCurso(
    form.nivel,
    form.grado,
    form.paralelo,
  );

  const payload = {
    nombre,
    paralelo: form.paralelo,
    nivel: form.nivel,
    grado: form.grado,
    turno: form.turno,
    gestionId: form.gestionId,
    unidadEducativaId: form.unidadEducativaId,
    profesorCiTutor: profesorSeleccionado?.profesorCi ?? '',
  };

  if (modal.data) {
    await updateCurso(modal.data.id, payload);
    toast('Curso actualizado', 'success');
  } else {
    await createCurso({
      ...payload,
      activo: form.activo,
    });
    toast('Curso creado', 'success');
  }

  setModal({ open: false });
  setForm(EMPTY);
  setRefresh(r => r + 1);
} catch (error) {
  console.error('Error guardando curso:', error);
  toast('Error al guardar el curso', 'error');
} finally {
  setSaving(false);
}

  };

  const openEditModal = (curso: Curso) => {
  setForm({
    nombre: curso.nombre,
    paralelo: curso.paralelo || 'A',
    nivel: curso.nivel === 'PRIMARIA'
      ? 'PRIMARIA'
      : 'SECUNDARIA',
    grado: curso.grado ?? 1,
    turno:
      curso.turno === 'tarde' || curso.turno === 'noche'
        ? curso.turno
        : 'mañana',
    gestionId: curso.gestionId,
    unidadEducativaId: curso.unidadEducativaId,
    profesorCiTutor: curso.profesorCiTutor ?? '',
    activo: curso.activo,
  });

  setModal({
    open: true,
    data: curso,
  });
};

  return (
    <>
      <CrudPage<Curso>
        title="Cursos y Paralelos"
        description="Cursos activos por institución y gestión"
        refreshTrigger={refresh}
        fetchData={({ search }) => getCursos({ search }).then(r => r)}
        keyExtractor={r => r.id}
        onAdd={() => {
          setForm(EMPTY);
          setModal({ open: true });
        }}
        addLabel="Nuevo curso"
        columns={[
          {
            key: 'nombre',
            label: 'Curso',
            render: r => (
              <span className="font-semibold text-slate-700">
                {r.nombre}
              </span>
            ),
          },
          {
            key: 'paralelo',
            label: 'Paralelo',
            render: r => (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-700 text-sm font-bold">
                {r.paralelo}
              </span>
            ),
          },
          {
            key: 'unidadEducativa',
            label: 'Institución',
            render: r => (
              <span>
                {r.unidadEducativa?.nombre ??
                  instituciones.find(
                    institucion => institucion.id === r.unidadEducativaId,
                  )?.nombre ??
                  r.unidadEducativaId}
              </span>
            ),
          },
          {
            key: 'gestion',
            label: 'Gestión',
            render: r => (
              <span>
                {r.gestion?.nombre ??
                  gestiones.find(
                    gestion => gestion.id === r.gestionId,
                  )?.nombre ??
                  r.gestionId}
              </span>
            ),
          },
          {
            key: 'totalEstudiantes',
            label: 'Estudiantes',
            render: r => (
              <span className="font-semibold text-slate-700">
                {r.totalEstudiantes ?? 0}
              </span>
            ),
          },
          {
            key: 'activo',
            label: 'Estado',
            render: r => <StatusBadge activo={r.activo} />,
          },
          {
            key: 'actions',
            label: '',
            render: r => (
              <ActionsMenu
                items={[
                  {
                    label: 'Ver estudiantes',
                    icon: <Eye size={14} />,
                    onClick: () => {},
                  },
                  {
                    label: 'Editar',
                    icon: <Edit2 size={14} />,
                    onClick: () => openEditModal(r),
                  },
                  {
                    label: r.activo ? 'Desactivar' : 'Activar',
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
        onClose={() => {
          if (!saving) {
            setModal({ open: false });
          }
        }}
        title={modal.data ? 'Editar curso' : 'Nuevo curso'}
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setModal({ open: false })}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || loadingOptions}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          
<div className="grid grid-cols-2 gap-4">
  <FormField label="Ciclo educativo" required>
    <Select
      value={form.nivel}
      onChange={e =>
        setForm(f => ({
          ...f,
          nivel: e.target.value as 'PRIMARIA' | 'SECUNDARIA',
          grado: 1,
        }))
      }
    >
      <option value="PRIMARIA">Primaria</option>
      <option value="SECUNDARIA">Secundaria</option>
    </Select>
  </FormField>

  <FormField label="Grado" required>
    <Select
      value={String(form.grado)}
      onChange={e =>
        setForm(f => ({
          ...f,
          grado: Number(e.target.value),
        }))
      }
    >
      {[1, 2, 3, 4, 5, 6].map(grado => (
        <option key={grado} value={grado}>
          {grado}° de {form.nivel === 'PRIMARIA' ? 'Primaria' : 'Secundaria'}
        </option>
      ))}
    </Select>
  </FormField>

  <FormField label="Paralelo" required>
    <Select
      value={form.paralelo}
      onChange={e =>
        setForm(f => ({
          ...f,
          paralelo: e.target.value,
        }))
      }
    >
      {['A', 'B', 'C', 'D', 'E'].map(letra => (
        <option key={letra} value={letra}>
          {letra}
        </option>
      ))}
    </Select>
  </FormField>

  <FormField label="Turno" required>
    <Select
      value={form.turno}
      onChange={e =>
        setForm(f => ({
          ...f,
          turno: e.target.value as 'mañana' | 'tarde' | 'noche',
        }))
      }
    >
      <option value="mañana">Mañana</option>
      <option value="tarde">Tarde</option>
      <option value="noche">Noche</option>
    </Select>
  </FormField>
</div>

<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
  <p className="text-xs font-medium text-emerald-700">
    Nombre del curso generado
  </p>
  <p className="mt-1 text-lg font-bold text-emerald-900">
    {generarNombreCurso(
      form.nivel,
      form.grado,
      form.paralelo,
    )}
  </p>
  <p className="mt-1 text-sm text-emerald-700">
    Turno {form.turno}
  </p>
</div>
          <FormField label="Institución" required>
            <Select
              value={form.unidadEducativaId}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  unidadEducativaId: e.target.value,
                  gestionId: '',
                  profesorCiTutor: '',
                }))
              }
              placeholder={
                loadingOptions
                  ? 'Cargando instituciones...'
                  : 'Seleccionar institución'
              }
              disabled={loadingOptions}
            >
              {instituciones.map(institucion => (
                <option
                  key={institucion.id}
                  value={institucion.id}
                >
                  {institucion.nombre}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Gestión académica" required>
            <Select
              value={form.gestionId}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  gestionId: e.target.value,
                }))
              }
              placeholder={
                loadingOptions
                  ? 'Cargando gestiones...'
                  : 'Seleccionar gestión'
              }
              disabled={loadingOptions || !form.unidadEducativaId}
            >
              {gestionesFiltradas.map(gestion => (
                <option
                  key={gestion.id}
                  value={gestion.id}
                >
                  {gestion.nombre}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Docente tutor">
            <Select
              value={form.profesorCiTutor}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  profesorCiTutor: e.target.value,
                }))
              }
              placeholder={
                loadingOptions
                  ? 'Cargando docentes...'
                  : !form.unidadEducativaId
                    ? 'Primero selecciona una institución'
                    : 'Seleccionar docente (opcional)'
              }
              disabled={
                loadingOptions || !form.unidadEducativaId
              }
            >
              <option value="">Sin docente tutor</option>

              {profesoresFiltrados.map(profesor => (
                <option
                  key={profesor.profesorCi}
                  value={profesor.profesorCi}
                >
                  {profesor.nombres} {profesor.apellidos}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={async () => {
          if (!confirmToggle) return;

          try {
            await updateCurso(confirmToggle.id, {
              activo: !confirmToggle.activo,
            });

            toast('Estado actualizado', 'success');
            setRefresh(r => r + 1);
          } catch (error) {
            console.error('Error actualizando estado del curso:', error);
            toast('Error al actualizar el estado', 'error');
          } finally {
            setConfirmToggle(null);
          }
        }}
        title="Cambiar estado"
        message={`¿Cambiar estado de "${confirmToggle?.nombre} ${confirmToggle?.paralelo}"?`}
        confirmLabel="Confirmar"
      />
    </>
  );
}

function generarNombreCurso(
  nivel: 'PRIMARIA' | 'SECUNDARIA',
  grado: number,
  paralelo: string,
): string {
  const ciclo = nivel === 'PRIMARIA'
    ? 'Primaria'
    : 'Secundaria';

  return `${grado}° de ${ciclo} ${paralelo}`;
}