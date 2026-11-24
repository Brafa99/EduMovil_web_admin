import { apiRequest } from './client';

export interface EstudiantePendienteVerificacion {
  id: string;
  nombres: string;
  apellidos: string;
  ci?: string | null;
  email?: string | null;
  codigoEdumovil?: string | null;
  origenRegistro: 'WEB_ADMIN' | 'RECLUTADOR' | 'AUTO_REGISTRO';
  estadoVerificacion: 'VERIFICADO' | 'PENDIENTE' | 'RECHAZADO' | 'INDEPENDIENTE';
  comprobanteUrl?: string | null;
  colegioSugeridoNombre?: string | null;
  colegioSugeridoCiudad?: string | null;
  cicloSugerido?: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA' | null;
  gradoSugerido?: string | null;
  createdAt: string;
  unidadEducativa?: { id: string; nombre: string } | null;
  cursoActual?: { id: string; nombre: string; ciclo: string } | null;
}

export interface ResolverVerificacionPayload {
  decision: 'VERIFICADO' | 'RECHAZADO';
  motivoRechazo?: string;
  unidadEducativaId?: string;
  cursoActualId?: string;
}

export const verificacionesApi = {
  listarPendientes: (incluirIndependientes = false) =>
    apiRequest<EstudiantePendienteVerificacion[]>(
      `/verificaciones/pendientes?incluirIndependientes=${incluirIndependientes}`
    ),

  resolver: (estudianteId: string, payload: ResolverVerificacionPayload) =>
    apiRequest(`/verificaciones/${estudianteId}/resolver`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};