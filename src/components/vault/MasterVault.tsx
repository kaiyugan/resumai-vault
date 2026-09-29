import React, { useState, useRef } from 'react';
import { useResume } from '../../context/ResumeContext';
import { ingestFileAPI } from '../../services/apiClient';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Tag,
  Briefcase,
  Sparkles,
  Edit3,
  Trash2,
  Check,
  Building,
  GraduationCap,
  Plus,
  Layers,
  Database,
  FileText,
  Paperclip,
  X
} from 'lucide-react';
import type { MasterAchievement } from '../../types/resume';

export const MasterVault: React.FC<{ onNavigateToJDEngine: () => void }> = ({ onNavigateToJDEngine }) => {
  const {
    profile,
    experiences,
    achievements,
    educations,
    skills,
    addAchievement,
    updateAchievement,
    deleteAchievement,
    ingestUnstructuredText
  } = useResume();

  const [activeSubTab, setActiveSubTab] = useState<'experiences' | 'skills' | 'education' | 'ingest'>('experiences');
  const [editingAchId, setEditingAchId] = useState<string | null>(null);
  const [editBulletText, setEditBulletText] = useState('');
  const [editMetricVal, setEditMetricVal] = useState('');

  // Add new achievement state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExpId, setSelectedExpId] = useState(experiences[0]?.id || '');
  const [newRawBullet, setNewRawBullet] = useState('');
  const [newMetricVal, setNewMetricVal] = useState('');
  const [newActionVerb, setNewActionVerb] = useState('');

  const [ingestMode, setIngestMode] = useState<'file' | 'text' | 'bookmarklet'>('file');

  const bookmarkletCode = `javascript:(function(){var n=encodeURIComponent(document.querySelector('h1')?.innerText||document.title);var u=encodeURIComponent(window.location.href);var t=encodeURIComponent((document.body.innerText||'').substring(0,5000));var h=window.location.origin.includes('localhost')?window.location.origin:'https://resumai-vault.vercel.app';window.open(h+'/?import=1&name='+n+'&url='+u+'&text='+t,'_blank');})();`;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawTextIngest, setRawTextIngest] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(false);
  const [ingestMsg, setIngestMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileIngest = async () => {
    if (!selectedFile) return;
    setIsIngesting(true);
    setIngestSuccess(false);
    try {
      const res = await ingestFileAPI(selectedFile, profile.id || 'prof-1');
      setIsIngesting(false);
      setIngestSuccess(true);
      setSelectedFile(null);
      setIngestMsg(res.message || `Successfully parsed ${selectedFile.name}`);
      setTimeout(() => setIngestSuccess(false), 5000);
    } catch (e: any) {
      setIsIngesting(false);
      alert('File ingestion warning: ' + (e.message || 'Failed to parse file'));
    }
  };

  const handleStartEdit = (ach: MasterAchievement) => {
    setEditingAchId(ach.id);
    setEditBulletText(ach.raw_bullet);
    setEditMetricVal(ach.quantified_metric.value || '');
  };

  const handleSaveEdit = (id: string) => {
    updateAchievement(id, editBulletText, editMetricVal);
    setEditingAchId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRawBullet.trim()) return;

    addAchievement({
      experience_id: selectedExpId || experiences[0]?.id || 'exp-1',
      raw_bullet: newRawBullet,
      quantified_metric: newMetricVal ? { value: newMetricVal } : {},
      action_verb: newActionVerb || newRawBullet.split(' ')[0] || 'Achieved',
      context: 'User manually added achievement',
      vector_tags: ['Manual Input', 'Master Vault']
    });

    setNewRawBullet('');
    setNewMetricVal('');
    setNewActionVerb('');
    setShowAddModal(false);
  };

  const handleIngest = async () => {
    if (!rawTextIngest.trim()) return;
    setIsIngesting(true);
    setIngestSuccess(false);

    const success = await ingestUnstructuredText(rawTextIngest);
    setIsIngesting(false);
    if (success) {
      setIngestSuccess(true);
      setRawTextIngest('');
      setTimeout(() => setIngestSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Strategy Summary */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-100 bg-gradient-to-r from-amber-500/10 via-indigo-50/60 to-purple-500/10 relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm">
                Canonical Truth Database
              </span>
              <span className="text-xs text-slate-600 font-semibold font-mono">• {profile.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Master Career <span className="gradient-text">Vault</span>
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Stores your complete career history as granular, structured entity records. Resumes are compiled subsets of this vault—eliminating AI hallucinations and shallow keyword stuffing.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveSubTab('ingest')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-sm transition"
            >
              <UploadCloud className="h-4 w-4 text-indigo-600" />
              <span>Ingest Raw Resume</span>
            </button>

            <button
              onClick={onNavigateToJDEngine}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition transform hover:-translate-y-0.5"
            >
              <span>Target JD Matching</span>
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Vault Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200/80">
          <div className="bg-white/90 p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Total Work Experiences</p>
            <p className="text-xl font-display font-extrabold text-slate-900 mt-1">{experiences.length}</p>
          </div>
          <div className="bg-white/90 p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Master Bullet Records</p>
            <p className="text-xl font-display font-extrabold text-slate-900 mt-1">{achievements.length}</p>
          </div>
          <div className="bg-white/90 p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Quantified Metrics (XYZ)</p>
            <p className="text-xl font-display font-extrabold text-emerald-600 mt-1">
              {achievements.filter((a) => a.quantified_metric.value).length} / {achievements.length}
            </p>
          </div>
          <div className="bg-white/90 p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Indexed Skills Matrix</p>
            <p className="text-xl font-display font-extrabold text-indigo-600 mt-1">{skills.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('experiences')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'experiences'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Experiences & Achievements ({achievements.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('skills')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'skills'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Skills Matrix ({skills.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('education')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'education'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Education & Honors ({educations.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ingest')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'ingest'
                ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Unstructured Ingest</span>
          </button>
        </div>

        {activeSubTab === 'experiences' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Achievement</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: Experiences & Achievements */}
      {activeSubTab === 'experiences' && (
        <div className="space-y-6">
          {experiences.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl border border-dashed border-indigo-300 text-center space-y-4 bg-gradient-to-b from-indigo-50/40 to-amber-50/20">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
                <UploadCloud className="h-7 w-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-xl font-display font-bold text-slate-900">Vault is Ready for Your Career Data</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No candidate history loaded yet. Paste your raw resume text or upload your document to extract entity records automatically into your Master Vault.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  onClick={() => setActiveSubTab('ingest')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md transition"
                >
                  Paste or Upload Resume Text
                </button>
              </div>
            </div>
          ) : (
            experiences.map((exp) => {
            const expAchievements = achievements.filter((a) => a.experience_id === exp.id);

            return (
              <div key={exp.id} className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 mt-1">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-slate-900">{exp.role_title}</h3>
                      <p className="text-sm text-slate-600 font-semibold">{exp.company} • {exp.location}</p>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-medium w-fit">
                    {exp.start_date} – {exp.is_current ? 'Present' : exp.end_date}
                  </div>
                </div>

                <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                  "{exp.raw_summary}"
                </p>

                {/* Granular Achievements List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-500">
                      Granular Achievement Entity Records ({expAchievements.length})
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {expAchievements.map((ach) => {
                      const isEditing = editingAchId === ach.id;
                      const hasMetric = Boolean(ach.quantified_metric.value);

                      return (
                        <div
                          key={ach.id}
                          className={`p-4 rounded-xl transition border ${
                            hasMetric
                              ? 'bg-white border-slate-200/80 hover:border-emerald-300 shadow-sm'
                              : 'bg-amber-50/60 border-amber-200 hover:border-amber-300 shadow-sm'
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-3">
                              <textarea
                                value={editBulletText}
                                onChange={(e) => setEditBulletText(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                                rows={3}
                              />
                              <div className="flex items-center justify-between">
                                <input
                                  type="text"
                                  placeholder="Quantified Metric (e.g. 42% LCP reduction)"
                                  value={editMetricVal}
                                  onChange={(e) => setEditMetricVal(e.target.value)}
                                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 w-64 focus:outline-none focus:border-indigo-500"
                                />
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setEditingAchId(null)}
                                    className="px-3 py-1 rounded bg-slate-200 text-xs text-slate-700 hover:bg-slate-300"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveEdit(ach.id)}
                                    className="flex items-center space-x-1 px-3 py-1 rounded bg-indigo-600 text-xs text-white hover:bg-indigo-500 font-bold"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Save</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start space-x-2">
                                  {hasMetric ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                  )}
                                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans font-medium">
                                    {ach.raw_bullet}
                                  </p>
                                </div>

                                <div className="flex items-center space-x-1 opacity-80 hover:opacity-100 shrink-0">
                                  <button
                                    onClick={() => handleStartEdit(ach)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 transition"
                                    title="Edit bullet"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteAchievement(ach.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                                    title="Delete record"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Badges & Embeddings metadata */}
                              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                                {hasMetric ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold">
                                    Google XYZ: {ach.quantified_metric.value}
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold">
                                    Unquantified (Needs Micro-Interview)
                                  </span>
                                )}

                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                                  Verb: {ach.action_verb}
                                </span>

                                {ach.vector_tags.map((tag, i) => (
                                  <span key={i} className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono text-[10px]">
                                    <Tag className="h-2.5 w-2.5" />
                                    <span>{tag}</span>
                                  </span>
                                ))}

                                <span className="ml-auto text-[10px] text-slate-400 font-mono font-medium">
                                  Vector Embedding Indexed
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>
      )}

      {/* SUB-TAB 2: Skills Matrix */}
      {activeSubTab === 'skills' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-display font-bold text-slate-900">Master Skills & Competency Matrix</h3>
              <p className="text-xs text-slate-500">Structured entities extracted from work experiences and project histories.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Hard Skill', 'Tool & Framework', 'Domain Responsibility', 'Soft Skill'].map((cat) => {
              const catSkills = skills.filter((s) => s.category === cat);
              return (
                <div key={cat} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-indigo-700">
                    {cat} ({catSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {catSkills.map((sk) => (
                      <div
                        key={sk.id}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between space-x-2 shadow-sm"
                      >
                        <span>{sk.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {sk.years_experience}y exp
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Education */}
      {activeSubTab === 'education' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="text-lg font-display font-bold text-slate-900">Education & Honors</h3>
          <div className="space-y-4">
            {educations.map((edu) => (
              <div key={edu.id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-display font-bold text-slate-900 text-base">{edu.degree}</h4>
                    <p className="text-xs text-slate-600 font-medium">{edu.field_of_study} • {edu.institution}</p>
                  </div>
                  <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 font-bold">
                    GPA: {edu.gpa}
                  </span>
                </div>
                {edu.honors && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {edu.honors.map((h, i) => (
                      <span key={i} className="px-2 py-0.5 text-[10px] rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono font-semibold">
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Ingestion Pipeline Simulator */}
      {activeSubTab === 'ingest' && (
        <div className="glass-panel p-6 rounded-2xl border border-purple-200 bg-gradient-to-b from-purple-50/50 to-indigo-50/30 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-slate-900">Career Ingestion Pipeline</h3>
                <p className="text-xs text-slate-600">Upload your PDF or Word resume, or paste raw text. The AI engine extracts entity records into your Master Vault.</p>
              </div>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setIngestMode('file')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  ingestMode === 'file'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Upload PDF / DOCX File</span>
              </button>

              <button
                onClick={() => setIngestMode('text')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  ingestMode === 'text'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Raw Text</span>
              </button>

              <button
                onClick={() => setIngestMode('bookmarklet')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  ingestMode === 'bookmarklet'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>LinkedIn 1-Click Importer</span>
              </button>
            </div>
          </div>

          {/* FILE UPLOAD MODE */}
          {ingestMode === 'file' ? (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setSelectedFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 ${
                  isDragOver
                    ? 'border-purple-500 bg-purple-100/60 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/60'
                    : 'border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50/40'
                }`}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{selectedFile.name}</span>
                      <span className="text-xs font-mono text-slate-500">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-emerald-600 font-medium">Ready for AI entity parsing! Click button below to process.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-sm">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Drag & Drop your Resume Attachment here
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports <span className="font-semibold text-purple-700">PDF (.pdf)</span>, <span className="font-semibold text-purple-700">Word (.docx)</span>, and Plain Text (.txt)
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Browse Local Computer Files
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 font-medium">
                  Direct binary parser supports ReportLab, Microsoft Word, and Adobe PDF formats.
                </div>

                <button
                  onClick={handleFileIngest}
                  disabled={isIngesting || !selectedFile}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition disabled:opacity-50"
                >
                  {isIngesting ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin text-purple-200" />
                      <span>Parsing Resume File...</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      <span>Upload & Extract Entities</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : ingestMode === 'text' ? (
            /* RAW TEXT PASTE MODE */
            <div className="space-y-3">
              <textarea
                value={rawTextIngest}
                onChange={(e) => setRawTextIngest(e.target.value)}
                placeholder="Paste raw resume text, employment summary, or LinkedIn export details here..."
                rows={6}
                className="w-full bg-white border border-slate-300 rounded-xl p-4 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-mono leading-relaxed shadow-sm"
              />

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">
                  Supports plain text and LinkedIn export paragraphs.
                </div>

                <button
                  onClick={handleIngest}
                  disabled={isIngesting || !rawTextIngest.trim()}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition disabled:opacity-50"
                >
                  {isIngesting ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin text-purple-200" />
                      <span>Extracting Entities...</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      <span>Run AI Ingestion Pipeline</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* LINKEDIN 1-CLICK BOOKMARKLET MODE */
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-4 shadow-xl border border-indigo-500/30">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">1-Click LinkedIn & Web Profile Importer</h4>
                  <p className="text-xs text-indigo-200">Import profiles directly from your browser when viewing any LinkedIn page.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">1-Click Bookmarklet Shortcut:</span>
                  <a
                    href={bookmarkletCode}
                    onClick={(e) => e.preventDefault()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md cursor-grab active:cursor-grabbing flex items-center gap-1.5 transition"
                    title="Drag this button to your Browser Bookmarks Bar!"
                  >
                    <span>📥 Import to ResumAI Vault</span>
                  </a>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  💡 <span className="font-semibold text-slate-200">Instructions:</span> Drag the button above to your browser bookmarks bar (or copy the code below to your bookmarks). When viewing any LinkedIn profile, click the bookmarklet to automatically ingest candidate achievements into your Master Vault!
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Bookmarklet JavaScript Code:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={bookmarkletCode}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-mono text-indigo-300 focus:outline-none select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bookmarkletCode);
                      alert('Bookmarklet code copied to clipboard!');
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition shrink-0"
                  >
                    Copy Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {ingestSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-fadeIn shadow-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{ingestMsg || 'Successfully extracted career achievements and skills! Master Vault updated.'}</span>
            </div>
          )}
        </div>
      )}

      {/* Add Achievement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-indigo-200 max-w-lg w-full space-y-4 shadow-2xl bg-white">
            <h3 className="text-lg font-display font-bold text-slate-900">Add Master Achievement Record</h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Experience</label>
                <select
                  value={selectedExpId}
                  onChange={(e) => setSelectedExpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-medium"
                >
                  {experiences.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.role_title} @ {exp.company}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Achievement / Bullet Text</label>
                <textarea
                  value={newRawBullet}
                  onChange={(e) => setNewRawBullet(e.target.value)}
                  placeholder="e.g. Reduced database latency by 35% by implementing Redis caching..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Action Verb</label>
                  <input
                    type="text"
                    placeholder="e.g. Reduced"
                    value={newActionVerb}
                    onChange={(e) => setNewActionVerb(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Metric (XYZ Format)</label>
                  <input
                    type="text"
                    placeholder="e.g. 35% latency drop"
                    value={newMetricVal}
                    onChange={(e) => setNewMetricVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-xs text-slate-700 font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-xs text-white font-bold hover:bg-indigo-500 shadow"
                >
                  Commit to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
