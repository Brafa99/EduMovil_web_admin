import { useEffect, useState } from 'react';
import { Edit2, Eye, Trash2 } from 'lucide-react';

import { CrudPage } from '../../components/ui/CrudPage';
import { Badge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import {
  FormField,
  Input,
  Select,
} from '../../components/ui/FormField';

import {
  getPracticas,
  createPractica,
  updatePractica,
  deletePractica
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

  const [searchEstudiante, setSearchEstudiante] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Practica | null>(null);

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
  

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deletePractica(confirmDelete.id);
      toast('Reto eliminado exitosamente', 'success');
      setRefresh(r => r + 1);
    } catch (error) {
      console.error('Error eliminando:', error);
      toast('Error al eliminar el reto', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

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

  const openCreate = () => {
    setForm(EMPTY);
    setSearchEstudiante('');
    setModal({ open: true });
  };

  const openEdit = (practica: Practica) => {
    setForm({
      estudianteId: practica.estudianteId,
      materiaId: practica.materiaId,
      titulo: practica.titulo,
      descripcion: practica.descripcion ?? '',
      puntaje: practica.puntaje,
      fecha: practica.fecha.split('T')[0],
      estado: practica.estado,
    });
    setSearchEstudiante('');
    setModal({ open: true, data: practica });
  };

  const handleSave = async () => {
    if (!form.estudianteId) return toast('Selecciona un estudiante', 'error');
    if (!form.materiaId) return toast('Selecciona una materia', 'error');
    if (!form.titulo.trim()) return toast('Ingresa el título de la práctica', 'error');
    if (form.puntaje !== undefined && (form.puntaje < 0 || form.puntaje > 100)) {
      return toast('El puntaje debe estar entre 0 y 100', 'error');
    }

    const payload = {
      titulo: form.titulo.trim(),
      puntaje: form.puntaje ?? 0, // Aseguramos que envíe un número
      fecha: form.fecha,
      estudianteId: form.estudianteId,
      materiaId: form.materiaId,
      trimestre: 1 as 1 | 2 | 3, // El backend espera un número (1, 2 o 3)
    };

    setSaving(true);

    try {
      if (modal.data) {
        await updatePractica(modal.data.id, payload);
        toast('Práctica actualizada', 'success');
      } else {
        await createPractica(payload);
        toast('Práctica registrada', 'success');
      }

      setModal({ open: false });
      setForm(EMPTY);
      setRefresh(value => value + 1);
    } catch (error) {
      console.error('Error guardando práctica:', error);
      toast('Error al guardar la práctica', 'error');
    } finally {
      setSaving(false);
    }
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
        title="Misiones y Retos (Prácticas)"
        description="Asigna retos específicos para que los estudiantes ganen puntos adicionales jugando en la app."
        refreshTrigger={refresh}
        fetchData={() => getPracticas().then(response => response)}
        keyExtractor={row => row.id}
        onAdd={openCreate}
        addLabel="Nuevo Reto"
        columns={[
          {
            key: 'titulo',
            label: 'Misión',
            render: row => <span className="font-semibold text-slate-700">{row.titulo}</span>,
          },
          {
            key: 'estudiante',
            label: 'Estudiante',
            render: row => (
              <span className="text-sm">
                {row.estudiante ? `${row.estudiante.nombres} ${row.estudiante.apellidos}` : '—'}
              </span>
            ),
          },
          {
            key: 'materia',
            label: 'Materia',
            render: row => <span className="text-sm">{row.materia?.nombre ?? '—'}</span>,
          },
          {
            key: 'puntaje',
            label: 'Recompensa (XP)',
            render: row => (
              <span className="font-bold text-blue-600">
                {row.puntaje ? `+${row.puntaje} XP` : '—'}
              </span>
            ),
          },
          {
            key: 'estado',
            label: 'Estado',
            render: row => {
              // Forzamos a string para que TypeScript no arroje error de "no overlap"
              const estado = row.estado as string;
              return (
                <Badge variant={estado === 'completado' ? 'blue' : estado === 'revisado' ? 'green' : 'orange'}>
                  {estado === 'completado' ? 'Completado 🎯' : estado === 'revisado' ? 'Revisado ✅' : 'Pendiente ⏳'}
                </Badge>
              );
            },
          },
          {
            key: 'actions',
            label: '',
            render: row => (
              <ActionsMenu
                items={[
                  { label: 'Editar', icon: <Edit2 size={14} />, onClick: () => openEdit(row) },
                  { label: 'Eliminar', icon: <Trash2 size={14} />, onClick: () => setConfirmDelete(row), variant: 'danger' },
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
            <FormField label="Buscar y Seleccionar Estudiante" required>
              <Input
                placeholder="🔍 Escribir nombre o apellido..."
                value={searchEstudiante}
                onChange={e => setSearchEstudiante(e.target.value)}
                className="mb-2 text-sm"
                disabled={saving}
              />
              <Select
                value={form.estudianteId}
                onChange={event => setForm(current => ({ ...current, estudianteId: event.target.value }))}
                disabled={loadingOptions || saving}
              >
                <option value="" disabled>Seleccione de la lista filtrada...</option>
                {estudiantes
                  .filter(e => e.activo)
                  .filter(e => {
                    if (!searchEstudiante) return true;
                    const term = searchEstudiante.toLowerCase();
                    return (
                      e.nombres.toLowerCase().includes(term) ||
                      e.apellidos.toLowerCase().includes(term)
                    );
                  })
                  .map(estudiante => (
                    <option key={estudiante.id} value={estudiante.id}>
                      {estudiante.nombres} {estudiante.apellidos}
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
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Reto"
        message={`¿Estás seguro de eliminar el reto "${confirmDelete?.titulo}" asignado a este estudiante?`}
        confirmLabel="Sí, eliminar"
      />
    </>
  );
}