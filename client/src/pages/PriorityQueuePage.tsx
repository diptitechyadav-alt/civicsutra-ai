import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Report } from '../types';
import { api } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { PriorityFormulaModal } from '../components/PriorityFormulaModal';
import {
  ListOrdered,
  Search,
  Scale,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

interface PriorityQueuePageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const PriorityQueuePage: React.FC<PriorityQueuePageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBreakdown, setSelectedBreakdown] = useState<Report | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getReports()
      .then((data) => {
        // Sort descending by priority totalScore
        const sorted = [...data].sort((a, b) => {
          const scoreA = a.priorityScore?.totalScore ?? (a as any)?.priority_score?.total_score ?? 0;
          const scoreB = b.priorityScore?.totalScore ?? (b as any)?.priority_score?.total_score ?? 0;
          return scoreB - scoreA;
        });
        setReports(sorted);
      })
      .catch((err) => console.error('Failed to load priority queue', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            {t.admin.priorityWorkspace}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent algorithmic triage ranking based on corroborating density, physical hazard severity, sensitive facility proximity, and pending days.
          </p>
        </div>

        <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Click any score to inspect the full mathematical calculation formula.</span>
        </div>
      </div>

      {/* Priority Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Total Score</th>
                <th className="py-3 px-4">Ref ID</th>
                <th className="py-3 px-4">Problem Details</th>
                <th className="py-3 px-4">Volume (w₁)</th>
                <th className="py-3 px-4">Severity (w₂)</th>
                <th className="py-3 px-4">Vulnerability (w₃)</th>
                <th className="py-3 px-4">Staleness (w₄)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400">
                    {t.common.loading}
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400">
                    No reports in queue.
                  </td>
                </tr>
              ) : (
                reports.map((report, idx) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">#{idx + 1}</td>
                    <td className="py-3 px-4">
                      <PriorityBadge
                        level={report.priorityScore.level}
                        score={report.priorityScore.totalScore}
                        showScore
                        onClick={() => setSelectedBreakdown(report)}
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{report.id}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-navy-900 line-clamp-1">{report.title}</div>
                      <div className="text-slate-400 text-[10px] truncate">
                        📍 {report.location.address}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {report.priorityScore.volumeFactor} / 30
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {report.priorityScore.severityFactor} / 30
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {report.priorityScore.vulnerabilityFactor} / 25
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {report.priorityScore.stalenessFactor} / 15
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={report.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigate('report-detail', report.id)}
                        className="px-3 py-1 bg-[#148F87] hover:bg-teal-hover text-white rounded font-bold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula Modal */}
      {selectedBreakdown && (
        <PriorityFormulaModal
          isOpen={true}
          onClose={() => setSelectedBreakdown(null)}
          breakdown={selectedBreakdown.priorityScore}
          reportId={selectedBreakdown.id}
        />
      )}
    </div>
  );
};
