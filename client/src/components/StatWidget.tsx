import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatWidgetProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  subtext?: string;
  variant?: 'default' | 'teal' | 'critical' | 'warning' | 'purple';
  onClick?: () => void;
}

export const StatWidget: React.FC<StatWidgetProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  variant = 'default',
  onClick,
}) => {
  const variantStyles = {
    default: {
      border: 'border-slate-200',
      iconBg: 'bg-slate-100 text-slate-700',
      valueColor: 'text-navy-900',
    },
    teal: {
      border: 'border-[#A8E6DC]',
      iconBg: 'bg-[#D5F3EE] text-[#148F87]',
      valueColor: 'text-[#0E756E]',
    },
    critical: {
      border: 'border-rose-200',
      iconBg: 'bg-rose-50 text-[#C94C4C]',
      valueColor: 'text-[#C94C4C]',
    },
    warning: {
      border: 'border-amber-200',
      iconBg: 'bg-amber-50 text-[#F4A261]',
      valueColor: 'text-amber-800',
    },
    purple: {
      border: 'border-purple-200',
      iconBg: 'bg-purple-50 text-purple-700',
      valueColor: 'text-purple-800',
    },
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`p-5 bg-white rounded-xl border ${variantStyles.border} shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div className={`p-2 rounded-lg ${variantStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className={`text-2xl font-extrabold ${variantStyles.valueColor}`}>{value}</div>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  );
};
