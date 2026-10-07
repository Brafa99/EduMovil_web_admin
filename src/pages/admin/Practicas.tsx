import { useEffect, useState } from 'react';
import { Edit2, Eye } from 'lucide-react';

import { CrudPage } from '../../components/ui/CrudPage';
import { Badge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal } from '../../components/ui/Modal';
import {
  FormField,
  Input,
  Select,
} from '../../components/ui/FormField';

import {
  getPracticas,
  createPractica,
  updatePractica,
} from '../../api/practicas.api';

import { getEstudiantes } from '../../api/estudiantes.api';
import { getMaterias } from '../../api/materias.api';

import { useToast } from '../../hooks/useToast';

import type {
  Estudiante,
  Materia,
  Practica,
} from '../../types';

const ESTADO_COLORS = {
  revisado: 'green',
  completado: 'blue',
  pendiente: 'orange',
} as const;

const EMPTY = {
  estudianteId: '',
  materiaId: '',
  titulo: '',
  descripcion: '',
  puntaje: undefined as number | undefined,
  fecha: new Date()
    .toISOString()
    .split('T')[0],
  estado:
    'pendiente' as Practica['estado'],
};

type PracticaForm = typeof EMPTY;

export default function Practicas() {
  const { toast } = useToast();

  const [refresh, setRefresh] = useState(0);

  const [modal, setModal] = useState<{
    open: boolean;
    data?: Practica;
  }>({
    open: false,
  });

  const [form, setForm] =
    useState<PracticaForm>(EMPTY);

  const [saving, setSaving] =
    useState(false);

  const [estudiantes, setEstudiantes] =
    useState<Estudiante[]>([]);

  const [materias, setMaterias] =
    useState<Materia[]>([]);

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  /*
   * Cargamos estudiantes y materias reales
   * desde el backend.
   *
   * Ya no utilizamos:
   * ESTUDIANTES
   * MATERIAS
   * desde mocks/data.
   */
  useEffect(() => {
    let mounted = true;

    const loadOptions = async () => {
      setLoadingOptions(true);

      try {
        const [
          estudiantesResponse,
          materiasResponse,
        ] = await Promise.all([
          getEstudiantes(),
          getMaterias(),
        ]);

        if (!mounted) return;

        setEstudiantes(
          estudiantesResponse.data ?? [],
        );

        setMaterias(
          materiasResponse.data ?? [],
        );
      } catch (error) {
        console.error(
          'Error cargando datos para Prácticas:',
          error,
        );

        if (mounted) {
          toast(
            'No se pudieron cargar los datos auxiliares',
            'error',
          );
        }
      } finally {
        if (mounted) {
          setLoadingOptions(false);
        }
      }
    };

    void loadOptions();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const handleSave = async () => {
    if (!form.estudianteId) {
      toast(
        'Selecciona un estudiante',
        'error',
      );
      return;
    }

    if (!form.materiaId) {
      toast(
        'Selecciona una materia',
        'error',
      );
      return;
    }

    if (!form.titulo.trim()) {
      toast(
        'Ingresa el título de la práctica',
        'error',
      );
      return;
    }

    if (
      form.puntaje !== undefined &&
      (form.puntaje < 0 ||
        form.puntaje > 100)
    ) {
      toast(
        'El puntaje debe estar entre 0 y 100',
        'error',
      );
      return;
    }

    /*
     * El backend de Practica actualmente maneja:
     *
     * titulo
     * puntaje
     * puntajeMax
     * fecha
     * estudianteId
     * materiaId
     * trimestre
     *
     * No maneja:
     * descripcion
     * estado
     *
     * Por eso no enviamos esos dos últimos
     * al backend.
     *
     * Como la UI actual tampoco tiene selector
     * de trimestre, usamos T1 por defecto.
     */
    const payload = {
      titulo: form.titulo.trim(),
      puntaje: form.puntaje,
      fecha: form.fecha,
      estudianteId:
        form.estudianteId,
      materiaId:
        form.materiaId,
      trimestre: 'T1' as const,
    };

    setSaving(true);

    try {
      if (modal.data) {
        await updatePractica(
          modal.data.id,
          payload,
        );

        toast(
          'Práctica actualizada',
          'success',
        );
      } else {
        await createPractica(payload);

        toast(
          'Práctica registrada',
          'success',
        );
      }

      setModal({
        open: false,
      });

      setForm(EMPTY);

      setRefresh(value => value + 1);
    } catch (error) {
      console.error(
        'Error guardando práctica:',
        error,
      );

      toast(
        'Error al guardar la práctica',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setForm(EMPTY);

    setModal({
      open: true,
    });
  };

  const openEdit = (
    practica: Practica,
  ) => {
    setForm({
      estudianteId:
        practica.estudianteId,
      materiaId:
        practica.materiaId,
      titulo:
        practica.titulo,
      descripcion:
        practica.descripcion ?? '',
      puntaje:
        practica.puntaje,
      fecha:
        practica.fecha
          ? practica.fecha.split('T')[0]
          : new Date()
              .toISOString()
              .split('T')[0],
      estado:
        practica.estado,
    });

    setModal({
      open: true,
      data: practica,
    });
  };

  const getNombreEstudiante = (
    practica: Practica,
  ) => {
    if (practica.estudiante) {
      return `${practica.estudiante.nombres} ${practica.estudiante.apellidos}`;
    }

    const estudiante =
      estudiantes.find(
        item =>
          item.id ===
          practica.estudianteId,
      );

    if (estudiante) {
      return `${estudiante.nombres} ${estudiante.apellidos}`;
    }

    return (
      practica.estudianteId ||
      '—'
    );
  };

  const getNombreMateria = (
    practica: Practica,
  ) => {
    if (practica.materia?.nombre) {
      return practica.materia.nombre;
    }

    const materia =
      materias.find(
        item =>
          item.id ===
          practica.materiaId,
      );

    return (
      materia?.nombre ??
      practica.materiaId ??
      '—'
    );
  };

  return (
    <>
      <CrudPage<Practica>
        title="Prácticas"
        description="Registro de prácticas y trabajos"
        refreshTrigger={refresh}
        fetchData={() =>
          getPracticas().then(
            response => response,
          )
        }
        keyExtractor={row => row.id}
        onAdd={openCreate}
        addLabel="Registrar práctica"
        columns={[
          {
            key: 'titulo',
            label: 'Título',
            render: row => (
              <span className="font-semibold text-sm text-slate-700">
                {row.titulo}
              </span>
            ),
          },

          {
            key: 'estudiante',
            label: 'Estudiante',
            render: row => (
              <span>
                {getNombreEstudiante(
                  row,
                )}
              </span>
            ),
          },

          {
            key: 'materia',
            label: 'Materia',
            render: row => (
              <span>
                {getNombreMateria(
                  row,
                )}
              </span>
            ),
          },

          {
            key: 'puntaje',
            label: 'Puntaje',
            render: row =>
              row.puntaje != null ? (
                <span className="font-bold text-slate-700">
                  {row.puntaje}
                </span>
              ) : (
                <span className="text-slate-400">
                  —
                </span>
              ),
          },

          {
            key: 'fecha',
            label: 'Fecha',
            render: row => {
              if (!row.fecha) {
                return '—';
              }

              const date =
                new Date(
                  row.fecha,
                );

              return Number.isNaN(
                date.getTime(),
              )
                ? '—'
                : date.toLocaleDateString(
                    'es-BO',
                  );
            },
          },

          {
            key: 'estado',
            label: 'Estado',
            render: row => (
              <Badge
                variant={
                  ESTADO_COLORS[
                    row.estado
                  ]
                }
              >
                {row.estado
                  .charAt(0)
                  .toUpperCase() +
                  row.estado.slice(1)}
              </Badge>
            ),
          },

          {
            key: 'actions',
            label: '',
            render: row => (
              <ActionsMenu
                items={[
                  {
                    label:
                      'Ver detalle',
                    icon: (
                      <Eye size={14} />
                    ),
                    onClick: () => {
                      /*
                       * Se conserva la acción
                       * visualmente por ahora.
                       * Podemos implementar el
                       * detalle posteriormente.
                       */
                    },
                  },
                  {
                    label: 'Editar',
                    icon: (
                      <Edit2 size={14} />
                    ),
                    onClick: () =>
                      openEdit(row),
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
            ? 'Editar práctica'
            : 'Registrar práctica'
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
              disabled={saving}
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
            label="Título"
            required
          >
            <Input
              value={form.titulo}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  titulo:
                    event.target
                      .value,
                }))
              }
              placeholder="Análisis literario..."
              disabled={saving}
            />
          </FormField>

          <FormField label="Descripción">
            <Input
              value={
                form.descripcion
              }
              onChange={event =>
                setForm(current => ({
                  ...current,
                  descripcion:
                    event.target
                      .value,
                }))
              }
              placeholder="Descripción breve..."
              disabled={saving}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Estudiante"
              required
            >
              <Select
                value={
                  form.estudianteId
                }
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    estudianteId:
                      event.target
                        .value,
                  }))
                }
                placeholder={
                  loadingOptions
                    ? 'Cargando estudiantes...'
                    : 'Seleccionar'
                }
                disabled={
                  loadingOptions ||
                  saving
                }
              >
                {estudiantes
                  .filter(
                    estudiante =>
                      estudiante.activo,
                  )
                  .map(estudiante => (
                    <option
                      key={
                        estudiante.id
                      }
                      value={
                        estudiante.id
                      }
                    >
                      {
                        estudiante.nombres
                      }{' '}
                      {
                        estudiante.apellidos
                      }
                    </option>
                  ))}
              </Select>
            </FormField>

            <FormField
              label="Materia"
              required
            >
              <Select
                value={
                  form.materiaId
                }
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    materiaId:
                      event.target
                        .value,
                  }))
                }
                placeholder={
                  loadingOptions
                    ? 'Cargando materias...'
                    : 'Seleccionar'
                }
                disabled={
                  loadingOptions ||
                  saving
                }
              >
                {materias
                  .filter(
                    materia =>
                      materia.activo,
                  )
                  .map(materia => (
                    <option
                      key={
                        materia.id
                      }
                      value={
                        materia.id
                      }
                    >
                      {
                        materia.nombre
                      }
                    </option>
                  ))}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Fecha">
              <Input
                type="date"
                value={form.fecha}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    fecha:
                      event.target
                        .value,
                  }))
                }
                disabled={saving}
              />
            </FormField>

            <FormField label="Puntaje">
              <Input
                type="number"
                min={0}
                max={100}
                value={
                  form.puntaje ??
                  ''
                }
                onChange={event => {
                  const raw =
                    event.target
                      .value;

                  const value =
                    raw === ''
                      ? undefined
                      : Math.min(
                          100,
                          Math.max(
                            0,
                            Number(raw),
                          ),
                        );

                  setForm(current => ({
                    ...current,
                    puntaje:
                      value,
                  }));
                }}
                placeholder="—"
                disabled={saving}
              />
            </FormField>

            <FormField label="Estado">
              <Select
                value={
                  form.estado
                }
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    estado:
                      event.target
                        .value as Practica['estado'],
                  }))
                }
                disabled={saving}
              >
                <option value="pendiente">
                  Pendiente
                </option>

                <option value="completado">
                  Completado
                </option>

                <option value="revisado">
                  Revisado
                </option>
              </Select>
            </FormField>
          </div>
        </div>
      </Modal>
    </>
  );
}