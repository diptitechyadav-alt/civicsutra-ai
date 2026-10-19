import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Report, IssueCluster } from '../types';
import { StatWidget } from '../components/StatWidget';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { InteractiveMap } from '../components/InteractiveMap';
import {
  Inbox,
  CopyCheck,
  Network,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getAnalytics(),
      api.getReports(),
      api.getClusters(),
    ])
      .then(([analyticsData, reportsData, clustersData]) => {
        setAnalytics(analyticsData);
        setRecentReports(reportsData.slice(0, 5));
        setClusters(clustersData);
      })
      .catch((err) => console.error('Failed to load admin dashboard', err))
      .finally(() => setLoading(false));
  }, []);

  const kpis = analytics?.kpis || {
    totalReports: 0,
    unreviewed: 0,
    suspectedDuplicates: 0,
    activeClusters: 0,
    criticalCount: 0,
    resolved: 0,
  };

  const categoryCounts = analytics?.categoryCounts || {};
  const statusCounts = analytics?.statusCounts || {};

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Ward 14 Grievance Intelligence System
          </span>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight mt-0.5">
            {t.admin.dashboardTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t.admin.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('incoming-reports')}
            className="px-4 py-2 bg-[#148F87] hover:bg-teal-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Inbox className="w-4 h-4" />
            <span>Triage Incoming ({kpis.unreviewed})</span>
          </button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatWidget
          label={t.admin.kpiTotal}
          value={kpis.totalReports}
          icon={Inbox}
          onClick={() => onNavigate('incoming-reports')}
        />
        <StatWidget
          label={t.admin.kpiUnreviewed}
          value={kpis.unreviewed}
          icon={Inbox}
          variant="warning"
          onClick={() => onNavigate('incoming-reports')}
        />
        <StatWidget
          label={t.admin.kpiDuplicates}
          value={kpis.suspectedDuplicates}
          icon={CopyCheck}
          variant="purple"
          onClick={() => onNavigate('duplicates')}
        />
        <StatWidget
          label={t.admin.kpiClusters}
          value={kpis.activeClusters}
          icon={Network}
          variant="teal"
          onClick={() => onNavigate('clusters')}
        />
        <StatWidget
          label={t.admin.kpiCritical}
          value={kpis.criticalCount}
          icon={ShieldAlert}
          variant="critical"
          onClick={() => onNavigate('priority-queue')}
        />
        <StatWidget
          label={t.admin.kpiResolved}
          value={kpis.resolved}
          icon={CheckCircle2}
          variant="default"
        />
      </div>

      {/* Distribution Charts & Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900">Category Distribution</h3>
            <span className="text-[11px] text-slate-400 font-mono">Ward 14 Intake</span>
          </div>

          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, count]: [string, any]) => {
              const pct = Math.round((count / (kpis.totalReports || 1)) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize font-medium text-slate-700">
                      {t.categories[cat as keyof typeof t.categories] || cat}
                    </span>
                    <span className="font-mono text-slate-500 font-bold">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#148F87] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Pipeline */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900">Resolution Pipeline Status</h3>
            <span className="text-[11px] text-slate-400 font-mono">Current Lifecycle</span>
          </div>

          <div className="space-y-3">
            {Object.entries(statusCounts).map(([st, count]: [string, any]) => {
              const pct = Math.round((count / (kpis.totalReports || 1)) * 100);
              return (
                <div key={st} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      {t.statuses[st as keyof typeof t.statuses] || st}
                    </span>
                    <span className="font-mono text-slate-500 font-bold">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-navy-800 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Triage Actions */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-navy-900 mb-1">AI Intelligence Alerts</h3>
            <p className="text-xs text-slate-500 mb-4">
              Corroborating reports identified by spatial proximity and NLP token overlap.
            </p>

            <div className="space-y-2.5">
              <div
                onClick={() => onNavigate('duplicates')}
                className="p-3 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100/70 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-bold text-purple-900 mb-0.5">
                  <span className="flex items-center gap-1.5">
                    <CopyCheck className="w-3.5 h-3.5" />
                    <span>Suspected Duplicates</span>
                  </span>
                  <span className="font-mono bg-purple-200/60 px-1.5 py-0.2 rounded-sm">
                    {kpis.suspectedDuplicates} Pending
                  </span>
                </div>
                <p className="text-[11px] text-purple-800">
                  Multiple citizens reported similar defects within 45 meters on MG Road.
                </p>
              </div>

              <div
                onClick={() => onNavigate('clusters')}
                className="p-3 bg-teal-50 rounded-lg border border-teal-200 cursor-pointer hover:bg-teal-100/70 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#0E756E] mb-0.5">
                  <span className="flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5" />
                    <span>Active Clusters</span>
                  </span>
                  <span className="font-mono bg-teal-200/60 px-1.5 py-0.2 rounded-sm">
                    {kpis.activeClusters} Grouped
                  </span>
                </div>
                <p className="text-[11px] text-[#0E756E]">
                  Grouped work orders ready for single-contractor asphalt dispatch.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('priority-queue')}
            className="w-full py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Open Transparent Priority Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Ward 14 Map Preview & Recent Intake */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Preview */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900">Ward 14 Spatial Hotspots</h3>
            <button
              onClick={() => onNavigate('hotspots')}
              className="text-xs font-semibold text-[#148F87] hover:underline flex items-center gap-1"
            >
              <span>Full Screen Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          <InteractiveMap
            reports={recentReports}
            clusters={clusters}
            heightClass="h-[320px]"
            onSelectReport={(r) => onNavigate('report-detail', r.id)}
          />
        </div>

        {/* Recent Intake Queue */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900">{t.admin.recentIncoming}</h3>
            <button
              onClick={() => onNavigate('incoming-reports')}
              className="text-xs font-semibold text-[#148F87] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentReports.map((report) => (
              <div
                key={report.id}
                onClick={() => onNavigate('report-detail', report.id)}
                className="py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 font-bold">{report.id}</span>
                    <StatusBadge status={report.status} size="sm" />
                    <CategoryBadge category={report.category} showIcon={false} />
                  </div>
                  <div className="font-bold text-navy-900 line-clamp-1">{report.title}</div>
                  <span className="text-slate-400 truncate max-w-[240px] block">
                    📍 {report.location.address}
                  </span>
                </div>

                <div className="shrink-0 text-right">
                  <PriorityBadge
                    level={report.priorityScore.level}
                    score={report.priorityScore.totalScore}
                    showScore
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
