import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Shield,
  User,
  Lock,
  Building2,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';

interface LoginPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, register, isLoading } = useAuth();

  // Active portal tab: 'CITIZEN' or 'ADMIN'
  const [activePortal, setActivePortal] = useState<'CITIZEN' | 'ADMIN'>('CITIZEN');

  // Citizen mode: 'login' or 'register'
  const [citizenMode, setCitizenMode] = useState<'login' | 'register'>('login');

  // Citizen Login State
  const [citizenEmail, setCitizenEmail] = useState('citizen@civicsutra.org');
  const [citizenPassword, setCitizenPassword] = useState('Citizen@123');

  // Citizen Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('+91 98765 00000');
  const [regWard, setRegWard] = useState('Ward 14 (South Zone)');

  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('admin@civicsutra.org');
  const [adminPassword, setAdminPassword] = useState('Admin@123');

  // Feedback & Error states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearFeedback = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // 1. Citizen Sign In
  const handleCitizenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    try {
      await login({ email: citizenEmail, password: citizenPassword, role: 'CITIZEN' });
      setSuccessMessage('Welcome back! Loading your citizen portal...');
      setTimeout(() => onNavigate('citizen-dashboard'), 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please verify your credentials.');
    }
  };

  // 2. Citizen Registration
  const handleCitizenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!regName.trim() || regName.length < 2) {
      setErrorMessage('Please enter your full legal or display name (at least 2 characters).');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim(),
        ward: regWard,
      });
      setSuccessMessage('Account created successfully! Opening your personalized dashboard...');
      setTimeout(() => onNavigate('citizen-dashboard'), 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. An account with this email may already exist.');
    }
  };

  // 3. Admin / Authority Sign In
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    try {
      await login({ email: adminEmail, password: adminPassword });
      setSuccessMessage('Administrative credentials verified. Entering operations console...');
      setTimeout(() => onNavigate('admin-dashboard'), 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Access denied. Please check your official municipal credentials.');
    }
  };

  // Quick Persona Click Helper
  const fillPersona = (role: UserRole, emailVal: string, pwVal: string) => {
    clearFeedback();
    if (role === 'CITIZEN') {
      setActivePortal('CITIZEN');
      setCitizenMode('login');
      setCitizenEmail(emailVal);
      setCitizenPassword(pwVal);
    } else {
      setActivePortal('ADMIN');
      setAdminEmail(emailVal);
      setAdminPassword(pwVal);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-xl space-y-6">
        {/* Civic Platform Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#148F87] text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>National Smart City Citizen Redressal Infrastructure</span>
          </div>
          <h1 className="text-3xl font-black text-navy-900 tracking-tight">CivicSutra AI</h1>
          <p className="text-sm font-medium text-slate-600 max-w-md mx-auto">
            AI-Powered Local Problem Intelligence & Response Platform
          </p>
          <p className="text-xs text-slate-400 italic">
            “Many Reports. One Connected Understanding. Smarter Action.”
          </p>
        </div>

        {/* Portal Selection Tabs: Citizen vs Municipal Authority */}
        <div className="bg-slate-200/80 p-1 rounded-xl grid grid-cols-2 gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActivePortal('CITIZEN');
              clearFeedback();
            }}
            className={`py-3 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activePortal === 'CITIZEN'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            <User className="w-4 h-4 text-[#148F87]" />
            <span>Citizen Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePortal('ADMIN');
              clearFeedback();
            }}
            className={`py-3 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activePortal === 'ADMIN'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-rose-600" />
            <span>Municipal Authority / Admin</span>
          </button>
        </div>

        {/* Alerts / Error & Success Banners */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Authentication Error</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Access Granted</div>
              <div>{successMessage}</div>
            </div>
          </div>
        )}

        {/* ===================== CITIZEN PORTAL ===================== */}
        {activePortal === 'CITIZEN' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-navy-900">Citizen Services</h2>
                <p className="text-xs text-slate-500">Report defects, track grievance timeline & view status</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setCitizenMode('login');
                    clearFeedback();
                  }}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    citizenMode === 'login' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCitizenMode('register');
                    clearFeedback();
                  }}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    citizenMode === 'register' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {citizenMode === 'login' ? (
              <form onSubmit={handleCitizenLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={citizenEmail}
                      onChange={(e) => setCitizenEmail(e.target.value)}
                      placeholder="citizen@civicsutra.org"
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#148F87] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={citizenPassword}
                      onChange={(e) => setCitizenPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#148F87] focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#148F87] hover:bg-[#0E756E] text-white font-bold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? 'Verifying...' : 'Sign In as Citizen'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleCitizenRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Vikram Malhotra"
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#148F87] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="vikram@example.com"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#148F87] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 98765 00000"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#148F87] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password (min 6 chars)</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#148F87] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Residential Ward</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={regWard}
                        onChange={(e) => setRegWard(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#148F87] focus:outline-hidden"
                      >
                        <option value="Ward 14 (South Zone)">Ward 14 (South Zone)</option>
                        <option value="Ward 15 (Central Zone)">Ward 15 (Central Zone)</option>
                        <option value="Ward 16 (East Zone)">Ward 16 (East Zone)</option>
                        <option value="Ward 17 (West Zone)">Ward 17 (West Zone)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#148F87] hover:bg-[#0E756E] text-white font-bold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isLoading ? 'Creating Account...' : 'Register as Citizen'}</span>
                </button>
              </form>
            )}

            {/* Quick Demo Citizen Accounts */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick-Fill Demonstration Citizens
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillPersona('CITIZEN', 'citizen@civicsutra.org', 'Citizen@123')}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-[#148F87] hover:bg-teal-50/30 text-left transition-colors"
                >
                  <div className="font-bold text-navy-900">Aarav Sharma</div>
                  <div className="text-[11px] text-slate-500">citizen@civicsutra.org</div>
                  <div className="text-[10px] text-teal-700 font-mono mt-0.5">PW: Citizen@123</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillPersona('CITIZEN', 'priya@civicsutra.org', 'Citizen@123')}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-[#148F87] hover:bg-teal-50/30 text-left transition-colors"
                >
                  <div className="font-bold text-navy-900">Priya Patel (2nd Citizen)</div>
                  <div className="text-[11px] text-slate-500">priya@civicsutra.org</div>
                  <div className="text-[10px] text-teal-700 font-mono mt-0.5">PW: Citizen@123</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== ADMIN / AUTHORITY PORTAL ===================== */}
        {activePortal === 'ADMIN' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-600" />
                <h2 className="text-base font-bold text-navy-900">Municipal Authority Console</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Authorized access for grievance officers, municipal engineers & field supervisors.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Server-side role verification enforced. Ordinary citizens cannot access administrative review,
                clustering, or audit functions.
              </span>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Municipal Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@civicsutra.org"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                <span>{isLoading ? 'Authenticating...' : 'Sign In to Operations Console'}</span>
              </button>
            </form>

            {/* Quick Demo Admin Accounts */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick-Fill Demonstration Authority Credentials
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillPersona('ADMIN', 'admin@civicsutra.org', 'Admin@123')}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-rose-400 hover:bg-rose-50/30 text-left transition-colors"
                >
                  <div className="font-bold text-navy-900">Dr. Rajesh Kumar (Admin)</div>
                  <div className="text-[11px] text-slate-500">admin@civicsutra.org</div>
                  <div className="text-[10px] text-rose-700 font-mono mt-0.5">PW: Admin@123</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillPersona('FIELD_TEAM', 'field@civicsutra.org', 'Field@123')}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 text-left transition-colors"
                >
                  <div className="font-bold text-navy-900">Pooja Verma (Field)</div>
                  <div className="text-[11px] text-slate-500">field@civicsutra.org</div>
                  <div className="text-[10px] text-amber-700 font-mono mt-0.5">PW: Field@123</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Public Map Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => onNavigate('public-map')}
            className="text-xs text-slate-500 hover:text-[#148F87] font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Explore Ward 14 Public Problem Map (No Sign In Required)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
