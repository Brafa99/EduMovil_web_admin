import { useEffect, useState } from 'react';
import { Edit2, PowerOff, Power } from 'lucide-react';
import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import {
  getProfesores,
  createProfesor,
  updateProfesor,
} from '../../api/profesores.api';
import { getInstituciones } from '../../api/instituciones.api';
import { useToast } from '../../hooks/useToast';
import type { Profesor, UnidadEducativa } from '../../types';

const EMPTY = {
  profesorCi: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  email: '',
  activo: true,
  unidadEducativaId: '',
};

export default function Profesores() {
  const { toast } = useToast();

  const [refresh, setRefresh] = useState(0);

  const [modal, setModal] = useState<{
    open: boolean;
    data?: Profesor;
  }>({
    open: false,
  });

  const [form, setForm] =
    useState<typeof EMPTY>(EMPTY);

  const [saving, setSaving] = useState(false);

  const [confirmToggle, setConfirmToggle] =
    useState<Profesor | null>(null);

  const [instituciones, setInstituciones] =
    useState<UnidadEducativa[]>([]);

  const [loadingInstituciones, setLoadingInstituciones] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadInstituciones() {
      setLoadingInstituciones(true);

      try {
        const response = await getInstituciones();

        if (!mounted) return;

        setInstituciones(response.data);
      } catch (error) {
        console.error(
          'Error cargando instituciones:',
          error,
        );

        if (mounted) {
          toast(
            'No se pudieron cargar las instituciones',
            'error',
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
    !form.profesorCi ||
    !form.nombres ||
    !form.apellidos ||
    !form.unidadEducativaId
  ) {
    toast('Completa todos los campos requeridos', 'error');
    return;
  }

  setSaving(true);

  try {
    if (modal.data) {
      await updateProfesor(
        modal.data.id,
        form,
      );

      toast('Docente actualizado', 'success');
    } else {
      await createProfesor(form);

      toast('Docente creado', 'success');
    }

    setModal({ open: false });
    setForm(EMPTY);
    setRefresh(r => r + 1);
  } catch (error) {
    console.error('Error guardando profesor:', error);
    toast('Error al guardar el docente', 'error');
  } finally {
    setSaving(false);
  }
};

  const openEditModal = (
    profesor: Profesor,
  ) => {
    setForm({
      profesorCi: profesor.profesorCi,
      nombres: profesor.nombres,
      apellidos: profesor.apellidos,
      telefono: profesor.telefono ?? '',
      email: profesor.email ?? '',
      activo: profesor.activo,
      unidadEducativaId:
        profesor.unidadEducativaId,
    });

    setModal({
      open: true,
      data: profesor,
    });
  };

  return (
    <>
      <CrudPage<Profesor>
        title="Profesores"
        description="Cuerpo docente registrado en el sistema"
        refreshTrigger={refresh}
        fetchData={({ search }) =>
          getProfesores({ search }).then(
            r => r,
          )
        }
        keyExtractor={r => r.profesorCi}
        onAdd={() => {
          setForm(EMPTY);
          setModal({ open: true });
        }}
        addLabel="Nuevo docente"
        columns={[
          {
            key: 'ci',
            label: 'CI',
            render: r => (
              <span className="font-mono text-xs bg-slate-50 px-2 py-1 rounded">
                {r.profesorCi}
              </span>
            ),
          },

          {
            key: 'nombre',
            label: 'Nombre',
            render: r => (
              <div>
                <p className="font-semibold text-slate-700 text-sm">
                  {r.nombres} {r.apellidos}
                </p>

                <p className="text-xs text-slate-400">
                  {r.email ?? '—'}
                </p>
              </div>
            ),
          },

          {
            key: 'telefono',
            label: 'Teléfono',
            render: r =>
              r.telefono ?? '—',
          },

          {
            key: 'institucion',
            label: 'Institución',
            render: r => (
              <span>
                {r.unidadEducativa?.nombre ??
                  instituciones.find(
                    institucion =>
                      institucion.id ===
                      r.unidadEducativaId,
                  )?.nombre ??
                  '—'}
              </span>
            ),
          },

          {
            key: 'activo',
            label: 'Estado',
            render: r => (
              <StatusBadge
                activo={r.activo}
              />
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
                    icon: (
                      <Edit2 size={14} />
                    ),
                    onClick: () =>
                      openEditModal(r),
                  },

                  {
                    label: r.activo
                      ? 'Desactivar'
                      : 'Activar',
                    icon: r.activo ? (
                      <PowerOff
                        size={14}
                      />
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
        onClose={() => {
          if (!saving) {
            setModal({
              open: false,
            });
          }
        }}
        title={
          modal.data
            ? 'Editar docente'
            : 'Nuevo docente'
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
            label="CI (Cédula de Identidad)"
            required
            hint="No puede modificarse después de creado"
          >
            <Input
              value={form.profesorCi}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  profesorCi:
                    e.target.value,
                }))
              }
              placeholder="1234567"
              disabled={!!modal.data}
            />
          </FormField>

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

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Teléfono">
              <Input
                value={form.telefono}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    telefono:
                      e.target.value,
                  }))
                }
                placeholder="71234567"
              />
            </FormField>

            <FormField label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    email:
                      e.target.value,
                  }))
                }
                placeholder="docente@colegio.edu.bo"
              />
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
                }))
              }
              placeholder={
                loadingInstituciones
                  ? 'Cargando instituciones...'
                  : 'Seleccionar institución'
              }
              disabled={
                loadingInstituciones
              }
            >
              {instituciones.map(
                institucion => (
                  <option
                    key={institucion.id}
                    value={institucion.id}
                  >
                    {institucion.nombre}
                  </option>
                ),
              )}
            </Select>
          </FormField>
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
            await updateProfesor(
              confirmToggle.profesorCi,
              {
                activo:
                  !confirmToggle.activo,
              },
            );

            toast(
              'Estado actualizado',
              'success',
            );

            setRefresh(
              r => r + 1,
            );
          } catch (error) {
            console.error(
              'Error actualizando estado:',
              error,
            );

            toast(
              'Error al actualizar el estado',
              'error',
            );
          } finally {
            setConfirmToggle(null);
          }
        }}
        title="Cambiar estado"
        message={`¿Cambiar estado de ${confirmToggle?.nombres} ${confirmToggle?.apellidos}?`}
        confirmLabel="Confirmar"
      />
    </>
  );
}