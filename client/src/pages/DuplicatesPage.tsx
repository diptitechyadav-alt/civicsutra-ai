import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DuplicateCandidate, Report } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  CopyCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  MapPin,
  FileText,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface DuplicatesPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const DuplicatesPage: React.FC<DuplicatesPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [candidates, setCandidates] = useState<
    (DuplicateCandidate & { report1?: Report; report2?: Report })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const fetchDuplicates = () => {
    setLoading(true);
    api
      .getDuplicates()
      .then((data) => setCandidates(data))
      .catch((err) => {
        console.error('Failed to load duplicates', err);
        setErrorMessage(err.message || 'Failed to load duplicate suggestions.');
      })
      .finally(() => setLoading(false));
  };

  const handleReview = async (
    pair: DuplicateCandidate,
    action: 'CONFIRM_SAME' | 'CONFIRM_DIFFERENT'
  ) => {
    const pairKey = `${pair.reportId}-${pair.matchingReportId}-${action}`;
    if (processingKey) return; // Prevent accidental duplicate submissions

    setProcessingKey(pairKey);
    setErrorMessage(null);
    setActionFeedback('');

    try {
      const res = await api.reviewDuplicate({
        reportId: pair.reportId,
        matchingReportId: pair.matchingReportId,
        action,
        reviewerNotes: `Verified by ${currentUser?.name || 'Dr. Rajesh Kumar'}: ${
          action === 'CONFIRM_SAME' ? 'Same underlying problem (associated to cluster)' : 'Independent defect'
        }`,
        actorName: currentUser?.name || 'Dr. Rajesh Kumar',
      });

      if (res && res.success) {
        setActionFeedback(
          action === 'CONFIRM_SAME'
            ? `Confirmed: ${pair.reportId} and ${pair.matchingReportId} marked as corroborating reports and associated with cluster.`
            : `Decision recorded: ${pair.reportId} and ${pair.matchingReportId} marked as independent issues.`
        );
        setTimeout(() => setActionFeedback(''), 5000);
        fetchDuplicates();
      } else {
        setErrorMessage('Failed to record duplicate review decision.');
      }
    } catch (err: any) {
      console.error('Failed to review duplicate', err);
      setErrorMessage(err.message || 'Failed to review duplicate candidate. Please verify backend connection.');
    } finally {
      setProcessingKey(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            {t.admin.duplicateWorkspace}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Spatial, semantic, and categorical cross-reference intelligence for human verification.
          </p>
        </div>

        <button
          onClick={fetchDuplicates}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg self-start sm:self-auto cursor-pointer"
        >
          {t.common.refresh}
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {actionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback('')}
            className="text-emerald-500 hover:text-emerald-700 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Candidates List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">{t.common.loading}</div>
      ) : candidates.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
          <CopyCheck className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-navy-900">No Suspected Duplicates Pending</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All reports currently in intake appear geographically distinct or have already been triaged.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {candidates.map((pair, index) => {
            const r1 = pair.report1;
            const r2 = pair.report2;

            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* AI Analysis Bar */}
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-purple-100 text-purple-700">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="font-bold text-navy-900">
                        AI Corroboration Match: {pair.overallConfidence}% Confidence
                      </span>
                      <span className="text-slate-500 block text-[11px] mt-0.5">
                        {pair.explanation}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      Distance: <strong>{pair.distanceMeters}m</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      Text Overlap: <strong>{pair.semanticSimilarity}%</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      Category:{' '}
                      <strong className={pair.categoryMatch ? 'text-emerald-700' : 'text-amber-700'}>
                        {pair.categoryMatch ? 'Matching' : 'Different'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Side-by-side Report Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-6 gap-6">
                  {/* Report A */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        Primary Report: {r1 ? r1.id : pair.reportId}
                      </span>
                      {r1 && <StatusBadge status={r1.status} size="sm" />}
                    </div>

                    {r1 ? (
                      <>
                        <h4 className="text-sm font-bold text-navy-900">{r1.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {r1.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <span>📍 {r1.location.address}</span>
                          <CategoryBadge category={r1.category} showIcon={false} />
                        </div>
                        {r1.photos && r1.photos.length > 0 && (
                          <div className="h-36 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                            <img
                              src={r1.photos[0]}
                              alt="A"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-slate-400">Report details unavailable</div>
                    )}
                  </div>

                  {/* Report B */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        Corroborating Submission: {r2 ? r2.id : pair.matchingReportId}
                      </span>
                      {r2 && <StatusBadge status={r2.status} size="sm" />}
                    </div>

                    {r2 ? (
                      <>
                        <h4 className="text-sm font-bold text-navy-900">{r2.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {r2.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <span>📍 {r2.location.address}</span>
                          <CategoryBadge category={r2.category} showIcon={false} />
                        </div>
                        {r2.photos && r2.photos.length > 0 && (
                          <div className="h-36 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                            <img
                              src={r2.photos[0]}
                              alt="B"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-slate-400">Report details unavailable</div>
                    )}
                  </div>
                </div>

                {/* Human Review Action Bar */}
                {(() => {
                  const pairKeyPrefix = `${pair.reportId}-${pair.matchingReportId}`;
                  const isConfirming = processingKey === `${pairKeyPrefix}-CONFIRM_SAME`;
                  const isRejecting = processingKey === `${pairKeyPrefix}-CONFIRM_DIFFERENT`;
                  const isPairBusy = processingKey?.startsWith(pairKeyPrefix);
                  const isConfirmedSame = pair.status === 'CONFIRMED_SAME_ISSUE';
                  const isConfirmedDiff = pair.status === 'CONFIRMED_DIFFERENT_ISSUE';

                  return (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Shield className="w-4 h-4 text-[#148F87]" />
                        <span>
                          Current Status:{' '}
                          <strong
                            className={
                              isConfirmedSame
                                ? 'text-emerald-700'
                                : isConfirmedDiff
                                ? 'text-slate-700'
                                : 'text-amber-700'
                            }
                          >
                            {isConfirmedSame
                              ? 'Cluster Association Confirmed'
                              : isConfirmedDiff
                              ? 'Marked as Independent Issue'
                              : 'Pending Human Verification'}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={Boolean(isPairBusy || isConfirmedDiff)}
                          onClick={() => handleReview(pair, 'CONFIRM_DIFFERENT')}
                          className={`px-3.5 py-2 border rounded-lg flex items-center gap-1.5 transition-colors text-xs font-bold ${
                            isConfirmedDiff
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                              : 'border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {isRejecting ? (
                            <>
                              <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                              <span>Saving Decision...</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-slate-500" />
                              <span>{isConfirmedDiff ? 'Marked Independent ✓' : t.admin.rejectCluster}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(isPairBusy || isConfirmedSame)}
                          onClick={() => handleReview(pair, 'CONFIRM_SAME')}
                          className={`px-4 py-2 font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors text-xs ${
                            isConfirmedSame
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-[#148F87] hover:bg-teal-hover text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {isConfirming ? (
                            <>
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                              <span>Associating Cluster...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{isConfirmedSame ? 'Cluster Associated ✓' : t.admin.approveCluster}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
