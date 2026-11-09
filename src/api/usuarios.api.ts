import type { UsuarioWeb, PaginatedResponse } from '../types';
import { apiRequest, IS_MOCK_MODE } from './client';
import { USUARIOS_WEB } from '../mocks/data';

export async function getUsuarios(params?: { search?: string }): Promise<PaginatedResponse<UsuarioWeb>> {
  return apiRequest('/usuarios-web');
}

export async function createUsuario(data: Omit<UsuarioWeb, 'id' | 'createdAt' | 'updatedAt' | 'unidadEducativa' | 'ultimoAcceso'> & { password: string }): Promise<UsuarioWeb> {
  return apiRequest('/usuarios-web', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUsuario(id: string, data: Partial<UsuarioWeb>): Promise<UsuarioWeb> {
  return apiRequest(`/usuarios-web/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function resetPassword(id: string, newPassword: string): Promise<void> {
  await apiRequest(`/usuarios-web/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) });
}
