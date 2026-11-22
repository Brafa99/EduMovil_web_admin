import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    CreditCard,
    QrCode,
    Building2,
    Users,
    Plus,
    Search,
    X,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Trash2,
    RefreshCw,
    Crown,
    Clock,
    TrendingUp,
    Wallet,
    School,
    Edit2,
    Upload,
    ZoomIn,
    Image as ImageIcon,
    UserCheck,
    Layers,
    Loader2,
} from 'lucide-react';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { useToast } from '../../hooks/useToast';
import {
    getResumenFinanciero,
    getPagos,
    createPago,
    updatePago,
    updatePagoEstado,
    deletePago,
    asignarPagosPorColegio,
    getConfiguracionesQr,
    saveConfiguracionQr,
    deleteConfiguracionQr,
    getPagosSponsors,
    createPagoSponsor,
    updatePagoSponsor,
    updateEstadoPagoSponsor,
    deletePagoSponsor,
    getPagosReclutadores,
    createPagoReclutador,
    updatePagoReclutador,
    deletePagoReclutador,
    getEstudiantesSimple,
    getColegiosSimple,
    getCursosSimple,
    getSponsorsSimple,
    getUsuariosSimple,
    comprimirImagenABase64,
    PRECIOS_PLAN_BOB,
    type Pago,
    type PagoEstado,
    type MetodoPago,
    type PlanSuscripcion,
    type ResumenFinanciero,
    type ConfiguracionQr,
    type PagoSponsor,
    type PagoReclutador,
} from '../../api/pagos.api';

type TabPagos = 'SUSCRIPCIONES' | 'SPONSORS' | 'RECLUTADORES' | 'QR';
type AgrupacionTipo = 'NINGUNO' | 'COLEGIO' | 'CURSO';

const ESTADO_STYLE: Record<PagoEstado, string> = {
    PENDIENTE: 'bg-amber-100 text-amber-800 border-amber-200',
    APROBADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    RECHAZADO: 'bg-rose-100 text-rose-800 border-rose-200',
    REEMBOLSADO: 'bg-purple-100 text-purple-800 border-purple-200',
    CANCELADO: 'bg-slate-200 text-slate-700 border-slate-300',
    EXPIRADO: 'bg-orange-100 text-orange-800 border-orange-200',
};

const fmtBob = (v?: number | string | null) =>
    `Bs. ${Number(v || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso?: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Componente reutilizable para subir imagen desde galería/cámara/PC + URL opcional */
function ImageUploadField({
    label,
    required,
    value,
    onChange,
    hint,
}: {
    label: string;
    required?: boolean;
    value: string;
    onChange: (val: string) => void;
    hint?: string;
}) {
    const [procesando, setProcesando] = useState(false);
    const [mostrarUrl, setMostrarUrl] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProcesando(true);
        try {
            const base64 = await comprimirImagenABase64(file);
            onChange(base64);
        } catch {
            alert('No se pudo procesar la imagen. Intenta con otro archivo.');
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
                <button
                    type="button"
                    onClick={() => setMostrarUrl((v) => !v)}
                    className="text-[11px] text-purple-600 hover:underline font-medium"
                >
                    {mostrarUrl ? 'Ocultar enlace URL' : '¿Prefieres pegar URL?'}
                </button>
            </div>

            {value ? (
                <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 flex items-center gap-3">
                    <img src={value} alt="Vista previa" className="h-20 w-20 object-cover rounded border bg-white" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-700">Comprobante cargado</p>
                        <p className="text-[11px] text-slate-400 truncate">
                            {value.startsWith('data:') ? 'Imagen subida desde dispositivo' : value}
                        </p>
                        <label className="inline-flex items-center gap-1 mt-1.5 text-xs text-purple-600 font-medium cursor-pointer hover:underline">
                            <Upload size={12} /> Cambiar imagen
                            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                        </label>
                    </div>
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        title="Quitar imagen"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-purple-400 rounded-lg p-4 bg-slate-50/70 cursor-pointer transition-colors text-center">
                    <Upload size={22} className="text-purple-500 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">
                        {procesando ? 'Comprimiendo imagen...' : 'Toca aquí para subir foto o captura'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                        {hint || 'Galería del celular, cámara o archivos de tu PC (JPG, PNG)'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </label>
            )}

            {mostrarUrl && (
                <Input
                    value={value.startsWith('data:') ? '' : value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://... (opcional)"
                />
            )}
        </div>
    );
}

export default function Pagos() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<TabPagos>('SUSCRIPCIONES');
    const [loading, setLoading] = useState(false);

    // Datos principales
    const [resumen, setResumen] = useState<ResumenFinanciero | null>(null);
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [pagosSponsors, setPagosSponsors] = useState<PagoSponsor[]>([]);
    const [pagosReclutadores, setPagosReclutadores] = useState<PagoReclutador[]>([]);
    const [qrs, setQrs] = useState<ConfiguracionQr[]>([]);

    // Catálogos auxiliares
    const [estudiantes, setEstudiantes] = useState<any[]>([]);
    const [colegios, setColegios] = useState<any[]>([]);
    const [cursos, setCursos] = useState<any[]>([]);
    const [sponsors, setSponsors] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);

    // Filtros y agrupación de Suscripciones
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState<string>('');
    const [colegioFiltro, setColegioFiltro] = useState<string>('');
    const [cursoFiltro, setCursoFiltro] = useState<string>('');
    const [metodoFiltro, setMetodoFiltro] = useState<string>('');
    const [agruparPor, setAgruparPor] = useState<AgrupacionTipo>('NINGUNO');

    // Modales y visores
    const [modalPago, setModalPago] = useState<{ open: boolean; editando?: Pago }>({ open: false });
    const [visorComprobante, setVisorComprobante] = useState<Pago | null>(null);
    const [visorImagen, setVisorImagen] = useState<{
        url: string;
        titulo: string;
        subtitulo?: string;
    } | null>(null);
    const [modalMasivo, setModalMasivo] = useState(false);
    const [modalSponsor, setModalSponsor] = useState<{ open: boolean; editando?: PagoSponsor }>({ open: false });
    const [modalReclutador, setModalReclutador] = useState<{ open: boolean; editando?: PagoReclutador }>({ open: false });
    const [modalQr, setModalQr] = useState<{ open: boolean; data?: ConfiguracionQr }>({ open: false });
    const [modalEstado, setModalEstado] = useState<{
        open: boolean;
        pago?: Pago;
        nuevoEstado?: PagoEstado;
    }>({ open: false });
    const [motivoAccion, setMotivoAccion] = useState('');

    // Confirmaciones de eliminación
    const [confirmDelete, setConfirmDelete] = useState<Pago | null>(null);
    const [confirmDeleteSponsor, setConfirmDeleteSponsor] = useState<PagoSponsor | null>(null);
    const [confirmDeleteReclutador, setConfirmDeleteReclutador] = useState<PagoReclutador | null>(null);
    const [saving, setSaving] = useState(false);

    // Form: Crear / Editar Pago Estudiante
    const [estSearch, setEstSearch] = useState('');
    const [estMenuOpen, setEstMenuOpen] = useState(false);
    const [formPago, setFormPago] = useState({
        estudianteId: '',
        unidadEducativaId: '',
        plan: 'MENSUAL' as PlanSuscripcion,
        monto: PRECIOS_PLAN_BOB.MENSUAL,
        metodoPago: 'QR_TRANSFERENCIA' as MetodoPago,
        estado: 'PENDIENTE' as PagoEstado,
        comprobanteUrl: '',
        referenciaExterno: '',
        notasAdmin: '',
    });

    // Form: Masivo por Colegio
    const [formMasivo, setFormMasivo] = useState({
        colegioId: '',
        meses: 'mensual',
        year: new Date().getFullYear(),
        monto: '15.00',
        metodoPago: 'QR_TRANSFERENCIA' as MetodoPago,
    });

    // Form: Pago Sponsor
    const [formSponsor, setFormSponsor] = useState({
        sponsorId: '',
        monto: 500,
        metodoPago: 'QR_TRANSFERENCIA' as MetodoPago,
        estado: 'APROBADO' as PagoEstado,
        periodoInicio: new Date().toISOString().slice(0, 10),
        periodoFin: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        comprobanteUrl: '',
        notas: '',
    });

    // Form: Pago Reclutador
    const [formReclutador, setFormReclutador] = useState({
        reclutadorId: '',
        tipo: 'COMISION',
        monto: 200,
        periodo: new Date().toISOString().slice(0, 7),
        estado: 'APROBADO' as PagoEstado,
        comprobanteUrl: '',
        notas: '',
    });

    // Form: QR Oficial
    const [formQr, setFormQr] = useState({
        id: '',
        banco: '',
        titular: '',
        numeroCuenta: '',
        qrImagenUrl: '',
        instrucciones: 'Coloca tu código EDU-XXXX en la glosa al transferir.',
        activo: true,
    });

    // Debounce solo para el input de texto; los selectores recargan al instante
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 250);
        return () => clearTimeout(t);
    }, [search]);

    const cargarTodo = useCallback(async () => {
        setLoading(true);
        try {
            const [resResumen, resPagos, resSponsors, resReclutadores, resQrs] = await Promise.all([
                getResumenFinanciero().catch(() => null),
                getPagos({
                    estado: estadoFiltro || undefined,
                    unidadEducativaId: colegioFiltro || undefined,
                    cursoId: cursoFiltro || undefined,
                    metodoPago: metodoFiltro || undefined,
                    search: debouncedSearch || undefined,
                }),
                getPagosSponsors().catch(() => []),
                getPagosReclutadores().catch(() => []),
                getConfiguracionesQr().catch(() => []),
            ]);
            setResumen(resResumen);
            setPagos(resPagos);
            setPagosSponsors(resSponsors);
            setPagosReclutadores(resReclutadores);
            setQrs(resQrs);
        } catch (error) {
            console.error(error);
            toast('Error cargando información financiera', 'error');
        } finally {
            setLoading(false);
        }
    }, [estadoFiltro, colegioFiltro, cursoFiltro, metodoFiltro, debouncedSearch, toast]);

    useEffect(() => {
        cargarTodo();
    }, [cargarTodo]);

    useEffect(() => {
        Promise.all([
            getEstudiantesSimple().catch(() => []),
            getColegiosSimple().catch(() => []),
            getCursosSimple().catch(() => []),
            getSponsorsSimple().catch(() => []),
            getUsuariosSimple().catch(() => []),
        ]).then(([est, col, cur, spo, usr]) => {
            setEstudiantes(est);
            setColegios(col);
            setCursos(cur);
            setSponsors(spo);
            setUsuarios(usr);
        });
    }, []);

    // Cursos filtrados por colegio seleccionado
    const cursosVisibles = useMemo(() => {
        if (!colegioFiltro) return cursos;
        return cursos.filter((c) => c.unidadEducativaId === colegioFiltro);
    }, [cursos, colegioFiltro]);

    // Agrupación de pagos para vista por Colegio o Curso
    const pagosAgrupados = useMemo(() => {
        if (agruparPor === 'NINGUNO') {
            return [{ titulo: '', items: pagos, totalMonto: pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0) }];
        }
        const mapa = new Map<string, Pago[]>();
        pagos.forEach((p) => {
            const key =
                agruparPor === 'COLEGIO'
                    ? p.unidadEducativa?.nombre || 'Sin Colegio'
                    : p.estudiante?.cursoActual
                        ? `${p.estudiante.cursoActual.nombre} ${p.estudiante.cursoActual.paralelo || ''}`.trim() +
                        ` — ${p.unidadEducativa?.nombre || ''}`
                        : `Sin Curso asignado — ${p.unidadEducativa?.nombre || ''}`;
            if (!mapa.has(key)) mapa.set(key, []);
            mapa.get(key)!.push(p);
        });
        return Array.from(mapa.entries()).map(([titulo, items]) => ({
            titulo,
            items,
            totalMonto: items.reduce((acc, p) => acc + Number(p.monto || 0), 0),
        }));
    }, [pagos, agruparPor]);

    const estudiantesFiltrados = estudiantes
        .filter((e) => {
            const q = estSearch.toLowerCase().trim();
            if (!q) return true;
            const full = `${e.nombres || ''} ${e.apellidos || ''} ${e.ci || ''} ${e.codigoRude || ''}`.toLowerCase();
            return full.includes(q);
        })
        .slice(0, 30);

    const renderPadres = (p: Pago) => {
        const lista = p.estudiante?.padres || [];
        if (lista.length === 0) return <span className="text-xs text-slate-400 italic">Sin padre vinculado</span>;
        return (
            <div className="space-y-0.5">
                {lista.map(({ padre }) => (
                    <div key={padre.id} className="text-xs">
                        <span className="font-medium text-slate-700">
                            {padre.nombres} {padre.apellidos}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">({padre.parentesco})</span>
                        {padre.telefono && <p className="text-[11px] text-slate-500">Tel: {padre.telefono}</p>}
                    </div>
                ))}
            </div>
        );
    };

    // --- HANDLERS SUSCRIPCIONES ---
    const abrirNuevoPago = () => {
        setEstSearch('');
        setFormPago({
            estudianteId: '',
            unidadEducativaId: '',
            plan: 'MENSUAL',
            monto: PRECIOS_PLAN_BOB.MENSUAL,
            metodoPago: 'QR_TRANSFERENCIA',
            estado: 'PENDIENTE',
            comprobanteUrl: '',
            referenciaExterno: '',
            notasAdmin: '',
        });
        setModalPago({ open: true, editando: undefined });
    };

    const abrirEditarPago = (p: Pago) => {
        setEstSearch(`${p.estudiante?.nombres || ''} ${p.estudiante?.apellidos || ''}`);
        setFormPago({
            estudianteId: p.estudianteId,
            unidadEducativaId: p.unidadEducativaId,
            plan: p.plan,
            monto: Number(p.monto),
            metodoPago: p.metodoPago,
            estado: p.estado,
            comprobanteUrl: p.comprobanteUrl || '',
            referenciaExterno: p.referenciaExterno || '',
            notasAdmin: p.notasAdmin || '',
        });
        setModalPago({ open: true, editando: p });
    };

    const handleGuardarPago = async () => {
        if (!modalPago.editando && !formPago.estudianteId) {
            return toast('Selecciona un estudiante', 'error');
        }
        if (Number(formPago.monto) <= 0) {
            return toast('El monto debe ser mayor a 0', 'error');
        }
        if (!formPago.comprobanteUrl.trim()) {
            return toast('Debes subir la captura del QR o foto del comprobante/efectivo', 'error');
        }

        setSaving(true);
        try {
            if (modalPago.editando) {
                await updatePago(modalPago.editando.id, {
                    monto: Number(formPago.monto),
                    plan: formPago.plan,
                    metodoPago: formPago.metodoPago,
                    comprobanteUrl: formPago.comprobanteUrl,
                    referenciaExterno: formPago.referenciaExterno || undefined,
                    notasAdmin: formPago.notasAdmin || undefined,
                });
                toast('Pago actualizado correctamente', 'success');
            } else {
                await createPago({
                    ...formPago,
                    monto: Number(formPago.monto),
                    comprobanteUrl: formPago.comprobanteUrl,
                    referenciaExterno: formPago.referenciaExterno || undefined,
                    notasAdmin: formPago.notasAdmin || undefined,
                });
                toast(
                    formPago.estado === 'APROBADO'
                        ? 'Pago registrado y estudiante activado en modo PLUS'
                        : 'Pago registrado en estado PENDIENTE',
                    'success',
                );
            }
            setModalPago({ open: false });
            await cargarTodo();
        } catch (e: any) {
            toast(e?.message || 'Error al guardar pago', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleAprobarRapido = async (pago: Pago) => {
        try {
            await updatePagoEstado(pago.id, { estado: 'APROBADO' });
            toast(`Pago ${pago.codigoPago || ''} aprobado. Estudiante ahora es PLUS.`, 'success');
            setVisorComprobante(null);
            await cargarTodo();
        } catch (e: any) {
            toast(e?.message || 'No se pudo aprobar el pago', 'error');
        }
    };

    const handleConfirmarCambioEstado = async () => {
        if (!modalEstado.pago || !modalEstado.nuevoEstado) return;
        setSaving(true);
        try {
            await updatePagoEstado(modalEstado.pago.id, {
                estado: modalEstado.nuevoEstado,
                notasAdmin: motivoAccion || undefined,
                motivoReembolso:
                    modalEstado.nuevoEstado === 'REEMBOLSADO' || modalEstado.nuevoEstado === 'CANCELADO'
                        ? motivoAccion || 'Procesado por administración'
                        : undefined,
            });
            toast(`Estado actualizado a ${modalEstado.nuevoEstado}`, 'success');
            setModalEstado({ open: false });
            setVisorComprobante(null);
            setMotivoAccion('');
            await cargarTodo();
        } catch (e: any) {
            toast(e?.message || 'Error al actualizar estado', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEliminarPago = async () => {
        if (!confirmDelete) return;
        try {
            await deletePago(confirmDelete.id);
            toast('Pago eliminado', 'success');
            setConfirmDelete(null);
            await cargarTodo();
        } catch {
            toast('Error al eliminar pago', 'error');
        }
    };

    const handleAsignacionMasiva = async () => {
        if (!formMasivo.colegioId) return toast('Selecciona un colegio', 'error');
        setSaving(true);
        try {
            const res: any = await asignarPagosPorColegio(formMasivo.colegioId, {
                meses: formMasivo.meses,
                year: Number(formMasivo.year),
                monto: String(formMasivo.monto),
                metodoPago: formMasivo.metodoPago,
            });
            toast(`Masivo completado: ${res?.creados ?? 0} creados, ${res?.existentes ?? 0} ya existían.`, 'success');
            setModalMasivo(false);
            await cargarTodo();
        } catch (e: any) {
            toast(e?.message || 'Error en asignación masiva', 'error');
        } finally {
            setSaving(false);
        }
    };

    // --- HANDLERS SPONSORS ---
    const abrirNuevoSponsor = () => {
        setFormSponsor({
            sponsorId: '',
            monto: 500,
            metodoPago: 'QR_TRANSFERENCIA',
            estado: 'APROBADO',
            periodoInicio: new Date().toISOString().slice(0, 10),
            periodoFin: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            comprobanteUrl: '',
            notas: '',
        });
        setModalSponsor({ open: true, editando: undefined });
    };

    const abrirEditarSponsor = (ps: PagoSponsor) => {
        setFormSponsor({
            sponsorId: ps.sponsorId,
            monto: Number(ps.monto),
            metodoPago: ps.metodoPago,
            estado: ps.estado,
            periodoInicio: ps.periodoInicio ? ps.periodoInicio.slice(0, 10) : '',
            periodoFin: ps.periodoFin ? ps.periodoFin.slice(0, 10) : '',
            comprobanteUrl: ps.comprobanteUrl || '',
            notas: ps.notas || '',
        });
        setModalSponsor({ open: true, editando: ps });
    };

    const handleGuardarPagoSponsor = async () => {
        if (!formSponsor.sponsorId) return toast('Selecciona un patrocinador', 'error');
        if (!formSponsor.comprobanteUrl) return toast('Sube el comprobante del pago', 'error');
        setSaving(true);
        try {
            if (modalSponsor.editando) {
                await updatePagoSponsor(modalSponsor.editando.id, { ...formSponsor, monto: Number(formSponsor.monto) });
                toast('Cobro de patrocinador actualizado', 'success');
            } else {
                await createPagoSponsor({ ...formSponsor, monto: Number(formSponsor.monto) });
                toast('Cobro de patrocinador registrado', 'success');
            }
            setModalSponsor({ open: false });
            await cargarTodo();
        } catch {
            toast('Error al guardar cobro de patrocinador', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEliminarSponsor = async () => {
        if (!confirmDeleteSponsor) return;
        try {
            await deletePagoSponsor(confirmDeleteSponsor.id);
            toast('Cobro de patrocinador eliminado', 'success');
            setConfirmDeleteSponsor(null);
            await cargarTodo();
        } catch {
            toast('Error al eliminar cobro de patrocinador', 'error');
        }
    };

    // --- HANDLERS RECLUTADORES ---
    const abrirNuevoReclutador = () => {
        setFormReclutador({
            reclutadorId: '',
            tipo: 'COMISION',
            monto: 200,
            periodo: new Date().toISOString().slice(0, 7),
            estado: 'APROBADO',
            comprobanteUrl: '',
            notas: '',
        });
        setModalReclutador({ open: true, editando: undefined });
    };

    const abrirEditarReclutador = (pr: PagoReclutador) => {
        setFormReclutador({
            reclutadorId: pr.reclutadorId,
            tipo: pr.tipo,
            monto: Number(pr.monto),
            periodo: pr.periodo,
            estado: pr.estado,
            comprobanteUrl: pr.comprobanteUrl || '',
            notas: pr.notas || '',
        });
        setModalReclutador({ open: true, editando: pr });
    };

    const handleGuardarPagoReclutador = async () => {
        if (!formReclutador.reclutadorId) return toast('Selecciona un reclutador/encuestador', 'error');
        setSaving(true);
        try {
            if (modalReclutador.editando) {
                await updatePagoReclutador(modalReclutador.editando.id, {
                    ...formReclutador,
                    monto: Number(formReclutador.monto),
                });
                toast('Pago a reclutador actualizado', 'success');
            } else {
                await createPagoReclutador({ ...formReclutador, monto: Number(formReclutador.monto) });
                toast('Pago a reclutador registrado', 'success');
            }
            setModalReclutador({ open: false });
            await cargarTodo();
        } catch {
            toast('Error al guardar pago a reclutador', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEliminarReclutador = async () => {
        if (!confirmDeleteReclutador) return;
        try {
            await deletePagoReclutador(confirmDeleteReclutador.id);
            toast('Pago a reclutador eliminado', 'success');
            setConfirmDeleteReclutador(null);
            await cargarTodo();
        } catch {
            toast('Error al eliminar pago a reclutador', 'error');
        }
    };

    // --- HANDLERS QR OFICIAL ---
    const handleGuardarQr = async () => {
        if (!formQr.banco.trim() || !formQr.titular.trim() || !formQr.qrImagenUrl.trim()) {
            return toast('Banco, Titular y la imagen del QR son obligatorios', 'error');
        }
        setSaving(true);
        try {
            await saveConfiguracionQr({
                ...(formQr.id ? { id: formQr.id } : {}),
                banco: formQr.banco,
                titular: formQr.titular,
                numeroCuenta: formQr.numeroCuenta || undefined,
                qrImagenUrl: formQr.qrImagenUrl,
                instrucciones: formQr.instrucciones || undefined,
                activo: formQr.activo,
            });
            toast('Configuración QR guardada', 'success');
            setModalQr({ open: false });
            await cargarTodo();
        } catch {
            toast('Error al guardar QR', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5 pb-10">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Wallet className="text-purple-600" size={24} />
                        Centro Financiero y Suscripciones
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Validación de comprobantes QR/Efectivo, activación Plus en tiempo real, sponsors y comisiones.
                    </p>
                </div>
                <button
                    onClick={cargarTodo}
                    className="btn-secondary text-xs sm:text-sm flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    Actualizar
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="card p-4 border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                        <span>Ingresos del Mes</span>
                        <TrendingUp size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-slate-800 mt-1">
                        {fmtBob((resumen?.ingresosEstudiantesMes || 0) + (resumen?.ingresosSponsorsMes || 0))}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Estudiantes: {fmtBob(resumen?.ingresosEstudiantesMes)} · Sponsors: {fmtBob(resumen?.ingresosSponsorsMes)}
                    </p>
                </div>

                <div className="card p-4 border-l-4 border-amber-500">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                        <span>Pendientes por Validar</span>
                        <Clock size={16} className="text-amber-600" />
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-amber-700 mt-1">{resumen?.pagosPendientes ?? 0}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Esperando revisión de comprobante</p>
                </div>

                <div className="card p-4 border-l-4 border-purple-600">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                        <span>Estudiantes PLUS Activos</span>
                        <Crown size={16} className="text-purple-600" />
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-purple-700 mt-1">
                        {resumen?.estudiantesPlusActivos ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Con acceso total a IA y juegos</p>
                </div>

                <div className="card p-4 border-l-4 border-sky-500">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                        <span>Balance Neto (Mes)</span>
                        <Wallet size={16} className="text-sky-600" />
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-slate-800 mt-1">{fmtBob(resumen?.balanceNetoMes)}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                        Equipo: {fmtBob(resumen?.egresosReclutadoresMes)} · Reemb: {fmtBob(resumen?.reembolsosMes)}
                    </p>
                </div>
            </div>

            {/* PESTAÑAS */}
            <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200">
                {(
                    [
                        { id: 'SUSCRIPCIONES', label: 'Suscripciones', icon: <CreditCard size={16} />, badge: resumen?.pagosPendientes },
                        { id: 'SPONSORS', label: 'Patrocinadores', icon: <Building2 size={16} /> },
                        { id: 'RECLUTADORES', label: 'Reclutadores', icon: <Users size={16} /> },
                        { id: 'QR', label: 'QR Oficial', icon: <QrCode size={16} /> },
                    ] as const
                ).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {'badge' in tab && (tab.badge ?? 0) > 0 && (
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* INDICADOR AUTOMÁTICO DE CARGA */}
            {loading && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium">
                    <Loader2 size={15} className="animate-spin shrink-0" />
                    Actualizando registros y balances en tiempo real...
                </div>
            )}

            {/* ==================== TAB 1: SUSCRIPCIONES ==================== */}
            {activeTab === 'SUSCRIPCIONES' && (
                <div className="space-y-4">
                    {/* Barra de filtros avanzados + Agrupación */}
                    <div className="card p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                            <div className="relative sm:col-span-2">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar estudiante, padre/tutor, CI o código EDU-..."
                                    className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                            </div>

                            <select
                                value={colegioFiltro}
                                onChange={(e) => {
                                    setColegioFiltro(e.target.value);
                                    setCursoFiltro('');
                                }}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Todos los colegios</option>
                                {colegios.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>

                            <select
                                value={cursoFiltro}
                                onChange={(e) => setCursoFiltro(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Todos los cursos</option>
                                {cursosVisibles.map((cur) => (
                                    <option key={cur.id} value={cur.id}>
                                        {cur.nombre}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={estadoFiltro}
                                onChange={(e) => setEstadoFiltro(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Todos los estados</option>
                                <option value="PENDIENTE">Pendientes</option>
                                <option value="APROBADO">Aprobados (Plus)</option>
                                <option value="RECHAZADO">Rechazados</option>
                                <option value="REEMBOLSADO">Reembolsados</option>
                                <option value="CANCELADO">Cancelados</option>
                                <option value="EXPIRADO">Expirados</option>
                            </select>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100">
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={metodoFiltro}
                                    onChange={(e) => setMetodoFiltro(e.target.value)}
                                    className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                                >
                                    <option value="">Método: Todos</option>
                                    <option value="QR_TRANSFERENCIA">Solo QR / Transferencia</option>
                                    <option value="EFECTIVO">Solo Efectivo</option>
                                </select>

                                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                    <Layers size={14} className="text-purple-600" />
                                    <span>Agrupar:</span>
                                    <select
                                        value={agruparPor}
                                        onChange={(e) => setAgruparPor(e.target.value as AgrupacionTipo)}
                                        className="bg-transparent font-semibold text-slate-800 focus:outline-none"
                                    >
                                        <option value="NINGUNO">Individual</option>
                                        <option value="COLEGIO">Por Colegio</option>
                                        <option value="CURSO">Por Curso</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={abrirNuevoPago}
                                    className="btn-primary text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700"
                                >
                                    <Plus size={16} /> Registrar Pago
                                </button>
                                <button
                                    onClick={() => setModalMasivo(true)}
                                    className="btn-secondary text-xs sm:text-sm flex items-center justify-center gap-1.5"
                                >
                                    <School size={16} /> Masivo por Colegio
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* LISTADO (Agrupado o Individual) */}
                    {pagosAgrupados.map((grupo, idx) => (
                        <div key={grupo.titulo || idx} className="space-y-2">
                            {grupo.titulo && (
                                <div className="flex items-center justify-between bg-purple-50 border border-purple-200 px-4 py-2 rounded-lg">
                                    <span className="font-bold text-purple-900 text-sm">
                                        {grupo.titulo} ({grupo.items.length} pagos)
                                    </span>
                                    <span className="font-bold text-purple-700 text-sm">Subtotal: {fmtBob(grupo.totalMonto)}</span>
                                </div>
                            )}

                            {/* Vista Desktop: Tabla */}
                            <div className="hidden md:block card overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Comprobante / Cód.</th>
                                            <th className="px-4 py-3">Estudiante / Curso / Colegio</th>
                                            <th className="px-4 py-3">Padre / Madre / Tutor</th>
                                            <th className="px-4 py-3">Plan / Monto</th>
                                            <th className="px-4 py-3">Estado / Vigencia</th>
                                            <th className="px-4 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {grupo.items.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                                                    No hay pagos registrados con estos filtros.
                                                </td>
                                            </tr>
                                        ) : (
                                            grupo.items.map((p) => (
                                                <tr key={p.id} className="hover:bg-slate-50/70">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            {p.comprobanteUrl ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setVisorComprobante(p)}
                                                                    className="relative group shrink-0 rounded-lg overflow-hidden border border-slate-200 w-12 h-12 bg-slate-100"
                                                                    title="Ampliar comprobante para validar"
                                                                >
                                                                    <img
                                                                        src={p.comprobanteUrl}
                                                                        alt="Comprobante"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                        <ZoomIn size={16} className="text-white" />
                                                                    </div>
                                                                </button>
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-300 shrink-0">
                                                                    <ImageIcon size={16} />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <span className="font-mono font-bold text-purple-700 text-xs bg-purple-50 px-2 py-0.5 rounded">
                                                                    {p.codigoPago || 'SIN-COD'}
                                                                </span>
                                                                <p className="text-[11px] text-slate-400 mt-1">{fmtDate(p.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-slate-800">
                                                                {p.estudiante?.nombres} {p.estudiante?.apellidos}
                                                            </span>
                                                            {p.estudiante?.esPlus && (
                                                                <span title="Plus Activo">
                                                                    <Crown size={14} className="text-amber-500" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500">
                                                            {p.estudiante?.cursoActual
                                                                ? `${p.estudiante.cursoActual.nombre}`
                                                                : 'Sin curso'}
                                                            {' · '}
                                                            <span className="text-slate-400">{p.unidadEducativa?.nombre || '—'}</span>
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">{renderPadres(p)}</td>
                                                    <td className="px-4 py-3">
                                                        <p className="font-bold text-slate-800">{fmtBob(p.monto)}</p>
                                                        <p className="text-[11px] text-slate-500">
                                                            {p.plan} · {p.metodoPago === 'QR_TRANSFERENCIA' ? 'QR' : 'Efectivo'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${ESTADO_STYLE[p.estado]
                                                                }`}
                                                        >
                                                            {p.estado}
                                                        </span>
                                                        <p className="text-[11px] text-slate-400 mt-1">
                                                            {p.validoHasta ? `Hasta ${fmtDate(p.validoHasta)}` : 'Sin activar'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {p.comprobanteUrl && (
                                                                <button
                                                                    onClick={() => setVisorComprobante(p)}
                                                                    className="p-1.5 text-sky-600 hover:bg-sky-50 rounded"
                                                                    title="Ampliar QR/Comprobante"
                                                                >
                                                                    <ZoomIn size={16} />
                                                                </button>
                                                            )}
                                                            {p.estado === 'PENDIENTE' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleAprobarRapido(p)}
                                                                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded flex items-center gap-1"
                                                                        title="Aprobar y activar PLUS"
                                                                    >
                                                                        <CheckCircle2 size={14} /> Aprobar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setMotivoAccion('');
                                                                            setModalEstado({ open: true, pago: p, nuevoEstado: 'RECHAZADO' });
                                                                        }}
                                                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                                                                        title="Rechazar"
                                                                    >
                                                                        <XCircle size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {p.estado === 'APROBADO' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setMotivoAccion('');
                                                                        setModalEstado({ open: true, pago: p, nuevoEstado: 'REEMBOLSADO' });
                                                                    }}
                                                                    className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                                                                    title="Reembolsar / Cancelar"
                                                                >
                                                                    <RotateCcw size={15} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => abrirEditarPago(p)}
                                                                className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                                                                title="Editar pago"
                                                            >
                                                                <Edit2 size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDelete(p)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                                                title="Eliminar registro"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Vista Móvil: Tarjetas táctiles */}
                            <div className="md:hidden space-y-3">
                                {grupo.items.length === 0 ? (
                                    <div className="card p-8 text-center text-slate-400 text-sm">
                                        No hay pagos registrados con estos filtros.
                                    </div>
                                ) : (
                                    grupo.items.map((p) => (
                                        <div key={p.id} className="card p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-2.5">
                                                    {p.comprobanteUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setVisorComprobante(p)}
                                                            className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0"
                                                        >
                                                            <img src={p.comprobanteUrl} alt="Comprobante" className="w-full h-full object-cover" />
                                                        </button>
                                                    )}
                                                    <div>
                                                        <span className="font-mono font-bold text-purple-700 text-xs bg-purple-50 px-2 py-0.5 rounded">
                                                            {p.codigoPago || 'SIN-COD'}
                                                        </span>
                                                        <h3 className="font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                                                            {p.estudiante?.nombres} {p.estudiante?.apellidos}
                                                            {p.estudiante?.esPlus && <Crown size={14} className="text-amber-500" />}
                                                        </h3>
                                                        <p className="text-xs text-slate-400">
                                                            {p.estudiante?.cursoActual?.nombre || 'Sin curso'} · {p.unidadEducativa?.nombre || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${ESTADO_STYLE[p.estado]
                                                        }`}
                                                >
                                                    {p.estado}
                                                </span>
                                            </div>

                                            {/* Padre/Tutor visible en móvil */}
                                            <div className="bg-slate-50 p-2.5 rounded-lg space-y-1.5">
                                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                                    <UserCheck size={13} className="text-purple-600" /> Padre / Tutor:
                                                </div>
                                                {renderPadres(p)}
                                                <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/70 text-xs">
                                                    <span className="font-semibold text-slate-600">
                                                        {p.plan} ({p.metodoPago === 'QR_TRANSFERENCIA' ? 'QR' : 'Efectivo'})
                                                    </span>
                                                    <span className="font-bold text-slate-900 text-sm">{fmtBob(p.monto)}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {p.comprobanteUrl && (
                                                    <button
                                                        onClick={() => setVisorComprobante(p)}
                                                        className="px-3 py-2 bg-sky-50 text-sky-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                                                    >
                                                        <ZoomIn size={14} /> Ver QR/Foto
                                                    </button>
                                                )}
                                                {p.estado === 'PENDIENTE' && (
                                                    <button
                                                        onClick={() => handleAprobarRapido(p)}
                                                        className="flex-1 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                                                    >
                                                        <CheckCircle2 size={14} /> Aprobar Plus
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => abrirEditarPago(p)}
                                                    className="px-3 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                                                >
                                                    Editar
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ==================== TAB 2: SPONSORS B2B ==================== */}
            {activeTab === 'SPONSORS' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-600">Ingresos por publicidad de marcas e institutos.</p>
                        <button
                            onClick={abrirNuevoSponsor}
                            className="btn-primary text-xs sm:text-sm flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700"
                        >
                            <Plus size={16} /> Registrar Cobro Sponsor
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {pagosSponsors.length === 0 ? (
                            <div className="col-span-full card p-8 text-center text-slate-400 text-sm">
                                Aún no hay cobros de patrocinadores registrados.
                            </div>
                        ) : (
                            pagosSponsors.map((ps) => {
                                const bannerPrincipal = ps.sponsor?.fotoPath || ps.sponsor?.imagenes?.[0] || null;
                                return (
                                    <div key={ps.id} className="card overflow-hidden flex flex-col justify-between min-h-[420px]">
                                        {/* Banner principal del Sponsor */}
                                        <div className="relative h-36 bg-slate-100 border-b border-slate-100">
                                            {bannerPrincipal ? (
                                                <img
                                                    src={bannerPrincipal}
                                                    alt={ps.sponsor?.nombre || 'Sponsor'}
                                                    onClick={() =>
                                                        setVisorImagen({
                                                            url: bannerPrincipal,
                                                            titulo: ps.sponsor?.nombre || 'Patrocinador',
                                                            subtitulo: 'Banner principal del patrocinador',
                                                        })
                                                    }
                                                    className="w-full h-full object-cover cursor-zoom-in"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                                                    <Building2 size={28} className="mb-1 opacity-40" />
                                                    Sin banner registrado
                                                </div>
                                            )}
                                            <span
                                                className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${ESTADO_STYLE[ps.estado]
                                                    }`}
                                            >
                                                {ps.estado}
                                            </span>
                                        </div>

                                        {/* Contenido + Acciones al costado */}
                                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-slate-800 text-base truncate">
                                                        {ps.sponsor?.nombre || 'Sponsor'}
                                                    </h3>
                                                    <p className="text-xs text-slate-400">{ps.sponsor?.rubro || ps.sponsor?.tipoSponsor}</p>
                                                    <p className="text-2xl font-bold text-emerald-700 mt-1.5">{fmtBob(ps.monto)}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {fmtDate(ps.periodoInicio)} — {fmtDate(ps.periodoFin)}
                                                    </p>
                                                </div>

                                                {/* Acciones CRUD al costado */}
                                                <div className="flex flex-col gap-1 shrink-0">
                                                    <button
                                                        onClick={() => abrirEditarSponsor(ps)}
                                                        className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                                        title="Editar cobro"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteSponsor(ps)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                        title="Eliminar cobro"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Comprobante ampliable */}
                                            {ps.comprobanteUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setVisorImagen({
                                                            url: ps.comprobanteUrl!,
                                                            titulo: `Comprobante — ${ps.sponsor?.nombre || 'Sponsor'}`,
                                                            subtitulo: `${fmtBob(ps.monto)} · ${ps.metodoPago === 'QR_TRANSFERENCIA' ? 'QR' : 'Efectivo'}`,
                                                        })
                                                    }
                                                    className="relative group w-full h-36 rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                                                >
                                                    <img
                                                        src={ps.comprobanteUrl}
                                                        alt="Comprobante Sponsor"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-semibold transition-opacity">
                                                        <ZoomIn size={16} /> Ampliar comprobante
                                                    </div>
                                                </button>
                                            )}

                                            {ps.notas && <p className="text-xs text-slate-500 italic line-clamp-2">{ps.notas}</p>}

                                            {ps.estado === 'PENDIENTE' && (
                                                <button
                                                    onClick={async () => {
                                                        await updateEstadoPagoSponsor(ps.id, 'APROBADO');
                                                        toast('Cobro de sponsor aprobado', 'success');
                                                        await cargarTodo();
                                                    }}
                                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                                                >
                                                    Marcar como Cobrado
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* ==================== TAB 3: RECLUTADORES ==================== */}
            {activeTab === 'RECLUTADORES' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-600">Comisiones, sueldos y viáticos al equipo de campo.</p>
                        <button
                            onClick={abrirNuevoReclutador}
                            className="btn-primary text-xs sm:text-sm flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700"
                        >
                            <Plus size={16} /> Registrar Pago Equipo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {pagosReclutadores.length === 0 ? (
                            <div className="col-span-full card p-8 text-center text-slate-400 text-sm">
                                No hay pagos a reclutadores/encuestadores registrados.
                            </div>
                        ) : (
                            pagosReclutadores.map((pr) => (
                                <div key={pr.id} className="card p-4 flex flex-col justify-between gap-3 min-h-[340px]">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                                                    {pr.tipo}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ESTADO_STYLE[pr.estado]}`}>
                                                    {pr.estado}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-base mt-2 truncate">
                                                {pr.reclutador?.username || 'Usuario'}
                                            </h3>
                                            <p className="text-xs text-slate-400 truncate">{pr.reclutador?.email || '—'}</p>
                                        </div>

                                        {/* Acciones CRUD al costado */}
                                        <div className="flex flex-col gap-1 shrink-0">
                                            <button
                                                onClick={() => abrirEditarReclutador(pr)}
                                                className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                                title="Editar pago"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteReclutador(pr)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                title="Eliminar pago"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center">
                                        <div>
                                            <span className="text-[11px] text-slate-400 block">Monto pagado</span>
                                            <p className="text-xl font-bold text-slate-800">{fmtBob(pr.monto)}</p>
                                        </div>
                                        <div className="text-right text-xs text-slate-500">
                                            <p>Periodo: <strong>{pr.periodo}</strong></p>
                                            <p>Ventas: <strong>{pr.cantidadVentas}</strong></p>
                                        </div>
                                    </div>

                                    {pr.comprobanteUrl ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setVisorImagen({
                                                    url: pr.comprobanteUrl!,
                                                    titulo: `Comprobante — ${pr.reclutador?.username || 'Reclutador'}`,
                                                    subtitulo: `${pr.tipo} · ${fmtBob(pr.monto)} · Periodo ${pr.periodo}`,
                                                })
                                            }
                                            className="relative group w-full h-36 rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                                        >
                                            <img
                                                src={pr.comprobanteUrl}
                                                alt="Comprobante Reclutador"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-semibold transition-opacity">
                                                <ZoomIn size={16} /> Ampliar comprobante
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="h-24 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
                                            Sin comprobante adjunto
                                        </div>
                                    )}

                                    {pr.notas && <p className="text-xs text-slate-500 italic line-clamp-2">{pr.notas}</p>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ==================== TAB 4: QR OFICIAL ==================== */}
            {activeTab === 'QR' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-600">
                            Cuentas y códigos QR oficiales que verán los Padres/Estudiantes en la App Flutter.
                        </p>
                        <button
                            onClick={() => {
                                setFormQr({
                                    id: '',
                                    banco: '',
                                    titular: '',
                                    numeroCuenta: '',
                                    qrImagenUrl: '',
                                    instrucciones: 'Coloca tu código EDU-XXXX en la glosa al transferir.',
                                    activo: true,
                                });
                                setModalQr({ open: true });
                            }}
                            className="btn-primary text-xs sm:text-sm flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700"
                        >
                            <Plus size={16} /> Nuevo QR Oficial
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {qrs.length === 0 ? (
                            <div className="col-span-full card p-8 text-center text-slate-400 text-sm">
                                Aún no configuraste ningún QR oficial. Sube tu QR bancario para recibir pagos.
                            </div>
                        ) : (
                            qrs.map((qr) => (
                                <div key={qr.id} className="card p-4 space-y-3 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-slate-800">{qr.banco}</h3>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${qr.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                                    }`}
                                            >
                                                {qr.activo ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600">
                                            Titular: <strong>{qr.titular}</strong>
                                        </p>
                                        {qr.numeroCuenta && <p className="text-xs text-slate-500">Cuenta: {qr.numeroCuenta}</p>}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setVisorImagen({
                                                    url: qr.qrImagenUrl,
                                                    titulo: `QR Oficial — ${qr.banco}`,
                                                    subtitulo: `Titular: ${qr.titular}${qr.numeroCuenta ? ` · Cta: ${qr.numeroCuenta}` : ''}`,
                                                })
                                            }
                                            className="relative group w-full bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-center cursor-zoom-in"
                                        >
                                            <img src={qr.qrImagenUrl} alt={`QR ${qr.banco}`} className="max-h-52 object-contain rounded" />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center gap-1.5 text-white text-xs font-semibold transition-opacity">
                                                <ZoomIn size={16} /> Ampliar QR
                                            </div>
                                        </button>
                                        {qr.instrucciones && <p className="text-xs text-slate-500">{qr.instrucciones}</p>}
                                    </div>
                                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                                        <button
                                            onClick={() => {
                                                setFormQr({
                                                    id: qr.id,
                                                    banco: qr.banco,
                                                    titular: qr.titular,
                                                    numeroCuenta: qr.numeroCuenta || '',
                                                    qrImagenUrl: qr.qrImagenUrl,
                                                    instrucciones: qr.instrucciones || '',
                                                    activo: qr.activo,
                                                });
                                                setModalQr({ open: true, data: qr });
                                            }}
                                            className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1"
                                        >
                                            <Edit2 size={13} /> Editar
                                        </button>
                                        <button
                                            onClick={async () => {
                                                await deleteConfiguracionQr(qr.id);
                                                toast('QR eliminado', 'success');
                                                await cargarTodo();
                                            }}
                                            className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ==================== MODAL VISOR AMPLIADO DE COMPROBANTE (SUSCRIPCIONES) ==================== */}
            <Modal
                open={!!visorComprobante}
                onClose={() => setVisorComprobante(null)}
                title={`Validar Comprobante — ${visorComprobante?.codigoPago || ''}`}
                footer={
                    <div className="flex flex-wrap w-full justify-between items-center gap-2">
                        <div className="flex gap-2">
                            {visorComprobante?.estado === 'PENDIENTE' && (
                                <>
                                    <button
                                        onClick={() => handleAprobarRapido(visorComprobante)}
                                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs flex items-center gap-1.5"
                                    >
                                        <CheckCircle2 size={15} /> Aprobar y Activar PLUS
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMotivoAccion('');
                                            setModalEstado({ open: true, pago: visorComprobante, nuevoEstado: 'RECHAZADO' });
                                        }}
                                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                                    >
                                        <XCircle size={15} /> Rechazar
                                    </button>
                                </>
                            )}
                        </div>
                        <button className="btn-secondary text-xs" onClick={() => setVisorComprobante(null)}>
                            Cerrar
                        </button>
                    </div>
                }
            >
                {visorComprobante && (
                    <div className="space-y-4">
                        <div className="bg-slate-900 rounded-xl p-2 flex items-center justify-center max-h-[55vh] overflow-auto">
                            <img
                                src={visorComprobante.comprobanteUrl || ''}
                                alt="Comprobante ampliado"
                                className="max-h-[52vh] w-auto object-contain rounded"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                            <div>
                                <p className="text-slate-400 font-semibold uppercase text-[10px]">Estudiante</p>
                                <p className="font-bold text-slate-800 text-sm">
                                    {visorComprobante.estudiante?.nombres} {visorComprobante.estudiante?.apellidos}
                                </p>
                                <p className="text-slate-500">
                                    {visorComprobante.estudiante?.cursoActual?.nombre || 'Sin curso'} · {visorComprobante.unidadEducativa?.nombre}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-400 font-semibold uppercase text-[10px]">Padre / Madre / Tutor</p>
                                {renderPadres(visorComprobante)}
                            </div>
                            <div className="sm:col-span-2 flex flex-wrap justify-between items-center pt-2 border-t border-slate-200">
                                <span>
                                    Plan: <strong>{visorComprobante.plan}</strong> ({visorComprobante.metodoPago === 'QR_TRANSFERENCIA' ? 'QR' : 'Efectivo'})
                                </span>
                                <span className="text-base font-bold text-emerald-700">{fmtBob(visorComprobante.monto)}</span>
                            </div>
                            {visorComprobante.notasAdmin && (
                                <p className="sm:col-span-2 text-slate-500 italic">Nota: {visorComprobante.notasAdmin}</p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* ==================== MODAL VISOR AMPLIADO GENÉRICO (SPONSORS, RECLUTADORES, QR) ==================== */}
            <Modal
                open={!!visorImagen}
                onClose={() => setVisorImagen(null)}
                title={visorImagen?.titulo || 'Vista Ampliada'}
                footer={
                    <button className="btn-secondary text-xs" onClick={() => setVisorImagen(null)}>
                        Cerrar
                    </button>
                }
            >
                {visorImagen && (
                    <div className="space-y-3">
                        {visorImagen.subtitulo && <p className="text-xs text-slate-500">{visorImagen.subtitulo}</p>}
                        <div className="bg-slate-900 rounded-xl p-2 flex items-center justify-center max-h-[65vh] overflow-auto">
                            <img
                                src={visorImagen.url}
                                alt={visorImagen.titulo}
                                className="max-h-[62vh] w-auto object-contain rounded"
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* ==================== MODAL CREAR / EDITAR PAGO ==================== */}
            <Modal
                open={modalPago.open}
                onClose={() => setModalPago({ open: false })}
                title={modalPago.editando ? `Editar Pago ${modalPago.editando.codigoPago || ''}` : 'Registrar Pago de Suscripción'}
                footer={
                    <>
                        <button className="btn-secondary" onClick={() => setModalPago({ open: false })}>Cancelar</button>
                        <button className="btn-primary bg-purple-600 hover:bg-purple-700" onClick={handleGuardarPago} disabled={saving}>
                            {saving ? 'Guardando...' : modalPago.editando ? 'Actualizar Pago' : 'Guardar Pago'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {!modalPago.editando && (
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Estudiante <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={estSearch}
                                onFocus={() => setEstMenuOpen(true)}
                                onBlur={() => setTimeout(() => setEstMenuOpen(false), 150)}
                                onChange={(e) => {
                                    setEstSearch(e.target.value);
                                    setEstMenuOpen(true);
                                }}
                                placeholder="Escribe nombre, apellido o CI del estudiante..."
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            {estMenuOpen && (
                                <ul className="absolute z-30 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg text-sm">
                                    {estudiantesFiltrados.length === 0 ? (
                                        <li className="px-3 py-2 text-slate-400">No se encontró ningún estudiante</li>
                                    ) : (
                                        estudiantesFiltrados.map((est) => (
                                            <li
                                                key={est.id}
                                                onMouseDown={() => {
                                                    setFormPago((f) => ({
                                                        ...f,
                                                        estudianteId: est.id,
                                                        unidadEducativaId: est.unidadEducativaId || '',
                                                    }));
                                                    setEstSearch(`${est.nombres} ${est.apellidos} ${est.ci ? `(${est.ci})` : ''}`);
                                                    setEstMenuOpen(false);
                                                }}
                                                className="px-3 py-2 cursor-pointer hover:bg-purple-50 border-b border-slate-50"
                                            >
                                                <span className="font-medium text-slate-800">
                                                    {est.nombres} {est.apellidos}
                                                </span>
                                                {est.ci && <span className="text-xs text-slate-400 ml-2">CI: {est.ci}</span>}
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField label="Plan de Suscripción" required>
                            <Select
                                value={formPago.plan}
                                onChange={(e) => {
                                    const plan = e.target.value as PlanSuscripcion;
                                    setFormPago((f) => ({ ...f, plan, monto: PRECIOS_PLAN_BOB[plan] }));
                                }}
                            >
                                <option value="MENSUAL">Mensual (Bs. 25)</option>
                                <option value="TRIMESTRAL">Trimestral (Bs. 70)</option>
                                <option value="SEMESTRAL">Semestral (Bs. 130)</option>
                                <option value="ANUAL">Anual (Bs. 250)</option>
                            </Select>
                        </FormField>

                        <FormField label="Monto (Bs.)" required>
                            <Input
                                type="number"
                                min={1}
                                step="0.5"
                                value={formPago.monto}
                                onChange={(e) => setFormPago((f) => ({ ...f, monto: Number(e.target.value) }))}
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField label="Método de Pago" required>
                            <Select
                                value={formPago.metodoPago}
                                onChange={(e) => setFormPago((f) => ({ ...f, metodoPago: e.target.value as MetodoPago }))}
                            >
                                <option value="QR_TRANSFERENCIA">QR / Transferencia</option>
                                <option value="EFECTIVO">Efectivo (Campo)</option>
                            </Select>
                        </FormField>

                        {!modalPago.editando && (
                            <FormField label="Estado Inicial" required>
                                <Select
                                    value={formPago.estado}
                                    onChange={(e) => setFormPago((f) => ({ ...f, estado: e.target.value as PagoEstado }))}
                                >
                                    <option value="PENDIENTE">Pendiente (Revisar luego)</option>
                                    <option value="APROBADO">Aprobado (Activar PLUS ya)</option>
                                </Select>
                            </FormField>
                        )}
                    </div>

                    <ImageUploadField
                        label={
                            formPago.metodoPago === 'EFECTIVO'
                                ? 'Foto del efectivo / recibo firmado'
                                : 'Captura del comprobante QR'
                        }
                        required
                        value={formPago.comprobanteUrl}
                        onChange={(val) => setFormPago((f) => ({ ...f, comprobanteUrl: val }))}
                        hint="Obligatorio para respaldo de auditoría, validación y reclamos"
                    />

                    <FormField label="Notas / Referencia">
                        <Input
                            value={formPago.notasAdmin}
                            onChange={(e) => setFormPago((f) => ({ ...f, notasAdmin: e.target.value }))}
                            placeholder="Ej: Cobrado en colegio / Nombre en transferencia bancaria"
                        />
                    </FormField>
                </div>
            </Modal>

            {/* MODAL MASIVO POR COLEGIO */}
            <Modal
                open={modalMasivo}
                onClose={() => setModalMasivo(false)}
                title="Asignación Masiva por Colegio"
                footer={
                    <>
                        <button className="btn-secondary" onClick={() => setModalMasivo(false)}>Cancelar</button>
                        <button className="btn-primary bg-purple-600" onClick={handleAsignacionMasiva} disabled={saving}>
                            {saving ? 'Generando...' : 'Generar Pagos Pendientes'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <FormField label="Colegio / Unidad Educativa" required>
                        <Select value={formMasivo.colegioId} onChange={(e) => setFormMasivo((f) => ({ ...f, colegioId: e.target.value }))}>
                            <option value="">Selecciona un colegio...</option>
                            {colegios.map((c) => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </Select>
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Plan" required>
                            <Select value={formMasivo.meses} onChange={(e) => setFormMasivo((f) => ({ ...f, meses: e.target.value }))}>
                                <option value="mensual">Mensual</option>
                                <option value="trimestral">Trimestral</option>
                                <option value="semestral">Semestral</option>
                                <option value="anual">Anual</option>
                            </Select>
                        </FormField>
                        <FormField label="Monto por Alumno (Bs.)" required>
                            <Input type="number" value={formMasivo.monto} onChange={(e) => setFormMasivo((f) => ({ ...f, monto: e.target.value }))} />
                        </FormField>
                    </div>
                </div>
            </Modal>

            {/* MODAL RECHAZAR / REEMBOLSAR */}
            <Modal
                open={modalEstado.open}
                onClose={() => setModalEstado({ open: false })}
                title={`Confirmar ${modalEstado.nuevoEstado}`}
                footer={
                    <>
                        <button className="btn-secondary" onClick={() => setModalEstado({ open: false })}>Cancelar</button>
                        <button className="btn-primary bg-rose-600" onClick={handleConfirmarCambioEstado} disabled={saving}>Confirmar</button>
                    </>
                }
            >
                <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                        Vas a cambiar el pago <strong>{modalEstado.pago?.codigoPago}</strong> a{' '}
                        <strong>{modalEstado.nuevoEstado}</strong>. Si es reembolso o cancelación, se desactivará el acceso PLUS del estudiante.
                    </p>
                    <FormField label="Motivo / Justificación">
                        <Input
                            value={motivoAccion}
                            onChange={(e) => setMotivoAccion(e.target.value)}
                            placeholder="Ej: Comprobante ilegible / Solicitud de devolución"
                        />
                    </FormField>
                </div>
            </Modal>

            {/* MODAL CREAR / EDITAR PAGO SPONSOR */}
            <Modal
                open={modalSponsor.open}
                onClose={() => setModalSponsor({ open: false })}
                title={modalSponsor.editando ? 'Editar Cobro a Patrocinador' : 'Registrar Cobro a Patrocinador'}
                footer={
                    <>
                        <button className="btn-secondary" onClick={() => setModalSponsor({ open: false })}>Cancelar</button>
                        <button className="btn-primary bg-purple-600" onClick={handleGuardarPagoSponsor} disabled={saving}>
                            {saving ? 'Guardando...' : modalSponsor.editando ? 'Actualizar' : 'Guardar'}
                        </button>
                    </>
                }
            >
                <div className="space-y-3">
                    <FormField label="Patrocinador" required>
                        <Select value={formSponsor.sponsorId} onChange={(e) => setFormSponsor((f) => ({ ...f, sponsorId: e.target.value }))}>
                            <option value="">Selecciona un sponsor...</option>
                            {sponsors.map((s) => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                            ))}
                        </Select>
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Monto (Bs.)" required>
                            <Input type="number" value={formSponsor.monto} onChange={(e) => setFormSponsor((f) => ({ ...f, monto: Number(e.target.value) }))} />
                        </FormField>
                        <FormField label="Método">
                            <Select value={formSponsor.metodoPago} onChange={(e) => setFormSponsor((f) => ({ ...f, metodoPago: e.target.value as MetodoPago }))}>
                                <option value="QR_TRANSFERENCIA">QR / Transferencia</option>
                                <option value="EFECTIVO">Efectivo</option>
                            </Select>
                        </FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Inicio"><Input type="date" value={formSponsor.periodoInicio} onChange={(e) => setFormSponsor((f) => ({ ...f, periodoInicio: e.target.value }))} /></FormField>
                        <FormField label="Fin"><Input type="date" value={formSponsor.periodoFin} onChange={(e) => setFormSponsor((f) => ({ ...f, periodoFin: e.target.value }))} /></FormField>
                    </div>
                    <ImageUploadField
                        label="Comprobante de Pago"
                        required
                        value={formSponsor.comprobanteUrl}
                        onChange={(val) => setFormSponsor((f) => ({ ...f, comprobanteUrl: val }))}
                    />
                    <FormField label="Notas"><Input value={formSponsor.notas} onChange={(e) => setFormSponsor((f) => ({ ...f, notas: e.target.value }))} /></FormField>
                </div>
            </Modal>

            {/* MODAL CREAR / EDITAR PAGO RECLUTADOR */}
            <Modal
                open={modalReclutador.open}
                onClose={() => setModalReclutador({ open: false })}
                title={modalReclutador.editando ? 'Editar Pago a Reclutador' : 'Registrar Pago a Reclutador / Encuestador'}
                footer={
                    <>
                        <button className="btn-secondary" onClick={() => setModalReclutador({ open: false })}>Cancelar</button>
                        <button className="btn-primary bg-purple-600" onClick={handleGuardarPagoReclutador} disabled={saving}>
                            {saving ? 'Guardando...' : modalReclutador.editando ? 'Actualizar' : 'Guardar'}
                        </button>
                    </>
                }
            >
                <div className="space-y-3">
                    <FormField label="Usuario (Reclutador/Encuestador)" required>
                        <Select value={formReclutador.reclutadorId} onChange={(e) => setFormReclutador((f) => ({ ...f, reclutadorId: e.target.value }))}>
                            <option value="">Selecciona un usuario...</option>
                            {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>{u.username} {u.email ? `(${u.email})` : ''}</option>
                            ))}
                        </Select>
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Concepto">
                            <Select value={formReclutador.tipo} onChange={(e) => setFormReclutador((f) => ({ ...f, tipo: e.target.value }))}>
                                <option value="COMISION">Comisión por ventas</option>
                                <option value="SUELDO">Sueldo</option>
                                <option value="BONO">Bono meta</option>
                                <option value="VIATICO">Viático</option>
                            </Select>
                        </FormField>
                        <FormField label="Monto (Bs.)" required>
                            <Input type="number" value={formReclutador.monto} onChange={(e) => setFormReclutador((f) => ({ ...f, monto: Number(e.target.value) }))} />
                        </FormField>
                    </div>
                    <FormField label="Periodo (Ej: 2026-11)">
                        <Input value={formReclutador.periodo} onChange={(e) => setFormReclutador((f) => ({ ...f, periodo: e.target.value }))} />
                    </FormField>
                    <ImageUploadField
                        label="Comprobante de transferencia / recibo"
                        value={formReclutador.comprobanteUrl}
                        onChange={(val) => setFormReclutador((f) => ({ ...f, comprobanteUrl: val }))}
                    />
                    <FormField label="Notas">
                        <Input value={formReclutador.notas} onChange={(e) => setFormReclutador((f) => ({ ...f, notas: e.target.value }))} />
                    </FormField>
                </div>
            </Modal>

            {/* MODAL QR OFICIAL */}
            <Modal
                open={modalQr.open}
                onClose={() => setModalQr({ open: false })}
                title={formQr.id ? 'Editar QR Oficial' : 'Nuevo QR Oficial'}
                footer={
                    <>
                        <button className="btn-secondary" onClick={() => setModalQr({ open: false })}>Cancelar</button>
                        <button className="btn-primary bg-purple-600" onClick={handleGuardarQr} disabled={saving}>Guardar QR</button>
                    </>
                }
            >
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Banco" required>
                            <Input value={formQr.banco} onChange={(e) => setFormQr((f) => ({ ...f, banco: e.target.value }))} placeholder="Ej: Banco Unión" />
                        </FormField>
                        <FormField label="Titular" required>
                            <Input value={formQr.titular} onChange={(e) => setFormQr((f) => ({ ...f, titular: e.target.value }))} placeholder="Ej: BrafaCorp SRL" />
                        </FormField>
                    </div>
                    <FormField label="Número de Cuenta">
                        <Input value={formQr.numeroCuenta} onChange={(e) => setFormQr((f) => ({ ...f, numeroCuenta: e.target.value }))} />
                    </FormField>
                    <ImageUploadField
                        label="Imagen del QR Bancario"
                        required
                        value={formQr.qrImagenUrl}
                        onChange={(val) => setFormQr((f) => ({ ...f, qrImagenUrl: val }))}
                        hint="Sube la imagen oficial de tu QR Simple"
                    />
                    <FormField label="Instrucciones para el Padre/Estudiante">
                        <Input value={formQr.instrucciones} onChange={(e) => setFormQr((f) => ({ ...f, instrucciones: e.target.value }))} />
                    </FormField>
                </div>
            </Modal>

            {/* CONFIRMACIONES DE ELIMINACIÓN */}
            <ConfirmDialog
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleEliminarPago}
                title="Eliminar Pago"
                message={`¿Eliminar el registro ${confirmDelete?.codigoPago || ''} definitivamente?`}
                confirmLabel="Sí, eliminar"
            />
            <ConfirmDialog
                open={!!confirmDeleteSponsor}
                onClose={() => setConfirmDeleteSponsor(null)}
                onConfirm={handleEliminarSponsor}
                title="Eliminar Cobro de Patrocinador"
                message={`¿Eliminar definitivamente este cobro de "${confirmDeleteSponsor?.sponsor?.nombre || 'Sponsor'}"?`}
                confirmLabel="Sí, eliminar"
            />
            <ConfirmDialog
                open={!!confirmDeleteReclutador}
                onClose={() => setConfirmDeleteReclutador(null)}
                onConfirm={handleEliminarReclutador}
                title="Eliminar Pago a Reclutador"
                message={`¿Eliminar definitivamente este registro de "${confirmDeleteReclutador?.reclutador?.username || 'Usuario'}"?`}
                confirmLabel="Sí, eliminar"
            />
        </div>
    );
}