import { useEffect, useState, useRef } from 'react';
import {
  Edit2,
  BrainCircuit,
  Sparkles,
  Eye,
  Loader2,
  PowerOff,
  Power,
  Trash2,
  LayoutGrid,
  Type,
  MessageSquare,
} from 'lucide-react';
import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { useToast } from '../../hooks/useToast';
import { apiRequest } from '../../api/client';
import {
  getSubtemas,
  createSubtema,
  updateSubtema,
  deleteSubtema,
  type Subtema,
} from '../../api/subtemas.api';
import { getTemas, type Tema } from '../../api/temas.api';
import { Search, X } from 'lucide-react';

type TipoJuego = 'QUIZ' | 'MEMORAMA' | 'COMPLETAR';

const EMPTY = { nombre: '', descripcion: '', orden: 1, activo: true, temaId: '' };

export default function Subtemas() {
  const { toast } = useToast();
  const temaIdDesdeUrl = new URLSearchParams(window.location.search).get('temaId') || '';

  const [refresh, setRefresh] = useState(0);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [selectedTemaId, setSelectedTemaId] = useState(temaIdDesdeUrl);
  const selectedTemaIdRef = useRef(temaIdDesdeUrl);

  useEffect(() => {
    selectedTemaIdRef.current = selectedTemaId;
    setRefresh((r) => r + 1);
  }, [selectedTemaId]);
  const [temaSearch, setTemaSearch] = useState('');
  const [temaMenuOpen, setTemaMenuOpen] = useState(false);

  const temasFiltrados = temas.filter((t) =>
    t.nombre.toLowerCase().includes(temaSearch.toLowerCase().trim()),
  );

  const [modal, setModal] = useState<{ open: boolean; data?: Subtema }>({ open: false });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  // Estado para la IA
  const [generatingIA, setGeneratingIA] = useState<string | null>(null);
  const [iaProgress, setIaProgress] = useState<string>('');

  // Estado para el Modal Visor de Juegos (3 tipos)
  const [visorModal, setVisorModal] = useState<{
    open: boolean;
    subtema?: Subtema;
    juegos: any[];
    cargando: boolean;
  }>({
    open: false,
    juegos: [],
    cargando: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const searchTermRef = useRef('');

  useEffect(() => {
    searchTermRef.current = searchTerm;
    const timer = setTimeout(() => {
      setRefresh((r) => r + 1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [confirmDelete, setConfirmDelete] = useState<Subtema | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Subtema | null>(null);
  const [activeTab, setActiveTab] = useState<TipoJuego>('QUIZ');
  const [cantidadPreguntas, setCantidadPreguntas] = useState<number>(10);

  useEffect(() => {
    const fetchListaTemas = async () => {
      try {
        const res = await getTemas();
        const lista = Array.isArray(res) ? res : ([] as Tema[]);
        setTemas(lista);
      } catch (error) {
        console.error('Error al cargar temas', error);
      }
    };
    fetchListaTemas();
  }, []);

  const [iaSeconds, setIaSeconds] = useState(0);

  useEffect(() => {
    if (!generatingIA) {
      setIaSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setIaSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [generatingIA]);

  const getEstadoIA = (sec: number) => {
    if (sec < 5) return 'Conectando con el motor de IA...';
    if (sec < 20) return 'Generando preguntas y opciones...';
    if (sec < 45) return 'El servidor de IA está procesando (puede estar despertando en Render)...';
    return 'Tardando más de lo normal. Revisa la pestaña Network o los logs de Render.';
  };

  

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
          temaId: form.temaId,
        });
        toast('Subtema actualizado', 'success');
      } else {
        await createSubtema(form);
        toast('Subtema creado', 'success');
      }
      setModal({ open: false, data: undefined });
      setRefresh((r) => r + 1);
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
      temaId: s.temaId,
    });
    setModal({ open: true, data: s });
  };

  const handleToggle = async () => {
    if (!confirmToggle) return;
    try {
      await updateSubtema(confirmToggle.id, { activo: !confirmToggle.activo });
      toast('Estado actualizado', 'success');
      setRefresh((r) => r + 1);
      setConfirmToggle(null);
    } catch (error) {
      toast('Error al actualizar el estado', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteSubtema(confirmDelete.id);
      toast('Subtema eliminado exitosamente', 'success');
      setRefresh((r) => r + 1);
    } catch (error) {
      console.error('Error eliminando subtema:', error);
      toast('Error al eliminar. Puede que tenga juegos vinculados.', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  // Función para abrir/recargar el visor con los juegos del subtema
  const handleVerJuegos = async (subtema: Subtema) => {
    setVisorModal((prev) => ({ ...prev, open: true, subtema, cargando: true }));
    try {
      const data = await apiRequest(`/juegos?subtemaId=${subtema.id}`);
      setVisorModal({
        open: true,
        subtema,
        juegos: Array.isArray(data) ? data : [],
        cargando: false,
      });
    } catch (error) {
      console.error('Error cargando juegos del subtema', error);
      toast('No se pudieron cargar los juegos', 'error');
      setVisorModal({ open: true, subtema, juegos: [], cargando: false });
    }
  };

  // Función para inyectar IA especificando el tipo de juego
  const handleGenerarIA = async (
    subtema: Subtema,
    tipoJuego: TipoJuego = 'QUIZ',
  ) => {
    setGeneratingIA(subtema.id);
    toast(`Generando ${tipoJuego} con IA... Esto tomará unos segundos.`, 'info');

    try {
      const adminId =
        localStorage.getItem('usuarioId') || 'a3e97a65-0687-452d-921b-a49664ce0404';

      await apiRequest('/juegos/generar-ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': adminId,
        },
        body: JSON.stringify({
          subtemaId: subtema.id,
          temaId: subtema.temaId,
          cantidad: cantidadPreguntas,
          tipoJuego,
        }),
      });

      toast(`¡${tipoJuego} generado con éxito!`, 'success');

      // Si el visor está abierto en este subtema, recargamos automáticamente
      if (visorModal.open && visorModal.subtema?.id === subtema.id) {
        await handleVerJuegos(subtema);
      }
    } catch (error) {
      console.error(error);
      toast(`Error al generar ${tipoJuego} con IA`, 'error');
    } finally {
      setGeneratingIA(null);
    }
  };

  const handleGenerarTodosIA = async (subtema: Subtema) => {
    const adminId = localStorage.getItem('usuarioId');
    if (!adminId) {
      toast('No se encontró tu sesión. Vuelve a iniciar sesión.', 'error');
      return;
    }

    const tipos: TipoJuego[] = ['QUIZ', 'MEMORAMA', 'COMPLETAR'];
    setGeneratingIA(subtema.id);
    const exitosos: TipoJuego[] = [];
    const fallidos: TipoJuego[] = [];

    for (let i = 0; i < tipos.length; i++) {
      if (i > 0) {
        setIaProgress(`Esperando 6s antes de ${tipos[i]}...`);
        await new Promise((resolve) => setTimeout(resolve, 6000));
      }
      const tipo = tipos[i];
      setIaProgress(`${i + 1}/3 ${tipo}...`);
      toast(`Generando ${tipo} (${i + 1}/3)...`, 'info');

      try {
        await apiRequest('/juegos/generar-ia', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Usuario-Id': adminId,
          },
          body: JSON.stringify({
            subtemaId: subtema.id,
            temaId: subtema.temaId,
            cantidad: cantidadPreguntas,
            tipoJuego: tipo,
          }),
        });
        exitosos.push(tipo);
      } catch (error) {
        console.error(`Error generando ${tipo}:`, error);
        fallidos.push(tipo);
      }
    }

    setGeneratingIA(null);
    setIaProgress('');

    if (fallidos.length === 0) {
      toast('¡Los 3 juegos (QUIZ, MEMORAMA y COMPLETAR) se generaron con éxito!', 'success');
    } else if (exitosos.length > 0) {
      toast(`Generados: ${exitosos.join(', ')}. Fallaron: ${fallidos.join(', ')}.`, 'error');
    } else {
      toast('No se pudo generar ninguno de los 3 juegos.', 'error');
    }
  };

  // Normaliza el tipo de juego sin importar si Prisma devuelve tipoJuego o tipo_juego
  const getTipoJuego = (juego: any): string =>
    String(juego.tipoJuego || juego.tipo_juego || 'QUIZ').toUpperCase();

  const juegosFiltrados = visorModal.juegos.filter(
    (j) => getTipoJuego(j) === activeTab,
  );

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" />
            <h2 className="font-semibold text-slate-700">Subtemas y Generación de IA</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Selecciona un tema para gestionar sus habilidades y lanzar la Inteligencia Artificial.
          </p>

          <div className="max-w-md">
            {/* Buscador 1: Selector de Tema base */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por tema base (opcional)
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={temaSearch}
                  onFocus={() => setTemaMenuOpen(true)}
                  onBlur={() => setTimeout(() => setTemaMenuOpen(false), 150)}
                  onChange={(e) => {
                    setTemaSearch(e.target.value);
                    setTemaMenuOpen(true);
                    if (!e.target.value.trim()) setSelectedTemaId('');
                  }}
                  placeholder="Todos los temas (escribe para buscar...)"
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
                {(temaSearch || selectedTemaId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTemaSearch('');
                      setSelectedTemaId('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Mostrar todos los temas"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {temaMenuOpen && (
                <ul className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
                  <li
                    onMouseDown={() => {
                      setSelectedTemaId('');
                      setTemaSearch('');
                      setTemaMenuOpen(false);
                    }}
                    className={`px-3 py-2 cursor-pointer hover:bg-purple-50 border-b border-gray-100 ${!selectedTemaId ? 'bg-purple-100 font-semibold text-purple-800' : 'text-gray-600'
                      }`}
                  >
                    — Todos los temas —
                  </li>
                  {temasFiltrados.length === 0 ? (
                    <li className="px-3 py-2 text-gray-400">No se encontró ningún tema</li>
                  ) : (
                    temasFiltrados.map((t) => (
                      <li
                        key={t.id}
                        onMouseDown={() => {
                          setSelectedTemaId(t.id);
                          setTemaSearch(t.nombre);
                          setTemaMenuOpen(false);
                        }}
                        className={`px-3 py-2 cursor-pointer hover:bg-purple-50 ${selectedTemaId === t.id
                            ? 'bg-purple-100 font-semibold text-purple-800'
                            : 'text-gray-700'
                          }`}
                      >
                        {t.nombre}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            
          </div>
        </div>
      </div>

      <CrudPage<Subtema>
        title="Listado de Subtemas"
        description="Agrega la última capa de jerarquía aquí"
        refreshTrigger={refresh}
        fetchData={async (params?: any) => {

          const res = await getSubtemas(selectedTemaIdRef.current || undefined);
          const normalize = (str?: string) =>
            (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

          const rawSearch = typeof params === 'string' ? params : params?.search || '';
          const term = normalize(rawSearch);
          if (!term) return res;

          const filtered = res.data.filter(
            (s) => normalize(s.nombre).includes(term) || normalize(s.descripcion).includes(term),
          );
          return { data: filtered, total: filtered.length };
        }}
        keyExtractor={(s) => s.id}
        onAdd={() => {
          setForm({ ...EMPTY, temaId: selectedTemaId });
          setModal({ open: true, data: undefined });
        }}
        addLabel="Nuevo Subtema"
        extraActions={
          <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg text-xs">
            <Sparkles size={14} className="text-purple-600 shrink-0" />
            <span className="font-medium text-purple-900">IA por juego:</span>
            <select
              value={cantidadPreguntas}
              onChange={(e) => setCantidadPreguntas(Number(e.target.value))}
              className="bg-transparent font-bold text-purple-700 focus:outline-none cursor-pointer"
            >
              <option value={3}>3 ítems (Demo)</option>
              <option value={5}>5 ítems (Normal)</option>
              <option value={10}>10 ítems (Estándar)</option>
            </select>
          </div>
        }
        columns={[
          {
            key: 'nombre',
            label: 'Subtema',
            render: (s) => <span className="font-semibold text-slate-700">{s.nombre}</span>,
          },
          {
            key: 'orden',
            label: 'Orden',
            render: (s) => <span className="text-slate-600">{s.orden}</span>,
          },
          {
            key: 'activo',
            label: 'Estado',
            render: (s) => <StatusBadge activo={s.activo} />,
          },
          {
            key: 'ia',
            label: 'Motor IA (RAG)',
            render: (s) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerarTodosIA(s)}
                  disabled={generatingIA === s.id}
                  className="btn-primary text-xs flex items-center gap-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  title={`Generar los 3 juegos (${cantidadPreguntas} ítems c/u: Quiz, Memorama y Completar)`}
                >
                  {generatingIA === s.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <BrainCircuit size={14} />
                  )}
                  {generatingIA === s.id ? iaProgress || 'Generando...' : 'IA (3)'}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('QUIZ');
                    handleVerJuegos(s);
                  }}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                  title="Auditar y Generar los 3 tipos de juegos"
                >
                  <Eye size={16} />
                </button>
              </div>
            ),
          },
          {
            key: 'actions',
            label: 'Gestión',
            render: (s) => (
            
              <ActionsMenu
                items={[
                  { label: 'Editar', icon: <Edit2 size={14} />, onClick: () => handleEdit(s) },
                  {
                    label: s.activo ? 'Desactivar' : 'Activar',
                    icon: s.activo ? <PowerOff size={14} /> : <Power size={14} />,
                    onClick: () => setConfirmToggle(s),
                    variant: s.activo ? 'danger' : 'default',
                  },
                  {
                    label: 'Eliminar',
                    icon: <Trash2 size={14} />,
                    onClick: () => setConfirmDelete(s),
                    variant: 'danger',
                  },
                ]}
              />
            ),
          },
          
        ]}
      />

      {/* MODAL DE EDICIÓN/CREACIÓN */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, data: undefined })}
        title={modal.data ? 'Editar Subtema' : 'Nuevo Subtema'}
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setModal({ open: false, data: undefined })}
            >
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Nombre del subtema" required>
            <Input
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Fases de la digestión"
            />
          </FormField>
          <FormField label="Descripción">
            <Input
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            />
          </FormField>
          <FormField label="Orden" required>
            <Input
              type="number"
              min={1}
              value={form.orden}
              onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) || 1 }))}
            />
          </FormField>
        </div>
      </Modal>

      {/* MODAL VISOR Y GENERADOR DE LOS 3 JUEGOS IA */}
      <Modal
        open={visorModal.open}
        onClose={() => setVisorModal({ open: false, juegos: [], cargando: false })}
        title={`Banco de IA - ${visorModal.subtema?.nombre ?? ''}`}
        footer={
          <div className="flex flex-wrap w-full justify-between items-center gap-2">
            {visorModal.subtema && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={cantidadPreguntas}
                  onChange={(e) => setCantidadPreguntas(Number(e.target.value))}
                  disabled={generatingIA === visorModal.subtema.id}
                  className="px-2.5 py-2 text-xs font-semibold border border-purple-200 rounded-lg bg-purple-50 text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  title="Cantidad de ítems a generar con IA"
                >
                  <option value={3}>
                    3 {activeTab === 'MEMORAMA' ? 'items (Demo)' : activeTab === 'COMPLETAR' ? 'frases (Demo)' : 'preguntas (Demo)'}
                  </option>
                  <option value={5}>
                    5 {activeTab === 'MEMORAMA' ? 'items (Pares)' : activeTab === 'COMPLETAR' ? 'frases (Prueba)' : 'preguntas (Prueba)'}
                  </option>
                  <option value={10}>
                    10 {activeTab === 'MEMORAMA' ? 'items (Estándar)' : activeTab === 'COMPLETAR' ? 'frases (Estándar)' : 'preguntas (Estándar)'}
                  </option>
                </select>

                <button
                  onClick={() => handleGenerarIA(visorModal.subtema!, activeTab)}
                  disabled={generatingIA === visorModal.subtema.id}
                  className="btn-primary text-xs flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {generatingIA === visorModal.subtema.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {generatingIA === visorModal.subtema.id
                    ? `Generando ${activeTab}...`
                    : `Generar ${activeTab} (${cantidadPreguntas})`}
                </button>
              </div>
            )}
            <button
              className="btn-secondary"
              onClick={() => setVisorModal({ open: false, juegos: [], cargando: false })}
            >
              Cerrar Auditoría
            </button>
          </div>
        }
      >
        {/* Pestañas de los 3 tipos de juegos */}
        <div className="flex border-b border-slate-200 mb-4">
          {(
            [
              { id: 'QUIZ', label: 'Quiz', icon: <MessageSquare size={16} /> },
              { id: 'MEMORAMA', label: 'Memorama', icon: <LayoutGrid size={16} /> },
              { id: 'COMPLETAR', label: 'Completar Frase', icon: <Type size={16} /> },
            ] as const
          ).map((tab) => {
            const count = visorModal.juegos.filter((j) => getTipoJuego(j) === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                {tab.icon}
                {tab.label}
                <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {generatingIA && (
          <div className="mb-4 p-3 rounded-lg bg-purple-50 border border-purple-200 flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-purple-600 shrink-0" />
            <div className="flex-1 text-xs">
              <p className="font-semibold text-purple-800">
                Generando {activeTab} con IA... ({iaSeconds}s)
              </p>
              <p className="text-purple-600 mt-0.5">{getEstadoIA(iaSeconds)}</p>
            </div>
          </div>
        )}

        <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
          {visorModal.cargando ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
              <Loader2 size={32} className="animate-spin text-purple-600 mb-2" />
              <p>Consultando base de datos...</p>
            </div>
          ) : juegosFiltrados.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg">
              <BrainCircuit size={40} className="mx-auto text-slate-300 mb-2" />
              <p>No hay juegos de tipo {activeTab} todavía.</p>
              <p className="text-xs mt-1">
                Usa el botón "Generar {activeTab} con IA" de abajo para crearlo.
              </p>
            </div>
          ) : (
            juegosFiltrados.map((juego, i) => (
              <div
                key={juego.id}
                className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm"
              >
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-700 text-sm">
                    Set #{i + 1} ({getTipoJuego(juego)})
                  </h3>
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                    {juego._count?.preguntas || juego.preguntas?.length || 0} Ítems
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  {juego.preguntas?.map((jp: any, index: number) => (
                    <div key={jp.pregunta.id} className="text-sm">
                      <p className="font-medium text-slate-800 mb-2">
                        <span className="text-purple-600 font-bold mr-1">{index + 1}.</span>
                        {jp.pregunta.enunciado}
                      </p>
                      <ul className="space-y-1.5 pl-4">
                        {jp.pregunta.opciones?.map((opcion: any) => (
                          <li
                            key={opcion.id}
                            className={`p-2 rounded border ${opcion.esCorrecta
                                ? 'bg-green-50 border-green-200 text-green-800 font-medium'
                                : 'bg-slate-50 border-slate-100 text-slate-600'
                              }`}
                          >
                            {opcion.esCorrecta ? '✅' : '⚪'} {opcion.texto}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
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
        title="Eliminar Subtema"
        message={`¿Eliminar definitivamente el subtema "${confirmDelete?.nombre}" y todos sus juegos? Esta acción es irreversible.`}
        confirmLabel="Sí, eliminar"
      />
    </div>
  );
}