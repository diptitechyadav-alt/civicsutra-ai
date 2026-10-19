import React from 'react';
import { PriorityScoreBreakdown } from '../types';
import { Modal } from './Modal';
import { ShieldAlert, Info, Scale, Users, AlertTriangle, Building, Clock } from 'lucide-react';

interface PriorityFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: PriorityScoreBreakdown | null;
  reportId?: string;
}

export const PriorityFormulaModal: React.FC<PriorityFormulaModalProps> = ({
  isOpen,
  onClose,
  breakdown,
  reportId,
}) => {
  if (!breakdown) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transparent Priority Scoring Breakdown"
      subtitle={`Auditable mathematical score analysis for ${reportId || 'Issue'}`}
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Total Score Banner */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Aggregated Priority Score
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-extrabold">{breakdown.totalScore}</span>
              <span className="text-slate-400 text-sm font-medium">/ 100 Points</span>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                breakdown.level === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : breakdown.level === 'HIGH'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : breakdown.level === 'MEDIUM'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              }`}
            >
              {breakdown.level} HAZARD
            </span>
          </div>
        </div>

        {/* Formula Representation */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
          <div className="font-semibold text-slate-900 mb-1">
            Priority Score = (Volume × w₁) + (Severity × w₂) + (Vulnerability × w₃) + (Age × w₄)
          </div>
          <div className="text-slate-500">
            {breakdown.totalScore} = {breakdown.volumeFactor} + {breakdown.severityFactor} +{' '}
            {breakdown.vulnerabilityFactor} + {breakdown.stalenessFactor}
          </div>
        </div>

        {/* Factor Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Factor 1: Volume */}
          <div className="p-3.5 border border-slate-200 rounded-lg bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Volume & Corroboration</span>
              </div>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {breakdown.volumeFactor} / 30 pts
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Based on distinct citizen submissions corroborating this hazard in the immediate area.
            </p>
          </div>

          {/* Factor 2: Severity */}
          <div className="p-3.5 border border-slate-200 rounded-lg bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span>Hazard Severity</span>
              </div>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {breakdown.severityFactor} / 30 pts
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Physical risk rating assigned to category (e.g. 2-wheeler skidding risk, flooding depth).
            </p>
          </div>

          {/* Factor 3: Vulnerability */}
          <div className="p-3.5 border border-slate-200 rounded-lg bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>Sensitive Facility Proximity</span>
              </div>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {breakdown.vulnerabilityFactor} / 25 pts
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Proximity boost if located adjacent to schools, hospitals, transit terminals, or clinics.
            </p>
          </div>

          {/* Factor 4: Age */}
          <div className="p-3.5 border border-slate-200 rounded-lg bg-white">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Pending Staleness / Age</span>
              </div>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {breakdown.stalenessFactor} / 15 pts
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Incremental escalation as reports remain unresolved over multiple days.
            </p>
          </div>
        </div>

        {/* AI Disclaimer & Responsible Use */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong className="font-semibold">Responsible AI Standard:</strong> This score is an
            indicative computational advisory generated to prevent critical community hazards from being overlooked.
            Authorized reviewers hold full discretion to override priority rankings based on field inspections.
          </div>
        </div>
      </div>
    </Modal>
  );
};
