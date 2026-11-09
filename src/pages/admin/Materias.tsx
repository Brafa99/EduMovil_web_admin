import { useEffect, useState } from 'react';
import { Edit2, PowerOff, Power, Globe } from 'lucide-react';
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
// NUEVO: Importamos la API del catálogo global (deberás crear este archivo si no existe)
import { getCatalogosMateria } from '../../api/catalogo.api'; 

import { useToast } from '../../hooks/useToast';
import type { Materia, Curso, Profesor, CatalogoMateria } from '../../types'; // Añadido CatalogoMateria

const EMPTY = {
  nombre: '',
  cursoId: '',
  profesorCi: '',
  catalogoMateriaId: '', // NUEVO: Enlace con la IA
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
  const [catalogos, setCatalogos] = useState<CatalogoMateria[]>([]); // NUEVO: Estado para el catálogo

  const [loadingOptions, setLoadingOptions] = useState(false);

  /**
   * Cargar cursos, profesores y CATÁLOGOS reales desde el backend.
   */
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);

      try {
        const [cursosResponse, profesoresResponse, catalogosResponse] =
          await Promise.all([
            getCursos(),
            getProfesores(),
            getCatalogosMateria(), // NUEVO: Llamada al backend
          ]);

        setCursos(cursosResponse.data);
        setProfesores(profesoresResponse.data);
        setCatalogos(catalogosResponse.data);
      } catch (error) {
        console.error('Error cargando dependencias:', error);
        toast('No se pudieron cargar cursos, docentes o catálogos', 'error');
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [toast]);

  /**
   * Obtener la unidad educativa correspondiente al curso seleccionado.
   */
  const getUnidadEducativaIdFromCurso = (
    cursoId: string
  ): string | undefined => {
    const curso = cursos.find(c => c.id === cursoId);
    return curso?.unidadEducativaId;
  };

  /**
   * Crear o actualizar materia institucional.
   */
  const handleSave = async () => {
    // Validamos que el catálogo esté seleccionado
    if (!form.nombre || !form.cursoId || !form.catalogoMateriaId) {
      toast('Nombre, curso y catálogo global son requeridos', 'error');
      return;
    }

    const unidadEducativaId = getUnidadEducativaIdFromCurso(form.cursoId);

    if (!unidadEducativaId) {
      toast('No se pudo determinar la unidad educativa del curso', 'error');
      return;
    }

    setSaving(true);

    try {
      if (modal.data) {
        await updateMateria(
          modal.data.id,
          {
            nombre: form.nombre, // Asegúrate que el backend reciba 'nombreMateria' o 'nombre' según tu DTO
            cursoId: form.cursoId,
            profesorCi: form.profesorCi || undefined,
            catalogoMateriaId: form.catalogoMateriaId, // NUEVO: Enviamos el enlace
            activo: form.activo,
            unidadEducativaId,
          }
        );
        toast('Materia actualizada', 'success');
      } else {
        await createMateria({
          nombre: form.nombre.trim(),
          cursoId: form.cursoId,
          // Si profesorCi está vacío, enviamos undefined para que la BD no busque una clave foránea inexistente
          profesorCi: form.profesorCi && form.profesorCi.trim() !== '' ? form.profesorCi : undefined,
          catalogoMateriaId: form.catalogoMateriaId,
          activo: form.activo,
          unidadEducativaId,
        });
        toast('Materia creada', 'success');
      }

      setModal({ open: false });
      setRefresh(r => r + 1);
    } catch (error) {
      console.error('Error guardando materia:', error);
      toast('Error al guardar la materia', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    setForm(EMPTY);
    setModal({ open: true });
  };

  const handleEdit = (materia: Materia) => {
    setForm({
      nombre: materia.nombre || materia.nombre || '', 
      cursoId: materia.cursoId ?? '',
      profesorCi: materia.profesorCi ?? '',
      catalogoMateriaId: materia.catalogoMateriaId ?? '', // NUEVO: Recuperar el enlace
      activo: materia.activo,
    });

    setModal({
      open: true,
      data: materia,
    });
  };

  const handleToggle = async () => {
    if (!confirmToggle) return;

    const unidadEducativaId = getUnidadEducativaIdFromCurso(confirmToggle.cursoId);

    if (!unidadEducativaId) {
      toast('No se pudo determinar la unidad educativa', 'error');
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
      toast('Estado actualizado', 'success');
      setRefresh(r => r + 1);
      setConfirmToggle(null);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast('No se pudo actualizar el estado', 'error');
    }
  };

  return (
    <>
      <CrudPage<Materia>
        title="Materias del Colegio"
        description="Asigna materias a los cursos y vincúlalas al catálogo global de contenido."
        refreshTrigger={refresh}
        fetchData={({ search }) => getMaterias({ search }).then(r => r)}
        keyExtractor={r => r.id}
        onAdd={handleAdd}
        addLabel="Nueva materia"
        columns={[
          {
            key: 'nombre',
            label: 'Materia',
            render: r => (
              <span className="font-semibold text-slate-700">
                {r.nombre || r.nombre}
              </span>
            ),
          },
          {
            key: 'curso',
            label: 'Curso',
            render: r => {
              const curso = cursos.find(c => c.id === r.cursoId);
              return curso ? `${curso.nombre}` : '—';
            },
          },
          {
            key: 'catalogo',
            label: 'Catálogo Vinculado',
            render: r => {
              const catalogo = catalogos.find(c => c.id === r.catalogoMateriaId);
              return catalogo ? (
                <span className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-max">
                  <Globe size={12} />
                  {catalogo.nombre}
                </span>
              ) : (
                <span className="text-red-500 text-sm">Sin vincular</span>
              );
            },
          },
          {
            key: 'profesor',
            label: 'Docente',
            render: r => {
              const profesor = profesores.find(p => p.profesorCi === r.profesorCi);
              return profesor ? `${profesor.nombres} ${profesor.apellidos}` : '—';
            },
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
                    label: 'Editar',
                    icon: <Edit2 size={14} />,
                    onClick: () => handleEdit(r),
                  },
                  {
                    label: r.activo ? 'Desactivar' : 'Activar',
                    icon: r.activo ? <PowerOff size={14} /> : <Power size={14} />,
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
        onClose={() => setModal({ open: false })}
        title={modal.data ? 'Editar materia' : 'Nueva materia'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal({ open: false })}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || loadingOptions}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          
          <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-2 border border-blue-100">
            <strong>Paso clave:</strong> Vincular esta materia local con un Catálogo Global permite que los alumnos hereden automáticamente los temas, juegos y contenido generado por IA.
          </div>

          <FormField label="Nombre de la materia local (Ej. Lenguaje)" required>
            <Input
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Lenguaje y Comunicación"
            />
          </FormField>

          <FormField label="Vincular a Catálogo Global (Contenido e IA)" required>
            <Select
              value={form.catalogoMateriaId}
              onChange={e => setForm(f => ({ ...f, catalogoMateriaId: e.target.value }))}
              placeholder={loadingOptions ? 'Cargando catálogos...' : 'Seleccionar catálogo base'}
              disabled={loadingOptions}
            >
              <option value="" disabled>Seleccionar catálogo base...</option>
              {catalogos.filter(c => c.activo).map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Curso" required>
              <Select
                value={form.cursoId}
                onChange={e => setForm(f => ({ ...f, cursoId: e.target.value }))}
                placeholder={loadingOptions ? 'Cargando cursos...' : 'Seleccionar curso'}
                disabled={loadingOptions}
              >
                <option value="" disabled>Seleccionar curso...</option>
                {cursos.filter(c => c.activo).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Docente responsable">
              <Select
                value={form.profesorCi}
                onChange={e => setForm(f => ({ ...f, profesorCi: e.target.value }))}
                placeholder={loadingOptions ? 'Cargando docentes...' : 'Seleccionar (Opcional)'}
                disabled={loadingOptions}
              >
                <option value="">Ninguno asignado</option>
                {profesores.filter(p => p.activo).map(p => (
                  <option key={p.profesorCi} value={p.profesorCi}>
                    {p.nombres} {p.apellidos}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={handleToggle}
        title="Cambiar estado"
        message={`¿Cambiar estado de "${confirmToggle?.nombre || confirmToggle?.nombre}"?`}
        confirmLabel="Confirmar"
      />
    </>
  );
}