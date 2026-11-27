import type { AuthResponse, AuthUser } from '../types';
import { apiRequest } from './client';

export interface LoginPayload {
  codigo: string;
  password: string;
  rolEsperado?: 'ADMIN' | 'SUPERADMIN' | 'ENCUESTADOR';
}

const MOCK_DELAY = 300;

const IS_AUTH_MOCK_MODE = import.meta.env.VITE_AUTH_MOCK === 'true';

const DEV_USERS: AuthUser[] = [
  {
    id: 'a3e97a65-0687-452d-921b-a49664ce0404',
    codigo: 'DEV-01',
    nombres: 'Desarrollador',
    apellidos: '01',
    email: 'dev01@edumovil.bo',
    rol: 'SUPERADMIN',
    activo: true,
    unidadEducativaId: null,
  },
  {
    id: 'd5773fe6-658c-4fc0-8eab-4aabb5511c63',
    codigo: 'DEV-02',
    nombres: 'Desarrollador',
    apellidos: '02',
    email: 'dev02@edumovil.bo',
    rol: 'SUPERADMIN',
    activo: true,
    unidadEducativaId: null,
  },
  {
    id: '36747b1e-f3ed-4482-98fd-3397994233ba',
    codigo: 'DEV-03',
    nombres: 'Desarrollador',
    apellidos: '03',
    email: 'dev03@edumovil.bo',
    rol: 'SUPERADMIN',
    activo: true,
    unidadEducativaId: null,
  },
  {
    id: '19dfe79c-be70-4a32-bcbb-1ec3a8b9fb7d',
    codigo: 'DEV-04',
    nombres: 'Desarrollador',
    apellidos: '04',
    email: 'dev04@edumovil.bo',
    rol: 'SUPERADMIN',
    activo: true,
    unidadEducativaId: null,
  },
  {
    id: '9c059635-7dc2-4990-82f4-4082a4566da0',
    codigo: 'DEV-05',
    nombres: 'Desarrollador',
    apellidos: '05',
    email: 'dev05@edumovil.bo',
    rol: 'SUPERADMIN',
    activo: true,
    unidadEducativaId: null,
  },
];

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const identificador = payload.codigo.trim();
  const password = payload.password.trim();

  if (IS_AUTH_MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

    const upper = identificador.toUpperCase();
    const lower = identificador.toLowerCase();
    const user = DEV_USERS.find(
      (item) =>
        item.codigo === upper ||
        item.email?.toLowerCase() === lower,
    );

    if (user && password.length > 0) {
      return {
        accessToken: 'development-mock-token',
        user,
      };
    }

    throw {
      statusCode: 401,
      message: 'Código o contraseña incorrectos',
    };
  }

  const raw = await apiRequest<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identificador,
      password,
      rolEsperado: payload.rolEsperado,
    }),
  });

  const backendUser = raw?.usuario ?? raw?.user;
  const nombresCompletos = (backendUser?.nombre ?? '').trim().split(/\s+/);

  const user: AuthUser = {
    id: backendUser?.id,
    codigo: backendUser?.username ?? identificador,
    nombres: backendUser?.nombres ?? nombresCompletos[0] ?? 'Usuario',
    apellidos:
      backendUser?.apellidos ??
      (nombresCompletos.slice(1).join(' ') || ''),
    email: backendUser?.email ?? '',
    rol: backendUser?.rol ?? 'ADMIN',
    activo: backendUser?.estado ? backendUser.estado === 'ACTIVO' : true,
    unidadEducativaId: backendUser?.unidadEducativaId ?? null,
  };

  return {
    accessToken: raw.accessToken,
    user,
  };
}

export async function getMe(): Promise<AuthUser> {
  if (IS_AUTH_MOCK_MODE) {
    const stored = localStorage.getItem('edumovil_user');
    if (stored) {
      return JSON.parse(stored) as AuthUser;
    }
    throw {
      statusCode: 401,
      message: 'No autenticado',
    };
  }

  return apiRequest<AuthUser>('/auth/me');
}

export async function logout(): Promise<void> {
  if (IS_AUTH_MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return;
  }

  await apiRequest('/auth/logout', {
    method: 'POST',
  }).catch(() => undefined);
}

export function getMockCredentials() {
  return DEV_USERS.map((user) => ({
    codigo: user.codigo,
    rol: user.rol,
    hint: 'Usa tu clave de Supabase o dev123',
  }));
}

const API_BASE =
  import.meta.env.VITE_API_URL ??
  'https://backend-edumovil.onrender.com/api/v1';

export const IS_MOCK_MODE = import.meta.env.VITE_MOCK_MODE !== 'false';
const IS_AUTH_MOCK = import.meta.env.VITE_AUTH_MOCK === 'true';

function getDevelopmentUserId(): string | null {
  try {
    const storedUser = localStorage.getItem('edumovil_user');
    if (!storedUser) return null;

    const user = JSON.parse(storedUser);
    return typeof user?.id === 'string' ? user.id : null;
  } catch {
    return null;
  }
}

function getHeaders(options: RequestInit = {}): Headers {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem('edumovil_token');

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && token !== 'development-mock-token') {
    headers.set('Authorization', `Bearer ${token}`);
  } else if (IS_AUTH_MOCK && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (IS_AUTH_MOCK) {
    const userId = getDevelopmentUserId() || localStorage.getItem('usuario_id');
    if (userId && !headers.has('X-Usuario-Id')) {
      headers.set('X-Usuario-Id', userId);
    }
  }

  return headers;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = getHeaders(options);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const responseText = await response.text();

    if (response.status === 401 && !endpoint.includes('/auth/login') && !IS_AUTH_MOCK) {
      localStorage.removeItem('edumovil_token');
      localStorage.removeItem('edumovil_user');
      localStorage.removeItem('usuarioId');
      localStorage.removeItem('usuario_id');
    }

    console.error('❌ Error en API:', {
      url,
      method: options.method ?? 'GET',
      status: response.status,
      response: responseText,
      requestBody: options.body,
    });

    let error: any;
    try {
      error = JSON.parse(responseText);
    } catch {
      error = { message: responseText || 'Error de servidor' };
    }

    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function uploadFile<T>(
  endpoint: string,
  formData: FormData,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: getHeaders({ body: formData }),
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Error al subir archivo',
    }));
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}