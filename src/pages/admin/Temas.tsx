import { useEffect, useMemo, useState } from 'react';
import {
  Edit2,
  PowerOff,
  Power,
  BookOpen,
} from 'lucide-react';

import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { apiRequest } from '../../api/client';

import {
  getTemas,
  createTema,
  updateTema,
  deleteTema,
  type Tema,
} from '../../api/temas.api';

import { getMaterias } from '../../api/materias.api';
import { useToast } from '../../hooks/useToast';
import type { Materia } from '../../types';

interface CatalogoItem {
  id: string;
  nombre: string;
}

const EMPTY = {
  nombre: '',
  descripcion: '',
  orden: 1,
  activo: true,
  catalogoMateriaId: '',
};

export default function Temas() {
  const { toast } = useToast();
  
  const [refresh, setRefresh] = useState(0);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogoItem[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  const [selectedMateriaId, setSelectedMateriaId] = useState('');

  const [modal, setModal] = useState<{
    open: boolean;
    data?: Tema;
  }>({
    open: false,
  });

  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<Tema | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tema | null>(null);

  // 1. Cargar materias y catálogos directamente del backend
  useEffect(() => {
    const loadData = async () => {
      setLoadingMaterias(true);
      try {
        const matRes = await getMaterias();
        const listaMaterias = matRes.data || [];
        setMaterias(listaMaterias);

        if (!selectedMateriaId && listaMaterias.length > 0) {
          setSelectedMateriaId(listaMaterias[0].id);
        }

        // Intento 1: Obtener la lista completa de catálogos desde el endpoint del backend
        try {
          const catRes = await apiRequest<CatalogoItem[]>('/catalogo/materias');
          if (Array.isArray(catRes) && catRes.length > 0) {
            setCatalogos(catRes);
            return;
          }
        } catch {
          // Si el endpoint no existe, extraemos de las materias recibidas
        }

        // Intento 2: Construir catálogo a partir de las materias
        const map = new Map<string, string>();
        for (const m of listaMaterias) {
          const id = m.catalogoMateriaId || m.catalogoMateria?.id;
          if (id) {
            map.set(id, m.catalogoMateria?.nombre || m.nombre);
          }
        }
        setCatalogos(Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre })));

      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        toast('No se pudieron cargar las materias', 'error');
      } finally {
        setLoadingMaterias(false);
      }
    };

    loadData();
  }, [refresh, toast]);

  const selectedMateria = useMemo(
    () => materias.find(materia => materia.id === selectedMateriaId),
    [materias, selectedMateriaId]
  );

  // Identificar el ID de catálogo que le corresponde a la materia seleccionada
  const activeCatalogoId = useMemo(() => {
    if (!selectedMateria) return '';
    if (selectedMateria.catalogoMateriaId) return selectedMateria.catalogoMateriaId;
    if (selectedMateria.catalogoMateria?.id) return selectedMateria.catalogoMateria.id;

    // Si la materia no trajo catalogoMateriaId explícito en el JSON, buscar coincidencia por nombre en catalogos
    const nombreMat = selectedMateria.nombre.toLowerCase().trim();
    const match = catalogos.find(c => {
      const cNom = c.nombre.toLowerCase().trim();
      return (
        cNom === nombreMat ||
        cNom.includes(nombreMat) ||
        nombreMat.includes(cNom) ||
        ((nombreMat.includes('bio') || nombreMat.includes('cien')) && (cNom.includes('bio') || cNom.includes('cien')))
      );
    });

    return match ? match.id : catalogos[0]?.id || '';
  }, [selectedMateria, catalogos]);

  const handleAdd = () => {
    if (!selectedMateria) {
      toast('Selecciona una materia primero', 'error');
      return;
    }

    setForm({
      nombre: '',
      descripcion: '',
      orden: 1,
      activo: true,
      catalogoMateriaId: activeCatalogoId || catalogos[0]?.id || '',
    });

    setModal({ open: true, data: undefined });
  };

  const handleEdit = (tema: Tema) => {
    setForm({
      nombre: tema.nombre,
      descripcion: tema.descripcion ?? '',
      orden: tema.orden,
      activo: tema.activo,
      catalogoMateriaId: tema.catalogoMateriaId,
    });

    setModal({
      open: true,
      data: tema,
    });
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      toast('El nombre del tema es requerido', 'error');
      return;
    }

    if (!form.catalogoMateriaId) {
      toast('Debes seleccionar un catálogo curricular válido', 'error');
      return;
    }

    if (!Number.isInteger(form.orden) || form.orden < 1) {
      toast('El orden debe ser un número mayor o igual a 1', 'error');
      return;
    }

    setSaving(true);

    try {
      if (modal.data) {
        await updateTema(modal.data.id, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          orden: form.orden,
          activo: form.activo,
          catalogoMateriaId: form.catalogoMateriaId,
        });

        toast('Tema actualizado', 'success');
      } else {
        await createTema({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          orden: form.orden,
          activo: form.activo,
          catalogoMateriaId: form.catalogoMateriaId,
        });

        toast('Tema creado correctamente', 'success');
      }

      setModal({ open: false });
      setRefresh(r => r + 1);
    } catch (error) {
      console.error('Error guardando tema:', error);
      toast('No se pudo guardar el tema', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!confirmToggle) return;

    try {
      await updateTema(confirmToggle.id, {
        activo: !confirmToggle.activo,
      });

      toast('Estado del tema actualizado', 'success');
      setRefresh(r => r + 1);
      setConfirmToggle(null);
    } catch (error) {
      console.error('Error actualizando tema:', error);
      toast('No se pudo actualizar el estado', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await deleteTema(confirmDelete.id);

      toast('Tema eliminado', 'success');
      setRefresh(r => r + 1);
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error eliminando tema:', error);
      toast('No se pudo eliminar el tema', 'error');
    }
  };

  const fetchTemas = async () => {
    if (!activeCatalogoId) {
      return { data: [], total: 0, page: 1, limit: 20 };
    }

    try {
      const temas = await getTemas(activeCatalogoId);
      const list = Array.isArray(temas) ? temas : [];
      return {
        data: list,
        total: list.length,
        page: 1,
        limit: list.length || 20,
      };
    } catch (err) {
      console.error('Error en fetchTemas:', err);
      return { data: [], total: 0, page: 1, limit: 20 };
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="card p-4">
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen size={18} />
                <h2 className="font-semibold text-slate-700">
                  Materia / Catálogo curricular
                </h2>
              </div>

              <p className="text-xs text-slate-400 mt-1">
                Selecciona la materia para administrar sus temas o lecciones.
              </p>
            </div>

            {/* Selector de materias con sus paralelos */}
            <Select
              value={selectedMateriaId}
              onChange={e => {
                setSelectedMateriaId(e.target.value);
                setRefresh(r => r + 1);
              }}
              disabled={loadingMaterias}
              placeholder={
                loadingMaterias
                  ? 'Cargando materias...'
                  : 'Seleccionar materia'
              }
            >
              {materias.map(materia => (
                <option key={materia.id} value={materia.id}>
                  {materia.nombre}
                  {materia.curso?.nombre ? ` — ${materia.curso.nombre}` : ''}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <CrudPage<Tema>
          title="Temas / Lecciones"
          description="Contenido curricular que podrán seleccionar los estudiantes"
          refreshTrigger={refresh}
          fetchData={async ({ search }) => {
            const response = await fetchTemas();

            if (!search) {
              return response;
            }

            const q = search.toLowerCase();
            const filtered = response.data.filter(
              tema =>
                tema.nombre.toLowerCase().includes(q) ||
                (tema.descripcion ?? '').toLowerCase().includes(q)
            );

            return {
              ...response,
              data: filtered,
              total: filtered.length,
            };
          }}
          keyExtractor={tema => tema.id}
          onAdd={handleAdd}
          addLabel="Nuevo tema"
          columns={[
            {
              key: 'nombre',
              label: 'Tema / Lección',
              render: tema => (
                <div>
                  <p className="font-semibold text-slate-700">
                    {tema.nombre}
                  </p>
                  {tema.descripcion && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {tema.descripcion}
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: 'orden',
              label: 'Orden',
              render: tema => (
                <span className="font-semibold text-slate-600">
                  {tema.orden}
                </span>
              ),
            },
            {
              key: 'activo',
              label: 'Estado',
              render: tema => (
                <StatusBadge activo={tema.activo} />
              ),
            },
            {
              key: 'actions',
              label: '',
              render: tema => (
                <ActionsMenu
                  items={[
                    {
                      label: 'Editar',
                      icon: <Edit2 size={14} />,
                      onClick: () => handleEdit(tema),
                    },
                    {
                      label: tema.activo ? 'Desactivar' : 'Activar',
                      icon: tema.activo ? (
                        <PowerOff size={14} />
                      ) : (
                        <Power size={14} />
                      ),
                      onClick: () => setConfirmToggle(tema),
                      variant: tema.activo ? 'danger' : 'default',
                    },
                    {
                      label: 'Eliminar',
                      icon: <PowerOff size={14} />,
                      onClick: () => setConfirmDelete(tema),
                      variant: 'danger',
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </div>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.data ? 'Editar tema' : 'Nuevo tema'}
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setModal({ open: false })}
            >
              Cancelar
            </button>

            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Nombre del tema" required>
            <Input
              value={form.nombre}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  nombre: e.target.value,
                }))
              }
              placeholder="Ej: La Célula y su Estructura"
            />
          </FormField>

          {/* Selector de Catálogo Curricular Asociado */}
          <FormField label="Catálogo curricular asociado" required>
            <Select
              value={form.catalogoMateriaId}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  catalogoMateriaId: e.target.value,
                }))
              }
            >
              <option value="">Selecciona el catálogo base...</option>
              {catalogos.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Descripción">
            <Input
              value={form.descripcion}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  descripcion: e.target.value,
                }))
              }
              placeholder="Descripción del contenido"
            />
          </FormField>

          <FormField label="Orden" required>
            <Input
              type="number"
              min={1}
              value={form.orden}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  orden: Number(e.target.value) || 1,
                }))
              }
            />
          </FormField>

          <FormField label="Estado">
            <Select
              value={form.activo ? 'true' : 'false'}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  activo: e.target.value === 'true',
                }))
              }
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={handleToggle}
        title="Cambiar estado"
        message={`¿Cambiar estado de "${confirmToggle?.nombre}"?`}
        confirmLabel="Confirmar"
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar tema"
        message={`¿Eliminar el tema "${confirmDelete?.nombre}"? Esta acción no debe usarse para temas que ya tengan juegos o historial asociado.`}
        confirmLabel="Eliminar"
      />
    </>
  );
}