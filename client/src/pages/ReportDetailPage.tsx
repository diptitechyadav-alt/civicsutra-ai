import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Report } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { PriorityFormulaModal } from '../components/PriorityFormulaModal';
import { InteractiveMap } from '../components/InteractiveMap';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Network,
  Send,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface ReportDetailPageProps {
  reportId: string;
  onNavigate: (tab: string, param?: string) => void;
}

export const ReportDetailPage: React.FC<ReportDetailPageProps> = ({
  reportId,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const { currentUser, role } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getReportById(reportId, role === 'CITIZEN' ? false : false)
      .then((data) => setReport(data))
      .catch((err) => console.error('Error fetching report', err))
      .finally(() => setLoading(false));
  }, [reportId, role]);

  const handleSendFeedback = () => {
    if (!feedbackText.trim() || !report) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackText('');
      setFeedbackSent(false);
    }, 3000);
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-xs">{t.common.loading}</div>;
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-navy-900">Report Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested report reference {reportId} could not be located.
        </p>
        <button
          onClick={() => onNavigate(role === 'ADMIN' ? 'incoming-reports' : 'my-reports')}
          className="px-4 py-2 bg-[#148F87] text-white text-xs font-bold rounded-lg"
        >
          Return to List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation Back Button */}
      <button
        onClick={() => onNavigate(role === 'ADMIN' ? 'incoming-reports' : 'my-reports')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Reports</span>
      </button>

      {/* Main Card Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-extrabold text-[#148F87] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              {report.id}
            </span>
            <StatusBadge status={report.status} />
            <CategoryBadge category={report.category} />
          </div>

          <div className="flex items-center gap-2">
            <PriorityBadge
              level={report.priorityScore.level}
              score={report.priorityScore.totalScore}
              showScore
              onClick={() => setShowFormulaModal(true)}
            />
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            {report.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            {report.description}
          </p>
        </div>

        {/* AI Categorization Intelligence note */}
        {report.aiSuggestedCategory && (
          <div className="p-3 bg-[#D5F3EE]/50 border border-[#A8E6DC] rounded-lg text-xs text-[#0E756E] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#148F87] shrink-0" />
              <span>
                <strong>AI Categorization:</strong> Evaluated with {report.aiCategoryConfidence}%
                confidence as <em>{t.categories[report.aiSuggestedCategory]}</em>.
              </span>
            </div>
            <span className="text-[11px] text-[#0E756E]/80">Human Verified</span>
          </div>
        )}

        {/* Cluster Link if associated */}
        {report.clusterId && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Connected to Multi-Report Cluster: <strong>{report.clusterId}</strong>
              </span>
            </div>
            {role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('clusters')}
                className="font-bold underline hover:text-amber-950"
              >
                Inspect Cluster
              </button>
            )}
          </div>
        )}

        {/* Metadata info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block">
              Location Address
            </span>
            <div className="font-medium text-navy-900 mt-0.5">📍 {report.location.address}</div>
            {report.location.landmark && (
              <div className="text-slate-500 text-[11px]">Landmark: {report.location.landmark}</div>
            )}
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block">
              Reported By & Contact
            </span>
            <div className="font-medium text-navy-900 mt-0.5">
              {role === 'CITIZEN' || role === 'ADMIN'
                ? report.citizenName
                : 'Verified Citizen (Identity Protected)'}
            </div>
            {role === 'ADMIN' && report.citizenPhone && (
              <div className="text-slate-500 font-mono text-[11px]">{report.citizenPhone}</div>
            )}
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider block">
              Submission Timestamp
            </span>
            <div className="font-medium text-navy-900 mt-0.5">
              {new Date(report.createdAt).toLocaleString()}
            </div>
            <div className="text-slate-400 text-[11px]">
              GPS Verified: {report.location.isGpsVerified ? 'Yes' : 'Manual Address'}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Evidence & Interactive Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Photos */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider text-slate-500">
            Photographic Evidence
          </h3>
          {report.photos && report.photos.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {report.photos.map((photo, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-slate-200 h-64 bg-slate-50">
                  <img src={photo} alt="Evidence" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-lg">
              No photo evidence attached
            </div>
          )}
        </div>

        {/* Map Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider text-slate-500">
            Geographic Location Pin
          </h3>
          <InteractiveMap
            reports={[report]}
            selectedReportId={report.id}
            heightClass="h-[280px]"
            isPublicMode={role === 'CITIZEN'}
          />
        </div>
      </div>

      {/* Verification & Action Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-navy-900">Official Resolution Timeline</h3>
          <span className="text-xs text-slate-400">Auditable Government Record</span>
        </div>

        <div className="space-y-6 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {report.timeline.map((entry) => (
            <div key={entry.id} className="relative group">
              {/* Dot */}
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-[#148F87] ring-4 ring-[#D5F3EE]" />

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.status} size="sm" />
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs font-bold text-navy-900">
                  Action Recorded by {entry.actorName} ({entry.actorRole})
                </div>
                {entry.note && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">
                    {entry.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Citizen Feedback / Follow-up Input */}
      {role === 'CITIZEN' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-navy-900">Provide Follow-Up Notes or Inquiries</h3>
          <p className="text-xs text-slate-500">
            Have you noticed any change on the ground or wish to provide additional context to the field team?
          </p>

          <div className="space-y-3">
            <textarea
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g. Cold-mix patch seems partially placed, but drain cover still loose..."
              className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#148F87] focus:outline-hidden"
            />

            <div className="flex items-center justify-between">
              {feedbackSent && (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Follow-up note logged for reviewer.</span>
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={handleSendFeedback}
                  disabled={!feedbackText.trim()}
                  className="px-4 py-2 bg-[#148F87] hover:bg-teal-hover text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Follow-Up Note</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Priority Formula Modal */}
      <PriorityFormulaModal
        isOpen={showFormulaModal}
        onClose={() => setShowFormulaModal(false)}
        breakdown={report.priorityScore}
        reportId={report.id}
      />
    </div>
  );
};
