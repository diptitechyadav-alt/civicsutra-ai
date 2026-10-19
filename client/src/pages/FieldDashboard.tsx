import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Report } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { Modal } from '../components/Modal';
import {
  HardHat,
  MapPin,
  Calendar,
  CheckCircle2,
  Camera,
  Upload,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface FieldDashboardProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const FieldDashboard: React.FC<FieldDashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolution modal state
  const [resolvingReport, setResolvingReport] = useState<Report | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = () => {
    setLoading(true);
    api
      .getReports()
      .then((data) => {
        // Filter assigned or in-progress tasks
        const fieldTasks = data.filter(
          (r) => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS' || r.status === 'CLUSTERED'
        );
        setTasks(fieldTasks);
      })
      .catch((err) => console.error('Failed to load field tasks', err))
      .finally(() => setLoading(false));
  };

  const handleStartWork = async (report: Report) => {
    try {
      await api.updateReportStatus(
        report.id,
        'IN_PROGRESS',
        'Field inspector arrived on site. Remediation work initiated.',
        currentUser?.name || 'Pooja Verma',
        'FIELD_TEAM'
      );
      fetchTasks();
    } catch (err) {
      console.error('Failed to start work', err);
    }
  };

  const handleCompleteWork = async () => {
    if (!resolvingReport) return;
    setIsSubmitting(true);
    try {
      await api.updateReportStatus(
        resolvingReport.id,
        'RESOLVED',
        `Remediation verified by field inspector ${currentUser?.name || 'Pooja Verma'}. Notes: ${
          resolutionNote || 'Defect resolved and verified on ground.'
        }`,
        currentUser?.name || 'Pooja Verma',
        'FIELD_TEAM'
      );
      setResolvingReport(null);
      setResolutionNote('');
      setResolutionPhoto(null);
      fetchTasks();
    } catch (err) {
      console.error('Failed to resolve task', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-1">
            <HardHat className="w-3.5 h-3.5 text-amber-600" />
            <span>Field Team & Contractor Workspace</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Assigned Work Orders — Ward 14
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active physical inspections and remediation orders dispatched for execution.
          </p>
        </div>

        <button
          onClick={fetchTasks}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg self-start sm:self-auto"
        >
          {t.common.refresh}
        </button>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">{t.common.loading}</div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-navy-900">All Assigned Tasks Completed</h3>
            <p className="text-xs text-slate-500">
              There are currently no outstanding work orders assigned to your unit.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-6 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {task.id}
                    </span>
                    <StatusBadge status={task.status} size="sm" />
                    <CategoryBadge category={task.category} />
                    <PriorityBadge
                      level={task.priorityScore.level}
                      score={task.priorityScore.totalScore}
                      showScore
                    />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-navy-900">{task.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{task.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-[#148F87]" />
                      <span>{task.location.address}</span>
                    </span>
                    {task.location.landmark && (
                      <span className="text-slate-400">Landmark: {task.location.landmark}</span>
                    )}
                  </div>
                </div>

                {/* Evidence Thumbnail & Actions */}
                <div className="flex items-center gap-4 shrink-0">
                  {task.photos && task.photos.length > 0 && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 hidden sm:block">
                      <img src={task.photos[0]} alt="Task" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {task.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleStartWork(task)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Start Work (Deploy Team)</span>
                      </button>
                    )}

                    <button
                      onClick={() => setResolvingReport(task)}
                      className="px-4 py-2 bg-[#148F87] hover:bg-teal-hover text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Resolution Evidence</span>
                    </button>

                    <button
                      onClick={() => onNavigate('report-detail', task.id)}
                      className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-navy-900 hover:underline text-center"
                    >
                      View Report Detail
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Evidence Modal */}
      {resolvingReport && (
        <Modal
          isOpen={true}
          onClose={() => setResolvingReport(null)}
          title={`Record Resolution Evidence: ${resolvingReport.id}`}
          subtitle={resolvingReport.title}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Resolution & Repair Summary Notes *
              </label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="e.g. High-pressure cold mix asphalt filled and roller compacted. Road cleared for vehicle transit."
                className="w-full p-2.5 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Resolution Photo Evidence
              </label>
              <div className="flex items-center gap-3">
                {resolutionPhoto ? (
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-300 relative">
                    <img src={resolutionPhoto} alt="Done" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      // Attach sample resolved photo for demo
                      setResolutionPhoto(
                        'https://images.unsplash.com/photo-1541888946425-d0fbb18086f7?w=600&auto=format&fit=crop&q=80'
                      );
                    }}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#148F87] flex flex-col items-center justify-center text-slate-400 hover:text-[#148F87]"
                  >
                    <Camera className="w-5 h-5 mb-1" />
                    <span className="text-[10px] text-center font-bold">Attach Photo</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-slate-500">
              Submitting this record will mark the issue as <strong>RESOLVED</strong>, notify the
              reporting citizen, and write an immutable audit log entry.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResolvingReport(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCompleteWork}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
              >
                {isSubmitting ? 'Recording...' : 'Certify & Resolve'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
