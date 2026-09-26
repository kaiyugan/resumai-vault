import React from 'react';
import type { TargetJob } from '../../types/resume';
import { X, Building2, Target, Award, Sparkles, CheckCircle2, FileText, Download } from 'lucide-react';
import { exportPdfAPI } from '../../services/apiClient';

interface PreInterviewReviewModalProps {
  job: TargetJob | null;
  onClose: () => void;
}

export const PreInterviewReviewModal: React.FC<PreInterviewReviewModalProps> = ({ job, onClose }) => {
  if (!job) return null;

  const intel = job.company_intelligence;
  const payload = job.tailored_resume_payload;

  const handleDownloadPDF = async () => {
    if (!payload) return;
    try {
      const blob = await exportPdfAPI(payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.title.replace(/\s+/g, '_')}_${job.company.replace(/\s+/g, '_')}_Tailored_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      alert('Could not generate PDF export for this application.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">{job.title}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {job.status || 'FINALIZED'}
                </span>
              </div>
              <p className="text-sm text-slate-400 font-medium">{job.company} • {job.location || 'Remote'}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <Award className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-xs text-slate-400 font-medium">ATS Match Score</p>
                <p className="text-lg font-bold text-slate-100">{job.ats_score || 85}% Match</p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Selected ATS Theme</p>
                <p className="text-lg font-bold text-slate-100 capitalize">{job.selected_theme || 'Classic'}</p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Requirements Solved</p>
                <p className="text-lg font-bold text-slate-100">{job.parsed_responsibilities?.length || 4} Core Items</p>
              </div>
            </div>
          </div>

          {/* Company Intelligence & Hooks */}
          {intel && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2 uppercase tracking-wider">
                <Target className="w-4 h-4" /> Company Mission & Interview Hooks
              </h3>
              
              {intel.mission_statement && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Strategic Mission</p>
                  <p className="text-sm text-slate-300 mt-1 italic">"{intel.mission_statement}"</p>
                </div>
              )}

              {intel.first_impression_hooks && intel.first_impression_hooks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">First-Impression Interview Hooks</p>
                  <ul className="space-y-2">
                    {intel.first_impression_hooks.map((hook, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        <span>{hook}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tailored Experience Snapshot */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Tailored Resume Bullet Points Snapshot
            </h3>
            
            {payload?.experiences ? (
              <div className="space-y-4">
                {payload.experiences.map((exp: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-slate-200 text-sm">{exp.role_title} <span className="text-slate-400 font-normal">at {exp.company}</span></h4>
                      <span className="text-xs text-slate-400">{exp.start_date} - {exp.end_date}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {exp.achievements?.map((ach: any, aIdx: number) => (
                        <li key={aIdx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                          <span className="text-blue-400 font-bold">•</span>
                          <span>{ach.raw_bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No snapshot generated yet. Complete Step 4 to lock this application version.</p>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Close
          </button>

          {payload && (
            <button
              onClick={handleDownloadPDF}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Download className="w-4 h-4" /> Export Saved PDF
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
