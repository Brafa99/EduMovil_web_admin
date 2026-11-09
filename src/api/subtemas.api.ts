import { apiRequest } from './client';

export interface Subtema {
  id: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
  temaId: string;
}

export async function getSubtemas(temaId?: string): Promise<{ data: Subtema[]; total: number }> {
  // Si pasamos un temaId, el backend debería filtrar por ese tema
  const url = temaId ? `/catalogo/subtemas?temaId=${temaId}` : '/catalogo/subtemas';
  const response = await apiRequest<Subtema[]>(url, { method: 'GET' });
  const data = Array.isArray(response) ? response : ([] as Subtema[]);
  return { data, total: data.length };
}

export async function createSubtema(data: Partial<Subtema>): Promise<Subtema> {
  return await apiRequest<Subtema>('/catalogo/subtemas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSubtema(id: string, data: Partial<Subtema>): Promise<Subtema> {
  return await apiRequest<Subtema>(`/catalogo/subtemas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}