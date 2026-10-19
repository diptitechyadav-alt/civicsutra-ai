import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Report, IssueCluster } from '../types';
import { api } from '../services/api';
import { InteractiveMap } from '../components/InteractiveMap';
import { Shield, EyeOff, Layers, PlusCircle, AlertTriangle } from 'lucide-react';

interface PublicMapPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const PublicMapPage: React.FC<PublicMapPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getReports({ isPublic: true }),
      api.getClusters(),
    ])
      .then(([repData, clusData]) => {
        setReports(repData);
        setClusters(clusData);
      })
      .catch((err) => console.error('Failed to load public map data', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header with Privacy Guarantee Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold mb-1">
            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.common.privacyProtected}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            {t.nav.publicMap}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time public spatial intelligence for Ward 14 civic maintenance.
          </p>
        </div>

        <button
          onClick={() => onNavigate('submit-report')}
          className="px-5 py-2.5 bg-[#148F87] hover:bg-teal-hover text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Problem in This Area</span>
        </button>
      </div>

      {/* Main Interactive Map */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs">
        <InteractiveMap
          reports={reports}
          clusters={clusters}
          isPublicMode={true}
          heightClass="h-[600px]"
          onSelectReport={(r) => onNavigate('report-detail', r.id)}
        />
      </div>

      {/* Map Legend & Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <span className="font-bold text-navy-900 block">Hazard Priority Color Coding</span>
          <div className="space-y-1.5 text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
              <span>Critical Hazard (High traffic accident / flooding risk)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
              <span>High Priority (Near schools, hospitals, or transit)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#148F87] shrink-0" />
              <span>Standard Maintenance Priority</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <span className="font-bold text-navy-900 block">Cluster Regional Boundary</span>
          <p className="text-slate-600 leading-relaxed">
            Dashed teal circles indicate AI-suggested problem clusters where multiple citizens have
            corroborated the same damaged infrastructure within a 50-meter radius.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <span className="font-bold text-navy-900 block">Citizen Privacy Protocol</span>
          <p className="text-slate-600 leading-relaxed">
            In compliance with public privacy standards, personal phone numbers, names, and precise
            doorstep markers are strictly masked on all public-facing views.
          </p>
        </div>
      </div>
    </div>
  );
};
