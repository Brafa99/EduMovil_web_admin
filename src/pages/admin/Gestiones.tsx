import { useEffect, useState } from 'react';
import { Edit2, PowerOff, Power, Trash2, X } from 'lucide-react';
import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { apiRequest } from '../../api/client';
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
const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-edumovil.onrender.com/api/v1';

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

  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const handleDeleteDefinitivo = async () => {
    if (!confirmDelete) return;

    try {
      // Como usamos tu apiRequest, el X-Usuario-Id se envía solo por detrás mágico
      await apiRequest(`/gestiones/${confirmDelete.id}`, {
        method: 'DELETE'
      });

      toast('Gestión eliminada correctamente', 'success');
      setRefresh(r => r + 1); // Recarga la tabla al instante
    } catch (error) {
      console.error(error);
      toast('Error al eliminar la gestión', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

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
                    label: r.activo ? 'Desactivar' : 'Activar',
                    icon: r.activo ? (
                      <PowerOff size={14} />
                    ) : (
                      <Power size={14} />
                    ),
                    onClick: () => setConfirmToggle(r),
                    variant: r.activo ? 'danger' : 'default',
                  },
                  {
                    // NUEVO BOTÓN
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
          // ⚠️ CAMBIO AQUÍ: Cambia 'activo' por 'activa'
          activa: !confirmToggle.activo,
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

      {/* MODAL: CONFIRMAR ELIMINACIÓN DEFINITIVA */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Gestión?</h3>
              <p className="text-slate-600 text-sm">
                Estás a punto de eliminar definitivamente la <strong>{confirmDelete.nombre}</strong>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-4 bg-slate-50 border-t border-slate-200">
              <button onClick={() => setConfirmDelete(null)} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium transition">
                Cancelar
              </button>
              <button onClick={handleDeleteDefinitivo} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm transition flex items-center gap-2">
                <Trash2 size={16} /> Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}