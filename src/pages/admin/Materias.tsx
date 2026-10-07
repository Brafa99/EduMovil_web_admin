import { useEffect, useState } from 'react';
import { Edit2, PowerOff, Power } from 'lucide-react';
import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';

import {
  getMaterias,
  createMateria,
  updateMateria,
} from '../../api/materias.api';

import { getCursos } from '../../api/cursos.api';
import { getProfesores } from '../../api/profesores.api';

import { useToast } from '../../hooks/useToast';
import type { Materia, Curso, Profesor } from '../../types';

const EMPTY = {
  nombre: '',
  cursoId: '',
  profesorCi: '',
  activo: true,
};

export default function Materias() {
  const { toast } = useToast();

  const [refresh, setRefresh] = useState(0);

  const [modal, setModal] = useState<{
    open: boolean;
    data?: Materia;
  }>({
    open: false,
  });

  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const [saving, setSaving] = useState(false);

  const [confirmToggle, setConfirmToggle] =
    useState<Materia | null>(null);

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(false);

  /**
   * Cargar cursos y profesores reales desde el backend.
   */
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);

      try {
        const [cursosResponse, profesoresResponse] =
          await Promise.all([
            getCursos(),
            getProfesores(),
          ]);

        setCursos(cursosResponse.data);
        setProfesores(profesoresResponse.data);
      } catch (error) {
        console.error('Error cargando cursos/profesores:', error);

        toast(
          'No se pudieron cargar cursos y docentes',
          'error'
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [toast]);

  /**
   * Obtener la unidad educativa correspondiente
   * al curso seleccionado.
   */
  const getUnidadEducativaIdFromCurso = (
    cursoId: string
  ): string | undefined => {
    const curso = cursos.find(c => c.id === cursoId);

    return curso?.unidadEducativaId;
  };

  /**
   * Crear o actualizar materia.
   */
  const handleSave = async () => {
    if (!form.nombre || !form.cursoId) {
      toast(
        'Nombre y curso son requeridos',
        'error'
      );

      return;
    }

    const unidadEducativaId =
      getUnidadEducativaIdFromCurso(form.cursoId);

    if (!unidadEducativaId) {
      toast(
        'No se pudo determinar la unidad educativa del curso',
        'error'
      );

      return;
    }

    setSaving(true);

    try {
      if (modal.data) {
        await updateMateria(
          modal.data.id,
          {
            nombre: form.nombre,
            cursoId: form.cursoId,
            profesorCi: form.profesorCi || undefined,
            activo: form.activo,
            unidadEducativaId,
          }
        );

        toast(
          'Materia actualizada',
          'success'
        );
      } else {
        await createMateria({
          nombre: form.nombre,
          cursoId: form.cursoId,
          profesorCi:
            form.profesorCi || undefined,
          activo: form.activo,
          unidadEducativaId,
        });

        toast(
          'Materia creada',
          'success'
        );
      }

      setModal({
        open: false,
      });

      setRefresh(r => r + 1);
    } catch (error) {
      console.error(
        'Error guardando materia:',
        error
      );

      toast(
        'Error al guardar la materia',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Abrir modal para crear.
   */
  const handleAdd = () => {
    setForm(EMPTY);

    setModal({
      open: true,
    });
  };

  /**
   * Abrir modal para editar.
   */
  const handleEdit = (materia: Materia) => {
    setForm({
      nombre: materia.nombre,
      cursoId: materia.cursoId,
      profesorCi:
        materia.profesorCi ?? '',
      activo: materia.activo,
    });

    setModal({
      open: true,
      data: materia,
    });
  };

  /**
   * Cambiar estado activo/inactivo.
   */
  const handleToggle = async () => {
    if (!confirmToggle) return;

    const unidadEducativaId =
      getUnidadEducativaIdFromCurso(
        confirmToggle.cursoId
      );

    if (!unidadEducativaId) {
      toast(
        'No se pudo determinar la unidad educativa',
        'error'
      );

      return;
    }

    try {
      await updateMateria(
        confirmToggle.id,
        {
          activo: !confirmToggle.activo,
          unidadEducativaId,
        }
      );

      toast(
        'Estado actualizado',
        'success'
      );

      setRefresh(r => r + 1);
      setConfirmToggle(null);
    } catch (error) {
      console.error(
        'Error actualizando estado:',
        error
      );

      toast(
        'No se pudo actualizar el estado',
        'error'
      );
    }
  };

  return (
    <>
      <CrudPage<Materia>
        title="Materias"
        description="Materias asignadas a cursos y docentes"
        refreshTrigger={refresh}
        fetchData={({ search }) =>
          getMaterias({ search }).then(r => r)
        }
        keyExtractor={r => r.id}
        onAdd={handleAdd}
        addLabel="Nueva materia"
        columns={[
          {
            key: 'nombre',
            label: 'Materia',
            render: r => (
              <span className="font-semibold text-slate-700">
                {r.nombre}
              </span>
            ),
          },

          {
            key: 'curso',
            label: 'Curso',
            render: r => {
              const curso = cursos.find(
                c => c.id === r.cursoId
              );

              if (curso) {
                return `${curso.nombre}`;
              }

              return r.curso?.nombre ?? r.cursoId;
            },
          },

          {
            key: 'profesor',
            label: 'Docente',
            render: r => {
              const profesor = profesores.find(
                p => p.profesorCi === r.profesorCi
              );

              if (profesor) {
                return `${profesor.nombres} ${profesor.apellidos}`;
              }

              if (r.profesor) {
                return `${r.profesor.nombres} ${r.profesor.apellidos}`;
              }

              return '—';
            },
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
                  {
                    label: 'Editar',
                    icon: <Edit2 size={14} />,
                    onClick: () =>
                      handleEdit(r),
                  },

                  {
                    label: r.activo
                      ? 'Desactivar'
                      : 'Activar',
                    icon: r.activo ? (
                      <PowerOff size={14} />
                    ) : (
                      <Power size={14} />
                    ),
                    onClick: () =>
                      setConfirmToggle(r),
                    variant: r.activo
                      ? 'danger'
                      : 'default',
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
          setModal({
            open: false,
          })
        }
        title={
          modal.data
            ? 'Editar materia'
            : 'Nueva materia'
        }
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() =>
                setModal({
                  open: false,
                })
              }
            >
              Cancelar
            </button>

            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={
                saving ||
                loadingOptions
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
          <FormField
            label="Nombre de la materia"
            required
          >
            <Input
              value={form.nombre}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  nombre: e.target.value,
                }))
              }
              placeholder="Matemáticas"
            />
          </FormField>

          <FormField
            label="Curso"
            required
          >
            <Select
              value={form.cursoId}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  cursoId: e.target.value,
                }))
              }
              placeholder={
                loadingOptions
                  ? 'Cargando cursos...'
                  : 'Seleccionar curso'
              }
              disabled={loadingOptions}
            >
              {cursos
                .filter(c => c.activo)
                .map(c => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.nombre}
                    {c.paralelo
                      ? ` — Paralelo ${c.paralelo}`
                      : ''}
                  </option>
                ))}
            </Select>
          </FormField>

          <FormField label="Docente responsable">
            <Select
              value={form.profesorCi}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  profesorCi: e.target.value,
                }))
              }
              placeholder={
                loadingOptions
                  ? 'Cargando docentes...'
                  : 'Seleccionar docente (opcional)'
              }
              disabled={loadingOptions}
            >
              {profesores
                .filter(p => p.activo)
                .map(p => (
                  <option
                    key={p.profesorCi}
                    value={p.profesorCi}
                  >
                    {p.nombres} {p.apellidos}
                  </option>
                ))}
            </Select>
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmToggle}
        onClose={() =>
          setConfirmToggle(null)
        }
        onConfirm={handleToggle}
        title="Cambiar estado"
        message={`¿Cambiar estado de "${confirmToggle?.nombre}"?`}
        confirmLabel="Confirmar"
      />
    </>
  );
}