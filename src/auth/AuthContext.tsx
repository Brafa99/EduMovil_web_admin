import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser, UserRole } from '../types';
import { login as apiLogin, logout as apiLogout } from '../api/auth.api';
import { apiRequest } from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (codigo: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('edumovil_token');
    const storedUser = localStorage.getItem('edumovil_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('edumovil_token');
        localStorage.removeItem('edumovil_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Reemplaza solo la función login por esta:
  const login = async (codigo: string, password: string) => {
    const response = await apiLogin({ codigo, password });

    localStorage.setItem('edumovil_token', response.accessToken);
    localStorage.setItem('edumovil_user', JSON.stringify(response.user));
    localStorage.setItem('usuarioId', response.user.id);

    setToken(response.accessToken);
    setUser(response.user);
  };

  const logout = async () => {
    await apiLogout().catch(() => {});
    localStorage.removeItem('edumovil_token');
    localStorage.removeItem('edumovil_user');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('usuario_id');

    setToken(null);
    setUser(null);
  };

  const hasRole = (role: UserRole) => {
    if (!user?.rol) return false;
    if (user.rol === 'SUPERADMIN' && (role === 'SUPERADMIN' || role === 'ADMIN')) {
      return true;
    }
    return user.rol === role;
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user,
      login, logout, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
