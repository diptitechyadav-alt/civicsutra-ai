import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Inbox,
  CopyCheck,
  Network,
  MapPin,
  ListOrdered,
  BarChart3,
  History,
  Settings,
  HardHat,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onNavigate }) => {
  const { t } = useLanguage();
  const { role } = useAuth();

  const adminNavItems = [
    { id: 'admin-dashboard', label: t.admin.dashboardTitle, icon: LayoutDashboard },
    { id: 'incoming-reports', label: t.nav.incomingReports, icon: Inbox },
    { id: 'duplicates', label: t.nav.duplicates, icon: CopyCheck },
    { id: 'clusters', label: t.nav.clusters, icon: Network },
    { id: 'hotspots', label: t.nav.hotspots, icon: MapPin },
    { id: 'priority-queue', label: t.nav.priorityQueue, icon: ListOrdered },
    { id: 'analytics', label: t.nav.analytics, icon: BarChart3 },
    { id: 'audit-history', label: t.nav.auditHistory, icon: History },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  const fieldNavItems = [
    { id: 'field-dashboard', label: 'Assigned Inspection Orders', icon: HardHat },
    { id: 'hotspots', label: 'Ward Hazard Map', icon: MapPin },
    { id: 'audit-history', label: 'Field Verification Logs', icon: History },
  ];

  const navItems = role === 'ADMIN' ? adminNavItems : fieldNavItems;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-5">
      <div>
        <div className="px-5 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#148F87]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {role === 'ADMIN' ? 'Operations Console' : 'Field Inspector Console'}
            </span>
          </div>
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#D5F3EE] text-[#0E756E] font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#148F87]' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-5 text-[11px] text-slate-400 border-t border-slate-100 pt-4">
        <div>CivicSutra AI v1.0</div>
        <div>Municipal Intelligence Layer</div>
      </div>
    </aside>
  );
};
