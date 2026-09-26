import { useState } from 'react';
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
import { Heart } from 'lucide-react';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'vault' | 'jd-engine' | 'interviewer' | 'coach' | 'cover-letter' | 'exporter' | 'dashboard' | 'analytics'>('vault');
  const { startElicitation } = useResume();

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
        {/* Critical User Journey Stepper & Guided Action Banner */}
        {activeTab !== 'dashboard' && activeTab !== 'analytics' && (
          <CUJStepperBar activeTab={activeTab as any} setActiveTab={setActiveTab as any} />
        )}

        {activeTab === 'dashboard' && (
          <ApplicationsHub onNavigateToStep2={() => setActiveTab('jd-engine')} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {activeTab === 'vault' && (
          <MasterVault onNavigateToJDEngine={() => setActiveTab('jd-engine')} />
        )}

        {activeTab === 'jd-engine' && (
          <JDEngine onStartMicroInterview={handleStartMicroInterviewFromJD} />
        )}

        {activeTab === 'interviewer' && (
          <MicroInterviewer onNavigateToExporter={() => setActiveTab('exporter')} />
        )}

        {activeTab === 'coach' && (
          <STARCoach />
        )}

        {activeTab === 'cover-letter' && (
          <CoverLetterGenerator />
        )}

        {activeTab === 'exporter' && (
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
      </ResumeProvider>
    </AuthProvider>
  );
}
