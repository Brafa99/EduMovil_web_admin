import { useEffect, useState } from 'react';
import { Edit2, PowerOff, Power } from 'lucide-react';
import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import {
  FormField,
  Input,
  Select,
} from '../../components/ui/FormField';
import {
  getGestiones,
  createGestion,
  updateGestion,
} from '../../api/gestiones.api';
import { getInstituciones } from '../../api/instituciones.api';
import { useToast } from '../../hooks/useToast';
import type {
  GestionAcademica,
  UnidadEducativa,
} from '../../types';

const CURRENT_YEAR = new Date().getFullYear();

const EMPTY = {
  anio: CURRENT_YEAR,
  nombre: `Gestión ${CURRENT_YEAR}`,
  fechaInicio: '',
  fechaFin: '',
  activo: true,
  unidadEducativaId: '',
};

export default function Gestiones() {
  const { toast } = useToast();

  const [refresh, setRefresh] = useState(0);

  const [modal, setModal] = useState<{
    open: boolean;
    data?: GestionAcademica;
  }>({ open: false });

  const [form, setForm] =
    useState<typeof EMPTY>(EMPTY);

  const [saving, setSaving] = useState(false);

  const [confirmToggle, setConfirmToggle] =
    useState<GestionAcademica | null>(null);

  const [instituciones, setInstituciones] =
    useState<UnidadEducativa[]>([]);

  const [loadingInstituciones, setLoadingInstituciones] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadInstituciones() {
      setLoadingInstituciones(true);

      try {
        const response =
          await getInstituciones();

        if (!mounted) return;

        setInstituciones(response.data);
      } catch {
        if (mounted) {
          toast(
            'No se pudieron cargar las instituciones',
            'error'
          );
        }
      } finally {
        if (mounted) {
          setLoadingInstituciones(false);
        }
      }
    }

    loadInstituciones();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const handleSave = async () => {
    if (
      !form.unidadEducativaId ||
      !form.fechaInicio ||
      !form.fechaFin ||
      !form.anio
    ) {
      toast(
        'Completa los campos requeridos',
        'error'
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        anio: form.anio,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        activa: form.activo,
        unidadEducativaId:
          form.unidadEducativaId,
      };

      if (modal.data) {
        await updateGestion(
          modal.data.id,
          payload
        );

        toast(
          'Gestión actualizada',
          'success'
        );
      } else {
        await createGestion(payload);

        toast(
          'Gestión creada',
          'success'
        );
      }

      setModal({ open: false });
      setRefresh(r => r + 1);
    } catch {
      toast(
        'Error al guardar la gestión',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CrudPage<GestionAcademica>
        title="Gestiones Académicas"
        description="Períodos académicos por institución"
        refreshTrigger={refresh}
        fetchData={({ search }) =>
          getGestiones({ search })
        }
        keyExtractor={r => r.id}
        onAdd={() => {
          setForm(EMPTY);
          setModal({ open: true });
        }}
        addLabel="Nueva gestión"
        columns={[
          {
            key: 'nombre',
            label: 'Gestión',
            render: r => (
              <span className="font-semibold text-slate-700">
                {r.nombre}
              </span>
            ),
          },
          {
            key: 'anio',
            label: 'Año',
            render: r => (
              <span className="font-mono text-slate-600">
                {r.anio}
              </span>
            ),
          },
          {
            key: 'fechaInicio',
            label: 'Inicio',
            render: r =>
              r.fechaInicio
                ? new Date(
                    r.fechaInicio
                  ).toLocaleDateString(
                    'es-BO'
                  )
                : '—',
          },
          {
            key: 'fechaFin',
            label: 'Fin',
            render: r =>
              r.fechaFin
                ? new Date(
                    r.fechaFin
                  ).toLocaleDateString(
                    'es-BO'
                  )
                : '—',
          },
          {
            key: 'unidadEducativa',
            label: 'Institución',
            render: r =>
              r.unidadEducativa?.nombre ??
              instituciones.find(
                i =>
                  i.id ===
                  r.unidadEducativaId
              )?.nombre ??
              '—',
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
                    onClick: () => {
                      setForm({
                        anio: r.anio,
                        nombre: r.nombre,
                        fechaInicio:
                          r.fechaInicio,
                        fechaFin:
                          r.fechaFin,
                        activo: r.activo,
                        unidadEducativaId:
                          r.unidadEducativaId,
                      });

                      setModal({
                        open: true,
                        data: r,
                      });
                    },
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
          setModal({ open: false })
        }
        title={
          modal.data
            ? 'Editar gestión'
            : 'Nueva gestión'
        }
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
                saving ||
                loadingInstituciones
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
            label="Año"
            required
          >
            <Input
              type="number"
              value={form.anio}
              onChange={e => {
                const anio =
                  Number(
                    e.target.value
                  );

                setForm(f => ({
                  ...f,
                  anio,
                  nombre: `Gestión ${anio}`,
                }));
              }}
            />
          </FormField>

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
                }))
              }
              placeholder="Seleccionar institución"
              disabled={
                loadingInstituciones
              }
            >
              {instituciones
                .filter(i => i.activo)
                .map(i => (
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
              label="Fecha inicio"
              required
            >
              <Input
                type="date"
                value={
                  form.fechaInicio
                    ? form.fechaInicio.slice(
                        0,
                        10
                      )
                    : ''
                }
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    fechaInicio:
                      e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField
              label="Fecha fin"
              required
            >
              <Input
                type="date"
                value={
                  form.fechaFin
                    ? form.fechaFin.slice(
                        0,
                        10
                      )
                    : ''
                }
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    fechaFin:
                      e.target.value,
                  }))
                }
              />
            </FormField>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmToggle}
        onClose={() =>
          setConfirmToggle(null)
        }
        onConfirm={async () => {
          if (!confirmToggle) return;

          try {
            await updateGestion(
              confirmToggle.id,
              {
                activo:
                  !confirmToggle.activo,
              }
            );

            toast(
              'Estado actualizado',
              'success'
            );

            setRefresh(r => r + 1);
          } catch {
            toast(
              'Error al actualizar el estado',
              'error'
            );
          } finally {
            setConfirmToggle(null);
          }
        }}
        title="Cambiar estado"
        message={`¿Confirmas ${
          confirmToggle?.activo
            ? 'desactivar'
            : 'activar'
        } "${confirmToggle?.nombre}"?`}
        confirmLabel="Confirmar"
      />
    </>
  );
}