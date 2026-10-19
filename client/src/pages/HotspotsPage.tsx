import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Report, IssueCluster } from '../types';
import { api } from '../services/api';
import { InteractiveMap } from '../components/InteractiveMap';
import { MapPin, Layers, Flame, ShieldAlert } from 'lucide-react';

interface HotspotsPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const HotspotsPage: React.FC<HotspotsPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getReports(), api.getClusters()])
      .then(([reps, clus]) => {
        setReports(reps);
        setClusters(clus);
      })
      .catch((err) => console.error('Failed to load map data', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Ward 14 Smart Map & Hotspot Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic incident clusters, density zones, and high-hazard road intersections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-[#C94C4C] text-xs font-bold border border-rose-200">
            <Flame className="w-3.5 h-3.5" />
            <span>High Density Zone: MG Road Depot</span>
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs">
        <InteractiveMap
          reports={reports}
          clusters={clusters}
          heightClass="h-[650px]"
          onSelectReport={(r) => onNavigate('report-detail', r.id)}
        />
      </div>
    </div>
  );
};
