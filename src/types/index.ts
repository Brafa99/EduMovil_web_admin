export type UserRole = 'ADMIN' | 'ENCUESTADOR';

export type ActiveStatus = 'activo' | 'inactivo';

export type TipoInstitucion = 'PUBLICA' | 'PRIVADA' | 'CONVENIO';

export type NivelEducativo =
  | 'INICIAL'
  | 'PRIMARIA'
  | 'SECUNDARIA'
  | 'TECNICO';

  export type CursoResumen = Pick<
  Curso,
  'id' | 'nombre'
>;

export type ProfesorResumen = Pick<
  Profesor,
  'profesorCi' | 'nombres' | 'apellidos'
>;

export interface AuthUser {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  unidadEducativaId: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UnidadEducativa {
  id: string;
  nombre: string;
  tipo: 'colegio' | 'colegio_tecnico' | 'instituto' | 'unidad_educativa';
  ciudad: string;
  descripcion?: string;
  departamento: string;
  direccion?: string;
  telefono?: string;
  activo: boolean;
  totalEstudiantes?: number;
  totalCursos?: number;

  // Información institucional
  codigoInstitucional?: string;
  tipoInstitucion?: TipoInstitucion;
  nivelesEducativos?: NivelEducativo[];

  // Contacto y responsables
  director?: string;
  encargador?: string;
  email?: string;
  telefonoAlternativo?: string;
  sitioWeb?: string;

  // Ubicación
  provincia?: string;
  municipio?: string;
  zona?: string;
  latitud?: number | null;
  longitud?: number | null;

  // Capacidad y organización
  numeroAlumnos?: number;
  cantidadMaximaAlumnos?: number;
  turnos?: string[];

  // Imágenes almacenadas en Supabase Storage
  imagenPrincipalUrl?: string | null;
  imagenPortadaUrl?: string | null;
  imagenes?: string[];

  createdAt: string;
  updatedAt: string;
}

export interface GestionAcademica {
  id: string;
  anio: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  unidadEducativaId: string;
  unidadEducativa?: UnidadEducativa;
  createdAt: string;
  updatedAt: string;
}

export interface Profesor {
  id: string;
  profesorCi: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  unidadEducativaId: string;
  unidadEducativa?: UnidadEducativa;
  materias?: Materia[];
  createdAt: string;
  updatedAt: string;
}

export interface Curso {
  id: string;
  nombre: string;
  paralelo: string;
  nivel: string;
  grado?: number | null;
  turno?: string | null;
  gestionId: string;
  gestion?: GestionAcademica;
  unidadEducativaId: string;
  unidadEducativa?: UnidadEducativa;
  profesorCiTutor?: string;
  profesorTutor?: Profesor;
  totalEstudiantes: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogoTemaResumen {
  id: string;
  nombre: string;
  descripcion?: string | null;
  orden: number;
  activo: boolean;
}

export interface CatalogoMateriaResumen {
  id: string;
  nombre: string;
  descripcion?: string | null;
  temas: CatalogoTemaResumen[];
}

export interface Materia {
  id: string;
  nombre: string;
  cursoId: string;
  curso?: CursoResumen;
  profesorCi?: string;
  profesor?: ProfesorResumen;
  activo: boolean;
  catalogoMateriaId?: string;
  catalogoMateria?: CatalogoMateriaResumen;
  createdAt: string;
  updatedAt: string;
}

export interface Padre {
  id: string;
  ci: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email?: string;
  ocupacion?: string;
  direccion?: string;
  relacion: 'padre' | 'madre' | 'tutor' | 'otro';
  activo: boolean;
  estudiantes?: Estudiante[];
  createdAt: string;
  updatedAt: string;
}

export interface Estudiante {
  id: string;
  ci: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero?: 'M' | 'F';
  codigoRude?: string;
  cursoActualId?: string;
  cursoActual?: Curso;
  paralelo?: string;
  unidadEducativaId: string;
  unidadEducativa?: UnidadEducativa;
  gestionId: string;
  gestion?: GestionAcademica;
  padreId?: string;
  padre?: Padre;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Nota {
  id: string;
  estudianteId: string;
  estudiante?: Estudiante;
  materiaId: string;
  materia?: Materia;
  gestionId: string;
  gestion?: GestionAcademica;
  trimestre: 1 | 2 | 3;
  puntaje: number;
  estado: 'aprobado' | 'reprobado' | 'pendiente';
  observacion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Practica {
  id: string;
  titulo: string;
  puntaje: number;
  fecha: string;
  estudianteId: string;
  estudiante?: Estudiante;
  materiaId: string;
  materia?: Materia;
  trimestre: 1 | 2 | 3;
  descripcion?: string;
  estado: 'pendiente' | 'completado';
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioWeb {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  unidadEducativaId?: string;
  unidadEducativa?: UnidadEducativa;
  ultimoAcceso?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportResult {
  id: string;
  fecha: string;
  archivo: string;
  tipo: 'estudiantes' | 'profesores' | 'notas';
  totalFilas: number;
  creados: number;
  actualizados: number;
  omitidos: number;
  errores: number;
  estado: 'completado' | 'fallido' | 'parcial';
  unidadEducativaId: string;
  gestionId?: string;
  usuarioId: string;
}

export interface ImportRowError {
  fila: number;
  campo: string;
  mensaje: string;
  tipo: 'error' | 'advertencia' | 'duplicado';
  valorOriginal?: string;
}

export interface ActivityItem {
  id: string;
  tipo: 'registro_estudiante' | 'importacion' | 'nota_actualizada' | 'nuevo_usuario' | 'institucion_actualizada';
  descripcion: string;
  usuario: string;
  fecha: string;
  entidadId?: string;
}
