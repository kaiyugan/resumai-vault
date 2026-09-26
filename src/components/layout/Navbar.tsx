import React from 'react';
import { Sparkles, Database, FileSearch, MessageSquareCode, FileText, FolderKanban, BarChart3, LogIn } from 'lucide-react';
import { useResume } from '../../context/ResumeContext';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  activeTab: 'vault' | 'jd-engine' | 'interviewer' | 'coach' | 'cover-letter' | 'exporter' | 'dashboard' | 'analytics';
  setActiveTab: (tab: 'vault' | 'jd-engine' | 'interviewer' | 'coach' | 'cover-letter' | 'exporter' | 'dashboard' | 'analytics') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { elicitationSessions } = useResume();
  const { user, isAuthenticated, setIsLoginModalOpen, setIsProfileModalOpen } = useAuth();
  const pendingGaps = elicitationSessions.filter((s) => s.status === 'PENDING').length;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('vault')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-400 p-0.5 shadow-md shadow-indigo-500/20">
              <div className="h-full w-full bg-white rounded-[10px] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-lg tracking-tight text-slate-900">
                  ResumAI <span className="gradient-text">Vault</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Beta Multi-User
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Uplifting Career Intelligence Platform</p>
            </div>
          </div>

          {/* Core Workflow Steps */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'vault'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>1. Master Vault</span>
            </button>

            <button
              onClick={() => setActiveTab('jd-engine')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'jd-engine'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileSearch className="h-3.5 w-3.5" />
              <span>2. Target Job</span>
            </button>

            <button
              onClick={() => setActiveTab('interviewer')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === 'interviewer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <MessageSquareCode className="h-3.5 w-3.5" />
              <span>3. Micro-Interviews</span>
              {pendingGaps > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white shadow">
                  {pendingGaps}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('exporter')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'exporter'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>4. Export Resume</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-300 mx-1" />

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FolderKanban className="h-3.5 w-3.5 text-amber-700" />
              <span>Applications & Career Hub</span>
            </button>

            {/* Admin Analytics & KPIs Tab - Admin Only */}
            {isAuthenticated && user?.email?.toLowerCase() === 'mirandahousinggroup@gmail.com' && (
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5 text-purple-300" />
                <span>Analytics & KPIs</span>
              </button>
            )}
          </nav>

          {/* User Account / Sign In Status */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div 
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs cursor-pointer transition-all shadow-sm group"
                title="Manage Account, Display Name & Data Controls"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shadow-sm border border-indigo-400">
                  {(user.preferred_resume_name || user.full_name).charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-slate-800 hidden sm:inline group-hover:text-indigo-600">
                  {user.preferred_resume_name || user.full_name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">⚙️</span>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Create Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
