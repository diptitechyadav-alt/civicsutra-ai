import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import {
  Settings,
  Cpu,
  Shield,
  Sliders,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [spatialRadius, setSpatialRadius] = useState<number>(150);
  const [semanticThreshold, setSemanticThreshold] = useState<number>(65);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetFeedback, setResetFeedback] = useState('');

  const handleResetDemo = async () => {
    try {
      await api.resetDemo();
      setIsResetModalOpen(false);
      setResetFeedback('Database restored to initial verified demo state.');
      setTimeout(() => setResetFeedback(''), 4000);
    } catch (err) {
      console.error('Failed to reset demo', err);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
          {t.nav.settings}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tune intelligence engine parameters, inspection thresholds, and environment persistence.
        </p>
      </div>

      {resetFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resetFeedback}</span>
        </div>
      )}

      {/* AI Intelligence Parameters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Cpu className="w-5 h-5 text-[#148F87]" />
          <h2 className="text-base font-bold text-navy-900">
            AI Duplicate & Cluster Triage Thresholds
          </h2>
        </div>

        <div className="space-y-5 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">
                Spatial Clustering Distance (Haversine Radius)
              </label>
              <span className="font-mono font-bold text-[#148F87] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {spatialRadius} Meters
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="500"
              step="10"
              value={spatialRadius}
              onChange={(e) => setSpatialRadius(Number(e.target.value))}
              className="w-full accent-[#148F87]"
            />
            <p className="text-slate-400 text-[11px] mt-1">
              Maximum geographic separation between two citizen submissions to be evaluated as the same localized hazard.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">
                Semantic Text Similarity Threshold (NLP Token Overlap)
              </label>
              <span className="font-mono font-bold text-[#148F87] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {semanticThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="95"
              step="5"
              value={semanticThreshold}
              onChange={(e) => setSemanticThreshold(Number(e.target.value))}
              className="w-full accent-[#148F87]"
            />
            <p className="text-slate-400 text-[11px] mt-1">
              Minimum textual and synonym overlap required to propose duplicate candidate flag to reviewers.
            </p>
          </div>
        </div>
      </div>

      {/* Responsible AI Compliance */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Shield className="w-5 h-5 text-[#148F87]" />
          <h2 className="text-base font-bold text-navy-900">Responsible AI Compliance Standard</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-navy-900 block">Mandatory Human Sign-Off</span>
            <p className="text-slate-600 leading-relaxed">
              Autonomous cluster approval or issue closure is permanently disabled. Reviewers must certify every association.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-navy-900 block">Citizen Privacy Masking</span>
            <p className="text-slate-600 leading-relaxed">
              Public endpoints automatically strip citizen names, phone numbers, and exact residential addresses.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Reset Container */}
      <div className="bg-white rounded-xl border border-rose-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h2 className="text-base font-bold text-rose-900">Demonstration Environment Control</h2>
        </div>
        <p className="text-xs text-slate-600">
          Restore the database back to initial seed data (re-populating the MG Road pothole cluster,
          mandi waste, underpass waterlogging, and audit records).
        </p>

        <button
          onClick={() => setIsResetModalOpen(true)}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-300 flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Clean Demo Records</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {isResetModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsResetModalOpen(false)}
          title="Reset Demonstration Environment?"
          subtitle="This action will re-seed all reports and audit logs."
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Are you sure you want to restore the platform data? All newly submitted reports and
              temporary notes created in this session will be reset to default seed records.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDemo}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
              >
                Yes, Reset Environment
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
