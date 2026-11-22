import type { UsuarioWeb, PaginatedResponse } from '../types';
import { apiRequest } from './client';

export async function getUsuarios(params?: { search?: string }): Promise<PaginatedResponse<UsuarioWeb>> {
  return apiRequest('/usuarios');
}

export async function createUsuario(data: Omit<UsuarioWeb, 'id' | 'createdAt' | 'updatedAt' | 'unidadEducativa' | 'ultimoAcceso'> & { password: string }): Promise<UsuarioWeb> {
  return apiRequest('/usuarios', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUsuario(id: string, data: Partial<UsuarioWeb>): Promise<UsuarioWeb> {
  return apiRequest(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function resetPassword(id: string, newPassword: string): Promise<void> {
  await apiRequest(`/usuarios/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) });
}

export async function deleteUsuario(id: string): Promise<void> {
  await apiRequest(`/usuarios/${id}`, { method: 'DELETE' });
}