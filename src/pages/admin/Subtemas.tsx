import { useEffect, useState } from 'react';
import { Edit2, BrainCircuit, Sparkles } from 'lucide-react';
import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { useToast } from '../../hooks/useToast';
import { apiRequest } from '../../api/client';

import { getSubtemas, createSubtema, updateSubtema, type Subtema } from '../../api/subtemas.api';
import { getTemas, type Tema } from '../../api/temas.api'; 

const EMPTY = { nombre: '', descripcion: '', orden: 1, activo: true, temaId: '' };

export default function Subtemas() {
  const { toast } = useToast();
  // Obtener el ID desde la URL
  const temaIdDesdeUrl = new URLSearchParams(window.location.search).get('temaId') || '';

  const [refresh, setRefresh] = useState(0);
  const [temas, setTemas] = useState<Tema[]>([]); 
  const [selectedTemaId, setSelectedTemaId] = useState(temaIdDesdeUrl);
  
  const [modal, setModal] = useState<{ open: boolean; data?: Subtema }>({ open: false });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [generatingIA, setGeneratingIA] = useState<string | null>(null);

  useEffect(() => {
    const fetchListaTemas = async () => {
      try {
        // Según tu Swagger, si no le pasamos el ID del catálogo, devuelve todos los temas
        const res = await getTemas(); 
        
        // Como 'res' ya es directamente un arreglo (Tema[]), quitamos el res.data
        const lista = Array.isArray(res) ? res : ([] as Tema[]);
        
        setTemas(lista);
      } catch (error) {
        console.error('Error al cargar temas', error);
      }
    };
    fetchListaTemas();
  }, []);

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.temaId) {
      toast('Nombre y Tema son obligatorios', 'error');
      return;
    }
    setSaving(true);
    try {
      if (modal.data) {
        await updateSubtema(modal.data.id, {
          nombre: form.nombre,
          descripcion: form.descripcion,
          orden: form.orden,
          activo: form.activo,
          temaId: form.temaId
        });
        toast('Subtema actualizado', 'success');
      } else {
        await createSubtema(form);
        toast('Subtema creado', 'success');
      }
      setModal({ open: false, data: undefined });
      setRefresh(r => r + 1);
    } catch (error) {
      toast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s: Subtema) => {
    setForm({
      nombre: s.nombre,
      descripcion: s.descripcion || '',
      orden: s.orden,
      activo: s.activo,
      temaId: s.temaId
    });
    setModal({ open: true, data: s });
  };

  const handleGenerarIA = async (subtemaId: string, temaId: string) => {
    setGeneratingIA(subtemaId);
    toast('Iniciando Motor IA...', 'info');
    
    try {
      // Usamos el ID del estudiante de prueba que verificaste
      const estudianteIdPrueba = "a829aad1-6f7e-4aca-8510-9fe005aa4281"; 

      await apiRequest('/juegos/generar-ia', {
        method: 'POST',
        body: JSON.stringify({ 
          subtemaId: subtemaId,
          temaId: temaId,            // 👈 Ahora extraemos y enviamos el tema real
          estudianteId: estudianteIdPrueba, 
          cantidad: 10 
        })
      });
      toast('¡Contenido y juego generados con éxito!', 'success');
    } catch (error) {
      console.error(error);
      toast('Error de IA', 'error');
    } finally {
      setGeneratingIA(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" />
            <h2 className="font-semibold text-slate-700">Subtemas y Generación de IA</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Selecciona un tema para gestionar sus habilidades y lanzar la Inteligencia Artificial.</p>
          
          <Select
            value={selectedTemaId}
            onChange={e => { setSelectedTemaId(e.target.value); setRefresh(r => r + 1); }}
          >
            <option value="" disabled>Selecciona un Tema Base...</option>
            {temas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </Select>
        </div>
      </div>

      <CrudPage<Subtema>
        title="Listado de Subtemas"
        description="Agrega la última capa de jerarquía aquí"
        refreshTrigger={refresh}
        fetchData={async () => {
          if (!selectedTemaId) return { data: [], total: 0 };
          return await getSubtemas(selectedTemaId);
        }}
        keyExtractor={s => s.id}
        onAdd={() => { setForm({ ...EMPTY, temaId: selectedTemaId }); setModal({ open: true, data: undefined }); }}
        addLabel="Nuevo Subtema"
        columns={[
          { key: 'nombre', label: 'Subtema', render: s => <span className="font-semibold text-slate-700">{s.nombre}</span> },
          { key: 'orden', label: 'Orden', render: s => <span className="text-slate-600">{s.orden}</span> },
          { key: 'activo', label: 'Estado', render: s => <StatusBadge activo={s.activo} /> },
          {
            key: 'ia',
            label: 'Motor IA (RAG)',
            render: s => (
              <button 
                onClick={() => handleGenerarIA(s.id, s.temaId)}
                disabled={generatingIA === s.id}
                className="btn-primary text-xs flex items-center gap-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                <BrainCircuit size={14} /> 
                {generatingIA === s.id ? 'Generando IA...' : 'Generar Juego'}
              </button>
            )
          },
          {
            key: 'actions',
            label: '',
            render: s => (
              <ActionsMenu
                items={[
                  { label: 'Editar', icon: <Edit2 size={14} />, onClick: () => handleEdit(s) }
                ]}
              />
            )
          }
        ]}
      />

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: undefined })} title={modal.data ? 'Editar Subtema' : 'Nuevo Subtema'} footer={<><button className="btn-secondary" onClick={() => setModal({ open: false, data: undefined })}>Cancelar</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button></>}>
        <div className="space-y-4">
          <FormField label="Nombre del subtema" required><Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Fases de la digestión" /></FormField>
          <FormField label="Descripción"><Input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} /></FormField>
          <FormField label="Orden" required><Input type="number" min={1} value={form.orden} onChange={e => setForm(f => ({ ...f, orden: Number(e.target.value) || 1 }))} /></FormField>
        </div>
      </Modal>
    </div>
  );
}