import { apiRequest } from './client';

export type PagoEstado =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'REEMBOLSADO'
  | 'CANCELADO'
  | 'EXPIRADO';

export type MetodoPago = 'EFECTIVO' | 'QR_TRANSFERENCIA';
export type PlanSuscripcion = 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export const PRECIOS_PLAN_BOB: Record<PlanSuscripcion, number> = {
  MENSUAL: 30,
  TRIMESTRAL: 75,
  SEMESTRAL: 135,
  ANUAL: 240,
};

export interface PadreResumen {
  id: string;
  nombres: string;
  apellidos: string;
  parentesco: string;
  telefono?: string | null;
  ci?: string | null;
}

export interface Pago {
  id: string;
  monto: string | number;
  moneda: string;
  estado: PagoEstado;
  metodoPago: MetodoPago;
  plan: PlanSuscripcion;
  codigoPago?: string | null;
  comprobanteUrl?: string | null;
  referenciaExterno?: string | null;
  notasAdmin?: string | null;
  motivoReembolso?: string | null;
  fechaReembolso?: string | null;
  validoDesde?: string | null;
  validoHasta?: string | null;
  estudianteId: string;
  unidadEducativaId: string;
  createdAt: string;
  estudiante?: {
    id: string;
    nombres: string;
    apellidos: string;
    ci?: string | null;
    codigoRude?: string | null;
    esPlus?: boolean;
    plusHasta?: string | null;
    cursoActualId?: string | null;
    cursoActual?: { id: string; nombre: string; paralelo?: string | null } | null;
    padres?: { padre: PadreResumen }[];
  };
  unidadEducativa?: { id: string; nombre: string };
  registradoPor?: { id: string; username: string } | null;
  aprobadoPor?: { id: string; username: string } | null;
}

export interface ResumenFinanciero {
  ingresosEstudiantesMes: number;
  cantidadPagosMes: number;
  ingresosSponsorsMes: number;
  egresosReclutadoresMes: number;
  reembolsosMes: number;
  balanceNetoMes: number;
  pagosPendientes: number;
  estudiantesPlusActivos: number;
}

export interface ConfiguracionQr {
  id: string;
  banco: string;
  titular: string;
  numeroCuenta?: string | null;
  qrImagenUrl: string;
  instrucciones?: string | null;
  activo: boolean;
  updatedAt: string;
}

export interface PagoSponsor {
  id: string;
  sponsorId: string;
  monto: string | number;
  moneda: string;
  estado: PagoEstado;
  metodoPago: MetodoPago;
  comprobanteUrl?: string | null;
  periodoInicio: string;
  periodoFin: string;
  notas?: string | null;
  createdAt: string;
    sponsor?: {
        id: string; nombre: string; tipoSponsor?: string; rubro?: string, fotoPath?: string | null;
        imagenes?: string[]; };
}

export interface PagoReclutador {
  id: string;
  reclutadorId: string;
  tipo: 'COMISION' | 'SUELDO' | 'BONO' | 'VIATICO' | string;
  monto: string | number;
  moneda: string;
  cantidadVentas: number;
  periodo: string;
  estado: PagoEstado;
  comprobanteUrl?: string | null;
  notas?: string | null;
  createdAt: string;
  reclutador?: { id: string; username: string; email?: string | null };
}

/**
 * Comprime una imagen subida desde galería/cámara/PC para guardarla rápido y ligera.
 * Si luego conectas un bucket (Supabase Storage / Cloudinary), solo reemplazas esta función.
 */
export function comprimirImagenABase64(file: File, maxSize = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Archivo de imagen no válido'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No se pudo procesar la imagen'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const getAuthHeaders = (): Record<string, string> => {
  const usuarioId = localStorage.getItem('usuarioId');
  return {
    'Content-Type': 'application/json',
    ...(usuarioId ? { 'X-Usuario-Id': usuarioId } : {}),
  };
};

const toArray = <T>(res: any): T[] => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
};

// --- KPIs ---
export async function getResumenFinanciero(): Promise<ResumenFinanciero> {
  return apiRequest<ResumenFinanciero>('/pagos/resumen', { method: 'GET' });
}

// --- SUSCRIPCIONES ESTUDIANTES ---
export async function getPagos(params?: {
  estado?: string;
  unidadEducativaId?: string;
  cursoId?: string;
  metodoPago?: string;
  search?: string;
}): Promise<Pago[]> {
  const q = new URLSearchParams();
  if (params?.estado) q.set('estado', params.estado);
  if (params?.unidadEducativaId) q.set('unidadEducativaId', params.unidadEducativaId);
  if (params?.cursoId) q.set('cursoId', params.cursoId);
  if (params?.metodoPago) q.set('metodoPago', params.metodoPago);
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const qs = q.toString();
  const res = await apiRequest<Pago[]>(`/pagos${qs ? `?${qs}` : ''}`, { method: 'GET' });
  return toArray<Pago>(res);
}

export async function createPago(payload: {
  estudianteId: string;
  unidadEducativaId?: string;
  monto: number;
  plan: PlanSuscripcion;
  metodoPago: MetodoPago;
  estado?: PagoEstado;
  comprobanteUrl?: string;
  referenciaExterno?: string;
  notasAdmin?: string;
}): Promise<Pago> {
  return apiRequest<Pago>('/pagos', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updatePago(
  id: string,
  payload: {
    monto?: number;
    plan?: PlanSuscripcion;
    metodoPago?: MetodoPago;
    comprobanteUrl?: string;
    referenciaExterno?: string;
    notasAdmin?: string;
  },
): Promise<Pago> {
  return apiRequest<Pago>(`/pagos/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updatePagoEstado(
  id: string,
  payload: { estado: PagoEstado; notasAdmin?: string; motivoReembolso?: string },
): Promise<Pago> {
  return apiRequest<Pago>(`/pagos/${id}/estado`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deletePago(id: string): Promise<void> {
  await apiRequest(`/pagos/${id}`, { method: 'DELETE' });
}

export async function asignarPagosPorColegio(
  colegioId: string,
  payload: { meses: string; year?: number; monto: string; metodoPago?: MetodoPago },
) {
  return apiRequest(`/pagos/general/por-colegio/${colegioId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

// --- QR OFICIAL ---
export async function getConfiguracionesQr(): Promise<ConfiguracionQr[]> {
  const res = await apiRequest<ConfiguracionQr[]>('/pagos/configuracion-qr', { method: 'GET' });
  return toArray<ConfiguracionQr>(res);
}

export async function saveConfiguracionQr(payload: Partial<ConfiguracionQr>): Promise<ConfiguracionQr> {
  return apiRequest<ConfiguracionQr>('/pagos/configuracion-qr', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteConfiguracionQr(id: string): Promise<void> {
  await apiRequest(`/pagos/configuracion-qr/${id}`, { method: 'DELETE' });
}

// --- SPONSORS B2B ---
export async function getPagosSponsors(): Promise<PagoSponsor[]> {
  const res = await apiRequest<PagoSponsor[]>('/pagos/sponsors', { method: 'GET' });
  return toArray<PagoSponsor>(res);
}

export async function createPagoSponsor(payload: {
  sponsorId: string;
  monto: number;
  metodoPago: MetodoPago;
  estado?: PagoEstado;
  periodoInicio: string;
  periodoFin: string;
  comprobanteUrl?: string;
  notas?: string;
}): Promise<PagoSponsor> {
  return apiRequest<PagoSponsor>('/pagos/sponsors', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updatePagoSponsor(
  id: string,
  payload: Partial<{
    sponsorId: string;
    monto: number;
    metodoPago: MetodoPago;
    estado: PagoEstado;
    periodoInicio: string;
    periodoFin: string;
    comprobanteUrl: string;
    notas: string;
  }>,
): Promise<PagoSponsor> {
  return apiRequest<PagoSponsor>(`/pagos/sponsors/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deletePagoSponsor(id: string): Promise<void> {
  await apiRequest(`/pagos/sponsors/${id}`, { method: 'DELETE' });
}

export async function updatePagoReclutador(
  id: string,
  payload: Partial<{
    reclutadorId: string;
    tipo: string;
    monto: number;
    periodo: string;
    estado: PagoEstado;
    comprobanteUrl: string;
    notas: string;
  }>,
): Promise<PagoReclutador> {
  return apiRequest<PagoReclutador>(`/pagos/reclutadores/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deletePagoReclutador(id: string): Promise<void> {
  await apiRequest(`/pagos/reclutadores/${id}`, { method: 'DELETE' });
}

export async function updateEstadoPagoSponsor(id: string, estado: PagoEstado): Promise<PagoSponsor> {
  return apiRequest<PagoSponsor>(`/pagos/sponsors/${id}/estado`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ estado }),
  });
}

// --- RECLUTADORES / ENCUESTADORES ---
export async function getPagosReclutadores(): Promise<PagoReclutador[]> {
  const res = await apiRequest<PagoReclutador[]>('/pagos/reclutadores', { method: 'GET' });
  return toArray<PagoReclutador>(res);
}

export async function createPagoReclutador(payload: {
  reclutadorId: string;
  tipo: string;
  monto: number;
  periodo: string;
  cantidadVentas?: number;
  estado?: PagoEstado;
  comprobanteUrl?: string;
  notas?: string;
}): Promise<PagoReclutador> {
  return apiRequest<PagoReclutador>('/pagos/reclutadores', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

// --- CATÁLOGOS AUXILIARES ---
export async function getEstudiantesSimple(): Promise<any[]> {
  const res = await apiRequest('/estudiantes', { method: 'GET' });
  return toArray(res);
}

export async function getColegiosSimple(): Promise<any[]> {
  const res = await apiRequest('/unidades-educativas', { method: 'GET' });
  return toArray(res);
}

export async function getCursosSimple(unidadEducativaId?: string): Promise<any[]> {
  const qs = unidadEducativaId ? `?unidadEducativaId=${unidadEducativaId}` : '';
  const res = await apiRequest(`/cursos${qs}`, { method: 'GET' });
  return toArray(res);
}

export async function getSponsorsSimple(): Promise<any[]> {
  const res = await apiRequest('/sponsors', { method: 'GET' });
  return toArray(res);
}

export async function getUsuariosSimple(): Promise<any[]> {
  const res = await apiRequest('/usuarios', { method: 'GET' });
  return toArray(res);
}