import { apiRequest } from './client'; // Ajusta la ruta a tu cliente axios/fetch

export interface Sponsor {
    id: string;
    nombre: string;
    tipoSponsor: 'INSTITUTO' | 'UNIVERSIDAD' | 'CURSO_EXTRA' | 'MARCA_COMERCIAL' | 'OTRO';
    ubicacion: 'INICIO_APP' | 'PANTALLA_JUEGOS' | 'MODAL_RESULTADOS' | 'PERFIL';
    prioridad?: number;
    fotoPath?: string;
    imagenes: string[]; // 👈 Arreglo para la galería
    rubro?: string;
    descripcion?: string;
    whatsapp?: string;  // 👈 Enlace directo a WA
    sitioWeb?: string;  // 👈 Enlace directo a la web
    activo: boolean;
    clicks: number;
    fechaInicio?: string;
    fechaFin?: string;
    createdAt: string;
    updatedAt: string;
}

export const getSponsors = () => apiRequest('/sponsors');
export const getSponsorById = (id: string) => apiRequest(`/sponsors/${id}`);
export const createSponsor = (data: Partial<Sponsor>) => apiRequest('/sponsors', { method: 'POST', body: JSON.stringify(data) });
export const updateSponsor = (id: string, data: Partial<Sponsor>) => apiRequest(`/sponsors/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSponsor = (id: string) => apiRequest(`/sponsors/${id}`, { method: 'DELETE' });