import { useEffect, useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
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
  getNotas,
  createNota,
  updateNota,
  deleteNota
} from '../../api/notas.api';

import { getEstudiantes } from '../../api/estudiantes.api';
import { getMaterias } from '../../api/materias.api';
import { getGestiones } from '../../api/gestiones.api';

import { useToast } from '../../hooks/useToast';

import type {
  Estudiante,
  Materia,
  GestionAcademica,
  Nota,
} from '../../types';

const ESTADO_COLORS = {
  aprobado: 'green',
  reprobado: 'red',
  pendiente: 'orange',
} as const;

const EMPTY = {
  estudianteId: '',
  materiaId: '',
  gestionId: '',
  trimestre: 1 as 1 | 2 | 3,
  puntaje: 0,
  estado: 'pendiente' as Nota['estado'],
  observacion: '',
};

type NotaForm = typeof EMPTY;

export default function Notas() {
  const { toast } = useToast();

  const [refresh, setRefresh] = useState(0);

  const [modal, setModal] = useState<{
    open: boolean;
    data?: Nota;
  }>({
    open: false,
  });

  const [form, setForm] = useState<NotaForm>(EMPTY);

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Nota | null>(null);
  const [searchEstudiante, setSearchEstudiante] = useState('');

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteNota(confirmDelete.id);const openCreate = () => {
    setForm(EMPTY);
    setSearchEstudiante(''); // <-- NUEVO
    setModal({ open: true });
  };
      toast('Registro eliminado exitosamente', 'success');
      setRefresh(r => r + 1);
    } catch (error) {
      console.error('Error eliminando:', error);
      toast('Error al eliminar el registro', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [gestiones, setGestiones] =
    useState<GestionAcademica[]>([]);

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  /*
   * Cargar los catálogos reales desde el backend.
   *
   * Ya no utilizamos:
   * ESTUDIANTES
   * MATERIAS
   * GESTIONES
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
          gestionesResponse,
        ] = await Promise.all([
          getEstudiantes(),
          getMaterias(),
          getGestiones(),
        ]);

        if (!mounted) return;

        setEstudiantes(
          estudiantesResponse.data ?? [],
        );

        setMaterias(
          materiasResponse.data ?? [],
        );

        setGestiones(
          gestionesResponse.data ?? [],
        );
      } catch (error) {
        console.error(
          'Error cargando datos para Notas:',
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

  /*
   * Cuando se selecciona un estudiante, podemos conocer
   * su curso actual y, si el curso tiene gestión, utilizar
   * esa gestión automáticamente.
   */
  const handleEstudianteChange = (
    estudianteId: string,
  ) => {
    setForm(current => {
      const estudiante = estudiantes.find(
        item => item.id === estudianteId,
      );

      const gestionId =
        estudiante?.gestionId ??
        current.gestionId;

      return {
        ...current,
        estudianteId,
        gestionId,
      };
    });
  };

  /*
   * Al cambiar la materia no hacemos suposiciones.
   * La materia solamente determina materiaId.
   */
  const handleMateriaChange = (
    materiaId: string,
  ) => {
    setForm(current => ({
      ...current,
      materiaId,
    }));
  };

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

    if (!form.gestionId) {
      toast(
        'Selecciona una gestión',
        'error',
      );
      return;
    }

    if (
      form.puntaje < 0 ||
      form.puntaje > 100
    ) {
      toast(
        'El puntaje debe estar entre 0 y 100',
        'error',
      );
      return;
    }

    const estudiante = estudiantes.find(
      item => item.id === form.estudianteId,
    );

    /*
     * El backend de Nota acepta cursoId opcional.
     *
     * Nuestro Estudiante tiene cursoActualId,
     * por lo que lo enviamos cuando está disponible.
     */
    const cursoId =
      estudiante?.cursoActualId;

    /*
     * El backend calcula notaLiteral automáticamente.
     *
     * Por eso NO enviamos:
     * - estado
     * - gestionId
     * - notaLiteral
     *
     * Esos son conceptos de presentación/relación
     * en el frontend.
     */
    const payload = {
      notaNumeral: form.puntaje,
      trimestre: form.trimestre === 1 ? ('T1' as const) : form.trimestre === 2 ? ('T2' as const) : ('T3' as const),
      observaciones: form.observacion.trim() || null,
      materiaId: form.materiaId,
      estudianteId: form.estudianteId,
      cursoId,
      unidadEducativaId: estudiante?.unidadEducativaId, // <-- ¡ESTO FALTABA Y CAUSABA EL ERROR!
    };

    setSaving(true);

    try {
      if (modal.data) {
        await updateNota(
          modal.data.id,
          payload,
        );

        toast(
          'Nota actualizada',
          'success',
        );
      } else {
        await createNota(payload);

        toast(
          'Nota registrada',
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
        'Error guardando nota:',
        error,
      );

      toast(
        'Error al guardar la nota',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setForm(EMPTY);
    setSearchEstudiante('');
    setModal({ open: true });
  };

  const openEdit = (nota: Nota) => {
    setForm({
      estudianteId:
        nota.estudianteId,
      materiaId:
        nota.materiaId,
      gestionId:
        nota.gestionId,
      trimestre:
        nota.trimestre,
      puntaje:
        nota.puntaje,
      estado:
        nota.estado,
      observacion:
        nota.observacion ?? '',
    });

    setModal({
      open: true,
      data: nota,
    });
  };

  const getNombreEstudiante = (
    nota: Nota,
  ) => {
    if (nota.estudiante) {
      return `${nota.estudiante.nombres} ${nota.estudiante.apellidos}`;
    }

    const estudiante =
      estudiantes.find(
        item =>
          item.id ===
          nota.estudianteId,
      );

    if (estudiante) {
      return `${estudiante.nombres} ${estudiante.apellidos}`;
    }

    return nota.estudianteId || '—';
  };

  const getNombreMateria = (
    nota: Nota,
  ) => {
    if (nota.materia?.nombre) {
      return nota.materia.nombre;
    }

    const materia =
      materias.find(
        item =>
          item.id === nota.materiaId,
      );

    return (
      materia?.nombre ??
      nota.materiaId ??
      '—'
    );
  };

  return (
    <>
      <CrudPage<Nota>
        title="Reporte de Rendimiento (Puntos Extra)"
        description="Visualiza los puntos ganados en juegos y misiones de IA. Úsalos como referencia para dar puntos extra en clase."
        refreshTrigger={refresh}
        fetchData={() => getNotas().then(response => response)}
        keyExtractor={row => row.id}
        onAdd={openCreate}
        addLabel="Registrar Puntos"
        columns={[
          {
            key: 'estudiante',
            label: 'Estudiante',
            render: row => <span className="font-semibold text-sm text-slate-700">{getNombreEstudiante(row)}</span>,
          },
          {
            key: 'materia',
            label: 'Materia',
            render: row => <span>{getNombreMateria(row)}</span>,
          },
          {
            key: 'trimestre',
            label: 'Trimestre',
            render: row => <span className="font-mono text-sm text-slate-500">{row.trimestre}° Trim.</span>,
          },
          {
            key: 'puntaje',
            label: 'Puntos de Juego',
            render: row => (
              <span className="font-bold text-lg" style={{ color: row.puntaje >= 51 ? '#8b5cf6' : '#f97316' }}>
                {row.puntaje} XP
              </span>
            ),
          },
          {
            key: 'estado',
            label: 'Nivel',
            render: row => (
              <Badge variant={row.puntaje >= 51 ? 'green' : 'orange'}>
                {row.puntaje >= 51 ? 'Logrado 🏆' : 'En Proceso 🏃'}
              </Badge>
            ),
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
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Reporte"
        message={`¿Estás seguro de eliminar este reporte de rendimiento?`}
        confirmLabel="Sí, eliminar"
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
            ? 'Editar nota'
            : 'Registrar nota'
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
          <FormField label="Buscar y Seleccionar Estudiante" required>
            <Input
              placeholder="🔍 Escribir nombre, apellido o CI para filtrar..."
              value={searchEstudiante}
              onChange={e => setSearchEstudiante(e.target.value)}
              className="mb-2 text-sm"
              disabled={saving}
            />
            <Select
              value={form.estudianteId}
              onChange={event => handleEstudianteChange(event.target.value)}
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
                    e.apellidos.toLowerCase().includes(term) ||
                    (e.ci && e.ci.toLowerCase().includes(term))
                  );
                })
                .map(estudiante => (
                  <option key={estudiante.id} value={estudiante.id}>
                    {estudiante.nombres} {estudiante.apellidos} {estudiante.ci ? ` — CI: ${estudiante.ci}` : ''}
                  </option>
                ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Materia"
              required
            >
              <Select
                value={
                  form.materiaId
                }
                onChange={event =>
                  handleMateriaChange(
                    event.target.value,
                  )
                }
                placeholder={
                  loadingOptions
                    ? 'Cargando materias...'
                    : 'Seleccionar materia'
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

            <FormField label="Gestión (Año Académico)" required>
              <Select
                value={form.gestionId}
                onChange={event => setForm(current => ({ ...current, gestionId: event.target.value }))}
                placeholder={loadingOptions ? 'Cargando gestiones...' : 'Seleccionar gestión'}
                disabled={loadingOptions || saving}
              >
                {/* <option value="" disabled>Seleccionar gestión...</option> */}
                {gestiones.map(gestion => (
                  <option key={gestion.id} value={gestion.id}>
                    {gestion.nombre || `Gestión ${gestion.anio}`} {gestion.unidadEducativa?.nombre ? ` - ${gestion.unidadEducativa.nombre}` : ''}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Trimestre">
              <Select
                value={
                  form.trimestre
                }
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    trimestre:
                      Number(
                        event.target
                          .value,
                      ) as
                        | 1
                        | 2
                        | 3,
                  }))
                }
                disabled={saving}
              >
                <option value={1}>
                  1° Trimestre
                </option>

                <option value={2}>
                  2° Trimestre
                </option>

                <option value={3}>
                  3° Trimestre
                </option>
              </Select>
            </FormField>

            <FormField label="Puntaje (0–100)">
              <Input
                type="number"
                min={0}
                max={100}
                value={
                  form.puntaje
                }
                onChange={event => {
                  const value =
                    Math.min(
                      100,
                      Math.max(
                        0,
                        Number(
                          event.target
                            .value,
                        ),
                      ),
                    );

                  setForm(current => ({
                    ...current,
                    puntaje:
                      value,
                    estado:
                      value >= 51
                        ? 'aprobado'
                        : 'reprobado',
                  }));
                }}
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
                        .value as Nota['estado'],
                  }))
                }
                disabled={saving}
              >
                <option value="aprobado">
                  Aprobado
                </option>

                <option value="reprobado">
                  Reprobado
                </option>

                <option value="pendiente">
                  Pendiente
                </option>
              </Select>
            </FormField>
          </div>

          <FormField label="Observación">
            <Input
              value={
                form.observacion
              }
              onChange={event =>
                setForm(current => ({
                  ...current,
                  observacion:
                    event.target
                      .value,
                }))
              }
              placeholder="Observación opcional..."
              disabled={saving}
            />
          </FormField>
        </div>
      </Modal>
      
    </>
  );
}