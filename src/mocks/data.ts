import type {
  UnidadEducativa, GestionAcademica, Profesor, Curso,
  Materia, Estudiante, Padre, Nota, Practica, UsuarioWeb,
  ImportResult, ActivityItem
} from '../types';

export const INSTITUCIONES: UnidadEducativa[] = [
  {
    id: 'inst-1',
    nombre: 'Colegio Nacional Simón Bolívar',
    tipo: 'colegio',
    ciudad: 'La Paz',
    departamento: 'La Paz',
    direccion: 'Av. Arce 1234, Zona Central',
    telefono: '02-2441234',
    activo: true,
    totalEstudiantes: 847,
    totalCursos: 18,
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-08-20T10:30:00Z',
  },
  {
    id: 'inst-2',
    nombre: 'Unidad Educativa Fe y Alegría',
    tipo: 'unidad_educativa',
    ciudad: 'Cochabamba',
    departamento: 'Cochabamba',
    direccion: 'Calle Jordán 567, Zona Norte',
    telefono: '04-4523456',
    activo: true,
    totalEstudiantes: 612,
    totalCursos: 14,
    createdAt: '2023-02-10T09:00:00Z',
    updatedAt: '2024-08-18T14:15:00Z',
  },
  {
    id: 'inst-3',
    nombre: 'Instituto Tecnológico Santa Cruz',
    tipo: 'instituto',
    ciudad: 'Santa Cruz de la Sierra',
    departamento: 'Santa Cruz',
    direccion: 'Av. Tres Pasos al Frente 890',
    telefono: '03-3564789',
    activo: false,
    totalEstudiantes: 320,
    totalCursos: 8,
    createdAt: '2023-03-05T10:00:00Z',
    updatedAt: '2024-06-01T09:00:00Z',
  },
];

export const GESTIONES: GestionAcademica[] = [
  {
    id: 'gest-1',
    anio: 2024,
    nombre: 'Gestión 2024',
    fechaInicio: '2024-02-01',
    fechaFin: '2024-11-30',
    activo: true,
    unidadEducativaId: 'inst-1',
    unidadEducativa: INSTITUCIONES[0],
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 'gest-2',
    anio: 2024,
    nombre: 'Gestión 2024',
    fechaInicio: '2024-02-01',
    fechaFin: '2024-11-30',
    activo: true,
    unidadEducativaId: 'inst-2',
    unidadEducativa: INSTITUCIONES[1],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'gest-3',
    anio: 2023,
    nombre: 'Gestión 2023',
    fechaInicio: '2023-02-01',
    fechaFin: '2023-11-30',
    activo: false,
    unidadEducativaId: 'inst-1',
    unidadEducativa: INSTITUCIONES[0],
    createdAt: '2023-01-10T08:00:00Z',
    updatedAt: '2023-12-01T08:00:00Z',
  },
];

export const PROFESORES: Profesor[] = [
  { id: 'profesor-1', profesorCi: '1234567', nombres: 'Roberto', apellidos: 'Flores Quispe', telefono: '71234567', email: 'r.flores@colegiobolivar.edu.bo', activo: true, unidadEducativaId: 'inst-1', createdAt: '2023-02-01T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
  { id: 'profesor-2', profesorCi: '2345678', nombres: 'María Elena', apellidos: 'Cáceres Mamani', telefono: '72345678', email: 'm.caceres@colegiobolivar.edu.bo', activo: true, unidadEducativaId: 'inst-1', createdAt: '2023-02-01T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
  { id: 'profesor-3', profesorCi: '3456789', nombres: 'Carlos Alberto', apellidos: 'Vargas Torrez', telefono: '73456789', email: 'c.vargas@colegiobolivar.edu.bo', activo: true, unidadEducativaId: 'inst-1', createdAt: '2023-02-01T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
  { id: 'profesor-4', profesorCi: '4567890', nombres: 'Ana Patricia', apellidos: 'Rojas Limachi', telefono: '74567890', email: 'a.rojas@feyalegria.edu.bo', activo: true, unidadEducativaId: 'inst-2', createdAt: '2023-03-01T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
  { id: 'profesor-5', profesorCi: '5678901', nombres: 'Diego Alejandro', apellidos: 'Chávez Poma', telefono: '75678901', email: 'd.chavez@feyalegria.edu.bo', activo: true, unidadEducativaId: 'inst-2', createdAt: '2023-03-01T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
  { id: 'profesor-6', profesorCi: '6789012', nombres: 'Lucía Fernanda', apellidos: 'Condori Apaza', telefono: '76789012', email: 'l.condori@colegiobolivar.edu.bo', activo: true, unidadEducativaId: 'inst-1', createdAt: '2023-02-15T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
  { id: 'profesor-7', profesorCi: '7890123', nombres: 'Fernando José', apellidos: 'Espinoza Ríos', telefono: '77890123', activo: false, unidadEducativaId: 'inst-1', createdAt: '2023-02-15T08:00:00Z', updatedAt: '2024-05-01T08:00:00Z' },
  { id: 'profesor-8', profesorCi: '8901234', nombres: 'Valentina Rosa', apellidos: 'Huanca Gutierrez', telefono: '78901234', email: 'v.huanca@feyalegria.edu.bo', activo: true, unidadEducativaId: 'inst-2', createdAt: '2023-03-15T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
];

export const CURSOS: Curso[] = [
  { id: 'curso-1', nombre: 'Primero de Secundaria', paralelo: 'A', nivel: 'secundaria', gestionId: 'gest-1', gestion: GESTIONES[0], unidadEducativaId: 'inst-1', profesorCiTutor: '1234567', totalEstudiantes: 32, activo: true, createdAt: '2024-01-20T08:00:00Z', updatedAt: '2024-01-20T08:00:00Z' },
  { id: 'curso-2', nombre: 'Primero de Secundaria', paralelo: 'B', nivel: 'secundaria', gestionId: 'gest-1', gestion: GESTIONES[0], unidadEducativaId: 'inst-1', profesorCiTutor: '2345678', totalEstudiantes: 30, activo: true, createdAt: '2024-01-20T08:00:00Z', updatedAt: '2024-01-20T08:00:00Z' },
  { id: 'curso-3', nombre: 'Segundo de Secundaria', paralelo: 'A', nivel: 'secundaria', gestionId: 'gest-1', gestion: GESTIONES[0], unidadEducativaId: 'inst-1', profesorCiTutor: '3456789', totalEstudiantes: 28, activo: true, createdAt: '2024-01-20T08:00:00Z', updatedAt: '2024-01-20T08:00:00Z' },
  { id: 'curso-4', nombre: 'Tercero de Secundaria', paralelo: 'A', nivel: 'secundaria', gestionId: 'gest-1', gestion: GESTIONES[0], unidadEducativaId: 'inst-1', profesorCiTutor: '6789012', totalEstudiantes: 25, activo: true, createdAt: '2024-01-20T08:00:00Z', updatedAt: '2024-01-20T08:00:00Z' },
  { id: 'curso-5', nombre: 'Primero de Secundaria', paralelo: 'A', nivel: 'secundaria', gestionId: 'gest-2', gestion: GESTIONES[1], unidadEducativaId: 'inst-2', profesorCiTutor: '4567890', totalEstudiantes: 35, activo: true, createdAt: '2024-01-20T08:00:00Z', updatedAt: '2024-01-20T08:00:00Z' },
  { id: 'curso-6', nombre: 'Segundo de Secundaria', paralelo: 'A', nivel: 'secundaria', gestionId: 'gest-2', gestion: GESTIONES[1], unidadEducativaId: 'inst-2', profesorCiTutor: '5678901', totalEstudiantes: 33, activo: true, createdAt: '2024-01-20T08:00:00Z', updatedAt: '2024-01-20T08:00:00Z' },
];

export const MATERIAS: Materia[] = [
  { id: 'mat-1', nombre: 'Matemáticas', cursoId: 'curso-1', profesorCi: '1234567', activo: true, createdAt: '2024-02-01T08:00:00Z', updatedAt: '2024-02-01T08:00:00Z' },
  { id: 'mat-2', nombre: 'Lenguaje y Literatura', cursoId: 'curso-1', profesorCi: '2345678', activo: true, createdAt: '2024-02-01T08:00:00Z', updatedAt: '2024-02-01T08:00:00Z' },
  { id: 'mat-3', nombre: 'Ciencias Naturales', cursoId: 'curso-1', profesorCi: '3456789', activo: true, createdAt: '2024-02-01T08:00:00Z', updatedAt: '2024-02-01T08:00:00Z' },
  { id: 'mat-4', nombre: 'Ciencias Sociales', cursoId: 'curso-2', profesorCi: '2345678', activo: true, createdAt: '2024-02-01T08:00:00Z', updatedAt: '2024-02-01T08:00:00Z' },
  { id: 'mat-5', nombre: 'Educación Física', cursoId: 'curso-2', profesorCi: '7890123', activo: false, createdAt: '2024-02-01T08:00:00Z', updatedAt: '2024-05-01T08:00:00Z' },
  { id: 'mat-6', nombre: 'Matemáticas', cursoId: 'curso-3', profesorCi: '6789012', activo: true, createdAt: '2024-02-01T08:00:00Z', updatedAt: '2024-02-01T08:00:00Z' },
  { id: 'mat-7', nombre: 'Física', cursoId: 'curso-3', profesorCi: '3456789', activo: true, createdAt: '2024-02-01T08:00:00Z', updatedAt: '2024-02-01T08:00:00Z' },
  { id: 'mat-8', nombre: 'Química', cursoId: 'curso-4', profesorCi: '6789012', activo: true, createdAt: '2024-02-01T08:00:00Z', updatedAt: '2024-02-01T08:00:00Z' },
  { id: 'mat-9', nombre: 'Biología', cursoId: 'curso-4', profesorCi: '1234567', activo: true, createdAt: '2024-02-01T08:00:00Z', updatedAt: '2024-02-01T08:00:00Z' },
  { id: 'mat-10', nombre: 'Inglés', cursoId: 'curso-5', profesorCi: '4567890', activo: true, createdAt: '2024-02-01T08:00:00Z', updatedAt: '2024-02-01T08:00:00Z' },
];

export const PADRES: Padre[] = [
  { id: 'padre-1', ci: '9100001', nombres: 'Juan Carlos', apellidos: 'Mamani Flores', telefono: '71100001', email: 'j.mamani@gmail.com', relacion: 'padre', activo: true, createdAt: '2024-02-10T08:00:00Z', updatedAt: '2024-02-10T08:00:00Z' },
  { id: 'padre-2', ci: '9100002', nombres: 'Rosa Elena', apellidos: 'Quispe López', telefono: '71100002', email: 'r.quispe@gmail.com', relacion: 'madre', activo: true, createdAt: '2024-02-10T08:00:00Z', updatedAt: '2024-02-10T08:00:00Z' },
  { id: 'padre-3', ci: '9100003', nombres: 'Pedro Alfredo', apellidos: 'Torrez Chávez', telefono: '71100003', relacion: 'padre', activo: true, createdAt: '2024-02-10T08:00:00Z', updatedAt: '2024-02-10T08:00:00Z' },
  { id: 'padre-4', ci: '9100004', nombres: 'Carmen Lucía', apellidos: 'Condori Rojas', telefono: '71100004', email: 'c.condori@gmail.com', relacion: 'madre', activo: true, createdAt: '2024-02-12T08:00:00Z', updatedAt: '2024-02-12T08:00:00Z' },
  { id: 'padre-5', ci: '9100005', nombres: 'Marco Antonio', apellidos: 'Vargas Huanca', telefono: '71100005', relacion: 'tutor', activo: true, createdAt: '2024-02-15T08:00:00Z', updatedAt: '2024-02-15T08:00:00Z' },
];

export const ESTUDIANTES: Estudiante[] = [
  { id: 'est-1', ci: '8000001', nombres: 'Alejandro', apellidos: 'Mamani Quispe', fechaNacimiento: '2010-03-15', genero: 'M', cursoActualId: 'curso-1', paralelo: 'A', unidadEducativaId: 'inst-1', gestionId: 'gest-1', padreId: 'padre-1', activo: true, createdAt: '2024-02-15T08:00:00Z', updatedAt: '2024-02-15T08:00:00Z' },
  { id: 'est-2', ci: '8000002', nombres: 'Valentina', apellidos: 'Flores Torrez', fechaNacimiento: '2010-05-22', genero: 'F', cursoActualId: 'curso-1', paralelo: 'A', unidadEducativaId: 'inst-1', gestionId: 'gest-1', padreId: 'padre-2', activo: true, createdAt: '2024-02-15T08:00:00Z', updatedAt: '2024-02-15T08:00:00Z' },
  { id: 'est-3', ci: '8000003', nombres: 'Diego Felipe', apellidos: 'Chávez Condori', fechaNacimiento: '2010-07-10', genero: 'M', cursoActualId: 'curso-1', paralelo: 'A', unidadEducativaId: 'inst-1', gestionId: 'gest-1', padreId: 'padre-3', activo: true, createdAt: '2024-02-16T08:00:00Z', updatedAt: '2024-02-16T08:00:00Z' },
  { id: 'est-4', ci: '8000004', nombres: 'Sofía Luciana', apellidos: 'Rojas Vargas', fechaNacimiento: '2010-09-05', genero: 'F', cursoActualId: 'curso-1', paralelo: 'A', unidadEducativaId: 'inst-1', gestionId: 'gest-1', padreId: 'padre-4', activo: true, createdAt: '2024-02-16T08:00:00Z', updatedAt: '2024-02-16T08:00:00Z' },
  { id: 'est-5', ci: '8000005', nombres: 'Mateo Andrés', apellidos: 'Limachi Poma', fechaNacimiento: '2010-11-18', genero: 'M', cursoActualId: 'curso-2', paralelo: 'B', unidadEducativaId: 'inst-1', gestionId: 'gest-1', padreId: 'padre-5', activo: true, createdAt: '2024-02-17T08:00:00Z', updatedAt: '2024-02-17T08:00:00Z' },
  { id: 'est-6', ci: '8000006', nombres: 'Camila Beatriz', apellidos: 'Apaza Espinoza', fechaNacimiento: '2010-01-25', genero: 'F', cursoActualId: 'curso-2', paralelo: 'B', unidadEducativaId: 'inst-1', gestionId: 'gest-1', activo: true, createdAt: '2024-02-17T08:00:00Z', updatedAt: '2024-02-17T08:00:00Z' },
  { id: 'est-7', ci: '8000007', nombres: 'Sebastián', apellidos: 'Gutierrez Ríos', fechaNacimiento: '2009-04-12', genero: 'M', cursoActualId: 'curso-3', paralelo: 'A', unidadEducativaId: 'inst-1', gestionId: 'gest-1', activo: true, createdAt: '2024-02-18T08:00:00Z', updatedAt: '2024-02-18T08:00:00Z' },
  { id: 'est-8', ci: '8000008', nombres: 'Isabella María', apellidos: 'Huanca López', fechaNacimiento: '2009-06-30', genero: 'F', cursoActualId: 'curso-3', paralelo: 'A', unidadEducativaId: 'inst-1', gestionId: 'gest-1', padreId: 'padre-1', activo: true, createdAt: '2024-02-18T08:00:00Z', updatedAt: '2024-02-18T08:00:00Z' },
  { id: 'est-9', ci: '8000009', nombres: 'Gabriel Enrique', apellidos: 'Morales Cáceres', fechaNacimiento: '2008-08-14', genero: 'M', cursoActualId: 'curso-4', paralelo: 'A', unidadEducativaId: 'inst-1', gestionId: 'gest-1', activo: true, createdAt: '2024-02-19T08:00:00Z', updatedAt: '2024-02-19T08:00:00Z' },
  { id: 'est-10', ci: '8000010', nombres: 'Natalia Elena', apellidos: 'Salinas Mendoza', fechaNacimiento: '2008-10-03', genero: 'F', cursoActualId: 'curso-4', paralelo: 'A', unidadEducativaId: 'inst-1', gestionId: 'gest-1', padreId: 'padre-2', activo: true, createdAt: '2024-02-19T08:00:00Z', updatedAt: '2024-02-19T08:00:00Z' },
  { id: 'est-11', ci: '8000011', nombres: 'Lucas Rodrigo', apellidos: 'Callisaya Mamani', fechaNacimiento: '2010-02-08', genero: 'M', cursoActualId: 'curso-5', paralelo: 'A', unidadEducativaId: 'inst-2', gestionId: 'gest-2', activo: true, createdAt: '2024-02-20T08:00:00Z', updatedAt: '2024-02-20T08:00:00Z' },
  { id: 'est-12', ci: '8000012', nombres: 'Valeria Fernanda', apellidos: 'Ortuño Sejas', fechaNacimiento: '2010-04-17', genero: 'F', cursoActualId: 'curso-5', paralelo: 'A', unidadEducativaId: 'inst-2', gestionId: 'gest-2', padreId: 'padre-3', activo: true, createdAt: '2024-02-20T08:00:00Z', updatedAt: '2024-02-20T08:00:00Z' },
  { id: 'est-13', ci: '8000013', nombres: 'Nicolás Javier', apellidos: 'Zambrana Perez', fechaNacimiento: '2010-06-24', genero: 'M', cursoActualId: 'curso-5', paralelo: 'A', unidadEducativaId: 'inst-2', gestionId: 'gest-2', activo: true, createdAt: '2024-02-21T08:00:00Z', updatedAt: '2024-02-21T08:00:00Z' },
  { id: 'est-14', ci: '8000014', nombres: 'Paola Alejandra', apellidos: 'Coria Torrico', fechaNacimiento: '2010-08-11', genero: 'F', cursoActualId: 'curso-6', paralelo: 'A', unidadEducativaId: 'inst-2', gestionId: 'gest-2', padreId: 'padre-4', activo: true, createdAt: '2024-02-21T08:00:00Z', updatedAt: '2024-02-21T08:00:00Z' },
  { id: 'est-15', ci: '8000015', nombres: 'Emilio Dante', apellidos: 'Barrios Antelo', fechaNacimiento: '2009-12-30', genero: 'M', cursoActualId: 'curso-6', paralelo: 'A', unidadEducativaId: 'inst-2', gestionId: 'gest-2', activo: false, createdAt: '2024-02-22T08:00:00Z', updatedAt: '2024-06-01T08:00:00Z' },
  { id: 'est-16', ci: '8000016', nombres: 'Andrea Cecilia', apellidos: 'Nogales Soria', fechaNacimiento: '2010-03-07', genero: 'F', cursoActualId: 'curso-6', paralelo: 'A', unidadEducativaId: 'inst-2', gestionId: 'gest-2', padreId: 'padre-5', activo: true, createdAt: '2024-02-22T08:00:00Z', updatedAt: '2024-02-22T08:00:00Z' },
  { id: 'est-17', ci: '8000017', nombres: 'Ricardo Omar', apellidos: 'Pinto Bustamante', fechaNacimiento: '2010-07-20', genero: 'M', cursoActualId: 'curso-1', paralelo: 'A', unidadEducativaId: 'inst-1', gestionId: 'gest-1', activo: true, createdAt: '2024-03-01T08:00:00Z', updatedAt: '2024-03-01T08:00:00Z' },
  { id: 'est-18', ci: '8000018', nombres: 'Paula Cristina', apellidos: 'Herrera Zabala', fechaNacimiento: '2010-09-14', genero: 'F', cursoActualId: 'curso-2', paralelo: 'B', unidadEducativaId: 'inst-1', gestionId: 'gest-1', activo: true, createdAt: '2024-03-01T08:00:00Z', updatedAt: '2024-03-01T08:00:00Z' },
  { id: 'est-19', ci: '8000019', nombres: 'Bruno Esteban', apellidos: 'Illanes Montoya', fechaNacimiento: '2009-11-28', genero: 'M', cursoActualId: 'curso-3', paralelo: 'A', unidadEducativaId: 'inst-1', gestionId: 'gest-1', activo: true, createdAt: '2024-03-02T08:00:00Z', updatedAt: '2024-03-02T08:00:00Z' },
  { id: 'est-20', ci: '8000020', nombres: 'Carla Marcela', apellidos: 'Suárez Alvarado', fechaNacimiento: '2010-01-05', genero: 'F', cursoActualId: 'curso-5', paralelo: 'A', unidadEducativaId: 'inst-2', gestionId: 'gest-2', activo: true, createdAt: '2024-03-02T08:00:00Z', updatedAt: '2024-03-02T08:00:00Z' },
];

export const NOTAS: Nota[] = [
  { id: 'nota-1', estudianteId: 'est-1', materiaId: 'mat-1', gestionId: 'gest-1', trimestre: 1, puntaje: 78, estado: 'aprobado', createdAt: '2024-05-10T08:00:00Z', updatedAt: '2024-05-10T08:00:00Z' },
  { id: 'nota-2', estudianteId: 'est-1', materiaId: 'mat-2', gestionId: 'gest-1', trimestre: 1, puntaje: 85, estado: 'aprobado', createdAt: '2024-05-10T08:00:00Z', updatedAt: '2024-05-10T08:00:00Z' },
  { id: 'nota-3', estudianteId: 'est-2', materiaId: 'mat-1', gestionId: 'gest-1', trimestre: 1, puntaje: 45, estado: 'reprobado', observacion: 'Necesita refuerzo', createdAt: '2024-05-10T08:00:00Z', updatedAt: '2024-05-10T08:00:00Z' },
  { id: 'nota-4', estudianteId: 'est-3', materiaId: 'mat-3', gestionId: 'gest-1', trimestre: 1, puntaje: 90, estado: 'aprobado', createdAt: '2024-05-11T08:00:00Z', updatedAt: '2024-05-11T08:00:00Z' },
  { id: 'nota-5', estudianteId: 'est-4', materiaId: 'mat-1', gestionId: 'gest-1', trimestre: 1, puntaje: 65, estado: 'aprobado', createdAt: '2024-05-11T08:00:00Z', updatedAt: '2024-05-11T08:00:00Z' },
  { id: 'nota-6', estudianteId: 'est-5', materiaId: 'mat-4', gestionId: 'gest-1', trimestre: 1, puntaje: 55, estado: 'pendiente', createdAt: '2024-05-12T08:00:00Z', updatedAt: '2024-05-12T08:00:00Z' },
  { id: 'nota-7', estudianteId: 'est-7', materiaId: 'mat-6', gestionId: 'gest-1', trimestre: 1, puntaje: 82, estado: 'aprobado', createdAt: '2024-05-13T08:00:00Z', updatedAt: '2024-05-13T08:00:00Z' },
  { id: 'nota-8', estudianteId: 'est-9', materiaId: 'mat-8', gestionId: 'gest-1', trimestre: 1, puntaje: 72, estado: 'aprobado', createdAt: '2024-05-14T08:00:00Z', updatedAt: '2024-05-14T08:00:00Z' },
];

export const PRACTICAS: Practica[] = [
  { id: 'prac-1', estudianteId: 'est-1', materiaId: 'mat-1', titulo: 'Ejercicios de álgebra lineal', descripcion: 'Resolución de sistemas de ecuaciones', puntaje: 92, fecha: '2024-04-15', estado: 'revisado', createdAt: '2024-04-15T08:00:00Z', updatedAt: '2024-04-16T08:00:00Z' },
  { id: 'prac-2', estudianteId: 'est-2', materiaId: 'mat-2', titulo: 'Análisis literario: El Quijote', puntaje: 88, fecha: '2024-04-16', estado: 'revisado', createdAt: '2024-04-16T08:00:00Z', updatedAt: '2024-04-17T08:00:00Z' },
  { id: 'prac-3', estudianteId: 'est-3', materiaId: 'mat-3', titulo: 'Experimento: fotosíntesis', puntaje: 95, fecha: '2024-04-18', estado: 'revisado', createdAt: '2024-04-18T08:00:00Z', updatedAt: '2024-04-19T08:00:00Z' },
  { id: 'prac-4', estudianteId: 'est-4', materiaId: 'mat-1', titulo: 'Resolución de inecuaciones', fecha: '2024-05-02', estado: 'pendiente', createdAt: '2024-05-02T08:00:00Z', updatedAt: '2024-05-02T08:00:00Z' },
  { id: 'prac-5', estudianteId: 'est-7', materiaId: 'mat-7', titulo: 'Práctica de laboratorio: cinemática', puntaje: 78, fecha: '2024-05-05', estado: 'completado', createdAt: '2024-05-05T08:00:00Z', updatedAt: '2024-05-06T08:00:00Z' },
];

export const USUARIOS_WEB: UsuarioWeb[] = [
  { id: 'usr-1', codigo: 'ADM-001', nombres: 'Administrador', apellidos: 'General', email: 'admin@edumovil.bo', rol: 'ADMIN', activo: true, ultimoAcceso: '2024-08-22T09:15:00Z', createdAt: '2023-01-01T08:00:00Z', updatedAt: '2024-08-22T09:15:00Z' },
  { id: 'usr-2', codigo: 'ENC-001', nombres: 'Carlos Rodrigo', apellidos: 'Mamani Flores', email: 'c.mamani@edumovil.bo', rol: 'ENCUESTADOR', activo: true, unidadEducativaId: 'inst-1', ultimoAcceso: '2024-08-21T14:30:00Z', createdAt: '2023-06-15T08:00:00Z', updatedAt: '2024-08-21T14:30:00Z' },
  { id: 'usr-3', codigo: 'ENC-002', nombres: 'Patricia Elena', apellidos: 'Torrez Quispe', email: 'p.torrez@edumovil.bo', rol: 'ENCUESTADOR', activo: true, unidadEducativaId: 'inst-2', ultimoAcceso: '2024-08-20T11:00:00Z', createdAt: '2023-08-01T08:00:00Z', updatedAt: '2024-08-20T11:00:00Z' },
];

export const IMPORT_HISTORY: ImportResult[] = [
  { id: 'imp-1', fecha: '2024-08-15T10:00:00Z', archivo: 'estudiantes_bolivar_gest2024.xlsx', tipo: 'estudiantes', totalFilas: 125, creados: 118, actualizados: 5, omitidos: 2, errores: 0, estado: 'completado', unidadEducativaId: 'inst-1', gestionId: 'gest-1', usuarioId: 'usr-2' },
  { id: 'imp-2', fecha: '2024-08-10T09:00:00Z', archivo: 'estudiantes_feyalegria_gest2024.xlsx', tipo: 'estudiantes', totalFilas: 98, creados: 90, actualizados: 3, omitidos: 0, errores: 5, estado: 'parcial', unidadEducativaId: 'inst-2', gestionId: 'gest-2', usuarioId: 'usr-3' },
  { id: 'imp-3', fecha: '2024-07-20T14:00:00Z', archivo: 'notas_bolivar_trim1.xlsx', tipo: 'notas', totalFilas: 340, creados: 340, actualizados: 0, omitidos: 0, errores: 0, estado: 'completado', unidadEducativaId: 'inst-1', gestionId: 'gest-1', usuarioId: 'usr-1' },
];

export const ACTIVITY: ActivityItem[] = [
  { id: 'act-1', tipo: 'registro_estudiante', descripcion: 'Estudiante Alejandro Mamani Quispe registrado en 1° Secundaria A', usuario: 'Carlos Mamani', fecha: '2024-08-22T09:30:00Z', entidadId: 'est-1' },
  { id: 'act-2', tipo: 'importacion', descripcion: 'Importación masiva completada: 118 estudiantes registrados en C.N. Simón Bolívar', usuario: 'Carlos Mamani', fecha: '2024-08-15T10:45:00Z', entidadId: 'imp-1' },
  { id: 'act-3', tipo: 'nota_actualizada', descripcion: 'Notas del 1er trimestre actualizadas para Matemáticas — 1° A', usuario: 'Admin General', fecha: '2024-08-13T16:00:00Z', entidadId: 'nota-1' },
  { id: 'act-4', tipo: 'nuevo_usuario', descripcion: 'Usuario web ENC-002 Patricia Torrez creado con rol ENCUESTADOR', usuario: 'Admin General', fecha: '2024-08-01T11:00:00Z', entidadId: 'usr-3' },
  { id: 'act-5', tipo: 'institucion_actualizada', descripcion: 'Instituto Tecnológico Santa Cruz desactivado', usuario: 'Admin General', fecha: '2024-06-01T09:00:00Z', entidadId: 'inst-3' },
  { id: 'act-6', tipo: 'importacion', descripcion: 'Importación parcial: 5 errores en archivo de U.E. Fe y Alegría', usuario: 'Patricia Torrez', fecha: '2024-08-10T09:30:00Z', entidadId: 'imp-2' },
];

export const ENROLLMENT_CHART_DATA = [
  { mes: 'Feb', bolivar: 240, feyalegria: 198 },
  { mes: 'Mar', bolivar: 620, feyalegria: 380 },
  { mes: 'Abr', bolivar: 760, feyalegria: 490 },
  { mes: 'May', bolivar: 820, feyalegria: 565 },
  { mes: 'Jun', bolivar: 840, feyalegria: 590 },
  { mes: 'Jul', bolivar: 847, feyalegria: 608 },
  { mes: 'Ago', bolivar: 847, feyalegria: 612 },
];

export const PERFORMANCE_CHART_DATA = [
  { subject: 'Matemáticas', aprobados: 68, reprobados: 22, pendientes: 10 },
  { subject: 'Lenguaje', aprobados: 82, reprobados: 12, pendientes: 6 },
  { subject: 'Ciencias', aprobados: 75, reprobados: 18, pendientes: 7 },
  { subject: 'Sociales', aprobados: 79, reprobados: 15, pendientes: 6 },
  { subject: 'Inglés', aprobados: 61, reprobados: 28, pendientes: 11 },
];

export const INSTITUTION_PIE_DATA = [
  { name: 'C.N. Simón Bolívar', value: 847, color: '#1B6FFF' },
  { name: 'U.E. Fe y Alegría', value: 612, color: '#00C8FF' },
  { name: 'I.T. Santa Cruz', value: 320, color: '#FF5C1A' },
];
