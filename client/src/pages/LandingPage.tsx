import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Report } from '../types';
import { api } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  Shield,
  ArrowRight,
  MapPin,
  Sparkles,
  GitMerge,
  ListOrdered,
  Lock,
  CheckCircle,
  HelpCircle,
  FileText,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [sampleReports, setSampleReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({
    totalReports: 7,
    activeClusters: 1,
    resolved: 1,
    criticalCount: 4,
  });

  useEffect(() => {
    api
      .getReports({ isPublic: true })
      .then((data) => setSampleReports(data.slice(0, 4)))
      .catch((err) => console.warn('Could not load landing reports', err));

    api
      .getAnalytics()
      .then((data) => setStats(data.kpis))
      .catch((err) => console.warn('Could not load landing stats', err));
  }, []);

  return (
    <div className="space-y-16 py-8">
      {/* 1. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          {/* Subtle background graphic */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#D5F3EE]/40 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D5F3EE] text-[#0E756E] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Civic Intelligence Layer</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-navy-900 tracking-tight leading-tight">
              {t.landing.heroTitle}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              {t.landing.heroSubtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('submit-report')}
                className="px-6 py-3.5 bg-[#148F87] hover:bg-teal-hover text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>{t.landing.ctaReport}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('public-map')}
                className="px-6 py-3.5 bg-white text-navy-900 hover:bg-slate-50 border border-slate-300 text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-[#148F87]" />
                <span>{t.landing.ctaExploreMap}</span>
              </button>
            </div>

            {/* Portal Access Links */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Portals:</span>
              <button
                onClick={() => onNavigate('login')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-md font-medium text-slate-800 cursor-pointer"
              >
                Citizen Portal
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 rounded-md font-medium text-rose-800 cursor-pointer"
              >
                Municipal Authority Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Demonstration Metrics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {t.landing.statsReports}
            </span>
            <div className="text-3xl font-extrabold text-navy-900 font-mono">
              {stats.totalReports}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Sample records in Ward 14
            </span>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {t.landing.statsClusters}
            </span>
            <div className="text-3xl font-extrabold text-[#148F87] font-mono">
              {stats.activeClusters}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Multi-report problem groups
            </span>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              High / Critical Hazards
            </span>
            <div className="text-3xl font-extrabold text-[#C94C4C] font-mono">
              {stats.criticalCount}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Prioritized by multi-factor score
            </span>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {t.landing.statsResolved}
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 font-mono">
              {stats.resolved}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Verified by field units
            </span>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">{t.landing.sampleNotice}</p>
      </section>

      {/* 3. Three-Step Civic Intelligence Pipeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#148F87]">
            Core Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
            {t.landing.stepsTitle}
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            “Many Reports. One Connected Understanding. Smarter Action.”
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-lg mb-5 border border-blue-100">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">{t.landing.step1Title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.landing.step1Desc}
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-12 h-12 rounded-xl bg-[#D5F3EE] text-[#148F87] flex items-center justify-center font-extrabold text-lg mb-5 border border-[#A8E6DC]">
              <GitMerge className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">{t.landing.step2Title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.landing.step2Desc}
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-lg mb-5 border border-amber-100">
              <ListOrdered className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">{t.landing.step3Title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.landing.step3Desc}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Illustrative Issue Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy-900">
              {t.landing.recentIssuesTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Public privacy-safe preview of active community issues.
            </p>
          </div>
          <button
            onClick={() => onNavigate('public-map')}
            className="text-xs font-bold text-[#148F87] hover:underline flex items-center gap-1"
          >
            <span>{t.landing.viewAllPublic}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sampleReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Photo Thumbnail */}
                <div className="h-40 bg-slate-100 relative overflow-hidden">
                  {report.photos && report.photos.length > 0 ? (
                    <img
                      src={report.photos[0]}
                      alt={report.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No Photo Evidence
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <PriorityBadge
                      level={report.priorityScore?.level || 'MEDIUM'}
                      score={report.priorityScore?.totalScore ?? (report as any)?.priority_score?.total_score}
                      showScore
                    />
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400 font-semibold">{report.id}</span>
                    <StatusBadge status={report.status} size="sm" />
                  </div>
                  <h4 className="text-sm font-bold text-navy-900 line-clamp-1">{report.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="truncate max-w-[180px]">📍 {report.location?.address || 'Ward 14, New Delhi'}</span>
                <CategoryBadge category={report.category} showIcon={false} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Human-Centered AI & Privacy Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0B1F2A] rounded-2xl p-8 sm:p-12 text-white shadow-lg">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-[#148F87]" />
              <span>Responsible Public AI Charter</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold">{t.landing.aiSafetyTitle}</h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {t.landing.aiSafetyDesc}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-navy-800">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#148F87] shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  Zero automated closure — human sign-off mandatory.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#148F87] shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  Full mathematical transparency on all priority scores.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#148F87] shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  Citizen identities & numbers masked on public map.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
