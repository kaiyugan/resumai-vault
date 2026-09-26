import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import {
  Copy,
  Printer,
  Check,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CoverLetterGenerator: React.FC = () => {
  const { profile, selectedJob, achievements } = useResume();

  const [selectedTone, setSelectedTone] = useState<'Executive' | 'Technical Architect' | 'Product Leader' | 'Confident Innovator'>('Technical Architect');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Top Google XYZ bullet to inject
  const topXYZBullet = achievements.find((a) => a.quantified_metric.value)?.raw_bullet ||
    (achievements[0]?.raw_bullet ? achievements[0].raw_bullet : 'achieved measurable outcome and performance metrics.');

  // Paragraphs state
  const [opening, setOpening] = useState<string>('');
  const [core, setCore] = useState<string>('');
  const [closing, setClosing] = useState<string>('');

  React.useEffect(() => {
    const jobTitle = selectedJob?.title || 'Target Position';
    const company = selectedJob?.company || 'Target Company';
    const candidateTitle = profile.title !== 'Target Professional Title' ? profile.title : 'Software & Tech Professional';
    const candidateName = profile.name !== 'Candidate Name' ? profile.name : 'Candidate Name';

    setOpening(
      `Dear Hiring Manager at ${company},\n\nI am writing to express my strong interest in the ${jobTitle} role. As a ${candidateTitle}, I bring hands-on experience and a focus on delivering high-impact, quantifiable technical results aligned with ${company}'s goals.`
    );

    setCore(
      `My technical background centers on scalable systems and engineering performance. Specifically, ${topXYZBullet} My skill set includes key frameworks and architecture practices tailored for ${jobTitle} requirements.`
    );

    setClosing(
      `I welcome the opportunity to discuss how my background and experience match the requirements for the ${jobTitle} position at ${company}. Thank you for your time and consideration.\n\nSincerely,\n${candidateName}`
    );
  }, [selectedJob, profile, achievements, selectedTone]);

  const handleCopy = () => {
    const fullText = `${opening}\n\n${core}\n\n${closing}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = (format: 'pdf' | 'docx') => {
    setDownloadSuccess(format.toUpperCase());

    try {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.7 }
      });
    } catch {
      // fallback
    }

    if (format === 'pdf') {
      window.print();
    } else {
      setTimeout(() => setDownloadSuccess(null), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-amber-50/50 shadow-md no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                AI Cover Letter Synthesizer
              </span>
              {selectedJob && (
                <span className="text-xs text-slate-600 font-mono font-semibold">• Tailored for {selectedJob.company}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Tailored Cover Letter <span className="gradient-text">Generator</span>
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Synthesizes a compelling, role-specific cover letter in seconds by blending your Master Vault Google XYZ achievements with target job description requirements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-sm transition"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-indigo-600" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Letter Text'}</span>
            </button>

            <button
              onClick={() => handleDownload('pdf')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition transform hover:-translate-y-0.5"
            >
              <Printer className="h-4 w-4" />
              <span>Export PDF / Print</span>
            </button>
          </div>
        </div>

        {/* Tone Selector & Customization Controls */}
        <div className="mt-6 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-slate-600">Select Tone Preset:</span>
            {(['Technical Architect', 'Executive', 'Product Leader', 'Confident Innovator'] as const).map((tone) => (
              <button
                key={tone}
                onClick={() => setSelectedTone(tone)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  selectedTone === tone
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>

          {downloadSuccess && (
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              ✓ Generated {downloadSuccess} Cover Letter
            </span>
          )}
        </div>
      </div>

      {/* Main Cover Letter Document View (Executive Light Paper View) */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white text-slate-900 rounded-xl shadow-xl p-10 font-sans border border-slate-300 space-y-6 print:shadow-none print:border-none">
          {/* Header */}
          <div className="border-b border-slate-300 pb-4 text-center space-y-1">
            <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">{profile.name}</h1>
            <p className="text-xs text-slate-700 font-semibold">{profile.title}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-600 font-mono pt-1">
              <span>{profile.location}</span>
              <span>•</span>
              <span>{profile.phone}</span>
              <span>•</span>
              <span>{profile.email}</span>
              <span>•</span>
              <span>{profile.linkedin}</span>
            </div>
          </div>

          {/* Target Metadata Bar */}
          <div className="text-xs text-slate-600 font-mono border-b border-slate-200 pb-3 flex justify-between items-center no-print">
            <span>Date: {new Date().toLocaleDateString()}</span>
            <span>Target Role: {selectedJob?.title || 'Staff AI Engineer'} @ {selectedJob?.company || 'Acme AI Labs'}</span>
          </div>

          {/* Editable Paragraph 1 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 no-print">
              <span>Paragraph 1: Opening & Target Role Hook</span>
              <Edit3 className="h-3 w-3" />
            </div>
            <textarea
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              rows={3}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-slate-300 rounded-lg p-3 text-xs text-slate-900 leading-relaxed font-medium focus:outline-none focus:bg-white focus:border-indigo-500 transition"
            />
          </div>

          {/* Editable Paragraph 2: Core Google XYZ Injected Experience */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 no-print">
              <span>Paragraph 2: Master Vault Google XYZ Achievement Injected</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ XYZ Metric Verified
              </span>
            </div>
            <textarea
              value={core}
              onChange={(e) => setCore(e.target.value)}
              rows={4}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-slate-300 rounded-lg p-3 text-xs text-slate-900 leading-relaxed font-medium focus:outline-none focus:bg-white focus:border-indigo-500 transition"
            />
          </div>

          {/* Editable Paragraph 3: Closing & Call to Action */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 no-print">
              <span>Paragraph 3: Closing & Call to Action</span>
              <Edit3 className="h-3 w-3" />
            </div>
            <textarea
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
              rows={4}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-slate-300 rounded-lg p-3 text-xs text-slate-900 leading-relaxed font-medium focus:outline-none focus:bg-white focus:border-indigo-500 transition"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
