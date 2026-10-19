import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { IssueCluster, Report } from '../types';
import { api } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { PriorityFormulaModal } from '../components/PriorityFormulaModal';
import { Modal } from '../components/Modal';
import {
  Network,
  PlusCircle,
  Eye,
  CheckCircle2,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ClustersPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const ClustersPage: React.FC<ClustersPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [loading, setLoading] = useState(true);

  // Inspector modal
  const [inspectCluster, setInspectCluster] = useState<IssueCluster | null>(null);
  const [clusterReports, setClusterReports] = useState<Report[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Priority modal
  const [formulaModalCluster, setFormulaModalCluster] = useState<IssueCluster | null>(null);

  // Create cluster modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [newClusterTitle, setNewClusterTitle] = useState('');

  useEffect(() => {
    fetchClusters();
  }, []);

  const fetchClusters = () => {
    setLoading(true);
    api
      .getClusters()
      .then((data) => setClusters(data))
      .catch((err) => console.error('Failed to load clusters', err))
      .finally(() => setLoading(false));
  };

  const handleOpenInspect = async (cluster: IssueCluster) => {
    setInspectCluster(cluster);
    setInspectLoading(true);
    try {
      const res = await api.getClusterById(cluster.id);
      setClusterReports(res.reports);
    } catch (err) {
      console.error('Failed to inspect cluster', err);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleOpenCreateModal = async () => {
    setIsCreateOpen(true);
    try {
      const reps = await api.getReports();
      setAllReports(reps);
      setSelectedReportIds([]);
      setNewClusterTitle('');
    } catch (err) {
      console.error('Error fetching reports for clustering', err);
    }
  };

  const handleCreateCluster = async () => {
    if (selectedReportIds.length === 0) return;
    try {
      await api.createCluster({
        title: newClusterTitle,
        reportIds: selectedReportIds,
        reviewerNotes: `Manually grouped by ${currentUser?.name || 'Dr. Rajesh Kumar'}.`,
      });
      setIsCreateOpen(false);
      fetchClusters();
    } catch (err) {
      console.error('Failed to create cluster', err);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            {t.admin.clusterWorkspace}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified incident groupings combining multiple corroborating citizen reports for coordinated municipal repair.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-[#148F87] hover:bg-teal-hover text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Form New Cluster</span>
        </button>
      </div>

      {/* Clusters Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">{t.common.loading}</div>
      ) : clusters.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
          <Network className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-navy-900">No Active Clusters</h3>
          <p className="text-xs text-slate-500">
            Incoming reports have not yet been grouped into multi-report clusters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clusters.map((cluster) => (
            <div
              key={cluster.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-[#148F87] bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                    {cluster.id}
                  </span>
                  <PriorityBadge
                    level={cluster.priorityScore.level}
                    score={cluster.priorityScore.totalScore}
                    showScore
                    onClick={() => setFormulaModalCluster(cluster)}
                  />
                </div>

                <h3 className="text-base font-bold text-navy-900 line-clamp-2">{cluster.title}</h3>

                <div className="flex items-center gap-2 mt-2">
                  <CategoryBadge category={cluster.primaryCategory} />
                  <span className="text-xs text-[#0E756E] bg-[#D5F3EE] px-2 py-0.5 rounded-full font-bold">
                    {cluster.reportCount} Corroborating Reports
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                  📍 {cluster.centerLocation.address}
                </p>

                {cluster.reviewerNotes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2 italic">
                    “{cluster.reviewerNotes}”
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  AI Confidence: {cluster.aiConfidence}%
                </span>

                <button
                  onClick={() => handleOpenInspect(cluster)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect ({cluster.reportCount})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cluster Inspection Modal */}
      {inspectCluster && (
        <Modal
          isOpen={true}
          onClose={() => setInspectCluster(null)}
          title={`Cluster Details: ${inspectCluster.id}`}
          subtitle={inspectCluster.title}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                  Cluster Status
                </span>
                <span className="text-sm font-bold text-navy-900">{inspectCluster.status}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                  Assigned Department
                </span>
                <span className="text-sm font-bold text-navy-900">
                  {inspectCluster.assignedDepartment || 'Pending Assignment'}
                </span>
              </div>
              <div>
                <PriorityBadge
                  level={inspectCluster.priorityScore.level}
                  score={inspectCluster.priorityScore.totalScore}
                  showScore
                  onClick={() => setFormulaModalCluster(inspectCluster)}
                />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-navy-900 uppercase tracking-wider text-slate-500 mb-2">
                Grouped Citizen Submissions ({clusterReports.length})
              </h4>

              {inspectLoading ? (
                <div className="py-6 text-center text-slate-400">{t.common.loading}</div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {clusterReports.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-50"
                    >
                      <div className="space-y-0.5 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-500">{r.id}</span>
                          <span className="text-navy-900 font-bold">{r.title}</span>
                        </div>
                        <p className="text-slate-500 line-clamp-1">{r.description}</p>
                        <span className="text-[10px] text-slate-400">
                          Reported by {r.citizenName} • {r.location.address}
                        </span>
                      </div>

                      <button
                        onClick={() => onNavigate('report-detail', r.id)}
                        className="px-2.5 py-1 text-xs font-bold text-[#148F87] hover:underline shrink-0"
                      >
                        View Report
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectCluster(null)}
                className="px-4 py-2 bg-navy-900 text-white font-bold rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Cluster Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          title="Create New Issue Cluster"
          subtitle="Select two or more related reports to group under a single municipal work order."
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cluster Title</label>
              <input
                type="text"
                value={newClusterTitle}
                onChange={(e) => setNewClusterTitle(e.target.value)}
                placeholder="e.g. MG Road Bus Depot Combined Asphalt Hazard"
                className="w-full p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-2">
                Select Reports to Include:
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                {allReports.map((r) => {
                  const isChecked = selectedReportIds.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#D5F3EE]/50 border border-[#A8E6DC]' : 'hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReportIds((prev) => [...prev, r.id]);
                          } else {
                            setSelectedReportIds((prev) => prev.filter((id) => id !== r.id));
                          }
                        }}
                        className="mt-0.5 rounded text-[#148F87] focus:ring-[#148F87]"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold font-mono text-slate-700 mr-2">{r.id}</span>
                        <span className="font-bold text-navy-900">{r.title}</span>
                        <div className="text-[11px] text-slate-500">📍 {r.location.address}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedReportIds.length < 1}
                onClick={handleCreateCluster}
                className="px-5 py-2 bg-[#148F87] hover:bg-teal-hover text-white rounded-lg font-bold disabled:opacity-40"
              >
                Group ({selectedReportIds.length}) Reports
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Priority Formula Modal */}
      {formulaModalCluster && (
        <PriorityFormulaModal
          isOpen={true}
          onClose={() => setFormulaModalCluster(null)}
          breakdown={formulaModalCluster.priorityScore}
          reportId={formulaModalCluster.id}
        />
      )}
    </div>
  );
};
