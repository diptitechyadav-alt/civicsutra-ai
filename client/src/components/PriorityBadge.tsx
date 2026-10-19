import React from 'react';
import { PriorityLevel } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { AlertCircle, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface PriorityBadgeProps {
  level?: PriorityLevel;
  score?: number;
  showScore?: boolean;
  onClick?: () => void;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  level,
  score,
  showScore = false,
  onClick,
}) => {
  const { t } = useLanguage();

  const safeLevel: PriorityLevel =
    level ||
    (score !== undefined
      ? score >= 80
        ? 'CRITICAL'
        : score >= 65
        ? 'HIGH'
        : score >= 45
        ? 'MEDIUM'
        : 'LOW'
      : 'MEDIUM');

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Info;

  switch (safeLevel) {
    case 'CRITICAL':
      styles = 'bg-red-50 text-[#C94C4C] border-red-200';
      Icon = ShieldAlert;
      break;
    case 'HIGH':
      styles = 'bg-orange-50 text-orange-700 border-orange-200';
      Icon = AlertTriangle;
      break;
    case 'MEDIUM':
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = AlertCircle;
      break;
    case 'LOW':
      styles = 'bg-emerald-50 text-[#148F87] border-emerald-200';
      Icon = Info;
      break;
  }

  const label = (t?.priorities && t.priorities[safeLevel]) || safeLevel;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${styles} ${
        onClick ? 'cursor-pointer hover:shadow-xs transition-shadow' : 'cursor-default'
      }`}
      title={onClick ? 'Click to inspect transparent AI score formula' : undefined}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/70 font-mono text-[10px] font-bold">
          {score}
        </span>
      )}
    </button>
  );
};
