import { apiRequest } from './client';
import type { CatalogoMateria } from '../types';

export async function getCatalogosMateria(): Promise<{ data: CatalogoMateria[]; total: number }> {
  const response = await apiRequest<CatalogoMateria[]>('/catalogo/materias', { // <-- Corregido aquí
    method: 'GET',
  });
  return { data: response, total: response.length }; 
}

export async function createCatalogoMateria(
  data: Partial<CatalogoMateria>
): Promise<CatalogoMateria> {
  const response = await apiRequest<CatalogoMateria>('/catalogo/materias', { // <-- Corregido aquí
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
}

export async function updateCatalogoMateria(
  id: string,
  data: Partial<CatalogoMateria>
): Promise<CatalogoMateria> {
  const response = await apiRequest<CatalogoMateria>(`/catalogo/materias/${id}`, { // <-- Corregido aquí
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response;
}