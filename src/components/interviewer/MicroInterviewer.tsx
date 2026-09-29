import React, { useState, useEffect } from 'react';
import { useResume } from '../../context/ResumeContext';
import {
  Sparkles,
  Send,
  CheckCircle2,
  Database,
  ArrowRight,
  Bot,
  User,
  Edit3,
  RotateCcw,
  Check,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { DraftXYZBullet } from '../../types/resume';

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
  options?: { label: string; action: () => void; variant?: 'primary' | 'secondary' | 'danger' }[];
}

const isClarifyingQuestion = (text: string): boolean => {
  const stripped = text.trim();
  if (stripped.endsWith('?')) return true;

  const lower = stripped.toLowerCase();
  const signals = [
    'what do you mean', 'could you clarify', 'can you clarify', 'what kind of',
    'can you give an example', 'give me an example', 'how do i', 'what is',
    'should i include', 'does this count', 'not sure what', 'explain',
    'what metric', 'which project', 'can you explain', 'what format',
    'what type', 'does it matter', 'is it okay if', 'how should i', 'example'
  ];
  return signals.some((sig) => lower.includes(sig));
};

const generateAgenticClarification = (gapTitle: string, _questionText: string): string => {
  const gapLower = gapTitle.toLowerCase();
  let example = '';
  let concept = '';

  if (gapLower.includes('latency') || gapLower.includes('performance') || gapLower.includes('speed')) {
    example = "For example: 'Reduced web application page load time by 45% (from 2.4s to 1.3s)' or 'Lowered API p99 latency from 180ms to 45ms'.";
    concept = 'how you improved speed, throughput, or responsiveness in your code or architecture.';
  } else if (gapLower.includes('team') || gapLower.includes('leadership') || gapLower.includes('manage')) {
    example = "For example: 'Led a cross-functional engineering team of 8 developers delivering 4 major production releases on schedule'.";
    concept = 'the team size, leadership scope, or process improvements you spearheaded.';
  } else if (gapLower.includes('security') || gapLower.includes('soc') || gapLower.includes('compliance')) {
    example = "For example: 'Achieved 100% SOC2 Type II compliance readiness across 32 security controls with zero critical findings'.";
    concept = 'how you implemented security policies, access controls, RBAC, or audit readiness.';
  } else if (gapLower.includes('cloud') || gapLower.includes('aws') || gapLower.includes('infrastructure')) {
    example = "For example: 'Migrated legacy workloads to AWS ECS/EKS, reducing cloud infrastructure operating costs by 28%'.";
    concept = 'the scale of infrastructure, cloud architecture, or cost optimizations achieved.';
  } else {
    example = `For example: 'Architected and deployed ${gapTitle} solution, improving system reliability by 35%'.`;
    concept = `how you applied ${gapTitle} in practice and what outcome or metric resulted.`;
  }

  return `Great question! When asking about **"${gapTitle}"**, we are looking for ${concept}\n\n💡 **Example of what works well:** ${example}\n\nFeel free to share any project details, scale, or metrics from your past work when you're ready!`;
};

export const MicroInterviewer: React.FC<{ onNavigateToExporter: () => void }> = ({ onNavigateToExporter }) => {
  const {
    matchItems,
    selectedJob,
    commitDirectXYZBulletToVault
  } = useResume();

  const unquantifiedMatches = matchItems.filter((m) => m.category === 'UNQUANTIFIED_MATCH');
  const potentialGaps = matchItems.filter((m) => m.category === 'POTENTIAL_GAP');
  const availableGaps = [...unquantifiedMatches, ...potentialGaps];

  // Conversational Interview State
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentGapIndex, setCurrentGapIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<
    'GATE_EXPERIENCE' | 'PROBE_ACTION' | 'GATE_METRIC' | 'REVIEW_SUMMARY'
  >('GATE_EXPERIENCE');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draftBullets, setDraftBullets] = useState<DraftXYZBullet[]>([]);
  const [tempActionText, setTempActionText] = useState('');
  const [userInputText, setUserInputText] = useState('');

  // Bullet Editing State
  const [editingBulletId, setEditingBulletId] = useState<string | null>(null);
  const [editGuidanceInput, setEditGuidanceInput] = useState('');

  // Start Cohesive Conversation
  const startCohesiveInterview = () => {
    setInterviewStarted(true);
    setCurrentGapIndex(0);
    setDraftBullets([]);
    setMessages([]);
    setTempActionText('');
    setUserInputText('');

    const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (availableGaps.length === 0) {
      setMessages([
        {
          id: `msg-${Date.now()}-1`,
          sender: 'assistant',
          text: `Awesome news! All target job requirements for **${selectedJob?.title || 'this role'}** are already fully matched with quantified metrics in your Master Vault!`,
          timestamp: getTime()
        }
      ]);
      setCurrentStep('REVIEW_SUMMARY');
      return;
    }

    const firstGap = availableGaps[0];

    setMessages([
      {
        id: `msg-${Date.now()}-1`,
        sender: 'assistant',
        text: `Welcome! Let's optimize your career achievements for **${selectedJob?.title || 'Target Position'}** at **${selectedJob?.company || 'Target Company'}**. I will guide you through ${availableGaps.length} target requirement gap(s) step-by-step.`,
        timestamp: getTime()
      },
      {
        id: `msg-${Date.now()}-2`,
        sender: 'assistant',
        text: `Requirement 1 of ${availableGaps.length}: The target job requires experience with **"${firstGap.jd_requirement}"**. Do you have direct experience with this?`,
        timestamp: getTime()
      }
    ]);
    setCurrentStep('GATE_EXPERIENCE');
  };

  // Auto-start on mount if not started yet
  useEffect(() => {
    if (!interviewStarted && availableGaps.length > 0) {
      startCohesiveInterview();
    }
  }, [selectedJob?.id]);

  const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Handle Step A: Experience Gate
  const handleAnswerExperience = (hasExp: boolean) => {
    const currentGap = availableGaps[currentGapIndex];
    if (!currentGap) return;

    if (hasExp) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-u`,
          sender: 'user',
          text: `Yes, I have direct experience with "${currentGap.jd_requirement}".`,
          timestamp: getTime()
        },
        {
          id: `msg-${Date.now()}-a`,
          sender: 'assistant',
          text: `Great! Could you briefly describe what specific project, role, or action you executed involving **"${currentGap.jd_requirement}"**?`,
          timestamp: getTime()
        }
      ]);
      setCurrentStep('PROBE_ACTION');
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-u`,
          sender: 'user',
          text: `No direct experience, skip this requirement.`,
          timestamp: getTime()
        },
        {
          id: `msg-${Date.now()}-a`,
          sender: 'assistant',
          text: `Understood, skipping **"${currentGap.jd_requirement}"** and moving to the next requirement.`,
          timestamp: getTime()
        }
      ]);
      advanceToNextGap();
    }
  };

  // Handle Step B: Action Probe Input
  const handleAnswerAction = (actionText: string) => {
    if (!actionText.trim()) return;

    const currentGap = availableGaps[currentGapIndex];
    if (!currentGap) return;

    setTempActionText(actionText);

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-u`,
        sender: 'user',
        text: actionText,
        timestamp: getTime()
      },
      {
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        text: `Awesome! Do you have any specific metric, percentage, scale, or quantifiable impact from this work (e.g. 35% velocity increase, 20 hires closed, $500k ARR, sub-50ms latency)?`,
        timestamp: getTime()
      }
    ]);
    setCurrentStep('GATE_METRIC');
    setUserInputText('');
  };

  // Handle Step C: Metric Gate Input
  const handleAnswerMetric = (hasMetric: boolean, metricVal?: string) => {
    const currentGap = availableGaps[currentGapIndex];
    if (!currentGap) return;

    let synthesized = '';

    if (hasMetric && metricVal && metricVal.trim()) {
      const cleanMetric = metricVal.trim();
      synthesized = `Accomplished ${currentGap.jd_requirement}, as measured by ${cleanMetric}, by executing ${tempActionText.trim().replace(/\.$/, '')}.`;
      
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-u`,
          sender: 'user',
          text: `Metric/Impact: ${cleanMetric}`,
          timestamp: getTime()
        },
        {
          id: `msg-${Date.now()}-a`,
          sender: 'assistant',
          text: `Synthesized Google XYZ metric bullet for **"${currentGap.jd_requirement}"**!`,
          timestamp: getTime()
        }
      ]);
    } else {
      synthesized = `Delivered ${currentGap.jd_requirement} by executing ${tempActionText.trim().replace(/\.$/, '')}.`;
      
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-u`,
          sender: 'user',
          text: `No metric available.`,
          timestamp: getTime()
        },
        {
          id: `msg-${Date.now()}-a`,
          sender: 'assistant',
          text: `Captured standard achievement bullet for **"${currentGap.jd_requirement}"**.`,
          timestamp: getTime()
        }
      ]);
    }

    const newDraft: DraftXYZBullet = {
      id: `draft-${Date.now()}-${draftBullets.length}`,
      gap_title: currentGap.jd_requirement,
      target_requirement: currentGap.jd_requirement,
      user_action: tempActionText,
      user_metric: metricVal,
      synthesized_bullet: synthesized,
      status: 'PENDING'
    };

    setDraftBullets((prev) => [...prev, newDraft]);
    setUserInputText('');
    setTempActionText('');
    advanceToNextGap();
  };

  // Advance to next gap or trigger Summary Review
  const advanceToNextGap = () => {
    const nextIdx = currentGapIndex + 1;
    if (nextIdx < availableGaps.length) {
      setCurrentGapIndex(nextIdx);
      const nextGap = availableGaps[nextIdx];
      setCurrentStep('GATE_EXPERIENCE');

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-next`,
            sender: 'assistant',
            text: `Requirement ${nextIdx + 1} of ${availableGaps.length}: The position requires experience with **"${nextGap.jd_requirement}"**. Do you have direct experience with this?`,
            timestamp: getTime()
          }
        ]);
      }, 500);
    } else {
      setCurrentStep('REVIEW_SUMMARY');
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-end`,
            sender: 'assistant',
            text: `🎉 All target job gaps have been reviewed! Review your synthesized **Google XYZ bullets** in the panel to approve or edit them.`,
            timestamp: getTime()
          }
        ]);
      }, 500);
    }
  };

  // Form Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInputText.trim()) return;

    const currentGap = availableGaps[currentGapIndex];
    const rawInput = userInputText.trim();

    // Check if input is a clarifying question
    if (isClarifyingQuestion(rawInput)) {
      const gapTitle = currentGap?.jd_requirement || 'this requirement';
      const clarification = generateAgenticClarification(gapTitle, rawInput);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-u`,
          sender: 'user',
          text: rawInput,
          timestamp: getTime()
        },
        {
          id: `msg-${Date.now()}-a`,
          sender: 'assistant',
          text: clarification,
          timestamp: getTime()
        }
      ]);
      setUserInputText('');
      return; // DO NOT advance step or force bullet synthesis!
    }

    if (currentStep === 'PROBE_ACTION') {
      handleAnswerAction(rawInput);
    } else if (currentStep === 'GATE_METRIC') {
      handleAnswerMetric(true, rawInput);
    }
  };

  // Bullet Approval Handler
  const handleApproveBullet = (bulletId: string) => {
    const draft = draftBullets.find((b) => b.id === bulletId);
    if (!draft) return;

    commitDirectXYZBulletToVault(draft.target_requirement, draft.synthesized_bullet, draft.user_metric);

    setDraftBullets((prev) =>
      prev.map((b) => (b.id === bulletId ? { ...b, status: 'APPROVED' } : b))
    );

    try {
      confetti({ particleCount: 70, spread: 55, origin: { y: 0.6 } });
    } catch {
      // fallback
    }
  };

  // Bullet Re-Synthesis Handler (Candidate Custom Editing)
  const handleResynthesizeBullet = (bulletId: string) => {
    if (!editGuidanceInput.trim()) return;

    setDraftBullets((prev) =>
      prev.map((b) => {
        if (b.id === bulletId) {
          const guidance = editGuidanceInput.trim();
          let newText = b.synthesized_bullet;

          if (guidance.toLowerCase().includes('senior') || guidance.toLowerCase().includes('executive')) {
            newText = newText.replace(/^(Accomplished|Delivered|Enhanced)/, 'Spearheaded strategic execution of');
          } else if (guidance.toLowerCase().includes('metric') || guidance.match(/\d+/)) {
            const num = guidance.match(/\d+%/)?.[0] || guidance.match(/\$\d+[\d,.]*/)?.[0] || guidance.match(/\b\d+\b/)?.[0];
            if (num) {
              newText = newText.replace(/as measured by [^,]+,/, `as measured by ${num} impact,`);
            } else {
              newText = `${newText} (Refined: ${guidance})`;
            }
          } else {
            newText = `${newText.replace(/\.$/, '')} to drive ${guidance}.`;
          }

          return {
            ...b,
            synthesized_bullet: newText,
            status: 'PENDING'
          };
        }
        return b;
      })
    );

    setEditingBulletId(null);
    setEditGuidanceInput('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-amber-50/50 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Interactive Conversational Elicitation
              </span>
              {selectedJob && (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                  Target: {selectedJob.title}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Discovery <span className="gradient-text">Micro-Interviewer</span>
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Conducts a single cohesive conversation covering all target job gaps. Asks for direct experience, action details, and metrics, then lets you review, edit, and approve synthesized Google XYZ bullet points.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={startCohesiveInterview}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm transition"
            >
              <RotateCcw className="h-3.5 w-3.5 text-purple-600" />
              <span>Restart Interview</span>
            </button>

            <button
              onClick={onNavigateToExporter}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition"
            >
              <span>Step 4: ATS Resume Export</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Cohesive Conversation Chat Stream */}
        <div className="lg:col-span-6 glass-panel rounded-2xl border border-slate-200 flex flex-col h-[650px] overflow-hidden bg-white shadow-sm">
          {/* Chat Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700 border border-purple-200">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-purple-800">
                  Cohesive AI Interviewer
                </h3>
                <p className="text-xs font-bold text-slate-900">
                  {currentStep === 'REVIEW_SUMMARY'
                    ? 'Interview Completed'
                    : `Requirement ${currentGapIndex + 1} of ${availableGaps.length}: ${availableGaps[currentGapIndex]?.jd_requirement || ''}`}
                </p>
              </div>
            </div>

            {availableGaps.length > 0 && currentStep !== 'REVIEW_SUMMARY' && (
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300">
                Gap {currentGapIndex + 1} / {availableGaps.length}
              </span>
            )}
          </div>

          {/* Messages Window */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FAF9F6]">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-purple-100 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  <div className="max-w-md space-y-1">
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none font-medium shadow'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block px-1 font-medium">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Quick Action Controls & Text Form */}
          <div className="p-4 bg-white border-t border-slate-200 space-y-3">
            {/* Step A: Experience Gate Quick Choice Pills */}
            {currentStep === 'GATE_EXPERIENCE' && (
              <div className="flex flex-wrap items-center gap-2 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => handleAnswerExperience(true)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Yes, I Have Direct Experience</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAnswerExperience(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  No Experience, Skip Requirement
                </button>
              </div>
            )}

            {/* Step C: Metric Gate Quick Choice Pills */}
            {currentStep === 'GATE_METRIC' && (
              <div className="flex flex-wrap items-center gap-2 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => handleAnswerMetric(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  No Metric Available (Capture Action Bullet)
                </button>
              </div>
            )}

            {/* Form Input for Text Answers */}
            {currentStep !== 'REVIEW_SUMMARY' && currentStep !== 'GATE_EXPERIENCE' && (
              <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder={
                      currentStep === 'PROBE_ACTION'
                        ? 'Describe your project or ask a question (e.g. "What do you mean by latency?")...'
                        : 'Enter specific metric or ask a question...'
                    }
                    value={userInputText}
                    onChange={(e) => setUserInputText(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
                  />

                  <button
                    type="submit"
                    disabled={!userInputText.trim()}
                    className="flex items-center space-x-1.5 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md disabled:opacity-50 transition shrink-0"
                  >
                    <span>Submit</span>
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const currentGap = availableGaps[currentGapIndex];
                    const gapTitle = currentGap?.jd_requirement || 'this requirement';
                    const qText = `Could you clarify what details or metrics work best for "${gapTitle}"?`;
                    const clarification = generateAgenticClarification(gapTitle, qText);

                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `msg-${Date.now()}-u`,
                        sender: 'user',
                        text: qText,
                        timestamp: getTime()
                      },
                      {
                        id: `msg-${Date.now()}-a`,
                        sender: 'assistant',
                        text: clarification,
                        timestamp: getTime()
                      }
                    ]);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold text-xs transition flex items-center justify-center gap-1.5 shrink-0"
                  title="Ask AI Agent for context, guidance, or real-world metric examples"
                >
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Ask Question / Get Example</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column (6 cols): Synthesized Bullets Review & Editing Panel */}
        <div className="lg:col-span-6 glass-panel rounded-2xl border border-slate-200 p-5 bg-white shadow-sm flex flex-col h-[650px] overflow-hidden space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-slate-900">
                  Proposed Google XYZ Bullets ({draftBullets.length})
                </h3>
                <p className="text-xs text-slate-500">Review, request custom edits, and approve bullets into your Master Vault.</p>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300">
              {draftBullets.filter((b) => b.status === 'APPROVED').length} Approved
            </span>
          </div>

          {draftBullets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
              <MessageSquare className="h-10 w-10 text-slate-400" />
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-slate-900">No Bullets Synthesized Yet</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Answer the interactive AI interview questions on the left. Synthesized Google XYZ bullets will appear here in real-time for your review and editing!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {draftBullets.map((bullet) => {
                const isApproved = bullet.status === 'APPROVED';
                const isEditing = editingBulletId === bullet.id;

                return (
                  <div
                    key={bullet.id}
                    className={`p-4 rounded-xl border transition space-y-3 ${
                      isApproved
                        ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
                        : 'bg-white border-amber-200 shadow-sm hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {bullet.gap_title}
                      </span>

                      {isApproved ? (
                        <span className="flex items-center space-x-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          <Check className="h-3 w-3" />
                          <span>Approved & Committed</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                          Pending Approval
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                      "{bullet.synthesized_bullet}"
                    </p>

                    {/* Bullet Actions */}
                    {!isApproved && !isEditing && (
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => handleApproveBullet(bullet.id)}
                          className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow transition"
                        >
                          <Database className="h-3.5 w-3.5" />
                          <span>Approve & Add to Master Vault</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingBulletId(bullet.id);
                            setEditGuidanceInput('');
                          }}
                          className="flex items-center space-x-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 transition shrink-0"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Edit Bullet</span>
                        </button>
                      </div>
                    )}

                    {/* Inline Edit Form */}
                    {isEditing && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 space-y-2 animate-fadeIn">
                        <label className="block text-[11px] font-bold text-amber-900">
                          Provide edit guidance (e.g., "Make it sound more executive", "Change 35% to 45%"):
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Type your desired edits or tone changes here..."
                          value={editGuidanceInput}
                          onChange={(e) => setEditGuidanceInput(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-purple-500"
                        />

                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingBulletId(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleResynthesizeBullet(bullet.id)}
                            disabled={!editGuidanceInput.trim()}
                            className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 shadow disabled:opacity-50 flex items-center space-x-1"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Re-Synthesize</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
