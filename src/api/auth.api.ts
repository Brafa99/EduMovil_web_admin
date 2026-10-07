
import type { AuthResponse, AuthUser } from '../types';
import { apiRequest } from './client';

export interface LoginPayload {
  codigo: string;
  password: string;
}

const MOCK_DELAY = 300;

const IS_AUTH_MOCK_MODE =
  import.meta.env.VITE_AUTH_MOCK === 'true';

const DEV_USERS: AuthUser[] = [
  {
    id: 'a3e97a65-0687-452d-921b-a49664ce0404',
    codigo: 'DEV-01',
    nombres: 'Desarrollador',
    apellidos: '01',
    email: 'dev01@edumovil.bo',
    rol: 'ADMIN',
    activo: true,
    unidadEducativaId: null,
  },
  {
    id: 'd5773fe6-658c-4fc0-8eab-4aabb5511c63',
    codigo: 'DEV-02',
    nombres: 'Desarrollador',
    apellidos: '02',
    email: 'dev02@edumovil.bo',
    rol: 'ADMIN',
    activo: true,
    unidadEducativaId: null,
  },
  {
    id: '36747b1e-f3ed-4482-98fd-3397994233ba',
    codigo: 'DEV-03',
    nombres: 'Desarrollador',
    apellidos: '03',
    email: 'dev03@edumovil.bo',
    rol: 'ADMIN',
    activo: true,
    unidadEducativaId: null,
  },
  {
    id: '19dfe79c-be70-4a32-bcbb-1ec3a8b9fb7d',
    codigo: 'DEV-04',
    nombres: 'Desarrollador',
    apellidos: '04',
    email: 'dev04@edumovil.bo',
    rol: 'ADMIN',
    activo: true,
    unidadEducativaId: null,
  },
  {
    id: '9c059635-7dc2-4990-82f4-4082a4566da0',
    codigo: 'DEV-05',
    nombres: 'Desarrollador',
    apellidos: '05',
    email: 'dev05@edumovil.bo',
    rol: 'ADMIN',
    activo: true,
    unidadEducativaId: null,
  },
];

export async function login(
  payload: LoginPayload,
): Promise<AuthResponse> {
  if (IS_AUTH_MOCK_MODE) {
    await new Promise((resolve) =>
      setTimeout(resolve, MOCK_DELAY),
    );

    const codigo = payload.codigo.trim().toUpperCase();
    const user = DEV_USERS.find(
      (item) => item.codigo === codigo,
    );

    if (user && payload.password === 'dev123') {
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

  return apiRequest<AuthResponse>(
    '/auth/web/login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function getMe(): Promise<AuthResponse['user']> {
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

  return apiRequest<AuthResponse['user']>('/auth/me');
}

export async function logout(): Promise<void> {
  if (IS_AUTH_MOCK_MODE) {
    await new Promise((resolve) =>
      setTimeout(resolve, 200),
    );
    return;
  }

  await apiRequest('/auth/logout', {
    method: 'POST',
  });
}

export function getMockCredentials() {
  return DEV_USERS.map((user) => ({
    codigo: user.codigo,
    rol: user.rol,
    hint: 'dev123',
  }));
}