import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../hooks/useToast';

interface TopbarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/instituciones': 'Instituciones Educativas',
  '/admin/gestiones': 'Gestiones Académicas',
  '/admin/cursos': 'Cursos y Paralelos',
  '/admin/profesores': 'Profesores',
  '/admin/materias': 'Materias',
  '/admin/estudiantes': 'Estudiantes',
  '/admin/padres': 'Padres y Tutores',
  '/admin/notas': 'Notas',
  '/admin/practicas': 'Prácticas',
  '/admin/reportes': 'Reportes',
  '/admin/usuarios': 'Usuarios Web',
  '/admin/importacion': 'Importación Masiva',
  '/encuestador': 'Mi Dashboard',
  '/encuestador/institucion': 'Institución Asignada',
  '/encuestador/estudiantes': 'Estudiantes',
  '/encuestador/cursos': 'Cursos y Paralelos',
  '/encuestador/importacion': 'Importación Masiva',
  '/encuestador/perfil': 'Mi Perfil',
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title = PAGE_TITLES[location.pathname] ?? 'EduMovil';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast('Sesión cerrada correctamente', 'success');
    navigate('/login');
  };

  return (
    <header
      className="shrink-0 flex items-center gap-3 px-4 lg:px-6 h-14"
      style={{ background: 'white', borderBottom: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <button
        onClick={onMenuClick}
        className="btn-ghost p-2 -ml-2 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-700 text-slate-800 truncate" style={{ fontWeight: 700 }}>{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative btn-ghost p-2">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-blue), var(--color-cyan))' }}
            >
              {user?.nombres?.[0]}{user?.apellidos?.[0]}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-600 text-slate-700 leading-tight" style={{ fontWeight: 600 }}>{user?.nombres}</p>
              <p className="text-xs text-slate-400 leading-tight">{user?.rol}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-100 shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-50">
                <p className="text-xs font-semibold text-slate-700">{user?.nombres} {user?.apellidos}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <User size={15} />
                Mi perfil
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
