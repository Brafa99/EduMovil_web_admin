import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
  bg?: string;
}

export function MetricCard({ icon, label, value, trend, color = '#1B6FFF', bg = 'rgba(27,111,255,0.1)' }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg, color }}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{trend}</span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-800" style={{ letterSpacing: '-0.02em' }}>{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
