import React, { useState, useEffect } from 'react';
import { Building2, Globe, ImagePlus, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import {
  getSponsors,
  createSponsor,
  updateSponsor,
  type Sponsor,
} from '../../api/sponsors.api';
import { useToast } from '../../hooks/useToast';
import { FormField, Input } from '../../components/ui/FormField';
import { subirImagenInstitucion } from '../../services/storage';

const EMPTY_SPONSOR: Partial<Sponsor> = {
  nombre: '',
  tipoSponsor: 'OTRO',
  ubicacion: 'INICIO_APP',
  prioridad: 1,
  fotoPath: '',
  imagenes: [],
  rubro: '',
  descripcion: '',
  whatsapp: '',
  sitioWeb: '',
  activo: true,
};

export default function PatrocinadoresPage() {
  const { toast } = useToast();
  const [patrocinadores, setPatrocinadores] = useState<Sponsor[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Sponsor>>(EMPTY_SPONSOR);

  // Estados para la imagen principal
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState('');

  // Estados para la galería de imágenes
  const [nuevasImagenes, setNuevasImagenes] = useState<File[]>([]);
  const [previewGaleria, setPreviewGaleria] = useState<string[]>([]);

  const [guardando, setGuardando] = useState(false);

  const cargarSponsors = async () => {
    setCargando(true);
    try {
      const data = await getSponsors();
      setPatrocinadores(Array.isArray(data) ? data : []);
    } catch (error) {
      toast('Error al cargar patrocinadores', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSponsors();
  }, []);

  // Previsualización de imagen principal
  useEffect(() => {
    if (!imagenArchivo) {
      setPreviewImagen('');
      return;
    }
    const url = URL.createObjectURL(imagenArchivo);
    setPreviewImagen(url);
    return () => URL.revokeObjectURL(url);
  }, [imagenArchivo]);

  // Previsualización de la galería
  useEffect(() => {
    const urls = nuevasImagenes.map((file) => URL.createObjectURL(file));
    setPreviewGaleria(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [nuevasImagenes]);

  const resetFormulario = () => {
    setForm(EMPTY_SPONSOR);
    setImagenArchivo(null);
    setNuevasImagenes([]);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      let finalFotoPath = form.fotoPath;
      let finalImagenes = [...(form.imagenes ?? [])];
      const storageId = form.id ?? 'nuevo-sponsor';

      // 1. Subir imagen principal si existe
      if (imagenArchivo) {
        toast('Subiendo imagen principal...', 'info');
        finalFotoPath = await subirImagenInstitucion(imagenArchivo, storageId);
      }

      // Validar obligatoriedad de imagen principal en creación
      if (!form.id && !finalFotoPath) {
        toast('El logotipo o banner principal es obligatorio', 'error');
        setGuardando(false);
        return;
      }

      // 2. Subir las nuevas imágenes de la galería
      if (nuevasImagenes.length > 0) {
        toast('Subiendo galería de imágenes...', 'info');
        for (const file of nuevasImagenes) {
          const url = await subirImagenInstitucion(file, storageId);
          finalImagenes.push(url);
        }
      }

      // 🔴 AQUÍ EL CAMBIO: Extraemos y descartamos los campos que NestJS prohíbe editar
      const { id, createdAt, updatedAt, clicks, ...datosEditables } = form;

      const payload = {
        ...datosEditables,
        fotoPath: finalFotoPath,
        imagenes: finalImagenes,
        prioridad: Number(form.prioridad) || 1,
      };

      if (form.id) {
        await updateSponsor(form.id, payload);
        toast('Patrocinador actualizado', 'success');
      } else {
        await createSponsor(payload);
        toast('Patrocinador creado exitosamente', 'success');
      }

      setModalOpen(false);
      resetFormulario();
      cargarSponsors();
    } catch (error) {
      toast('Error al guardar patrocinador', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (sponsor: Sponsor) => {
    setForm({
      ...EMPTY_SPONSOR,
      ...sponsor,
      imagenes: sponsor.imagenes ?? [],
    });
    setImagenArchivo(null);
    setNuevasImagenes([]);
    setModalOpen(true);
  };

  const handleToggleActivo = async (sponsor: Sponsor) => {
    try {
      await updateSponsor(sponsor.id, { activo: !sponsor.activo });
      toast(
        !sponsor.activo ? 'Patrocinador activado' : 'Patrocinador desactivado',
        'success',
      );
      cargarSponsors();
    } catch {
      toast('Error al cambiar estado del patrocinador', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Patrocinadores y Publicidad</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gestión de banners, Leads (WhatsApp) y segmentación comercial
          </p>
        </div>

        <button
          onClick={() => { resetFormulario(); setModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center shadow-sm transition self-start sm:self-auto"
        >
          + Nuevo Anunciante
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[780px] text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Banner</th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Anunciante</th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Ubicación</th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">Estado / Vigencia</th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase text-center whitespace-nowrap">Leads (Clics)</th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400">Cargando anuncios...</td></tr>
              ) : patrocinadores.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400 italic">No hay pautas publicitarias activas.</td></tr>
              ) : (
                patrocinadores.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-4">
                      {item.fotoPath ? (
                        <img src={item.fotoPath} alt="Logo" className="w-16 h-12 object-cover rounded-md border border-slate-200 shadow-sm" />
                      ) : (
                        <div className="w-16 h-12 bg-slate-100 rounded-md flex items-center justify-center text-xs text-slate-400">Sin img</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 whitespace-nowrap">{item.nombre}</div>
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        {item.tipoSponsor.replace('_', ' ')} • {item.rubro || 'Sin rubro'}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                      {item.ubicacion.replace('_', ' ')}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${item.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {item.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                      {item.fechaFin && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          Hasta {new Date(item.fechaFin).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <span className="font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-md">
                        {item.clicks}
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActivo(item)}
                          className={`p-1.5 rounded-lg transition ${item.activo
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          title={item.activo ? 'Desactivar pauta' : 'Activar pauta'}
                        >
                          {item.activo ? <PowerOff size={17} /> : <Power size={17} />}
                        </button>
                        <button
                          onClick={() => handleEditar(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar Anuncio"
                        >
                          <Edit2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">{form.id ? 'Editar Pauta Publicitaria' : 'Nueva Pauta Publicitaria'}</h3>
              <button onClick={() => { setModalOpen(false); resetFormulario(); }} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleGuardar} className="overflow-y-auto p-5 space-y-6">

              {/* DATOS PRINCIPALES */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Building2 size={18} className="text-blue-700" />
                  <h3 className="font-semibold text-slate-700">Comercial y Segmentación</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Nombre de Institución/Campaña *" required>
                    <Input required type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Universidad Loyola - Robótica" />
                  </FormField>
                  <FormField label="Tipo de Anunciante">
                    <select value={form.tipoSponsor} onChange={e => setForm({ ...form, tipoSponsor: e.target.value as any })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="UNIVERSIDAD">Universidad</option>
                      <option value="INSTITUTO">Instituto Técnico</option>
                      <option value="CURSO_EXTRA">Cursos Extras (Nivelación)</option>
                      <option value="MARCA_COMERCIAL">Marca Comercial</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Rubro (Ej: Ingeniería, Gastronomía)">
                    <Input type="text" value={form.rubro} onChange={e => setForm({ ...form, rubro: e.target.value })} />
                  </FormField>
                  <FormField label="Prioridad de Visualización (1=Alto)">
                    <Input type="number" min="1" value={form.prioridad} onChange={e => setForm({ ...form, prioridad: Number(e.target.value) })} />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Fecha de Inicio de Pauta">
                    <input
                      type="date"
                      value={form.fechaInicio ? form.fechaInicio.split('T')[0] : ''}
                      onChange={e => setForm({ ...form, fechaInicio: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </FormField>
                  <FormField label="Fecha Límite (Fin de Pauta)">
                    <input
                      type="date"
                      value={form.fechaFin ? form.fechaFin.split('T')[0] : ''}
                      onChange={e => setForm({ ...form, fechaFin: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </FormField>
                </div>
              </section>

              {/* COMPORTAMIENTO APP */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Globe size={18} className="text-blue-700" />
                  <h3 className="font-semibold text-slate-700">Comportamiento y Enlaces</h3>
                </div>
                <FormField label="Ubicación del Banner">
                  <select value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value as any })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="INICIO_APP">Dashboard Principal (App)</option>
                    <option value="PANTALLA_JUEGOS">Modo Trivia (IA)</option>
                    <option value="MODAL_RESULTADOS">Resultados al Terminar</option>
                    <option value="PERFIL">Perfil del Estudiante</option>
                  </select>
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Enlace WhatsApp (Botón Contactar)">
                    <Input type="url" placeholder="https://wa.me/591..." value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
                  </FormField>
                  <FormField label="Sitio Web (Botón Visitar Web)">
                    <Input type="url" placeholder="https://instituto.edu.bo" value={form.sitioWeb} onChange={e => setForm({ ...form, sitioWeb: e.target.value })} />
                  </FormField>
                </div>
              </section>

              {/* MULTIMEDIA */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <ImagePlus size={18} className="text-blue-700" />
                  <h3 className="font-semibold text-slate-700">Diseño Visual y Galería</h3>
                </div>

                {/* Imagen Principal */}
                <FormField label="Banner Principal / Logotipo" required={!form.id && !form.fotoPath}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => setImagenArchivo(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700 font-medium"
                  />
                </FormField>
                {(previewImagen || form.fotoPath) && (
                  <div className="relative w-full max-w-sm mt-2 mb-4">
                    <img src={previewImagen || form.fotoPath || ''} alt="Banner Principal" className="h-32 w-full rounded-xl object-cover border border-slate-200 shadow-sm" />
                  </div>
                )}

                {/* Galería Secundaria */}
                <FormField label="Galería del Mini-Perfil (Opcional)">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={e => setNuevasImagenes(Array.from(e.target.files ?? []))}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-700 font-medium"
                  />
                </FormField>

                {((form.imagenes && form.imagenes.length > 0) || previewGaleria.length > 0) && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {/* Imágenes ya guardadas */}
                    {form.imagenes?.map((url, index) => (
                      <div key={`saved-${index}`} className="relative">
                        <img src={url} alt={`Galería ${index + 1}`} className="h-24 w-full rounded-lg object-cover border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, imagenes: f.imagenes?.filter((_, i) => i !== index) }))}
                          className="absolute right-1 top-1 rounded-full bg-white p-1 text-red-600 shadow"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {/* Imágenes por subir */}
                    {previewGaleria.map((url, index) => (
                      <div key={`new-${index}`} className="relative opacity-70">
                        <img src={url} alt={`Nueva ${index + 1}`} className="h-24 w-full rounded-lg object-cover border border-slate-200" />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <FormField label="Notas Internas de Pauta (Visibles solo para Admins)">
                <textarea rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: Pauta válida de Octubre a Diciembre. Contactar a Lic. Pérez." className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </FormField>

              <div className="flex items-center gap-2 pt-2 pb-4">
                <input type="checkbox" id="activo" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer" />
                <label htmlFor="activo" className="text-sm font-bold text-slate-700 cursor-pointer">Pauta Activa y Visible en App</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => { setModalOpen(false); resetFormulario(); }} className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition" disabled={guardando}>Cancelar</button>
                <button type="submit" disabled={guardando} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition disabled:opacity-50">
                  {guardando ? 'Guardando al servidor...' : 'Guardar Pauta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}