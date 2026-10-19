import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Report, IssueStatus } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { Modal } from '../components/Modal';
import {
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  Wrench,
  Network,
  Eye,
  ExternalLink,
} from 'lucide-react';

interface IncomingReportsPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const IncomingReportsPage: React.FC<IncomingReportsPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Status Modal state
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<IssueStatus>('UNDER_REVIEW');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Assign Modal state
  const [assignModalReport, setAssignModalReport] = useState<Report | null>(null);
  const [selectedTeam, setSelectedTeam] = useState('team-road-01');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = () => {
    setLoading(true);
    api
      .getReports()
      .then((data) => setReports(data))
      .catch((err) => console.error('Failed to load reports', err))
      .finally(() => setLoading(false));
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;
    setIsUpdating(true);
    try {
      await api.updateReportStatus(
        selectedReport.id,
        newStatus,
        statusNote,
        currentUser?.name || 'Dr. Rajesh Kumar',
        'ADMIN'
      );
      setSelectedReport(null);
      setStatusNote('');
      fetchReports();
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignTeam = async () => {
    if (!assignModalReport) return;
    const teamMap: Record<string, { name: string; assignee: string }> = {
      'team-road-01': { name: 'Roads & Asphalt Maintenance', assignee: 'Pooja Verma' },
      'team-sanitation-01': { name: 'Solid Waste Rapid Action Unit', assignee: 'Pooja Verma' },
      'team-drainage-01': { name: 'Stormwater & Drainage Division', assignee: 'Inspector Ramesh' },
      'team-electrical-01': { name: 'Street Lighting & Electrical Division', assignee: 'Sunil Sethi' },
    };

    const target = teamMap[selectedTeam] || { name: 'General Municipal Cell', assignee: 'Officer On Duty' };
    try {
      await api.assignReport(assignModalReport.id, {
        teamId: selectedTeam,
        teamName: target.name,
        assigneeName: target.assignee,
        actorName: currentUser?.name || 'Dr. Rajesh Kumar',
      });
      setAssignModalReport(null);
      fetchReports();
    } catch (err) {
      console.error('Failed to assign team', err);
    }
  };

  const filtered = reports.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.location.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            {t.admin.recentIncoming}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming citizen submissions awaiting evidence validation and operational triage.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg self-start sm:self-auto"
        >
          {t.common.refresh}
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, title, or road name..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#148F87] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="SUBMITTED">Newly Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="CLUSTERED">Clustered</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Ref ID</th>
                <th className="py-3 px-4">Problem Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Priority Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    {t.common.loading}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No matching reports.
                  </td>
                </tr>
              ) : (
                filtered.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {report.id}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-navy-900 line-clamp-1">{report.title}</div>
                      <div className="text-slate-500 line-clamp-1 text-[11px]">
                        {report.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <CategoryBadge category={report.category} />
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="truncate text-slate-700">{report.location.address}</div>
                      {report.location.landmark && (
                        <div className="text-slate-400 text-[10px] truncate">
                          Near {report.location.landmark}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge
                        level={report.priorityScore.level}
                        score={report.priorityScore.totalScore}
                        showScore
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={report.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold"
                        title="Update Status"
                      >
                        Status
                      </button>

                      <button
                        onClick={() => setAssignModalReport(report)}
                        className="px-2.5 py-1 bg-[#D5F3EE] hover:bg-[#A8E6DC] text-[#0E756E] rounded font-bold"
                        title="Assign Department"
                      >
                        Assign
                      </button>

                      <button
                        onClick={() => onNavigate('report-detail', report.id)}
                        className="px-2.5 py-1 bg-[#148F87] hover:bg-teal-hover text-white rounded font-bold"
                        title="Inspect Full Workspace"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {selectedReport && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          title={`Update Status for ${selectedReport.id}`}
          subtitle={selectedReport.title}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">New Official Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="CLUSTERED">Clustered</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected / Invalid</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Official Reviewer Note (Appended to Audit Trail)
              </label>
              <textarea
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Field inspection completed. Work order #104 dispatched to road maintenance division."
                className="w-full p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleUpdateStatus}
                className="px-5 py-2 bg-[#148F87] hover:bg-teal-hover text-white rounded-lg font-bold"
              >
                {isUpdating ? 'Updating...' : 'Save & Publish Update'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign Team Modal */}
      {assignModalReport && (
        <Modal
          isOpen={true}
          onClose={() => setAssignModalReport(null)}
          title={`Assign Department for ${assignModalReport.id}`}
          subtitle={assignModalReport.title}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Select Municipal Unit / Division
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="team-road-01">Roads & Asphalt Maintenance (Pooja Verma)</option>
                <option value="team-sanitation-01">
                  Solid Waste Rapid Action Unit (Pooja Verma)
                </option>
                <option value="team-drainage-01">
                  Stormwater & Drainage Division (Inspector Ramesh)
                </option>
                <option value="team-electrical-01">
                  Street Lighting & Electrical Division (Sunil Sethi)
                </option>
              </select>
            </div>

            <p className="text-slate-500">
              Assigning this issue transitions the report to <strong>ASSIGNED</strong> and dispatches
              it directly to the field inspector’s active task queue.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignModalReport(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignTeam}
                className="px-5 py-2 bg-[#148F87] hover:bg-teal-hover text-white rounded-lg font-bold"
              >
                Dispatch Work Order
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
