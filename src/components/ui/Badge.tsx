interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'cyan';
  size?: 'sm' | 'md';
}

const VARIANTS = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  gray: 'bg-slate-50 text-slate-600 border-slate-100',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
};

export function Badge({ children, variant = 'gray', size = 'sm' }: BadgeProps) {
  return (
    <span className={`badge border ${VARIANTS[variant]} ${size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-xs'}`}>
      {children}
    </span>
  );
}

export const StatusBadge = ({ activo }: { activo: boolean }) => (
  <span
    className={`rounded-full px-2 py-1 text-xs font-semibold ${
      activo
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-700'
    }`}
  >
    {activo ? 'Activo' : 'Bloqueado'}
  </span>
);
