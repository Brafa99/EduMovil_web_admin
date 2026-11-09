import { useEffect, useState } from 'react';
import { Edit2, PowerOff, Power, ListTree, Sparkles } from 'lucide-react';

import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';

import { getTemas, createTema, updateTema, deleteTema, type Tema } from '../../api/temas.api';
import { getCatalogosMateria } from '../../api/catalogo.api';
import { useToast } from '../../hooks/useToast';
import type { CatalogoMateria } from '../../types';

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
  const [catalogos, setCatalogos] = useState<CatalogoMateria[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCatalogoId, setSelectedCatalogoId] = useState('');

  const [modal, setModal] = useState<{ open: boolean; data?: Tema }>({ open: false });
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<Tema | null>(null);

  useEffect(() => {
    const loadCatalogos = async () => {
      setLoading(true);
      try {
        const res = await getCatalogosMateria();
        setCatalogos(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedCatalogoId(res.data[0].id);
        }
      } catch (error) {
        console.error('Error cargando catálogos:', error);
        toast('No se pudieron cargar los catálogos base', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadCatalogos();
  }, [toast]);

  const handleAdd = () => {
    if (!selectedCatalogoId) {
      toast('Selecciona un Catálogo Base primero', 'error');
      return;
    }
    setForm({ ...EMPTY, catalogoMateriaId: selectedCatalogoId });
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
    setModal({ open: true, data: tema });
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return toast('El nombre es requerido', 'error');
    if (!form.catalogoMateriaId) return toast('Debes seleccionar un catálogo', 'error');

    setSaving(true);
    try {
      if (modal.data) {
        await updateTema(modal.data.id, form);
        toast('Tema actualizado', 'success');
      } else {
        await createTema(form);
        toast('Tema creado', 'success');
      }
      setModal({ open: false });
      setRefresh(r => r + 1);
    } catch (error) {
      toast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!confirmToggle) return;
    try {
      await updateTema(confirmToggle.id, { activo: !confirmToggle.activo });
      toast('Estado actualizado', 'success');
      setRefresh(r => r + 1);
      setConfirmToggle(null);
    } catch (error) {
      toast('Error al actualizar', 'error');
    }
  };

  const fetchTemas = async () => {
    if (!selectedCatalogoId) return { data: [], total: 0 };
    try {
      // El endpoint recibe el ID del catálogo base para traer solo sus temas
      const res = await getTemas(selectedCatalogoId); 
      // Como res ya es un arreglo de temas, lo asignamos directamente:
      const temas = Array.isArray(res) ? res : ([] as Tema[]);
      return { data: temas, total: temas.length };
    } catch (err) {
      return { data: [], total: 0 };
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="card p-4">
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ListTree size={18} />
                <h2 className="font-semibold text-slate-700">Temas del Catálogo Global</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Estos temas estarán disponibles para todos los colegios que usen el catálogo base.
              </p>
            </div>
            <Select
              value={selectedCatalogoId}
              onChange={e => { setSelectedCatalogoId(e.target.value); setRefresh(r => r + 1); }}
              disabled={loading}
              placeholder={loading ? 'Cargando catálogos...' : 'Seleccionar catálogo base'}
            >
              <option value="" disabled>Selecciona un Catálogo Base...</option>
              {catalogos.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </Select>
          </div>
        </div>

        <CrudPage<Tema>
          title="Listado de Temas"
          description="Estructura curricular principal"
          refreshTrigger={refresh}
          fetchData={fetchTemas}
          keyExtractor={tema => tema.id}
          onAdd={handleAdd}
          addLabel="Nuevo tema"
          columns={[
            {
              key: 'nombre',
              label: 'Tema',
              render: tema => (
                <div>
                  <p className="font-semibold text-slate-700">{tema.nombre}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{tema.descripcion}</p>
                </div>
              ),
            },
            { key: 'orden', label: 'Orden', render: tema => <span className="font-semibold text-slate-600">{tema.orden}</span> },
            { key: 'activo', label: 'Estado', render: tema => <StatusBadge activo={tema.activo} /> },
            {
              key: 'actions',
              label: 'Acciones',
              render: tema => (
                <div className="flex gap-2">
                   <button 
                      className="btn-primary text-xs flex items-center gap-1 bg-purple-600 hover:bg-purple-700"
                      onClick={() => window.location.href = `/admin/subtemas?temaId=${tema.id}`}
                    >
                      <Sparkles size={14} /> Subtemas (IA)
                    </button>
                  <ActionsMenu
                    items={[
                      { label: 'Editar', icon: <Edit2 size={14} />, onClick: () => handleEdit(tema) },
                      {
                        label: tema.activo ? 'Desactivar' : 'Activar',
                        icon: tema.activo ? <PowerOff size={14} /> : <Power size={14} />,
                        onClick: () => setConfirmToggle(tema),
                        variant: tema.activo ? 'danger' : 'default',
                      },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.data ? 'Editar Tema' : 'Nuevo Tema'} footer={<><button className="btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button></>}>
        <div className="space-y-4">
          <FormField label="Nombre del tema" required><Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: La Célula" /></FormField>
          <FormField label="Descripción"><Input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción breve" /></FormField>
          <FormField label="Orden" required><Input type="number" min={1} value={form.orden} onChange={e => setForm(f => ({ ...f, orden: Number(e.target.value) || 1 }))} /></FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={handleToggle} title="Cambiar estado" message={`¿Cambiar estado de "${confirmToggle?.nombre}"?`} confirmLabel="Confirmar" />
    </>
  );
}