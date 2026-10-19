import React from 'react';
import { IssueCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  AlertOctagon,
  Trash2,
  Droplets,
  Waves,
  Lightbulb,
  Pipette,
  Car,
  Building2,
  HelpCircle,
} from 'lucide-react';

interface CategoryBadgeProps {
  category: IssueCategory;
  showIcon?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  showIcon = true,
}) => {
  const { t } = useLanguage();

  let Icon = HelpCircle;
  let color = 'text-slate-700 bg-slate-100';

  switch (category) {
    case 'pothole':
      Icon = AlertOctagon;
      color = 'text-amber-800 bg-amber-50 border-amber-200';
      break;
    case 'garbage':
      Icon = Trash2;
      color = 'text-emerald-800 bg-emerald-50 border-emerald-200';
      break;
    case 'waterlogging':
      Icon = Droplets;
      color = 'text-blue-800 bg-blue-50 border-blue-200';
      break;
    case 'drainage':
      Icon = Waves;
      color = 'text-cyan-800 bg-cyan-50 border-cyan-200';
      break;
    case 'streetlight':
      Icon = Lightbulb;
      color = 'text-yellow-800 bg-yellow-50 border-yellow-200';
      break;
    case 'water_supply':
      Icon = Pipette;
      color = 'text-sky-800 bg-sky-50 border-sky-200';
      break;
    case 'traffic':
      Icon = Car;
      color = 'text-orange-800 bg-orange-50 border-orange-200';
      break;
    case 'infrastructure':
      Icon = Building2;
      color = 'text-slate-800 bg-slate-100 border-slate-200';
      break;
    default:
      Icon = HelpCircle;
      color = 'text-gray-700 bg-gray-50 border-gray-200';
  }

  const label = t.categories[category] || category;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border ${color}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
    </span>
  );
};
