import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AuditLogEntry } from '../types';
import { api } from '../services/api';
import { History, Shield, Lock, Search, Calendar, User } from 'lucide-react';

interface AuditHistoryPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const AuditHistoryPage: React.FC<AuditHistoryPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .getAuditLogs()
      .then((data) => setLogs(data))
      .catch((err) => console.error('Failed to load audit logs', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.targetId.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-1">
            <Lock className="w-3.5 h-3.5 text-[#148F87]" />
            <span>Tamper-Evident Government Ledger</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            {t.admin.auditLog}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable administrative action history preserving complete municipal accountability.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-white p-2.5 rounded-lg border border-slate-200">
          Total Recorded Operations: <strong>{logs.length}</strong>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, ref ID, or keyword..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#148F87] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Ref</th>
                <th className="py-3 px-4">Details & Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    {t.common.loading}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    No matching audit records.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0E756E]">
                      <span className="bg-[#D5F3EE] px-2 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy-900">{log.actorName}</div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {log.targetId}
                    </td>
                    <td className="py-3.5 px-4 max-w-md text-slate-600">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
