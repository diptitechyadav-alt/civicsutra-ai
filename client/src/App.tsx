import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PublicMapPage } from './pages/PublicMapPage';
import { LoginPage } from './pages/LoginPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ReportSubmissionPage } from './pages/ReportSubmissionPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { CitizenNotificationsPage } from './pages/CitizenNotificationsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { IncomingReportsPage } from './pages/IncomingReportsPage';
import { DuplicatesPage } from './pages/DuplicatesPage';
import { ClustersPage } from './pages/ClustersPage';
import { HotspotsPage } from './pages/HotspotsPage';
import { PriorityQueuePage } from './pages/PriorityQueuePage';
import { AuditHistoryPage } from './pages/AuditHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { FieldDashboard } from './pages/FieldDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

import { ShieldAlert } from 'lucide-react';

function MainLayout() {
  const { currentUser, role } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return localStorage.getItem('civicsutra_token') ? 'citizen-dashboard' : 'login';
  });
  const [selectedReportId, setSelectedReportId] = useState<string>('CS-2026-1001');

  const handleNavigate = (tab: string, param?: string) => {
    if (param) setSelectedReportId(param);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route protection
  const publicPages = ['landing', 'how-it-works', 'public-map', 'login'];
  const adminPages = [
    'admin-dashboard',
    'incoming-reports',
    'duplicates',
    'clusters',
    'hotspots',
    'priority-queue',
    'audit-history',
    'settings',
  ];

  const isAdminView =
    (role === 'ADMIN' || role === 'FIELD_TEAM') &&
    [
      ...adminPages,
      'field-dashboard',
    ].includes(currentTab);

  const renderContent = () => {
    // 1. Unauthenticated gate
    if (!currentUser && !publicPages.includes(currentTab)) {
      return <LoginPage onNavigate={handleNavigate} />;
    }

    // 2. Citizen trying to access Admin pages
    if (currentUser && role !== 'ADMIN' && adminPages.includes(currentTab)) {
      return (
        <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-rose-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-navy-900">Administrative Authorization Required</h2>
          <p className="text-xs text-slate-600">
            Access to municipal review and operational triage is restricted to verified administrative staff.
            Your account ({currentUser.name}) is registered with citizen privileges.
          </p>
          <button
            onClick={() => handleNavigate('citizen-dashboard')}
            className="px-4 py-2 bg-[#148F87] text-white text-xs font-bold rounded-lg hover:bg-[#0E756E] transition-colors cursor-pointer"
          >
            Return to Citizen Dashboard
          </button>
        </div>
      );
    }
    switch (currentTab) {
      // Public Pages
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'how-it-works':
        return <HowItWorksPage onNavigate={handleNavigate} />;
      case 'public-map':
        return <PublicMapPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;

      // Citizen Pages
      case 'citizen-dashboard':
        return <CitizenDashboard onNavigate={handleNavigate} />;
      case 'submit-report':
        return <ReportSubmissionPage onNavigate={handleNavigate} />;
      case 'my-reports':
        return <MyReportsPage onNavigate={handleNavigate} />;
      case 'report-detail':
        return <ReportDetailPage reportId={selectedReportId} onNavigate={handleNavigate} />;
      case 'citizen-notifications':
        return <CitizenNotificationsPage onNavigate={handleNavigate} />;

      // Admin Pages
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'incoming-reports':
        return <IncomingReportsPage onNavigate={handleNavigate} />;
      case 'duplicates':
        return <DuplicatesPage onNavigate={handleNavigate} />;
      case 'clusters':
        return <ClustersPage onNavigate={handleNavigate} />;
      case 'hotspots':
        return <HotspotsPage onNavigate={handleNavigate} />;
      case 'priority-queue':
        return <PriorityQueuePage onNavigate={handleNavigate} />;
      case 'audit-history':
        return <AuditHistoryPage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage onNavigate={handleNavigate} />;

      // Field Team Pages
      case 'field-dashboard':
        return <FieldDashboard onNavigate={handleNavigate} />;

      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F7]">
      <Navbar currentTab={currentTab} onNavigate={handleNavigate} />

      {isAdminView ? (
        <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
          <Sidebar currentTab={currentTab} onNavigate={handleNavigate} />
          <main className="flex-1 min-w-0 bg-[#F4F6F7]">
            <ErrorBoundary key={currentTab}>{renderContent()}</ErrorBoundary>
          </main>
        </div>
      ) : (
        <main className="flex-1">
          <ErrorBoundary key={currentTab}>{renderContent()}</ErrorBoundary>
        </main>
      )}

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Initialization">
      <LanguageProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
