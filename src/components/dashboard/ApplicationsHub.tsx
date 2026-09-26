import React, { useState, useEffect } from 'react';
import { useResume } from '../../context/ResumeContext';
import type { TargetJob } from '../../types/resume';
import { fetchApplicationsHistoryAPI, exportPdfAPI, updateJobStateAPI } from '../../services/apiClient';
import { STARCoach } from '../star-coach/STARCoach';
import { CoverLetterGenerator } from '../cover-letter/CoverLetterGenerator';
import { 
  Building2, 
  Plus, 
  FileText, 
  Award, 
  Download, 
  RefreshCw, 
  FolderKanban
} from 'lucide-react';

interface ApplicationsHubProps {
  onNavigateToStep2: () => void;
}

export const ApplicationsHub: React.FC<ApplicationsHubProps> = ({ onNavigateToStep2 }) => {
  const { currentJob, setCurrentJob, setStep } = useResume();
  const [applications, setApplications] = useState<TargetJob[]>([]);
  const [hubTab, setHubTab] = useState<'prep' | 'cover-letter' | 'resume' | 'tracker'>('prep');
  const [downloading, setDownloading] = useState<boolean>(false);

  const loadApplications = async () => {
    try {
      const data = await fetchApplicationsHistoryAPI();
      if (data && data.length > 0) {
        setApplications(data);
        if (!currentJob) {
          setCurrentJob(data[0]);
        }
      }
    } catch (err) {
      console.warn('Applications history fallback:', err);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const selectedApp = currentJob || applications[0];

  const handleSelectJob = (job: TargetJob) => {
    setCurrentJob(job);
  };

  const handleStatusUpdate = async (status: 'DRAFT' | 'FINALIZED' | 'APPLIED' | 'INTERVIEWING' | 'OFFER') => {
    if (!selectedApp) return;
    try {
      const updated = await updateJobStateAPI(selectedApp.id, { status });
      if (updated) {
        setCurrentJob(updated);
        setApplications((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      }
    } catch (e) {
      console.warn('Status update warning:', e);
    }
  };

  const handleDownloadSavedPdf = async () => {
    if (!selectedApp) return;
    setDownloading(true);
    try {
      const payload = selectedApp.tailored_resume_payload || {
        profile: { name: 'Candidate' },
        experiences: [],
        achievements: [],
        skills: []
      };
      const blob = await exportPdfAPI(payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tailored_Resume_${selectedApp.company.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('PDF download warning:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Main Banner & Job Selector */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-purple-950/60 text-white shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
              <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
              <span>Job-Centric Applications & Post-Export Suite</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Applications & Career Hub</h1>
            <p className="text-sm text-slate-300 mt-1">
              Select an applied job below to launch tailored interview prep, custom cover letters, or re-download saved resumes.
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentJob(null);
              setStep(2);
              onNavigateToStep2();
            }}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-sm font-extrabold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tailor Resume for Another Job</span>
          </button>
        </div>

        {/* Applied Job Application Switcher Bar */}
        {applications.length > 0 && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Active Job Applications ({applications.length}) — Click to Switch Focus
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {applications.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => handleSelectJob(app)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-400 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-400'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="font-bold text-sm text-white truncate">{app.company}</span>
                      </div>
                      <p className="text-xs text-slate-300 truncate">{app.title}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                        app.status === 'FINALIZED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : app.status === 'INTERVIEWING'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      }`}>
                        {app.status || 'FINALIZED'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Job Action Header & Sub-Tab Bar */}
      {selectedApp && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">{selectedApp.company} — {selectedApp.title}</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {selectedApp.ats_score || 88}% ATS Score
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Location: {selectedApp.location || 'Remote / Hybrid'}</p>
            </div>

            {/* Application Status Fast Action */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <select
                value={selectedApp.status || 'FINALIZED'}
                onChange={(e) => handleStatusUpdate(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="DRAFT">Drafting</option>
                <option value="FINALIZED">Finalized Resume</option>
                <option value="APPLIED">Applied</option>
                <option value="INTERVIEWING">Interviewing</option>
                <option value="OFFER">Job Offer Received</option>
              </select>
            </div>
          </div>

          {/* Sub-Tab Navigation Bar */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setHubTab('prep')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                hubTab === 'prep'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Interview Prep & AI Simulator</span>
            </button>

            <button
              onClick={() => setHubTab('cover-letter')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                hubTab === 'cover-letter'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Tailored Cover Letter</span>
            </button>

            <button
              onClick={() => setHubTab('resume')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                hubTab === 'resume'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Saved Resume Snapshot</span>
            </button>
          </div>

          {/* Active Sub-Tab View */}
          <div className="pt-2">
            {hubTab === 'prep' && <STARCoach />}
            {hubTab === 'cover-letter' && <CoverLetterGenerator />}
            {hubTab === 'resume' && (
              <div className="glass-panel p-8 rounded-2xl border border-slate-800 bg-slate-950/60 text-center space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                  <Download className="w-6 h-6" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-white">Saved Tailored Resume Snapshot</h3>
                  <p className="text-xs text-slate-400">
                    Finalized resume version for <strong>{selectedApp.company}</strong> ({selectedApp.title}).
                  </p>
                </div>

                <button
                  onClick={handleDownloadSavedPdf}
                  disabled={downloading}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating PDF Download...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Saved PDF Resume</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
