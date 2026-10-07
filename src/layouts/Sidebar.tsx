import { NavLink } from 'react-router';
import {
  LayoutDashboard, Building2, CalendarDays, BookOpen, Users,
  GraduationCap, UserCheck, FileText, ClipboardList, Upload,
  UserCog, BarChart3, Settings, ChevronLeft, ChevronRight,
  X, Signal, MapPin, ClipboardCheck, User
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

const ADMIN_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { label: 'Instituciones', icon: Building2, to: '/admin/instituciones' },
  { label: 'Gestiones Académicas', icon: CalendarDays, to: '/admin/gestiones' },
  { label: 'Cursos y Paralelos', icon: BookOpen, to: '/admin/cursos' },
  { label: 'Profesores', icon: Users, to: '/admin/profesores' },
  { label: 'Materias', icon: FileText, to: '/admin/materias' },
  { label: 'Temas/Lecciones', icon: BookOpen, to: '/admin/temas' },
  { label: 'Estudiantes', icon: GraduationCap, to: '/admin/estudiantes' },
  { label: 'Padres y Tutores', icon: UserCheck, to: '/admin/padres' },
  { label: 'Notas', icon: ClipboardList, to: '/admin/notas' },
  { label: 'Prácticas', icon: ClipboardCheck, to: '/admin/practicas' },
  { label: 'Importación Masiva', icon: Upload, to: '/admin/importacion' },
  { label: 'Usuarios Web', icon: UserCog, to: '/admin/usuarios' },
  { label: 'Reportes', icon: BarChart3, to: '/admin/reportes' },
  { label: 'Configuración', icon: Settings, to: '/admin/configuracion' },
];

const ENCUESTADOR_NAV = [
  { label: 'Mi Dashboard', icon: LayoutDashboard, to: '/encuestador' },
  { label: 'Institución Asignada', icon: MapPin, to: '/encuestador/institucion' },
  { label: 'Estudiantes', icon: GraduationCap, to: '/encuestador/estudiantes' },
  { label: 'Cursos y Paralelos', icon: BookOpen, to: '/encuestador/cursos' },
  { label: 'Importación Masiva', icon: Upload, to: '/encuestador/importacion' },
  { label: 'Mi Perfil', icon: User, to: '/encuestador/perfil' },
];

export default function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const { user } = useAuth();
  const navItems = user?.rol === 'ADMIN' ? ADMIN_NAV : ENCUESTADOR_NAV;

  return (
    <aside
      className={`
        fixed lg:relative inset-y-0 left-0 z-50 flex flex-col
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
      style={{ background: 'var(--color-navy)', borderRight: '1px solid var(--color-border-dark)' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0" style={{ borderBottom: '1px solid var(--color-border-dark)' }}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-blue)' }}>
              <Signal size={16} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight tracking-tight">Edu·Movil</div>
              <div className="text-xs leading-tight" style={{ color: 'var(--color-cyan)' }}>Plataforma Educativa</div>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ background: 'var(--color-blue)' }}>
            <Signal size={16} color="white" strokeWidth={2.5} />
          </div>
        )}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
          <button onClick={onClose} className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/10 text-white/50 hover:text-white">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Role badge */}
      {!isCollapsed && (
        <div className="px-4 py-2.5 shrink-0">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={user?.rol === 'ADMIN'
              ? { background: 'rgba(27,111,255,0.2)', color: '#4D8FFF' }
              : { background: 'rgba(0,200,255,0.15)', color: '#00C8FF' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {user?.rol === 'ADMIN' ? 'Administrador' : 'Encuestador'}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin' || to === '/encuestador'}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-2' : ''}`
            }
            title={isCollapsed ? label : undefined}
            onClick={onClose}
          >
            <Icon size={18} className="nav-icon shrink-0" />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      {!isCollapsed && (
        <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--color-border-dark)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-blue), var(--color-cyan))' }}
            >
              {user?.nombres?.[0]}{user?.apellidos?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.nombres} {user?.apellidos}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.codigo}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
