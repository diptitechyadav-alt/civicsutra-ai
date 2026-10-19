import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Shield, Lock, EyeOff, FileText, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0B1F2A] text-slate-400 text-xs border-t border-navy-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#148F87] flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-white font-bold text-sm tracking-tight">CivicSutra AI</span>
            </div>
            <p className="text-slate-300 font-medium">{t.tagline}</p>
            <p className="text-slate-400 text-[11px] leading-relaxed max-w-lg">
              AI-Powered Local Problem Intelligence & Response Platform. Transforming scattered
              community problem submissions into connected, evidence-supported civic intelligence for
              transparent municipal triage and verified public action.
            </p>
          </div>

          {/* Col 2: Architecture & Transparency */}
          <div className="space-y-2">
            <span className="text-white font-semibold uppercase tracking-wider text-[11px] block">
              Governance & AI Standards
            </span>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5 text-slate-300">
                <Lock className="w-3 h-3 text-[#148F87]" />
                <span>Auditable Decision Trail</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <EyeOff className="w-3 h-3 text-[#148F87]" />
                <span>Citizen Privacy Protection</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <Shield className="w-3 h-3 text-[#148F87]" />
                <span>Human-In-The-Loop Verification</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Institutional Notice */}
          <div className="space-y-2">
            <span className="text-white font-semibold uppercase tracking-wider text-[11px] block">
              Demonstration Notice
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This deployment is a structured demonstration environment. All metrics, ward coordinates,
              and municipal logs represent simulated demonstration records to evaluate intelligence workflows.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            © 2026 CivicSutra AI — Designed with government-grade reliability & open civic standards.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-white cursor-pointer">Privacy Safeguards</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Accessibility Standards</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Responsible AI Charter</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
