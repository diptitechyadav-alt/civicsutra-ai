import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import {
  Shield,
  Languages,
  Bell,
  User,
  ChevronDown,
  Menu,
  X,
  MapPin,
  FileText,
  LayoutDashboard,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { currentUser, role, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'landing', label: t.nav.home, roles: ['ALL'] },
    { id: 'how-it-works', label: t.nav.howItWorks, roles: ['ALL'] },
    { id: 'public-map', label: t.nav.publicMap, roles: ['ALL'] },
    // Citizen Links
    { id: 'citizen-dashboard', label: t.nav.dashboard, roles: ['CITIZEN'] },
    { id: 'submit-report', label: t.nav.reportProblem, roles: ['CITIZEN'] },
    { id: 'my-reports', label: t.nav.myReports, roles: ['CITIZEN'] },
    // Admin Links
    { id: 'admin-dashboard', label: t.nav.adminDashboard, roles: ['ADMIN'] },
    { id: 'incoming-reports', label: t.nav.incomingReports, roles: ['ADMIN'] },
    { id: 'duplicates', label: t.nav.duplicates, roles: ['ADMIN'] },
    { id: 'clusters', label: t.nav.clusters, roles: ['ADMIN'] },
    { id: 'priority-queue', label: t.nav.priorityQueue, roles: ['ADMIN'] },
    // Field Links
    { id: 'field-dashboard', label: t.nav.fieldAssigned, roles: ['FIELD_TEAM'] },
  ];

  const visibleLinks = navLinks.filter(
    (item) => item.roles.includes('ALL') || item.roles.includes(role)
  );

  return (
    <header className="sticky top-0 z-40 bg-[#0B1F2A] text-white border-b border-navy-800 shadow-md">
      {/* Top Demo Banner / Environment notice */}
      <div className="bg-[#148F87] text-white text-[11px] font-medium py-1 px-4 text-center flex items-center justify-center gap-2">
        <span className="bg-white/20 px-1.5 py-0.2 rounded-sm text-[10px] font-bold uppercase tracking-wider">
          DEMO ENVIRONMENT
        </span>
        <span>{t.demoDataNotice}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate(role === 'ADMIN' ? 'admin-dashboard' : 'landing')}
          >
            <div className="w-10 h-10 rounded-lg bg-[#148F87] flex items-center justify-center text-white shadow-sm ring-1 ring-white/20 group-hover:bg-teal-hover transition-colors">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white">CivicSutra</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm bg-[#148F87] text-white tracking-widest">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block leading-tight">
                Ward 14 Civic Intelligence & Response
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleLinks.slice(0, 5).map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentTab === link.id
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Controls: Language, Role Switcher, Profile */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 transition-colors"
              >
                <Languages className="w-3.5 h-3.5 text-[#148F87]" />
                <span>{language === 'hi' ? 'हिन्दी' : 'English'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-200 py-1 text-slate-800 text-xs z-50">
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 ${
                      language === 'en' ? 'font-bold text-[#148F87]' : ''
                    }`}
                  >
                    <span>English</span>
                    {language === 'en' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('hi');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 ${
                      language === 'hi' ? 'font-bold text-[#148F87]' : ''
                    }`}
                  >
                    <span>हिन्दी</span>
                    {language === 'hi' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Authenticated Role Status Badge */}
            {currentUser && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  role === 'ADMIN'
                    ? 'bg-rose-950/50 border-rose-600/50 text-rose-300'
                    : role === 'FIELD_TEAM'
                    ? 'bg-amber-950/50 border-amber-600/50 text-amber-300'
                    : 'bg-teal-950/50 border-teal-600/50 text-teal-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>
                  {role === 'ADMIN' ? 'Authority / Admin' : role === 'FIELD_TEAM' ? 'Field Inspector' : 'Citizen'}
                </span>
              </div>
            )}

            {/* User Profile / Auth State & Sign Out */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-navy-800 border border-navy-700">
                  <div className="w-6 h-6 rounded-full bg-[#148F87] flex items-center justify-center text-white text-[11px] font-bold">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold text-white leading-tight">{currentUser.name}</div>
                    <div className="text-[10px] text-teal-300 capitalize">
                      {role === 'ADMIN' ? 'Municipal Admin' : role === 'FIELD_TEAM' ? 'Field Unit' : 'Citizen'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onNavigate('login');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#148F87] hover:bg-teal-hover text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}

            {/* Quick Action button for citizen */}
            {role === 'CITIZEN' && (
              <button
                type="button"
                onClick={() => onNavigate('submit-report')}
                className="px-3 py-1.5 bg-[#148F87] hover:bg-teal-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>+ {t.report.heading}</span>
              </button>
            )}

            {/* Notifications Shortcut */}
            <button
              type="button"
              onClick={() => onNavigate(role === 'CITIZEN' ? 'citizen-notifications' : 'audit-history')}
              className="p-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition-colors relative cursor-pointer"
              title={t.nav.notifications}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#148F87] rounded-full" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-navy-800"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-navy-800 bg-navy-950 px-4 pt-2 pb-6 space-y-3">
          <div className="space-y-1">
            {visibleLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  currentTab === link.id
                    ? 'bg-[#148F87] text-white'
                    : 'text-slate-300 hover:bg-navy-800'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
