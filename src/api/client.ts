
const API_BASE =
  import.meta.env.VITE_API_URL ??
  'https://backend-edumovil.onrender.com/api/v1';

export const IS_MOCK_MODE = import.meta.env.VITE_MOCK_MODE !== 'false';

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
  const userId = getDevelopmentUserId();

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (import.meta.env.VITE_AUTH_MOCK === 'true' && userId) {
  headers.set('X-Usuario-Id', userId);
  }

  return headers;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: getHeaders(options),
  });

  if (!response.ok) {
    const responseText = await response.text();

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
  formData: FormData
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