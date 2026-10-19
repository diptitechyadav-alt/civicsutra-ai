import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { NotificationItem } from '../types';
import { api } from '../services/api';
import { Bell, CheckCircle2, Clock, Network, AlertCircle, ArrowRight } from 'lucide-react';

interface CitizenNotificationsPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const CitizenNotificationsPage: React.FC<CitizenNotificationsPageProps> = ({
  onNavigate,
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);

  const fetchNotifications = () => {
    setLoading(true);
    api
      .getNotifications(currentUser?.id || 'usr-citizen-01')
      .then((data) => setNotifications(data))
      .catch((err) => console.error('Failed to load notifications', err))
      .finally(() => setLoading(false));
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            {t.nav.notifications}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official progress alerts and cluster notifications regarding your submitted reports.
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
        >
          {t.common.refresh}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">{t.common.loading}</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-navy-900">No Notifications</h3>
            <p className="text-xs text-slate-500">You are all caught up on status updates.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 transition-colors flex items-start justify-between gap-4 ${
                  n.read ? 'bg-white' : 'bg-[#D5F3EE]/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      n.type === 'CLUSTER_ASSOCIATION'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-teal-100 text-[#148F87]'
                    }`}
                  >
                    {n.type === 'CLUSTER_ASSOCIATION' ? (
                      <Network className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-navy-900">{n.title}</h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#148F87]" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {new Date(n.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 text-right">
                  {n.reportId && (
                    <button
                      onClick={() => onNavigate('report-detail', n.reportId)}
                      className="px-3 py-1 bg-[#148F87] hover:bg-teal-hover text-white text-xs font-bold rounded flex items-center gap-1"
                    >
                      <span>Track Report</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-[11px] text-slate-500 hover:text-navy-900 hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
