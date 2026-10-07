import { useAuth } from '../../auth/AuthContext';
import Estudiantes from '../admin/Estudiantes';

export default function EncuestadorEstudiantes() {
  const { user } = useAuth();
  return <Estudiantes key={user?.unidadEducativaId} />;
}
