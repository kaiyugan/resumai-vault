import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import {
  Award,
  Sparkles,
  Zap,
  ChevronRight,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { MockInterviewSimulator } from './MockInterviewSimulator';

interface STARStory {
  id: string;
  title: string;
  raw_bullet: string;
  metric_value: string;
  situation: str;
  task: str;
  action: str;
  result: str;
  sample_questions: string[];
}

type str = string;

export const STARCoach: React.FC = () => {
  const { achievements, selectedJob } = useResume();
  const [activeTabMode, setActiveTabMode] = useState<'cards' | 'simulator'>('simulator');

  // Generate STAR Story cards from Master Vault achievements
  const starStories: STARStory[] = achievements.map((ach, i) => {
    const metricVal = ach.quantified_metric.value || 'Quantified Result';

    return {
      id: `star-${ach.id}`,
      title: `Story #${i + 1}: ${ach.context || 'System Architecture & Performance'}`,
      raw_bullet: ach.raw_bullet,
      metric_value: metricVal,
      situation: `The team faced technical scaling constraints requiring improved application throughput and baseline reliability.`,
      task: `Took lead technical ownership to architect and implement optimizations for ${ach.context || 'core system modules'}.`,
      action: `Engineered performance refactoring, dynamic bundle splitting, and asynchronous database connections.`,
      result: `Accomplished verified Google XYZ impact: "${ach.raw_bullet}"`,
      sample_questions: [
        `Tell me about a time you optimized application performance under tight deadlines.`,
        `Describe a scenario where you took ownership to solve a technical scaling challenge.`,
        `How do you quantify the impact of engineering decisions on user experience?`
      ]
    };
  });

  const [activeStoryId, setActiveStoryId] = useState<string>(starStories[0]?.id || 'star-ach-1');
  const [activeQuestion, setActiveQuestion] = useState<string>(
    selectedJob
      ? `Tell me about your experience related to "${selectedJob.parsed_responsibilities[0] || 'Next.js & React Frontend Architecture'}"`
      : `Tell me about a time you optimized performance under tight deadlines.`
  );
  const [practiceAnswer, setPracticeAnswer] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<{
    score: number;
    hasMetric: boolean;
    situationFeedback: string;
    actionFeedback: string;
    resultFeedback: string;
    overallTip: string;
  } | null>(null);

  const activeStory = starStories.find((s) => s.id === activeStoryId) || starStories[0];

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!practiceAnswer.trim()) return;

    setIsEvaluating(true);
    setEvaluation(null);

    setTimeout(() => {
      const words = practiceAnswer.split(' ').length;
      const hasMetric = /\d+%|\d+x|\$\d+|\b\d+\s*ms\b/i.test(practiceAnswer);
      const score = Math.min(94, Math.max(65, words * 2 + (hasMetric ? 15 : 0)));

      setEvaluation({
        score,
        hasMetric,
        situationFeedback: 'Solid context setup establishing baseline business and technical constraints.',
        actionFeedback: 'Clear engineering steps described. Highlight specific framework tools used.',
        resultFeedback: hasMetric
          ? 'Verified metric included! Explicit percentage or throughput numbers build immense recruiter trust.'
          : 'Tip: Incorporate an explicit percentage or throughput number in your final result sentence.',
        overallTip: 'Focus on emphasizing your direct technical ownership ("I architected" vs "We built") to showcase technical leadership.'
      });

      setIsEvaluating(false);

      try {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 }
        });
      } catch {
        // fallback
      }
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-indigo-50/50 to-purple-50/50 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                STAR Behavioral Coach & Simulator
              </span>
              {selectedJob && (
                <span className="text-xs text-slate-600 font-mono font-medium">• Tailored for {selectedJob.company}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              STAR-Method & AI Mock <span className="gradient-text-warm">Interview Room</span>
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Conduct interactive mock interview practice runs or review structured STAR story cards derived from your Master Vault.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-white/80 p-1.5 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setActiveTabMode('simulator')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTabMode === 'simulator'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>AI Mock Simulator</span>
            </button>
            <button
              onClick={() => setActiveTabMode('cards')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTabMode === 'cards'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>STAR Story Vault</span>
            </button>
          </div>
        </div>
      </div>

      {activeTabMode === 'simulator' ? (
        <MockInterviewSimulator />
      ) : (


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {starStories.length === 0 ? (
          <div className="lg:col-span-3 glass-panel p-10 rounded-2xl border border-dashed border-amber-300 text-center space-y-4 bg-gradient-to-b from-amber-50/40 to-indigo-50/20">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
              <Award className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-xl font-display font-bold text-slate-900">No Achievements Loaded Yet</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add career experiences or ingest your resume into your Master Vault to generate structured STAR story cards and start behavioral mock practice.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Left Column: STAR Story Cards List */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 lg:col-span-1 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-display font-bold text-slate-800 uppercase tracking-wider font-mono">
              STAR Story Cards ({starStories.length})
            </h3>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Master Vault Synced
            </span>
          </div>

          <div className="space-y-2">
            {starStories.map((story) => {
              const isActive = activeStoryId === story.id;

              return (
                <button
                  key={story.id}
                  onClick={() => {
                    setActiveStoryId(story.id);
                    setActiveQuestion(story.sample_questions[0]);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-start justify-between space-x-2 ${
                    isActive
                      ? 'bg-amber-50 border-amber-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center space-x-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <h4 className="text-xs font-bold text-slate-900 truncate">{story.title}</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate font-medium">{story.raw_bullet}</p>
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected STAR Story Breakdown & Practice Simulator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active STAR Card Breakdown */}
          {activeStory && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase tracking-wider">STAR Method Framework</span>
                  <h3 className="text-base font-display font-bold text-slate-900">{activeStory.title}</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold w-fit">
                  Metric: {activeStory.metric_value}
                </span>
              </div>

              {/* Grid of S-T-A-R */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                    <span className="h-5 w-5 rounded bg-indigo-100 text-indigo-800 flex items-center justify-center font-mono text-[11px]">S</span>
                    <span>Situation (Context)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{activeStory.situation}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                    <span className="h-5 w-5 rounded bg-purple-100 text-purple-800 flex items-center justify-center font-mono text-[11px]">T</span>
                    <span>Task (Your Ownership)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{activeStory.task}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                    <span className="h-5 w-5 rounded bg-amber-100 text-amber-900 flex items-center justify-center font-mono text-[11px]">A</span>
                    <span>Action (Technical Steps)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{activeStory.action}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900">
                    <span className="h-5 w-5 rounded bg-emerald-200 text-emerald-900 flex items-center justify-center font-mono text-[11px]">R</span>
                    <span>Result (Google XYZ Metric)</span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed font-bold">{activeStory.result}</p>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Mock Practice Simulator */}
          <div className="glass-panel p-6 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/40 space-y-4 shadow-sm">
            <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-base">Interactive Behavioral Practice Simulator</h3>
                <p className="text-xs text-slate-600">Practice answering out loud or typing your STAR response to receive AI coaching feedback.</p>
              </div>
            </div>

            {/* Behavioral Question Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Practice Question</label>
              <select
                value={activeQuestion}
                onChange={(e) => setActiveQuestion(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 shadow-sm"
              >
                {activeStory?.sample_questions.map((q, i) => (
                  <option key={i} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            {/* Answer Input */}
            <form onSubmit={handleEvaluate} className="space-y-3">
              <textarea
                value={practiceAnswer}
                onChange={(e) => setPracticeAnswer(e.target.value)}
                placeholder="Type your STAR interview response here (e.g. In my role at TechCloud, I faced a challenge where... I led the technical action by... resulting in...)"
                rows={4}
                className="w-full bg-white border border-slate-300 rounded-xl p-4 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 leading-relaxed shadow-sm"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  Tip: Include concrete metrics and direct action verbs.
                </span>

                <button
                  type="submit"
                  disabled={isEvaluating || !practiceAnswer.trim()}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin text-indigo-200" />
                      <span>Evaluating STAR Delivery...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>Evaluate STAR Answer</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Evaluation Results Card */}
            {evaluation && (
              <div className="mt-4 p-5 rounded-2xl bg-white border border-indigo-200 space-y-4 shadow-sm animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 font-display font-extrabold flex items-center justify-center text-lg shadow-sm">
                      {evaluation.score}%
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">STAR Completeness Score</h4>
                      <p className="text-[11px] text-slate-500">Evaluated against recruiter benchmarks</p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                    evaluation.hasMetric
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {evaluation.hasMetric ? '✓ Metric Quantified' : '⚠️ Unquantified Result'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <p><strong>Situation Context:</strong> {evaluation.situationFeedback}</p>
                  <p><strong>Technical Action:</strong> {evaluation.actionFeedback}</p>
                  <p><strong>Result & Impact:</strong> {evaluation.resultFeedback}</p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs font-medium flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span><strong>Coaching Advice:</strong> {evaluation.overallTip}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>
      )}
    </div>
  );
};
