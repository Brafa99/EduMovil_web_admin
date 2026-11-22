
import { useEffect, useState } from 'react';
import {
  Eye,
  Edit2,
  PowerOff,
  Power,
  Building2,
  ImagePlus,
  Trash2,
  MapPin,
  Globe,
  Users,
  Clock3,
  Ban,
  CheckCircle,
  X
} from 'lucide-react';

import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input } from '../../components/ui/FormField';
import { MapPickerModal } from '../../components/MapPickerModal'; 
import {
  getInstituciones,
  createInstitucion,
  updateInstitucion,
  type InstitucionPayload,
} from '../../api/instituciones.api';

import { subirImagenInstitucion } from '../../services/storage';
import { useToast } from '../../hooks/useToast';
import type { UnidadEducativa } from '../../types';


interface InstitucionForm
  extends Omit<
    InstitucionPayload,
    'tipoInstitucion' | 'nivelesEducativos' | 'telefono' | 'direccion'
  > {
  telefono: string;
  direccion: string;
  descripcion: string;
  codigoInstitucional: string;
  tipoInstitucion: 'PUBLICA' | 'PRIVADA' | 'CONVENIO' | '';
  nivelesEducativos: string[];
  director: string;
  encargador: string;
  email: string;
  telefonoAlternativo: string;
  sitioWeb: string;
  departamento: string;
  provincia: string;
  municipio: string;
  zona: string;
  latitud: number | null;
  longitud: number | null;
  numeroAlumnos: number;
  cantidadMaximaAlumnos: number;
  turnos: string[];
  imagenPrincipalUrl: string | null;
  imagenPortadaUrl: string | null;
  imagenes: string[];
}

const EMPTY: InstitucionForm = {
  nombre: '',
  descripcion: '',
  codigoInstitucional: '',
  tipoInstitucion: '',
  nivelesEducativos: [],
  director: '',
  encargador: '',
  email: '',
  telefono: '',
  telefonoAlternativo: '',
  sitioWeb: '',
  direccion: '',
  departamento: '',
  provincia: '',
  municipio: '',
  zona: '',
  latitud: null,
  longitud: null,
  numeroAlumnos: 0,
  cantidadMaximaAlumnos: 0,
  turnos: [],
  imagenPrincipalUrl: null,
  imagenPortadaUrl: null,
  imagenes: [],
  activo: true,
};

export default function Instituciones() {
  
  const [imagenPrincipal, setImagenPrincipal] = useState<File | null>(null);
  const [imagenPortada, setImagenPortada] = useState<File | null>(null);
  const [nuevasImagenes, setNuevasImagenes] = useState<File[]>([]);
  // Estados para los nuevos modales
  const [detailModalItem, setDetailModalItem] = useState<any>(null); // Reemplaza 'any' por tu interface de Institucion si la tienes
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const [previewPrincipal, setPreviewPrincipal] = useState('');
  const [previewPortada, setPreviewPortada] = useState('');
  const [previewGaleria, setPreviewGaleria] = useState<string[]>([]);
  const { toast } = useToast();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const [modal, setModal] = useState<{
    open: boolean;
    data?: UnidadEducativa;
  }>({
    open: false,
  });

  const [form, setForm] =
    useState<InstitucionForm>(EMPTY);

  const [saving, setSaving] = useState(false);

  const [isMapOpen, setIsMapOpen] = useState(false);

  // Lo lee de tu .env local, o de los settings de Vercel en producción
  const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-edumovil.onrender.com/api/v1';

  const handleLocationSelected = (lat: number, lng: number) => {
    setForm(f => ({
      ...f,
      latitud: Number(lat.toFixed(6)),
      longitud: Number(lng.toFixed(6)),
    }));
  };
  const [confirmToggle, setConfirmToggle] =
    useState<UnidadEducativa | null>(null);

    useEffect(() => {
    if (!imagenPortada) {
      setPreviewPortada('');
      return;
    }

    const url = URL.createObjectURL(imagenPortada);
    setPreviewPortada(url);

    return () => URL.revokeObjectURL(url);
  }, [imagenPortada]);

  // Previsualización de la galería
  useEffect(() => {
    const urls = nuevasImagenes.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviewGaleria(urls);

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [nuevasImagenes]);


  const resetImages = () => {
  setImagenPrincipal(null);
  setImagenPortada(null);
  setNuevasImagenes([]);
};

const openCreate = () => {
  setForm({ ...EMPTY });
  resetImages();
  setModal({ open: true });
};

  const openEdit = (row: UnidadEducativa) => {
  setForm({
    ...EMPTY,
    ...row,
    nombre: row.nombre ?? '',
    descripcion: row.descripcion ?? '',
    codigoInstitucional: row.codigoInstitucional ?? '',
    tipoInstitucion: row.tipoInstitucion ?? '',
    nivelesEducativos: row.nivelesEducativos ?? [],
    director: row.director ?? '',
    encargador: row.encargador ?? '',
    email: row.email ?? '',
    telefono: row.telefono ?? '',
    telefonoAlternativo: row.telefonoAlternativo ?? '',
    sitioWeb: row.sitioWeb ?? '',
    direccion: row.direccion ?? '',
    departamento: row.departamento ?? '',
    provincia: row.provincia ?? '',
    municipio: row.municipio ?? '',
    zona: row.zona ?? '',
    latitud: row.latitud ?? null,
    longitud: row.longitud ?? null,
    numeroAlumnos: row.numeroAlumnos ?? row.totalEstudiantes ?? 0,
    cantidadMaximaAlumnos: row.cantidadMaximaAlumnos ?? 0,
    turnos: row.turnos ?? [],
    imagenPrincipalUrl: row.imagenPrincipalUrl ?? null,
    imagenPortadaUrl: row.imagenPortadaUrl ?? null,
    imagenes: row.imagenes ?? [],
    activo: row.activo,
  });

  resetImages();
  setModal({ open: true, data: row });
};


  const handleDeleteDefinitivo = async () => {
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_BASE}/instituciones/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // Si usas token
        }
      });

      if (!response.ok) throw new Error('Error al eliminar la institución');

      // 1. Guardamos el ID y cerramos el modal
      const idEliminado = confirmDelete.id;
      setConfirmDelete(null);

      // 2. ACTUALIZACIÓN INMEDIATA DE LA TABLA
      // Asumiendo que tu estado que guarda la lista se llama "instituciones" o "data".
      // Descomenta y ajusta el nombre de tu state según cómo lo tengas:
      // setInstituciones(prev => prev.filter(item => item.id !== idEliminado)); 

      // O si tienes una función que hace el fetch de nuevo, llámala aquí:
      // fetchInstituciones(); 

      // 3. MENSAJE VISUAL ELEGANTE (Toast)
      setToastMessage('La institución fue eliminada correctamente.');
      setTimeout(() => setToastMessage(null), 3000); // Se oculta a los 3 segundos

    } catch (error) {
      console.error(error);
      setToastMessage('Error: No se pudo eliminar la institución.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleSave = async () => {
  if (!form.nombre.trim()) {
    toast('El nombre de la institución es requerido', 'error');
    return;
  }

  if (!modal.data && !imagenPrincipal) {
    toast('Selecciona una imagen principal para la institución', 'error');
    return;
  }

  setSaving(true);

  try {
    let imagenPrincipalUrl = form.imagenPrincipalUrl;
    let imagenPortadaUrl = form.imagenPortadaUrl;
    let imagenes = [...(form.imagenes ?? [])];

    // Subir imagen principal si se seleccionó una nueva.
    if (imagenPrincipal) {
      imagenPrincipalUrl = await subirImagenInstitucion(
        imagenPrincipal,
        modal.data?.id ?? 'instituciones-pendientes',
      );
    }

    // Subir portada si se seleccionó una nueva.
    if (imagenPortada) {
      imagenPortadaUrl = await subirImagenInstitucion(
        imagenPortada,
        modal.data?.id ?? 'instituciones-pendientes',
      );
    }

    // Subir las nuevas imágenes de la galería.
    for (const file of nuevasImagenes) {
      const url = await subirImagenInstitucion(
        file,
        modal.data?.id ?? 'instituciones-pendientes',
      );
      imagenes.push(url);
    }

    const payload: InstitucionPayload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
      codigoInstitucional: form.codigoInstitucional.trim() || undefined,
      tipoInstitucion: form.tipoInstitucion || undefined,
      nivelesEducativos: form.nivelesEducativos as InstitucionPayload['nivelesEducativos'],
      director: form.director.trim() || undefined,
      encargador: form.encargador.trim() || undefined,
      email: form.email.trim() || undefined,
      telefono: form.telefono.trim() || undefined,
      telefonoAlternativo: form.telefonoAlternativo.trim() || undefined,
      sitioWeb: form.sitioWeb.trim() || undefined,
      direccion: form.direccion.trim() || undefined,
      departamento: form.departamento.trim() || undefined,
      provincia: form.provincia.trim() || undefined,
      municipio: form.municipio.trim() || undefined,
      zona: form.zona.trim() || undefined,
      latitud: form.latitud,
      longitud: form.longitud,
      numeroAlumnos: Number(form.numeroAlumnos) || 0,
      cantidadMaximaAlumnos: Number(form.cantidadMaximaAlumnos) || 0,
      turnos: form.turnos,
      imagenPrincipalUrl,
      imagenPortadaUrl,
      imagenes,
      activo: form.activo,
    };

    if (modal.data) {
      await updateInstitucion(modal.data.id, payload);
      toast('Institución actualizada', 'success');
    } else {
      await createInstitucion(payload);
      toast('Institución creada', 'success');
    }

    setModal({ open: false });
    setForm({ ...EMPTY });
    resetImages();
    setRefresh(r => r + 1);
  } catch (error) {
    console.error('Error guardando institución:', error);
    toast(
      error instanceof Error
        ? error.message
        : 'Error al guardar la institución',
      'error',
    );
  } finally {
    setSaving(false);
  }
};

  const handleToggle = async () => {
    if (!confirmToggle) return;

    try {
      await updateInstitucion(
        confirmToggle.id,
        {
          activo:
            !confirmToggle.activo,
        },
      );

      toast(
        `Institución ${
          confirmToggle.activo
            ? 'desactivada'
            : 'activada'
        }`,
        'success',
      );

      setRefresh(r => r + 1);
    } catch (error) {
      console.error(
        'Error cambiando estado:',
        error,
      );

      toast(
        'Error al cambiar el estado',
        'error',
      );
    } finally {
      setConfirmToggle(null);
    }
  };

  return (
    <>
      <CrudPage<UnidadEducativa>
        title="Instituciones Educativas"
        description="Gestiona las instituciones registradas en el sistema"
        refreshTrigger={refresh}
        fetchData={({ search }) =>
          getInstituciones({ search }).then(
            r => r,
          )
        }
        keyExtractor={r => r.id}
        onAdd={openCreate}
        addLabel="Nueva institución"
        columns={[
          
{
  key: 'nombre',
  label: 'Institución',
  render: r => (
    <div className="flex items-center gap-3 min-w-[220px]">
      {r.imagenPrincipalUrl ? (
        <img
          src={r.imagenPrincipalUrl}
          alt={`Imagen de ${r.nombre}`}
          className="h-14 w-14 rounded-xl object-cover border border-slate-200 bg-slate-100"
          onError={e => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}

      <div
        className={`h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 ${
          r.imagenPrincipalUrl ? 'hidden' : ''
        }`}
      >
        <Building2 size={26} />
      </div>

      <div className="min-w-0">
        <p className="font-semibold text-slate-700 text-sm truncate">
          {r.nombre}
        </p>
        <p className="text-xs text-slate-400 truncate max-w-[240px]">
          {r.direccion || 'Sin dirección'}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {r.tipoInstitucion ?? 'Tipo no especificado'}
        </p>
      </div>
    </div>
  ),
},

          {
            key: 'telefono',
            label: 'Teléfono',
            render: r =>
              r.telefono || '—',
          },

          {
            key: 'totalEstudiantes',
            label: 'Estudiantes',
            render: r => (
              <span className="font-semibold text-slate-700">
                {r.totalEstudiantes ?? 0}
              </span>
            ),
          },

          {
            key: 'totalCursos',
            label: 'Cursos',
            render: r => (
              <span className="text-slate-600">
                {r.totalCursos ?? 0}
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
                    label: 'Ver detalle',
                    icon: <Eye size={14} />,
                    onClick: () => setDetailModalItem(r), // <-- Abrirá el modal de detalles
                  },
                  {
                    label: 'Editar',
                    icon: <Edit2 size={14} />,
                    onClick: () => openEdit(r),
                  },
                  {
                    label: r.activo ? 'Desactivar' : 'Activar',
                    icon: r.activo ? (
                      <Ban size={14} /> // Icono de bloqueo/pausa (más claro que PowerOff)
                    ) : (
                      <CheckCircle size={14} /> // Icono de check (más claro que Power)
                    ),
                    onClick: () => setConfirmToggle(r),
                    variant: 'default',
                  },
                  {
                    // NUEVO BOTÓN: ELIMINAR DEFINITIVAMENTE
                    label: 'Eliminar',
                    icon: <Trash2 size={14} />,
                    onClick: () => setConfirmDelete(r), // <-- Abrirá el modal de confirmación
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
        onClose={() => {
  if (!saving) {
    setModal({ open: false });
    setForm({ ...EMPTY });
    resetImages();
  }
}}
        title={
          modal.data
            ? 'Editar institución'
            : 'Nueva institución'
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
              disabled={saving}
            >
              {saving
                ? 'Guardando...'
                : 'Guardar'}
            </button>
          </>
        }
      >

        
        
<div className="space-y-6 max-h-[65vh] overflow-y-auto pr-1">
  {/* INFORMACIÓN GENERAL */}
  <section className="space-y-3">
    <div className="flex items-center gap-2 border-b pb-2">
      <Building2 size={18} className="text-emerald-700" />
      <h3 className="font-semibold text-slate-700">Información general</h3>
    </div>

    <FormField label="Nombre de la institución" required>
      <Input
        value={form.nombre}
        onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
        placeholder="Unidad Educativa San Martín"
      />
    </FormField>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormField label="Código institucional">
        <Input
          value={form.codigoInstitucional}
          onChange={e => setForm(f => ({ ...f, codigoInstitucional: e.target.value }))}
          placeholder="Ej. UE-0001"
        />
      </FormField>

      <FormField label="Tipo de institución">
        <select
          value={form.tipoInstitucion}
          onChange={e => setForm(f => ({
            ...f,
            tipoInstitucion: e.target.value as InstitucionForm['tipoInstitucion'],
          }))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Seleccionar tipo</option>
          <option value="PUBLICA">Pública</option>
          <option value="PRIVADA">Privada</option>
          <option value="CONVENIO">Convenio</option>
        </select>
      </FormField>
    </div>

    <FormField label="Descripción">
      <textarea
        value={form.descripcion}
        onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
        rows={3}
        placeholder="Descripción de la institución..."
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
    </FormField>

    <div>
      <p className="text-sm font-medium text-slate-700 mb-2">Niveles educativos</p>
      <div className="grid grid-cols-2 gap-2">
        {['INICIAL', 'PRIMARIA', 'SECUNDARIA', 'TECNICO'].map(nivel => (
          <label key={nivel} className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.nivelesEducativos.includes(nivel)}
              onChange={e => setForm(f => ({
                ...f,
                nivelesEducativos: e.target.checked
                  ? [...f.nivelesEducativos, nivel]
                  : f.nivelesEducativos.filter(n => n !== nivel),
              }))}
            />
            {nivel === 'TECNICO' ? 'Técnico' : nivel.charAt(0) + nivel.slice(1).toLowerCase()}
          </label>
        ))}
      </div>
    </div>
  </section>

  {/* UBICACIÓN */}
  <section className="space-y-3">
    <div className="flex items-center justify-between border-b pb-2">
      <div className="flex items-center gap-2">
        <MapPin size={18} className="text-emerald-700" />
        <h3 className="font-semibold text-slate-700">Ubicación</h3>
      </div>

      {/* BOTÓN PARA ABRIR EL MAPA */}
      <button
        type="button"
        onClick={() => setIsMapOpen(true)}
        className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium transition shadow-sm"
      >
        <MapPin size={14} /> Seleccionar en Mapa
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {([
        ['departamento', 'Departamento'],
        ['provincia', 'Provincia'],
        ['municipio', 'Municipio'],
        ['zona', 'Zona / Barrio'],
      ] as const).map(([key, label]) => (
        <FormField key={key} label={label}>
          <Input
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            placeholder={label}
          />
        </FormField>
      ))}
    </div>

    <FormField label="Dirección">
      <Input
        value={form.direccion}
        onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
        placeholder="Av. Principal 123"
      />
    </FormField>

    <div className="grid grid-cols-2 gap-3">
      <FormField label="Latitud">
        <input
          type="number"
          step="any"
          value={form.latitud ?? ''}
          onChange={e =>
            setForm(f => ({
              ...f,
              latitud: e.target.value === '' ? null : Number(e.target.value),
            }))
          }
          placeholder="-16.5000"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </FormField>
      <FormField label="Longitud">
        <Input
          type="number"
          step="any"
          value={form.longitud ?? ''}
          onChange={e => setForm(f => ({
            ...f,
            longitud: e.target.value === '' ? null : Number(e.target.value),
          }))}
          placeholder="-68.1500"
        />
      </FormField>
    </div>
  </section>

  {/* CONTACTO */}
  <section className="space-y-3">
    <div className="flex items-center gap-2 border-b pb-2">
      <Globe size={18} className="text-emerald-700" />
      <h3 className="font-semibold text-slate-700">Contacto y responsables</h3>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormField label="Director">
        <Input
          value={form.director}
          onChange={e => setForm(f => ({ ...f, director: e.target.value }))}
          placeholder="Nombre del director"
        />
      </FormField>
      <FormField label="Encargado">
        <Input
          value={form.encargador}
          onChange={e => setForm(f => ({ ...f, encargador: e.target.value }))}
          placeholder="Nombre del encargado"
        />
      </FormField>
      <FormField label="Correo electrónico">
        
<input
  type="email"
  value={form.email}
  onChange={e =>
    setForm(f => ({ ...f, email: e.target.value }))
  }
  placeholder="contacto@colegio.edu.bo"
  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
/>
      </FormField>
      <FormField label="Teléfono principal">
        <Input
          value={form.telefono}
          onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
          placeholder="+591..."
        />
      </FormField>
      <FormField label="Teléfono alternativo">
        <Input
          value={form.telefonoAlternativo}
          onChange={e => setForm(f => ({ ...f, telefonoAlternativo: e.target.value }))}
          placeholder="+591..."
        />
      </FormField>
      <FormField label="Sitio web">
        <Input
          value={form.sitioWeb}
          onChange={e => setForm(f => ({ ...f, sitioWeb: e.target.value }))}
          placeholder="https://..."
        />
      </FormField>
    </div>
  </section>

  {/* CAPACIDAD */}
  <section className="space-y-3">
    <div className="flex items-center gap-2 border-b pb-2">
      <Users size={18} className="text-emerald-700" />
      <h3 className="font-semibold text-slate-700">Capacidad y funcionamiento</h3>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <FormField label="Número de alumnos">
        
<input
  type="number"
  min="0"
  value={form.numeroAlumnos}
  onChange={e =>
    setForm(f => ({
      ...f,
      numeroAlumnos: Number(e.target.value) || 0,
    }))
  }
  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
/>
      </FormField>
      <FormField label="Capacidad máxima">
        <Input
          type="number"
          value={form.cantidadMaximaAlumnos}
          onChange={e => setForm(f => ({ ...f, cantidadMaximaAlumnos: Number(e.target.value) || 0 }))}
        />
      </FormField>
    </div>

    <div>
      <p className="text-sm font-medium text-slate-700 mb-2">Turnos</p>
      <div className="flex flex-wrap gap-4">
        {['MAÑANA', 'TARDE', 'NOCHE'].map(turno => (
          <label key={turno} className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.turnos.includes(turno)}
              onChange={e => setForm(f => ({
                ...f,
                turnos: e.target.checked
                  ? [...f.turnos, turno]
                  : f.turnos.filter(t => t !== turno),
              }))}
            />
            {turno.charAt(0) + turno.slice(1).toLowerCase()}
          </label>
        ))}
      </div>
    </div>

    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={form.activo}
        onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
      />
      Institución activa
    </label>
  </section>

  {/* IMÁGENES */}
  <section className="space-y-3">
    <div className="flex items-center gap-2 border-b pb-2">
      <ImagePlus size={18} className="text-emerald-700" />
      <h3 className="font-semibold text-slate-700">Identidad visual</h3>
    </div>

    <p className="text-xs text-slate-500">
      La imagen principal identifica al colegio en el listado. Se permiten imágenes JPG, PNG o WebP de hasta 5 MB.
    </p>

    <FormField label="Imagen principal" required={!modal.data}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={e => setImagenPrincipal(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-800"
      />
    </FormField>

    {(previewPrincipal || form.imagenPrincipalUrl) ? (
      <div className="relative w-full max-w-sm">
        <img
          src={previewPrincipal || form.imagenPrincipalUrl || ''}
          alt="Vista previa de imagen principal"
          className="h-40 w-full rounded-xl object-cover border"
        />
        <button
          type="button"
          onClick={() => {
            setImagenPrincipal(null);
            setForm(f => ({ ...f, imagenPrincipalUrl: null }));
          }}
          className="absolute right-2 top-2 rounded-full bg-white p-2 text-red-600 shadow"
          aria-label="Quitar imagen principal"
        >
          <Trash2 size={16} />
        </button>
      </div>
    ) : (
      <div className="flex h-32 max-w-sm items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
        <div className="text-center">
          <Building2 size={30} className="mx-auto mb-1" />
          <p className="text-xs">Sin imagen principal</p>
        </div>
      </div>
    )}

    <FormField label="Imagen de portada (opcional)">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={e => setImagenPortada(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-800"
      />
    </FormField>

    {(previewPortada || form.imagenPortadaUrl) && (
      <div className="relative w-full">
        <img
          src={previewPortada || form.imagenPortadaUrl || ''}
          alt="Vista previa de portada"
          className="h-36 w-full rounded-xl object-cover border"
        />
        <button
          type="button"
          onClick={() => {
            setImagenPortada(null);
            setForm(f => ({ ...f, imagenPortadaUrl: null }));
          }}
          className="absolute right-2 top-2 rounded-full bg-white p-2 text-red-600 shadow"
          aria-label="Quitar portada"
        >
          <Trash2 size={16} />
        </button>
      </div>
    )}

    <FormField label="Galería (opcional)">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={e => setNuevasImagenes(Array.from(e.target.files ?? []))}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-800"
      />
    </FormField>

    {(form.imagenes.length > 0 || previewGaleria.length > 0) && (
      <div className="grid grid-cols-3 gap-2">
        {form.imagenes.map((url, index) => (
          <div key={`${url}-${index}`} className="relative">
            <img src={url} alt={`Imagen de galería ${index + 1}`} className="h-24 w-full rounded-lg object-cover border" />
            <button
              type="button"
              onClick={() => setForm(f => ({
                ...f,
                imagenes: f.imagenes.filter((_, i) => i !== index),
              }))}
              className="absolute right-1 top-1 rounded-full bg-white p-1 text-red-600 shadow"
              aria-label="Eliminar imagen de galería"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {previewGaleria.map((url, index) => (
          <div key={`${url}-${index}`} className="relative">
            <img src={url} alt={`Nueva imagen ${index + 1}`} className="h-24 w-full rounded-lg object-cover border" />
          </div>
        ))}
      </div>
    )}
  </section>
</div>

{/* MODAL DEL MAPA */}
      <MapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={handleLocationSelected}
        initialLat={form.latitud ?? -16.5000}
        initialLng={form.longitud ?? -68.1500}
      />

      </Modal>

      

      {/* ==========================================
          MODALES INDEPENDIENTES (FUERA DEL FORMULARIO)
          ========================================== */}

        {/* 1. MODAL: VER DETALLES COMPLETOS */}
        {detailModalItem && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

              {/* Cabecera con imagen de portada (si hay) o color sólido */}
              <div className="relative h-52 bg-slate-800 flex-shrink-0">
                {detailModalItem.imagen_portada_url && (
                  <img src={detailModalItem.imagen_portada_url} alt="Portada" className="w-full h-full object-cover opacity-60" />
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${detailModalItem.activo ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {detailModalItem.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                  <button onClick={() => setDetailModalItem(null)} className="bg-white/20 hover:bg-white/40 text-white rounded-full p-1 backdrop-blur-md transition">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Cuerpo del Modal */}
              <div className="px-6 pb-6 overflow-y-auto relative">
                {/* Imagen Principal tipo Perfil */}
                <div className="relative -mt-0 mb-4 flex items-end gap-4">
                  <div className="w-24 h-24 rounded-xl border-4 border-white bg-slate-100 shadow-md overflow-hidden flex-shrink-0">
                    {detailModalItem.imagen_principal_url ? (
                      <img src={detailModalItem.imagen_principal_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400"><Building2 size={40} /></div>
                    )}
                  </div>
                  <div className="pb-1">
                    <h3 className="text-2xl font-bold text-slate-800 leading-tight">{detailModalItem.nombre}</h3>
                    <p className="text-sm font-medium text-blue-600">{detailModalItem.codigo_institucional || 'Sin código'} • {detailModalItem.tipo_institucion}</p>
                  </div>
                </div>

                {detailModalItem.descripcion && (
                  <p className="text-sm text-slate-600 mb-6 italic border-l-4 border-slate-200 pl-3">{detailModalItem.descripcion}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bloque: Ubicación */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800 border-b pb-1 flex items-center gap-2"><MapPin size={16} className="text-slate-400" /> Ubicación</h4>
                    <ul className="text-sm text-slate-600 space-y-1.5">
                      <li><strong>Departamento:</strong> {detailModalItem.departamento || '-'}</li>
                      <li><strong>Provincia:</strong> {detailModalItem.provincia || '-'}</li>
                      <li><strong>Municipio:</strong> {detailModalItem.municipio || '-'}</li>
                      <li><strong>Zona:</strong> {detailModalItem.zona || '-'}</li>
                      <li><strong>Dirección:</strong> {detailModalItem.direccion || '-'}</li>
                      {(detailModalItem.latitud && detailModalItem.longitud) && (
                        <li className="text-xs font-mono bg-slate-100 p-1 rounded mt-1">GPS: {detailModalItem.latitud}, {detailModalItem.longitud}</li>
                      )}
                    </ul>
                  </div>

                  {/* Bloque: Contacto y Personal */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800 border-b pb-1 flex items-center gap-2"><Globe size={16} className="text-slate-400" /> Contacto y Directiva</h4>
                    <ul className="text-sm text-slate-600 space-y-1.5">
                      <li><strong>Director:</strong> {detailModalItem.director || '-'}</li>
                      <li><strong>Encargado:</strong> {detailModalItem.encargador || '-'}</li>
                      <li><strong>Email:</strong> {detailModalItem.email || '-'}</li>
                      <li><strong>Teléfonos:</strong> {detailModalItem.telefono || '-'} {detailModalItem.telefono_alternativo ? ` / ${detailModalItem.telefono_alternativo}` : ''}</li>
                      <li><strong>Sitio Web:</strong> {detailModalItem.sitio_web ? <a href={detailModalItem.sitio_web} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{detailModalItem.sitio_web}</a> : '-'}</li>
                    </ul>
                  </div>

                {/* Bloque: Datos Académicos */}
                <div className="space-y-3 md:col-span-2">
                  <h4 className="text-sm font-bold text-slate-800 border-b pb-1 flex items-center gap-2"><Users size={16} className="text-slate-400" /> Capacidad y Oferta Académica</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-400 font-semibold mb-1">ALUMNOS DECLARADOS</p>
                      <p className="text-lg font-bold text-slate-700">{detailModalItem.numeroAlumnos || detailModalItem.numero_alumnos || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-400 font-semibold mb-1">CAPACIDAD MAX.</p>
                      <p className="text-lg font-bold text-slate-700">{detailModalItem.cantidadMaximaAlumnos || detailModalItem.cantidad_maxima_alumnos || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-400 font-semibold mb-1">NIVELES</p>
                      <p className="font-medium text-slate-700 truncate">
                        {(() => {
                          const niveles = detailModalItem.nivelesEducativos || detailModalItem.niveles_educativos;
                          if (!niveles) return '-';
                          return Array.isArray(niveles) ? niveles.join(', ') : niveles.replace(/[\[\]"]/g, '');
                        })()}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-400 font-semibold mb-1">TURNOS</p>
                      <p className="font-medium text-slate-700 truncate">
                        {(() => {
                          const turnos = detailModalItem.turnos || detailModalItem.turnos_educativos; // Ajustado por si acaso
                          if (!turnos) return '-';
                          return Array.isArray(turnos) ? turnos.join(', ') : (typeof turnos === 'string' ? turnos.replace(/[\[\]"]/g, '') : '-');
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <span className="text-xs text-slate-400 font-mono">ID: {detailModalItem.id}</span>
                <button onClick={() => setDetailModalItem(null)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition shadow-sm">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. MODAL: CONFIRMAR ELIMINACIÓN DEFINITIVA */}
        {confirmDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Institución?</h3>
                <p className="text-slate-600 text-sm">
                  Estás a punto de eliminar definitivamente <strong>{confirmDelete.nombre}</strong>. Esta acción no se puede deshacer y borrará todos sus datos de la plataforma.
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

        {/* 3. DIÁLOGO ORIGINAL: ACTIVAR / DESACTIVAR */}
      <ConfirmDialog
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={handleToggle}
        title={confirmToggle?.activo ? 'Desactivar institución' : 'Activar institución'}
        message={`¿Confirmas ${confirmToggle?.activo ? 'desactivar' : 'activar'} "${confirmToggle?.nombre}"?`}
        confirmLabel={confirmToggle?.activo ? 'Desactivar' : 'Activar'}
        variant={confirmToggle?.activo ? 'danger' : 'warning'}
      />
      {/* NOTIFICACIÓN FLOTANTE (TOAST) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-800 text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce">
          {toastMessage.includes('Error') ? (
            <X size={20} className="text-red-400" />
          ) : (
            <CheckCircle size={20} className="text-green-400" />
          )}
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </>
  );
}