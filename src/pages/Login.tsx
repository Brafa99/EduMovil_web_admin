import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Signal, AlertCircle, Loader2, HelpCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { IS_MOCK_MODE } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ codigo: '', password: '', remember: false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo.trim()) { setError('El código es requerido'); return; }
    if (!form.password) { setError('La contraseña es requerida'); return; }
    setError('');
    setLoading(true);
    try {
      await login(form.codigo.trim(), form.password);
      navigate('/');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message ?? 'Error al iniciar sesión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-navy)' }}>
      {/* Left branding panel — hidden on mobile */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 xl:w-2/5 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0A1628 0%, #0F2040 40%, #101C3A 100%)' }}
      >
        {/* Background grid decoration */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,200,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, var(--color-blue), transparent)' }} />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, var(--color-cyan), transparent)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-blue)' }}>
              <Signal size={20} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">Edu·Movil</span>
              <div className="text-xs font-medium" style={{ color: 'var(--color-cyan)' }}>Plataforma Educativa</div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Gestión educativa<br />
              <span style={{ color: 'var(--color-cyan)' }}>inteligente</span> para<br />Bolivia
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Conecta instituciones, docentes, estudiantes y familias en una plataforma unificada de alto rendimiento.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {[
              { value: '1,779+', label: 'Estudiantes registrados' },
              { value: '3', label: 'Instituciones activas' },
              { value: '40+', label: 'Docentes en plataforma' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-4">
                <span className="text-xl font-bold" style={{ color: 'var(--color-cyan)', minWidth: 72 }}>{stat.value}</span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © 2024 EduMovil. Plataforma de gestión educativa.
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-blue)' }}>
            <Signal size={20} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-white font-bold text-xl tracking-tight">Edu·Movil</span>
            <div className="text-xs font-medium" style={{ color: 'var(--color-cyan)' }}>Plataforma Educativa</div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">Iniciar sesión</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Mock credentials hint */}
          {IS_MOCK_MODE && (
            <div
              className="flex gap-3 p-4 rounded-xl mb-6 text-xs"
              style={{ background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.2)', color: 'rgba(255,255,255,0.7)' }}
            >
              <div className="text-cyan-400 shrink-0 mt-0.5"><HelpCircle size={14} /></div>
              <div>
                <strong className="text-cyan-400">Modo demo activo</strong><br />
                Admin: <code className="bg-white/10 px-1 rounded">ADM-001</code> / <code className="bg-white/10 px-1 rounded">admin123</code><br />
                Encuestador: <code className="bg-white/10 px-1 rounded">ENC-001</code> / <code className="bg-white/10 px-1 rounded">enc123</code>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Código de usuario
              </label>
              <input
                type="text"
                value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                placeholder="Ej. ADM-001"
                autoComplete="username"
                className="form-input"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="form-input pr-10"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--color-blue)' }}
                />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Recordar sesión</span>
              </label>
              <button type="button" className="text-sm font-medium" style={{ color: 'var(--color-cyan)' }}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && (
              <div
                className="flex items-center gap-2.5 p-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{ background: loading ? 'rgba(27,111,255,0.6)' : 'var(--color-blue)', color: 'white' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verificando credenciales...
                </>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-8 text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            ¿Problemas para acceder? Contacta al administrador del sistema
          </p>
        </div>
      </div>
    </div>
  );
}
