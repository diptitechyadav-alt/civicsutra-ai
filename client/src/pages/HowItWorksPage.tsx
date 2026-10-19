import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  FileText,
  GitMerge,
  ListOrdered,
  ShieldCheck,
  Cpu,
  MapPin,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D5F3EE] text-[#0E756E] text-xs font-bold uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5" />
          <span>Platform Architecture & Mechanics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
          How CivicSutra AI Works
        </h1>
        <p className="text-sm text-slate-600">
          A transparent, evidence-supported civic intelligence framework built to eliminate municipal blindspots and duplicate backlogs.
        </p>
      </div>

      {/* Step by Step Flow */}
      <div className="space-y-8">
        {/* Step 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-lg shrink-0 border border-blue-100">
            1
          </div>
          <div className="space-y-3 flex-1">
            <h3 className="text-lg font-bold text-navy-900">
              Citizen Reporting with Ground Evidence
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Citizens submit reports using text or microphone voice dictation. High-precision GPS
              coordinates or manual map pin placement establish the exact incident coordinates.
              Photographs are timestamped and categorized to support physical verification.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-medium">
                Web Speech Voice-to-Text
              </span>
              <span className="px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-medium">
                GPS Geolocation
              </span>
              <span className="px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-medium">
                Photo Evidence Verification
              </span>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-[#D5F3EE] text-[#148F87] flex items-center justify-center font-extrabold text-lg shrink-0 border border-[#A8E6DC]">
            2
          </div>
          <div className="space-y-3 flex-1">
            <h3 className="text-lg font-bold text-navy-900">
              Spatial & Semantic Duplicate Detection
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              When Citizen A reports a pothole with a photo and Citizen B describes the same hazard 40m away in different words, CivicSutra AI computes:
            </p>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-5">
              <li>
                <strong>Geographic Proximity:</strong> Haversine great-circle distance in meters between report GPS pins.
              </li>
              <li>
                <strong>Semantic Text Overlap:</strong> NLP token frequency and civic synonym clustering (e.g. "pothole", "crater", "broken road").
              </li>
              <li>
                <strong>Categorical Equivalence:</strong> Validates category alignment across both submissions.
              </li>
            </ul>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-lg shrink-0 border border-amber-100">
            3
          </div>
          <div className="space-y-3 flex-1">
            <h3 className="text-lg font-bold text-navy-900">
              Multi-Report Clustering & Transparent Priority Scoring
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Corroborating reports are grouped into unified issue clusters. The system calculates an auditable priority score (0 to 100) combining four weighted factors:
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-navy-900 space-y-1">
              <div className="font-bold">
                Priority Score = Volume (w₁) + Hazard Severity (w₂) + Sensitive Facility Proximity (w₃) + Pending Age (w₄)
              </div>
              <div className="text-slate-500 text-[11px]">
                Max weights: Volume = 30 pts • Severity = 30 pts • Vulnerability = 25 pts • Staleness = 15 pts
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-lg shrink-0 border border-emerald-100">
            4
          </div>
          <div className="space-y-3 flex-1">
            <h3 className="text-lg font-bold text-navy-900">
              Human Reviewer Verification & Field Remediation
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              AI suggests associations; authorized municipal officers certify them. Field inspectors
              deploy on-site, log progress notes, and upload photo evidence certifying complete
              resolution. Every action is recorded in a tamper-evident audit history.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <button
          onClick={() => onNavigate('submit-report')}
          className="px-6 py-3 bg-[#148F87] hover:bg-teal-hover text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2"
        >
          <span>Experience the Platform — Report a Problem</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
