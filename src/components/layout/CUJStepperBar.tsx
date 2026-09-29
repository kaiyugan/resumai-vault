import React from 'react';
import { useResume } from '../../context/ResumeContext';
import {
  Database,
  FileSearch,
  MessageSquareCode,
  FileText,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export type TabType = 'vault' | 'jd-engine' | 'interviewer' | 'exporter' | 'coach' | 'cover-letter';

interface CUJStepperBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

interface CUJStep {
  id: TabType;
  stepNumber: number;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  isComplete: boolean;
  nextTab: TabType | null;
  nextActionLabel: string;
  isPremiumTier?: boolean;
}

export const CUJStepperBar: React.FC<CUJStepperBarProps> = ({ activeTab, setActiveTab }) => {
  const { experiences, achievements, targetJobs, selectedJob, calculateATSScore } = useResume();

  const hasVaultData = experiences.length > 0 || achievements.length > 0;
  const hasJobData = targetJobs.length > 0 && Boolean(selectedJob);
  const quantifiedCount = achievements.filter((a) => a.quantified_metric.value).length;
  const hasQuantifiedMetrics = achievements.length > 0 && (quantifiedCount / achievements.length) >= 0.5;
  const atsScore = calculateATSScore();

  const steps: CUJStep[] = [
    {
      id: 'vault',
      stepNumber: 1,
      label: 'Build Master Vault',
      shortLabel: '1. Master Vault',
      icon: Database,
      description: 'Upload or paste your raw career history to extract entity records.',
      isComplete: hasVaultData,
      nextTab: 'jd-engine',
      nextActionLabel: 'Next: Import Target Job Link / Text'
    },
    {
      id: 'jd-engine',
      stepNumber: 2,
      label: 'Import Job & Research Company',
      shortLabel: '2. Target Job & Research',
      icon: FileSearch,
      description: 'Import job URL to deconstruct JD requirements & extract company culture hooks.',
      isComplete: hasJobData,
      nextTab: 'interviewer',
      nextActionLabel: 'Next: Bridge Metric Gaps via Micro-Interview'
    },
    {
      id: 'interviewer',
      stepNumber: 3,
      label: 'Bridge Gaps (XYZ Interview)',
      shortLabel: '3. Micro-Interviews',
      icon: MessageSquareCode,
      description: 'Convert missing numbers into Google XYZ formula metric achievements.',
      isComplete: hasQuantifiedMetrics,
      nextTab: 'exporter',
      nextActionLabel: 'Next: Audit ATS Score & Download Base Resume'
    },
    {
      id: 'exporter',
      stepNumber: 4,
      label: 'ATS Audit & Resume Export',
      shortLabel: '4. Export Resume',
      icon: FileText,
      description: 'Run ATS benchmark auditor and download single-column PDF or DOCX resume.',
      isComplete: atsScore >= 80,
      nextTab: 'dashboard' as any,
      nextActionLabel: 'Next: Applications & Career Hub'
    }
  ];

  const currentStep = steps.find((s) => s.id === activeTab || (activeTab === 'cover-letter' && s.id === 'coach')) || steps[0];
  const completedStepsCount = steps.filter((s) => s.isComplete).length;
  const progressPercent = Math.round((completedStepsCount / steps.length) * 100);

  return (
    <div className="mb-6 space-y-4 no-print">
      {/* CUJ Stepper Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-indigo-100 bg-white/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-display font-extrabold text-sm shadow">
              {currentStep.stepNumber}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-display font-bold text-slate-900">
                  Critical User Journey: <span className="gradient-text">{currentStep.label}</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold">
                  {progressPercent}% Complete
                </span>
                {currentStep.isPremiumTier && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold">
                    ★ Premium Offering
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">{currentStep.description}</p>
            </div>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-2 transition-all duration-500"
                style={{ width: `${Math.max(15, progressPercent)}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-600">
              {completedStepsCount}/{steps.length} Steps
            </span>
          </div>
        </div>

        {/* Interactive 5-Step Pipeline Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3">
          {steps.map((step) => {
            const isActive = activeTab === step.id || (activeTab === 'cover-letter' && step.id === 'coach');
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                onClick={() => setActiveTab(step.id)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                    : step.isComplete
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800 hover:bg-emerald-100/70'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : step.isComplete ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {step.isComplete ? (
                    <CheckCircle2 className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  ) : (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      Step {step.stepNumber}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate leading-tight">{step.shortLabel}</span>
                  {step.isPremiumTier && (
                    <span className="text-[9px] font-mono text-amber-700 font-bold bg-amber-50 px-1 rounded border border-amber-200">
                      ★ Premium
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guided "What To Do Next" Callout Box */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-50/60 to-purple-500/10 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">
                Guided Career Journey • Step {currentStep.stepNumber} Action
              </span>
              {currentStep.stepNumber <= 4 ? (
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Base Tier: Core Resume Creation
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  Premium Tier: STAR Coaching & Cover Letter
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 font-medium mt-0.5 leading-relaxed">
              {!hasVaultData && activeTab === 'vault' && "Start by pasting your raw resume text or uploading a document into your Master Vault."}
              {hasVaultData && !hasJobData && activeTab === 'vault' && "Vault data loaded! Next, add your target job URL or job description to run vector matching."}
              {hasJobData && activeTab === 'jd-engine' && "Job description parsed! Bridge your experience gaps via conversational micro-interviews."}
              {activeTab === 'interviewer' && "Synthesize missing metrics into Google XYZ bullets, then run your ATS audit & download your base resume."}
              {activeTab === 'exporter' && "Core Resume Creation Complete! Run ATS audit & export, then proceed to Premium STAR Coaching & Cover Letter."}
              {(activeTab === 'coach' || activeTab === 'cover-letter') && "Prepare your STAR interview story cards and generate your tailored cover letter with company culture hooks!"}
            </p>
          </div>
        </div>

        {currentStep.nextTab && (
          <button
            onClick={() => {
              if (!hasVaultData && activeTab === 'vault') {
                const uploadEl = document.getElementById('resume-upload-section');
                if (uploadEl) {
                  uploadEl.scrollIntoView({ behavior: 'smooth' });
                }
              } else {
                setActiveTab(currentStep.nextTab!);
              }
            }}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 transform hover:-translate-y-0.5 ${
              !hasVaultData && activeTab === 'vault'
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20'
            }`}
          >
            <span>
              {!hasVaultData && activeTab === 'vault'
                ? '🚀 Upload Resume to Begin'
                : currentStep.nextActionLabel}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
