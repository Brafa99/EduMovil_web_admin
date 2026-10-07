import { createBrowserRouter, Navigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import AppLayout from '../layouts/AppLayout';
import Login from '../pages/Login';
import AdminDashboard from '../pages/admin/Dashboard';
import Instituciones from '../pages/admin/Instituciones';
import Gestiones from '../pages/admin/Gestiones';
import Cursos from '../pages/admin/Cursos';
import Profesores from '../pages/admin/Profesores';
import Materias from '../pages/admin/Materias';
import Estudiantes from '../pages/admin/Estudiantes';
import Padres from '../pages/admin/Padres';
import Notas from '../pages/admin/Notas';
import Temas from '../pages/admin/Temas';
import Practicas from '../pages/admin/Practicas';
import Reportes from '../pages/admin/Reportes';
import Usuarios from '../pages/admin/Usuarios';
import Importacion from '../pages/admin/Importacion';
import EncuestadorDashboard from '../pages/encuestador/Dashboard';
import EncuestadorInstitucion from '../pages/encuestador/Institucion';
import EncuestadorEstudiantes from '../pages/encuestador/Estudiantes';
import EncuestadorCursos from '../pages/encuestador/Cursos';
import EncuestadorImportacion from '../pages/encuestador/Importacion';
import EncuestadorPerfil from '../pages/encuestador/Perfil';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1628]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-[#1B6FFF] border-t-transparent rounded-full animate-spin" />
        <span className="text-white/60 text-sm">Cargando...</span>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ role, children }: { role: 'ADMIN' | 'ENCUESTADOR'; children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.rol !== role) return <Navigate to={user?.rol === 'ADMIN' ? '/admin' : '/encuestador'} replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.rol === 'ADMIN' ? '/admin' : '/encuestador'} replace />;
}

export const router = createBrowserRouter([
  { path: '/login', Component: Login },
  {
    path: '/',
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: <RootRedirect /> },
      // Admin routes
      {
        path: 'admin',
        element: <RequireRole role="ADMIN"><AdminDashboard /></RequireRole>,
      },
      { path: 'admin/instituciones', element: <RequireRole role="ADMIN"><Instituciones /></RequireRole> },
      { path: 'admin/gestiones', element: <RequireRole role="ADMIN"><Gestiones /></RequireRole> },
      { path: 'admin/cursos', element: <RequireRole role="ADMIN"><Cursos /></RequireRole> },
      { path: 'admin/profesores', element: <RequireRole role="ADMIN"><Profesores /></RequireRole> },
      { path: 'admin/materias', element: <RequireRole role="ADMIN"><Materias /></RequireRole> },
      { path: 'admin/temas', element: <RequireRole role="ADMIN"><Temas /></RequireRole> },
      { path: 'admin/estudiantes', element: <RequireRole role="ADMIN"><Estudiantes /></RequireRole> },
      { path: 'admin/padres', element: <RequireRole role="ADMIN"><Padres /></RequireRole> },
      { path: 'admin/notas', element: <RequireRole role="ADMIN"><Notas /></RequireRole> },
      { path: 'admin/practicas', element: <RequireRole role="ADMIN"><Practicas /></RequireRole> },
      { path: 'admin/reportes', element: <RequireRole role="ADMIN"><Reportes /></RequireRole> },
      { path: 'admin/usuarios', element: <RequireRole role="ADMIN"><Usuarios /></RequireRole> },
      { path: 'admin/importacion', element: <RequireRole role="ADMIN"><Importacion /></RequireRole> },
      // Encuestador routes
      { path: 'encuestador', element: <RequireRole role="ENCUESTADOR"><EncuestadorDashboard /></RequireRole> },
      { path: 'encuestador/institucion', element: <RequireRole role="ENCUESTADOR"><EncuestadorInstitucion /></RequireRole> },
      { path: 'encuestador/estudiantes', element: <RequireRole role="ENCUESTADOR"><EncuestadorEstudiantes /></RequireRole> },
      { path: 'encuestador/cursos', element: <RequireRole role="ENCUESTADOR"><EncuestadorCursos /></RequireRole> },
      { path: 'encuestador/importacion', element: <RequireRole role="ENCUESTADOR"><EncuestadorImportacion /></RequireRole> },
      { path: 'encuestador/perfil', element: <RequireRole role="ENCUESTADOR"><EncuestadorPerfil /></RequireRole> },
    ],
  },
]);
