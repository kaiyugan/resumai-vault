import React, { useState, useEffect } from 'react';
import { useResume } from '../../context/ResumeContext';
import type { TargetJob } from '../../types/resume';
import { fetchApplicationsHistoryAPI, exportPdfAPI } from '../../services/apiClient';
import { PreInterviewReviewModal } from './PreInterviewReviewModal';
import { 
  Briefcase, 
  Building2, 
  Clock, 
  Play, 
  Eye, 
  Download, 
  Plus, 
  ArrowRight,
  Filter,
  FileCheck
} from 'lucide-react';

export const ApplicationsDashboard: React.FC = () => {
  const { currentJob, setCurrentJob, setStep } = useResume();
  const [applications, setApplications] = useState<TargetJob[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedReviewJob, setSelectedReviewJob] = useState<TargetJob | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await fetchApplicationsHistoryAPI(filter === 'ALL' ? undefined : filter);
      setApplications(data);
    } catch (e) {
      console.warn('Could not load applications history from backend.', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [filter]);

  const handleResumeJourney = (job: TargetJob) => {
    setCurrentJob(job);
    setStep(job.current_step || 2);
  };

  const handleStartNewApplication = () => {
    setCurrentJob(null);
    setStep(2);
  };

  const handleQuickPDFDownload = async (job: TargetJob) => {
    if (!job.tailored_resume_payload) {
      alert('No finalized resume snapshot found for this application. Please resume journey to Step 4.');
      return;
    }
    try {
      const blob = await exportPdfAPI(job.tailored_resume_payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.title.replace(/\s+/g, '_')}_Tailored_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      alert('Export failed for saved application PDF.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" /> Multi-Job Application & Version Vault
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Your Tailored Job Applications</h1>
          <p className="text-sm text-slate-400 mt-1">
            Pick up where you left off, review tailored pre-interview snapshots, or start a new job application.
          </p>
        </div>

        <button
          onClick={handleStartNewApplication}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Start New Application
        </button>
      </div>

      {/* Active Session Continuation Banner */}
      {currentJob && (
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 animate-pulse">
                Active Session In Progress
              </span>
              <span className="text-xs text-slate-400 font-medium">Step {currentJob.current_step || 2} of 5</span>
            </div>
            <h2 className="text-xl font-bold text-white">{currentJob.title}</h2>
            <p className="text-xs text-slate-300 font-medium flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-blue-400" /> {currentJob.company} • {currentJob.location || 'Remote'}
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400">ATS Match Score</p>
              <p className="text-lg font-bold text-emerald-400">{currentJob.ats_score || 85}% Match</p>
            </div>
            
            <button
              onClick={() => handleResumeJourney(currentJob)}
              className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" /> Resume Journey <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['ALL', 'DRAFT', 'FINALIZED', 'APPLIED', 'INTERVIEWING'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === t
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {t === 'ALL' ? 'All Applications' : t}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-medium shrink-0 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Showing {applications.length} Applications
        </span>
      </div>

      {/* Applications Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 animate-spin text-blue-400" /> Loading your tailored applications vault...
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No Job Applications Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Paste a target job posting or import a job link to start building your first tailored resume version.
          </p>
          <button
            onClick={handleStartNewApplication}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Start Application Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {applications.map((app) => {
            const isCurrent = currentJob?.id === app.id;
            return (
              <div
                key={app.id}
                className={`bg-slate-900/60 border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all hover:border-slate-700 hover:shadow-xl ${
                  isCurrent ? 'border-blue-500/50 bg-blue-950/20' : 'border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        app.status === 'FINALIZED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : app.status === 'APPLIED'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {app.status || 'DRAFT'}
                      </span>
                      <h3 className="font-bold text-slate-100 text-base mt-2 line-clamp-1">{app.title}</h3>
                      <p className="text-xs text-slate-400 font-medium">{app.company} • {app.location || 'Remote'}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 block">
                        {app.ats_score || 85}%
                      </span>
                    </div>
                  </div>

                  {/* Skills preview */}
                  {app.parsed_hard_skills && app.parsed_hard_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {app.parsed_hard_skills.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                          {s}
                        </span>
                      ))}
                      {app.parsed_hard_skills.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                          +{app.parsed_hard_skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedReviewJob(app)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Pre-Interview Review Snapshot"
                  >
                    <Eye className="w-4 h-4 text-blue-400" /> Pre-Interview
                  </button>

                  <div className="flex items-center gap-2">
                    {app.tailored_resume_payload && (
                      <button
                        onClick={() => handleQuickPDFDownload(app)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        title="Download PDF Snapshot"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleResumeJourney(app)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" /> Pick Up
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Pre-Interview Review Modal */}
      {selectedReviewJob && (
        <PreInterviewReviewModal
          job={selectedReviewJob}
          onClose={() => setSelectedReviewJob(null)}
        />
      )}

    </div>
  );
};
