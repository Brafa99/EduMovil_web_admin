import type { UsuarioWeb, PaginatedResponse } from '../types';
import { apiRequest, IS_MOCK_MODE } from './client';
import { USUARIOS_WEB } from '../mocks/data';

export async function getUsuarios(params?: { search?: string }): Promise<PaginatedResponse<UsuarioWeb>> {
  if (IS_MOCK_MODE) {
    let data = [...USUARIOS_WEB];
    if (params?.search) {
      const q = params.search.toLowerCase();
      data = data.filter(u => u.nombres.toLowerCase().includes(q) || u.apellidos.toLowerCase().includes(q) || u.codigo.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return { data, total: data.length, page: 1, limit: 20 };
  }
  return apiRequest('/usuarios-web');
}

export async function createUsuario(data: Omit<UsuarioWeb, 'id' | 'createdAt' | 'updatedAt' | 'unidadEducativa' | 'ultimoAcceso'> & { password: string }): Promise<UsuarioWeb> {
  if (IS_MOCK_MODE) {
    const { password: _p, ...rest } = data;
    const nuevo: UsuarioWeb = { ...rest, id: `usr-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    USUARIOS_WEB.push(nuevo);
    return nuevo;
  }
  return apiRequest('/usuarios-web', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUsuario(id: string, data: Partial<UsuarioWeb>): Promise<UsuarioWeb> {
  if (IS_MOCK_MODE) {
    const idx = USUARIOS_WEB.findIndex(u => u.id === id);
    if (idx === -1) throw { statusCode: 404, message: 'Usuario no encontrado' };
    USUARIOS_WEB[idx] = { ...USUARIOS_WEB[idx], ...data, updatedAt: new Date().toISOString() };
    return USUARIOS_WEB[idx];
  }
  return apiRequest(`/usuarios-web/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function resetPassword(id: string, newPassword: string): Promise<void> {
  if (IS_MOCK_MODE) {
    await new Promise(r => setTimeout(r, 500));
    return;
  }
  await apiRequest(`/usuarios-web/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) });
}
