import React, { useState, useEffect } from 'react';
import { useResume } from '../../context/ResumeContext';
import {
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Check,
  Loader2,
  ArrowRight,
  Layout,
  Palette
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { auditATSAPI, exportDocxAPI, exportPdfAPI } from '../../services/apiClient';
import type { ResumeStyleId } from '../../types/resume';
import { sanitizeText, spellCheckAndPolishBullet, isHeaderDuplicate } from '../../utils/textSanitizer';

interface ATSResumeExporterProps {
  onNavigateToHub?: () => void;
  onNavigateToStep2?: () => void;
  onNavigateToCoach?: () => void;
}

export const ATSResumeExporter: React.FC<ATSResumeExporterProps> = ({
  onNavigateToHub,
  onNavigateToStep2,
  onNavigateToCoach
}) => {
  const {
    profile,
    experiences,
    achievements,
    educations,
    skills,
    selectedJob,
    calculateATSScore,
    selectedStyle,
    setSelectedStyle,
    runQualityPolishOnAllBullets,
    finalizeAndSaveApplication,
    setCurrentJob,
    setStep
  } = useResume();

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [atsAuditData, setAtsAuditData] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [showPostExportBanner, setShowPostExportBanner] = useState<boolean>(false);

  // Dynamic summary fallback
  const dynamicSummary = sanitizeText(
    profile.summary ||
      (experiences.length > 0
        ? `${profile.title || 'Experienced Professional'} with background leading key initiatives across ${experiences
            .map((e) => e.company)
            .filter(Boolean)
            .slice(0, 3)
            .join(', ')}. Proven track record of operational excellence and team leadership.`
        : 'Career professional with a track record of driving strategic goals and delivering high-impact business outcomes.')
  );

  const dynamicSkillsList = (skills.length > 0 ? skills.map((s) => s.name) : ['Strategic Planning', 'Leadership', 'Process Optimization', 'Stakeholder Management']).map(sanitizeText);

  // Construct standard JSON payload for backend ATS audit & export engines
  const resumePayload = {
    name: sanitizeText(profile.name),
    email: sanitizeText(profile.email),
    phone: sanitizeText(profile.phone),
    location: sanitizeText(profile.location),
    linkedin: sanitizeText(profile.linkedin),
    summary: dynamicSummary,
    style: selectedStyle,
    experiences: experiences.map((exp) => ({
      title: sanitizeText(exp.role_title),
      company: sanitizeText(exp.company),
      location: sanitizeText(exp.location),
      dates: `${exp.start_date} – ${exp.is_current ? 'Present' : exp.end_date}`,
      bullets: achievements
        .filter((a) => a.experience_id === exp.id && !isHeaderDuplicate(a.raw_bullet, exp.role_title, exp.company))
        .map((a) => spellCheckAndPolishBullet(a.raw_bullet))
    })),
    skills: dynamicSkillsList,
    education: educations.map((edu) => ({
      degree: `${sanitizeText(edu.degree)} in ${sanitizeText(edu.field_of_study)}`,
      institution: sanitizeText(edu.institution),
      year: `${edu.start_date.split('-')[0]} – ${edu.end_date.split('-')[0]}`
    }))
  };

  useEffect(() => {
    async function fetchAudit() {
      setLoadingAudit(true);
      try {
        const res = await auditATSAPI(resumePayload, selectedJob?.raw_description || '');
        if (res?.data) {
          setAtsAuditData(res.data);
        }
      } catch (err) {
        console.warn('Backend API offline, using local ATS calculation.');
      } finally {
        setLoadingAudit(false);
      }
    }
    fetchAudit();
  }, [selectedJob, selectedStyle]);

  const atsScore = atsAuditData?.ats_score ?? calculateATSScore();

  const handleDownload = async (format: 'pdf' | 'docx') => {
    setIsExporting(true);
    setDownloadSuccess(null);

    try {
      if (format === 'docx') {
        const blob = await exportDocxAPI(resumePayload);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${profile.name.replace(/\s+/g, '_')}_${selectedStyle.toUpperCase()}_ATS.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setDownloadSuccess('DOCX (Native Word)');
      } else {
        try {
          const blob = await exportPdfAPI(resumePayload);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${profile.name.replace(/\s+/g, '_')}_${selectedStyle.toUpperCase()}_ATS.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          setDownloadSuccess('ATS PDF Document');
        } catch {
          window.print();
          setDownloadSuccess('PDF Print View');
        }
      }

      await finalizeAndSaveApplication(resumePayload);
      setShowPostExportBanner(true);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {
        // fallback
      }
    } catch (err) {
      console.error('Export error:', err);
      if (format === 'pdf') {
        window.print();
      } else {
        alert('Could not connect to backend exporter service. Ensure FastAPI server is running on port 8090.');
      }
    } finally {
      setIsExporting(false);
      setTimeout(() => setDownloadSuccess(null), 4000);
    }
  };

  // 6 Style Definitions for UI Cards
  const styleOptions: { id: ResumeStyleId; name: string; tag: string; description: string; badgeBg: string; badgeText: string }[] = [
    {
      id: 'classic',
      name: 'Classic Single-Column',
      tag: '100% ATS Benchmark',
      description: 'Clean slate typography, thin section rules, traditional serif/sans corporate standard.',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-800'
    },
    {
      id: 'modern_executive',
      name: 'Modern Executive',
      tag: 'Leadership & Board',
      description: 'Deep navy banner header, bold blue section titles, commanding executive layout.',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800'
    },
    {
      id: 'warm_modern',
      name: 'Warm Modern',
      tag: 'Uplifting & Inviting',
      description: 'Soft teal section headings, warm amber bullet accents, encouraging presentation.',
      badgeBg: 'bg-teal-100',
      badgeText: 'text-teal-900'
    },
    {
      id: 'minimalist',
      name: 'Minimalist Tech',
      tag: 'High Metric Density',
      description: 'Sky blue left accent bars, mono contact header, maximized content spacing.',
      badgeBg: 'bg-sky-100',
      badgeText: 'text-sky-900'
    },
    {
      id: 'leadership',
      name: 'Leadership Hybrid',
      tag: 'Corporate & Strategy',
      description: 'Deep indigo accents, two-tone header typography, structured role alignment.',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-900'
    },
    {
      id: 'creative',
      name: 'Creative Professional',
      tag: 'Contemporary & Open',
      description: 'Emerald section rules, pill-style skill badges, modern open paragraph spacing.',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-900'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Post-Export Success Gateway Banner */}
      {showPostExportBanner && (
        <div className="glass-panel p-6 rounded-2xl border-2 border-emerald-500 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl space-y-4 animate-bounce-short">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold">Resume Tailored & Saved for {selectedJob?.company || 'Target Job'}!</h3>
                <p className="text-xs text-slate-300">
                  Your customized resume version has been locked into your saved applications vault.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              {atsScore}% ATS Score Locked
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-800">
            {onNavigateToHub && (
              <button
                onClick={onNavigateToHub}
                className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Go to Interview Prep & Cover Letter for {selectedJob?.company || 'this role'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                setCurrentJob(null);
                setStep(2);
                if (onNavigateToStep2) onNavigateToStep2();
              }}
              className="w-full sm:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <span>+ Tailor Resume for Another Job</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-indigo-50/40 no-print shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Single-Column ATS Compiler & Exporter
              </span>
              <span className="text-xs text-slate-600 font-mono font-medium">• Tailored for {selectedJob?.company || 'Target Role'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              ATS-Compliant Document <span className="text-emerald-700">Compilation</span>
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Choose from 6 professionally designed ATS layouts. Synthesizes verified Master Vault data into clean, Workday & Taleo compatible exports.
            </p>
          </div>

          {/* Download & Print Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => handleDownload('docx')}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-sm transition disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 text-sky-600 animate-spin" />
              ) : (
                <Download className="h-4 w-4 text-sky-600" />
              )}
              <span>Export DOCX (Native Word)</span>
            </button>

            <button
              onClick={() => handleDownload('pdf')}
              disabled={isExporting}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              <span>Export ATS PDF</span>
            </button>

            {onNavigateToCoach && (
              <button
                onClick={onNavigateToCoach}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition transform hover:-translate-y-0.5"
              >
                <span>Step 5: STAR Coach & Cover Letter (★ Premium)</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ATS Score & Quality Audit Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200/80">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Estimated ATS Match Score</p>
              {loadingAudit ? (
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <span>Auditing...</span>
                </div>
              ) : (
                <p className="text-2xl font-display font-extrabold text-emerald-600 mt-0.5">{atsScore}% Match</p>
              )}
            </div>
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Quality & Typo Status</p>
              <p className="text-sm font-display font-bold text-emerald-700 mt-1 flex items-center space-x-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>100% Sanitized</span>
              </p>
            </div>
            <button
              onClick={() => runQualityPolishOnAllBullets()}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow transition shrink-0"
            >
              Run AI Polish
            </button>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Selected Layout Format</p>
              <p className="text-sm font-display font-bold text-slate-900 mt-1 capitalize">
                {selectedStyle.replace('_', ' ')}
              </p>
            </div>
            <Layout className="h-6 w-6 text-sky-600" />
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Quantified Metric Density</p>
              <p className="text-sm font-display font-bold text-indigo-700 mt-1">
                {achievements.filter((a) => a.quantified_metric?.value).length} of {achievements.length} Google XYZ
              </p>
            </div>
            <Sparkles className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        {downloadSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center space-x-2">
            <Check className="h-4 w-4" />
            <span>Successfully generated clean ATS-optimized {downloadSuccess} document in <strong>{selectedStyle.replace('_', ' ').toUpperCase()}</strong> style!</span>
          </div>
        )}
      </div>

      {/* Interactive 6-Style Gallery Chooser */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 no-print">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-slate-900">Choose Your Resume Style & Format</h3>
              <p className="text-xs text-slate-600">Select from 6 ATS-optimized visual themes tailored to your target industry.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            6 Styles Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {styleOptions.map((opt) => {
            const isSelected = selectedStyle === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedStyle(opt.id)}
                className={`p-4 rounded-xl border text-left transition relative flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${opt.badgeBg} ${opt.badgeText} border border-slate-200`}>
                      {opt.tag}
                    </span>
                    {isSelected && (
                      <span className="flex items-center space-x-1 text-[11px] font-bold text-indigo-700">
                        <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-display font-bold text-slate-900">{opt.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Printable Preview Canvas */}
      <div className="max-w-4xl mx-auto">
        <div
          className={`bg-white text-slate-900 rounded-xl shadow-xl p-10 font-sans border print:shadow-none print:border-none transition ${
            selectedStyle === 'modern_executive'
              ? 'border-blue-300'
              : selectedStyle === 'warm_modern'
              ? 'border-teal-300'
              : selectedStyle === 'minimalist'
              ? 'border-sky-300'
              : selectedStyle === 'leadership'
              ? 'border-indigo-300'
              : selectedStyle === 'creative'
              ? 'border-emerald-300'
              : 'border-slate-300'
          }`}
        >
          {/* Header Variant 1: Modern Executive Header Banner */}
          {selectedStyle === 'modern_executive' ? (
            <div className="bg-slate-900 text-white p-6 rounded-xl mb-6 text-center space-y-1">
              <h1 className="text-2xl font-bold uppercase tracking-wider text-white">{sanitizeText(profile.name)}</h1>
              <p className="text-xs text-blue-300 font-semibold">{sanitizeText(profile.title)}</p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-300 font-mono pt-1">
                <span>{sanitizeText(profile.location)}</span>
                <span>•</span>
                <span>{sanitizeText(profile.phone)}</span>
                <span>•</span>
                <span>{sanitizeText(profile.email)}</span>
                <span>•</span>
                <span>{sanitizeText(profile.linkedin)}</span>
              </div>
            </div>
          ) : (
            /* Header Variant Standard & Other Styles */
            <div className="border-b border-slate-300 pb-4 mb-6 text-center space-y-1">
              <h1
                className={`text-2xl font-bold uppercase tracking-wider ${
                  selectedStyle === 'warm_modern'
                    ? 'text-teal-800'
                    : selectedStyle === 'creative'
                    ? 'text-emerald-800'
                    : selectedStyle === 'leadership'
                    ? 'text-indigo-900'
                    : 'text-slate-900'
                }`}
              >
                {sanitizeText(profile.name)}
              </h1>
              <p className="text-xs text-slate-700 font-semibold">{sanitizeText(profile.title)}</p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-600 font-mono pt-1">
                <span>{sanitizeText(profile.location)}</span>
                <span>•</span>
                <span>{sanitizeText(profile.phone)}</span>
                <span>•</span>
                <span>{sanitizeText(profile.email)}</span>
                <span>•</span>
                <span>{sanitizeText(profile.linkedin)}</span>
              </div>
            </div>
          )}

          {/* Executive Summary */}
          <div className="mb-6 space-y-1.5">
            <h2
              className={`text-xs font-bold uppercase tracking-wider pb-1 ${
                selectedStyle === 'modern_executive'
                  ? 'text-blue-700 border-b-2 border-blue-600'
                  : selectedStyle === 'warm_modern'
                  ? 'text-teal-700 border-b border-teal-200'
                  : selectedStyle === 'minimalist'
                  ? 'text-slate-900 border-l-4 border-sky-600 pl-2 font-mono'
                  : selectedStyle === 'leadership'
                  ? 'text-indigo-800 border-b-2 border-indigo-200'
                  : selectedStyle === 'creative'
                  ? 'text-emerald-700 border-b border-emerald-200'
                  : 'text-slate-900 border-b border-slate-300'
              }`}
            >
              Professional Summary
            </h2>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {dynamicSummary}
            </p>
          </div>

          {/* Work Experience */}
          <div className="mb-6 space-y-4">
            <h2
              className={`text-xs font-bold uppercase tracking-wider pb-1 ${
                selectedStyle === 'modern_executive'
                  ? 'text-blue-700 border-b-2 border-blue-600'
                  : selectedStyle === 'warm_modern'
                  ? 'text-teal-700 border-b border-teal-200'
                  : selectedStyle === 'minimalist'
                  ? 'text-slate-900 border-l-4 border-sky-600 pl-2 font-mono'
                  : selectedStyle === 'leadership'
                  ? 'text-indigo-800 border-b-2 border-indigo-200'
                  : selectedStyle === 'creative'
                  ? 'text-emerald-700 border-b border-emerald-200'
                  : 'text-slate-900 border-b border-slate-300'
              }`}
            >
              Work Experience
            </h2>

            {experiences.map((exp) => {
              const expAchievements = achievements
                .filter((a) => a.experience_id === exp.id && !isHeaderDuplicate(a.raw_bullet, exp.role_title, exp.company))
                .map((a) => spellCheckAndPolishBullet(a.raw_bullet));

              return (
                <div key={exp.id} className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xs font-bold text-slate-900">
                      {sanitizeText(exp.role_title)} | {sanitizeText(exp.company)}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-600 font-medium">
                      {exp.start_date} – {exp.is_current ? 'Present' : exp.end_date}
                    </span>
                  </div>

                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-800 pl-1 leading-relaxed">
                    {expAchievements.map((bullet, idx) => (
                      <li
                        key={idx}
                        className={`font-medium ${
                          selectedStyle === 'warm_modern'
                            ? 'marker:text-amber-500'
                            : selectedStyle === 'creative'
                            ? 'marker:text-emerald-500'
                            : 'marker:text-slate-500'
                        }`}
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Skills & Competencies */}
          <div className="mb-6 space-y-2">
            <h2
              className={`text-xs font-bold uppercase tracking-wider pb-1 ${
                selectedStyle === 'modern_executive'
                  ? 'text-blue-700 border-b-2 border-blue-600'
                  : selectedStyle === 'warm_modern'
                  ? 'text-teal-700 border-b border-teal-200'
                  : selectedStyle === 'minimalist'
                  ? 'text-slate-900 border-l-4 border-sky-600 pl-2 font-mono'
                  : selectedStyle === 'leadership'
                  ? 'text-indigo-800 border-b-2 border-indigo-200'
                  : selectedStyle === 'creative'
                  ? 'text-emerald-700 border-b border-emerald-200'
                  : 'text-slate-900 border-b border-slate-300'
              }`}
            >
              Core Competencies & Skills
            </h2>

            {selectedStyle === 'creative' ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {dynamicSkillsList.map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-800 leading-relaxed font-medium">
                <p>{dynamicSkillsList.join(' • ')}</p>
              </div>
            )}
          </div>

          {/* Education */}
          <div className="space-y-2">
            <h2
              className={`text-xs font-bold uppercase tracking-wider pb-1 ${
                selectedStyle === 'modern_executive'
                  ? 'text-blue-700 border-b-2 border-blue-600'
                  : selectedStyle === 'warm_modern'
                  ? 'text-teal-700 border-b border-teal-200'
                  : selectedStyle === 'minimalist'
                  ? 'text-slate-900 border-l-4 border-sky-600 pl-2 font-mono'
                  : selectedStyle === 'leadership'
                  ? 'text-indigo-800 border-b-2 border-indigo-200'
                  : selectedStyle === 'creative'
                  ? 'text-emerald-700 border-b border-emerald-200'
                  : 'text-slate-900 border-b border-slate-300'
              }`}
            >
              Education
            </h2>
            {educations.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline text-xs text-slate-800 font-medium">
                <div>
                  <strong>{edu.degree}</strong> in {edu.field_of_study} — {edu.institution} ({edu.location})
                </div>
                <div className="font-mono text-[11px] text-slate-600 font-medium">
                  {edu.start_date.split('-')[0]} – {edu.end_date.split('-')[0]} | GPA {edu.gpa}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
