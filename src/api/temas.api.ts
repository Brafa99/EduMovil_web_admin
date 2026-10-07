import { apiRequest } from './client';

export interface Tema {
  id: string;
  nombre: string;
  descripcion?: string | null;
  orden: number;
  activo: boolean;
  catalogoMateriaId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BackendTema {
  id: string;
  nombre: string;
  descripcion?: string | null;
  orden: number;
  activo: boolean;
  catalogoMateriaId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTemaPayload {
  nombre: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
  catalogoMateriaId: string;
}

function mapTema(
  tema: BackendTema
): Tema {
  return {
    id: tema.id,
    nombre: tema.nombre,
    descripcion: tema.descripcion ?? null,
    orden: tema.orden,
    activo: tema.activo,
    catalogoMateriaId:
      tema.catalogoMateriaId,
    createdAt: tema.createdAt,
    updatedAt: tema.updatedAt,
  };
}

export async function getTemas(
  catalogoMateriaId?: string
): Promise<Tema[]> {
  const query =
    catalogoMateriaId
      ? `?catalogoMateriaId=${encodeURIComponent(
          catalogoMateriaId
        )}`
      : '';

  const response =
    await apiRequest<BackendTema[]>(
      `/catalogo/temas${query}`
    );

  return response.map(mapTema);
}

export async function createTema(
  data: CreateTemaPayload
): Promise<Tema> {
  const response =
    await apiRequest<BackendTema>(
      '/catalogo/temas',
      {
        method: 'POST',
        body: JSON.stringify({
          nombre: data.nombre,
          descripcion:
            data.descripcion || undefined,
          orden: data.orden,
          activo: data.activo,
          catalogoMateriaId:
            data.catalogoMateriaId,
        }),
      }
    );

  return mapTema(response);
}

export async function updateTema(
  id: string,
  data: Partial<CreateTemaPayload>
): Promise<Tema> {
  const response =
    await apiRequest<BackendTema>(
      `/catalogo/temas/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );

  return mapTema(response);
}

export async function deleteTema(
  id: string
): Promise<void> {
  await apiRequest<void>(
    `/catalogo/temas/${id}`,
    {
      method: 'DELETE',
    }
  );
}