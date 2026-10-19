import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Report } from '../types';
import { api } from '../services/api';
import { StatWidget } from '../components/StatWidget';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface CitizenDashboardProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
      .catch((err) => console.error('Failed to load citizen reports', err))
      .finally(() => setLoading(false));
  }, [currentUser]);

  // Derived metrics from actual stored data
  const totalSubmitted = reports.length;
  const underReview = reports.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' || r.status === 'DUPLICATE_FLAGGED'
  ).length;
  const inProgress = reports.filter(
    (r) => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS' || r.status === 'CLUSTERED'
  ).length;
  const resolved = reports.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Citizen Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#148F87] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {currentUser?.ward || 'Ward 14 (South Zone)'}
            </span>
            {currentUser?.phone && (
              <span className="text-xs text-slate-500 font-medium">
                • {currentUser.phone}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 mt-0.5">
            {t.citizen.welcome.replace('{name}', currentUser?.name || 'Citizen')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Signed in as <span className="font-semibold text-slate-700">{currentUser?.email}</span>. Only your submitted grievances are visible here.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('submit-report')}
          className="px-5 py-2.5 bg-[#148F87] hover:bg-teal-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.nav.reportProblem}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget
          label={t.citizen.totalSubmitted}
          value={totalSubmitted}
          icon={FileText}
          subtext="Total grievances filed"
        />
        <StatWidget
          label={t.citizen.underReview}
          value={underReview}
          icon={Clock}
          variant="warning"
          subtext="Awaiting verification"
        />
        <StatWidget
          label={t.citizen.inProgress}
          value={inProgress}
          icon={Wrench}
          variant="teal"
          subtext="Dispatched or clustered"
        />
        <StatWidget
          label={t.citizen.resolved}
          value={resolved}
          icon={CheckCircle}
          variant="default"
          subtext="Remediated issues"
        />
      </div>

      {/* Recent Reports Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-navy-900">{t.citizen.recentActivity}</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {reports.length}
            </span>
          </div>

          <button
            onClick={() => onNavigate('my-reports')}
            className="text-xs font-semibold text-[#148F87] hover:underline flex items-center gap-1"
          >
            <span>View All My Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">{t.common.loading}</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-500 font-medium">{t.citizen.noReports}</p>
            <button
              onClick={() => onNavigate('submit-report')}
              className="px-4 py-2 bg-[#148F87] text-white text-xs font-bold rounded-lg"
            >
              Submit Your First Problem
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.slice(0, 5).map((report) => (
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
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
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
