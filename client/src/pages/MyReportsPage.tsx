import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Report, IssueCategory, IssueStatus } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Calendar,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface MyReportsPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const MyReportsPage: React.FC<MyReportsPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!currentUser?.id) {
      setReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .getReports({
        role: 'CITIZEN',
        userId: currentUser.id,
      })
      .then((data) => setReports(data))
      .catch((err) => console.error('Failed to load reports', err))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const filteredReports = reports.filter((r) => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = r.id.toLowerCase().includes(q);
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchAddr = r.location.address.toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchDesc && !matchAddr) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Submit Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            {t.nav.myReports}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View history, official verification timelines, and responses to your reports.
          </p>
        </div>

        <button
          onClick={() => onNavigate('submit-report')}
          className="px-4 py-2 bg-[#148F87] hover:bg-teal-hover text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.nav.reportProblem}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.citizen.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#148F87] focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="all">{t.citizen.allCategories}</option>
            <option value="pothole">{t.categories.pothole}</option>
            <option value="garbage">{t.categories.garbage}</option>
            <option value="waterlogging">{t.categories.waterlogging}</option>
            <option value="drainage">{t.categories.drainage}</option>
            <option value="streetlight">{t.categories.streetlight}</option>
            <option value="water_supply">{t.categories.water_supply}</option>
            <option value="traffic">{t.categories.traffic}</option>
            <option value="infrastructure">{t.categories.infrastructure}</option>
            <option value="other">{t.categories.other}</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="all">{t.citizen.allStatuses}</option>
            <option value="SUBMITTED">{t.statuses.SUBMITTED}</option>
            <option value="UNDER_REVIEW">{t.statuses.UNDER_REVIEW}</option>
            <option value="CLUSTERED">{t.statuses.CLUSTERED}</option>
            <option value="ASSIGNED">{t.statuses.ASSIGNED}</option>
            <option value="IN_PROGRESS">{t.statuses.IN_PROGRESS}</option>
            <option value="RESOLVED">{t.statuses.RESOLVED}</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">{t.common.loading}</div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No matching reports found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => onNavigate('report-detail', report.id)}
                className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{report.id}</span>
                    <StatusBadge status={report.status} size="sm" />
                    <CategoryBadge category={report.category} />
                  </div>
                  <h3 className="text-sm font-bold text-navy-900">{report.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-1">{report.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{report.location.address}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <PriorityBadge
                    level={report.priorityScore.level}
                    score={report.priorityScore.totalScore}
                    showScore
                  />
                  <span className="text-[#148F87] text-xs font-bold flex items-center gap-1 hover:underline">
                    <span>{t.citizen.viewDetails}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
