
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
} from 'lucide-react';

import { CrudPage } from '../../components/ui/CrudPage';
import { StatusBadge } from '../../components/ui/Badge';
import { ActionsMenu } from '../../components/ui/ActionsMenu';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input } from '../../components/ui/FormField';

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

  const [previewPrincipal, setPreviewPrincipal] = useState('');
  const [previewPortada, setPreviewPortada] = useState('');
  const [previewGaleria, setPreviewGaleria] = useState<string[]>([]);
  const { toast } = useToast();

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
                    icon: (
                      <Eye size={14} />
                    ),
                    onClick: () => {},
                  },

                  {
                    label: 'Editar',
                    icon: (
                      <Edit2 size={14} />
                    ),
                    onClick: () =>
                      openEdit(r),
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
    <div className="flex items-center gap-2 border-b pb-2">
      <MapPin size={18} className="text-emerald-700" />
      <h3 className="font-semibold text-slate-700">Ubicación</h3>
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
      </Modal>

      <ConfirmDialog
        open={!!confirmToggle}
        onClose={() =>
          setConfirmToggle(null)
        }
        onConfirm={handleToggle}
        title={
          confirmToggle?.activo
            ? 'Desactivar institución'
            : 'Activar institución'
        }
        message={`¿Confirmas ${
          confirmToggle?.activo
            ? 'desactivar'
            : 'activar'
        } "${confirmToggle?.nombre}"?`}
        confirmLabel={
          confirmToggle?.activo
            ? 'Desactivar'
            : 'Activar'
        }
        variant={
          confirmToggle?.activo
            ? 'danger'
            : 'warning'
        }
      />
    </>
  );
}