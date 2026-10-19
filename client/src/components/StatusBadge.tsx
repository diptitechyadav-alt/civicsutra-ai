import React from 'react';
import { IssueStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface StatusBadgeProps {
  status: IssueStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { t } = useLanguage();

  let styles = 'bg-slate-100 text-slate-800 border-slate-200';
  let dotColor = 'bg-slate-500';

  switch (status) {
    case 'SUBMITTED':
      styles = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-500';
      break;
    case 'UNDER_REVIEW':
      styles = 'bg-amber-50 text-amber-800 border-amber-200';
      dotColor = 'bg-amber-500';
      break;
    case 'DUPLICATE_FLAGGED':
      styles = 'bg-purple-50 text-purple-700 border-purple-200';
      dotColor = 'bg-purple-500';
      break;
    case 'CLUSTERED':
      styles = 'bg-[#D5F3EE] text-[#0E756E] border-[#A8E6DC]';
      dotColor = 'bg-[#148F87]';
      break;
    case 'ASSIGNED':
      styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      dotColor = 'bg-indigo-500';
      break;
    case 'IN_PROGRESS':
      styles = 'bg-orange-50 text-orange-700 border-orange-200';
      dotColor = 'bg-orange-500';
      break;
    case 'RESOLVED':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-600';
      break;
    case 'REJECTED':
      styles = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  const label = t.statuses[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${styles} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};
