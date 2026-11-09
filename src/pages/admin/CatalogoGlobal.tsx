import { useEffect, useState } from 'react';
import { CrudPage } from '../../components/ui/CrudPage';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { StatusBadge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Edit2, Power, PowerOff, ListTree } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

// Ajusta estas importaciones a tu api client
import { getCatalogosMateria, createCatalogoMateria, updateCatalogoMateria } from '../../api/catalogo.api';
import type { CatalogoMateria } from '../../types';

const EMPTY = { nombre: '', descripcion: '', activo: true };

export default function CatalogoGlobal() {
  const { toast } = useToast();
  const [refresh, setRefresh] = useState(0);
  const [modal, setModal] = useState({ open: false, data: undefined as CatalogoMateria | undefined });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.nombre) {
      toast('El nombre del catálogo es requerido', 'error');
      return;
    }
    setSaving(true);
    try {
      if (modal.data) {
        await updateCatalogoMateria(modal.data.id, form);
        toast('Catálogo actualizado', 'success');
      } else {
        await createCatalogoMateria(form);
        toast('Catálogo creado', 'success');
      }
      setModal({ open: false, data: undefined });
      setRefresh(r => r + 1);
    } catch (error) {
      toast('Error al guardar el catálogo', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CrudPage<CatalogoMateria>
        title="Catálogo Base (Global)"
        description="Crea las materias base. Aquí se generarán los juegos con IA y se heredarán a todos los colegios."
        refreshTrigger={refresh}
        fetchData={() => getCatalogosMateria()}
        keyExtractor={r => r.id}
        onAdd={() => { setForm(EMPTY); setModal({ open: true, data: undefined }); }}
        addLabel="Nuevo Catálogo Base"
        columns={[
          {
            key: 'nombre',
            label: 'Nombre de Materia Base',
            render: r => <span className="font-bold text-slate-800">{r.nombre}</span>,
          },
          {
            key: 'descripcion',
            label: 'Descripción',
            render: r => r.descripcion || '—',
          },
          {
            key: 'activo',
            label: 'Estado',
            render: r => <StatusBadge activo={r.activo} />,
          },
          {
            key: 'actions',
            label: 'Gestión',
            render: r => (
              <div className="flex gap-2">
                <button 
                  className="btn-secondary text-xs flex items-center gap-1"
                  onClick={() => toast('Aquí abriremos la vista de Temas', 'info')}
                >
                  <ListTree size={14} /> Ver Temas
                </button>
                <ActionsMenu
                  items={[
                    { label: 'Editar', icon: <Edit2 size={14} />, onClick: () => { setForm({ nombre: r.nombre, descripcion: r.descripcion || '', activo: r.activo }); setModal({ open: true, data: r }); } },
                  ]}
                />
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, data: undefined })}
        title={modal.data ? 'Editar Catálogo Base' : 'Nuevo Catálogo Base'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal({ open: false, data: undefined })}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm mb-2 border border-yellow-200">
            <strong>Nota:</strong> Este catálogo será visible para todos los colegios. Ej: "Matemática 1ro de Secundaria Nacional".
          </div>
          <FormField label="Nombre del Catálogo Base" required>
            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Lenguaje 3ro Primaria" />
          </FormField>
          <FormField label="Descripción (Opcional)">
            <Input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Ej: Contenido curricular oficial 2026" />
          </FormField>
        </div>
      </Modal>
    </>
  );
}