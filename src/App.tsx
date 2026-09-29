import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { LoginModal } from './components/auth/LoginModal';
import { ResumeProvider, useResume } from './context/ResumeContext';
import { Navbar } from './components/layout/Navbar';
import { MasterVault } from './components/vault/MasterVault';
import { JDEngine } from './components/jd-engine/JDEngine';
import { MicroInterviewer } from './components/interviewer/MicroInterviewer';
import { STARCoach } from './components/star-coach/STARCoach';
import { CoverLetterGenerator } from './components/cover-letter/CoverLetterGenerator';
import { ATSResumeExporter } from './components/exporter/ATSResumeExporter';
import { ApplicationsHub } from './components/dashboard/ApplicationsHub';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { CUJStepperBar } from './components/layout/CUJStepperBar';
import type { JDMatchItem } from './types/resume';
import { Heart, CheckCircle2 } from 'lucide-react';

import { useAuth } from './context/AuthContext';
import { CandidateProfileModal } from './components/auth/CandidateProfileModal';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'vault' | 'jd-engine' | 'interviewer' | 'coach' | 'cover-letter' | 'exporter' | 'dashboard' | 'analytics'>('vault');
  const { startElicitation, ingestUnstructuredText } = useResume();
  const [importNotification, setImportNotification] = useState<string | null>(null);

  const isAdmin = user?.email?.toLowerCase() === 'mirandahousinggroup@gmail.com';
  const effectiveTab = activeTab === 'analytics' && !isAdmin ? 'vault' : activeTab;

  // Auto-ingest URL import parameters (e.g. from LinkedIn bookmarklet or web importer)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const isImport = params.get('import') === '1' || params.has('text') || params.has('url');

    if (isImport) {
      const rawText = params.get('text') || '';
      const name = params.get('name') || '';
      const sourceUrl = params.get('url') || '';

      if (rawText.trim() || name.trim()) {
        const fullContent = `Imported Candidate Profile: ${name}\nSource URL: ${sourceUrl}\n\n${rawText}`;
        ingestUnstructuredText(fullContent).then(() => {
          setImportNotification(`🎉 Successfully imported LinkedIn profile for "${name || 'Candidate'}" into your Master Vault!`);
          setTimeout(() => setImportNotification(null), 10000);
        });
        setActiveTab('vault');
        // Clean URL query params without triggering page reload
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleStartMicroInterviewFromJD = (matchItem: JDMatchItem) => {
    startElicitation(matchItem);
    setActiveTab('interviewer');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Import Banner Notification */}
        {importNotification && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-950 text-sm font-bold flex items-center justify-between shadow-lg animate-fade-in">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{importNotification}</span>
            </div>
            <button
              onClick={() => setImportNotification(null)}
              className="text-emerald-700 hover:text-emerald-950 font-extrabold text-base px-2 py-0.5 rounded-lg hover:bg-emerald-500/20 transition"
            >
              ✕
            </button>
          </div>
        )}

        {/* Critical User Journey Stepper & Guided Action Banner */}
        {effectiveTab !== 'dashboard' && effectiveTab !== 'analytics' && (
          <CUJStepperBar activeTab={effectiveTab as any} setActiveTab={setActiveTab as any} />
        )}

        {effectiveTab === 'dashboard' && (
          <ApplicationsHub onNavigateToStep2={() => setActiveTab('jd-engine')} />
        )}

        {effectiveTab === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {effectiveTab === 'vault' && (
          <MasterVault onNavigateToJDEngine={() => setActiveTab('jd-engine')} />
        )}

        {effectiveTab === 'jd-engine' && (
          <JDEngine onStartMicroInterview={handleStartMicroInterviewFromJD} />
        )}

        {effectiveTab === 'interviewer' && (
          <MicroInterviewer onNavigateToExporter={() => setActiveTab('exporter')} />
        )}

        {effectiveTab === 'coach' && (
          <STARCoach />
        )}

        {effectiveTab === 'cover-letter' && (
          <CoverLetterGenerator />
        )}

        {effectiveTab === 'exporter' && (
          <ATSResumeExporter
            onNavigateToHub={() => setActiveTab('dashboard')}
            onNavigateToStep2={() => setActiveTab('jd-engine')}
            onNavigateToCoach={() => setActiveTab('coach')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/60 py-6 text-center text-xs text-slate-500 space-y-2 no-print">
        <div className="flex items-center justify-center space-x-1 font-medium text-slate-600">
          <span>Building high-impact resumes made simpler & stress-free</span>
          <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
        </div>
        <p className="font-mono text-[11px] text-slate-400">
          Tailored Resume Intelligence Platform MVP • Next.js App Router Architecture • Google XYZ Format Standard
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ResumeProvider>
        <MainApp />
        <LoginModal />
        <CandidateProfileModal />
      </ResumeProvider>
    </AuthProvider>
  );
}
