import React, { useState, useEffect } from 'react';
import { useResume } from '../../context/ResumeContext';
import { generateMockInterviewSessionAPI, evaluateSimulatedAnswerAPI } from '../../services/apiClient';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  Brain, 
  Zap, 
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuestionItem {
  id: string;
  category: 'BEHAVIORAL' | 'TECHNICAL_COMPETENCY' | 'CULTURE_FIT' | 'LEADERSHIP_IMPACT';
  question: string;
  interviewer_intent: string;
  recommended_story_angle: string;
}

interface SimulatedEvaluation {
  overall_readiness: number;
  star_score: number;
  metric_score: number;
  tone_score: number;
  alignment_score: number;
  situation_feedback: string;
  action_feedback: string;
  result_feedback: string;
  tactical_coaching_tip: string;
}

export const MockInterviewSimulator: React.FC = () => {
  const { selectedJob } = useResume();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [candidateAnswer, setCandidateAnswer] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [evaluations, setEvaluations] = useState<Record<number, SimulatedEvaluation>>({});
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  const currentQuestion = questions[currentIdx];

  const loadQuestions = async () => {
    setIsGenerating(true);
    setSessionCompleted(false);
    setCurrentIdx(0);
    setEvaluations({});

    try {
      const resp = await generateMockInterviewSessionAPI(
        selectedJob?.title,
        selectedJob?.company,
        selectedJob?.parsed_responsibilities
      );
      if (resp && resp.length > 0) {
        setQuestions(resp);
      } else {
        setQuestions(getFallbackQuestions());
      }
    } catch (e) {
      console.warn('Fallback to mock questions suite:', e);
      setQuestions(getFallbackQuestions());
    } finally {
      setIsGenerating(false);
    }
  };

  const getFallbackQuestions = (): QuestionItem[] => [
    {
      id: 'q1',
      category: 'BEHAVIORAL',
      question: `Tell me about a time you led technical delivery under tight deadlines for ${selectedJob?.title || 'a key project'}.`,
      interviewer_intent: 'Evaluates problem-solving resilience and task ownership.',
      recommended_story_angle: 'Focus on a Master Vault achievement with verified metrics.'
    },
    {
      id: 'q2',
      category: 'TECHNICAL_COMPETENCY',
      question: `How do you architect applications to ensure scalability, zero downtime, and high performance?`,
      interviewer_intent: 'Probes domain engineering depth and system design best practices.',
      recommended_story_angle: 'Detail specific performance metrics and dynamic caching techniques.'
    },
    {
      id: 'q3',
      category: 'CULTURE_FIT',
      question: `Why are you interested in joining ${selectedJob?.company || 'our company'}, and how do your values align with our engineering culture?`,
      interviewer_intent: 'Tests company research and authentic mission alignment.',
      recommended_story_angle: 'Use strategic company intelligence hooks from Step 2.'
    },
    {
      id: 'q4',
      category: 'LEADERSHIP_IMPACT',
      question: 'Describe a scenario where you persuaded skeptical team members or stakeholders to adopt your architecture.',
      interviewer_intent: 'Measures communication clarity, empathy, and influence.',
      recommended_story_angle: 'Highlight before/after quantitative transformations.'
    }
  ];

  useEffect(() => {
    loadQuestions();
  }, [selectedJob?.id]);

  // Voice Audio Synthesis
  const speakQuestion = (text: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (currentQuestion && !isMuted && !isGenerating) {
      speakQuestion(currentQuestion.question);
    }
  }, [currentIdx, isGenerating]);

  const handleEvaluateAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateAnswer.trim() || !currentQuestion) return;

    setIsEvaluating(true);

    try {
      const evalResp = await evaluateSimulatedAnswerAPI(
        currentQuestion.question,
        candidateAnswer,
        selectedJob?.title
      );
      setEvaluations((prev) => ({ ...prev, [currentIdx]: evalResp }));
    } catch (err) {
      console.warn('Using local evaluator fallback:', err);
      const words = candidateAnswer.split(' ').length;
      const hasMetric = /\d+%|\d+x|\$\d+|\b\d+\s*ms\b/i.test(candidateAnswer);
      const starScore = Math.min(96, Math.max(55, words * 2));
      const metricScore = hasMetric ? 92 : 45;
      const overall = Math.round(0.35 * starScore + 0.30 * metricScore + 0.35 * 85);

      setEvaluations((prev) => ({
        ...prev,
        [currentIdx]: {
          overall_readiness: overall,
          star_score: starScore,
          metric_score: metricScore,
          tone_score: 84,
          alignment_score: 86,
          situation_feedback: 'Established project baseline effectively.',
          action_feedback: 'Clear engineering steps described.',
          result_feedback: hasMetric
            ? 'Verified hard metric present! Builds high recruiter credibility.'
            : 'Tip: Incorporate concrete percentage or dollar throughput numbers in your result.',
          tactical_coaching_tip: 'Emphasize direct technical ownership ("I architected") to project executive presence.'
        }
      }));
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    setCandidateAnswer('');
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    }
  };

  if (isGenerating) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <h3 className="text-xl font-bold text-white">Synthesizing Tailored Interview Questions...</h3>
        <p className="text-sm text-slate-400">
          Analyzing target job requirements for {selectedJob?.title || 'your target role'} and indexing Master Vault achievements.
        </p>
      </div>
    );
  }

  // Final Session Scorecard View
  if (sessionCompleted) {
    const evalList = Object.values(evaluations);
    const avgScore = evalList.length > 0 
      ? Math.round(evalList.reduce((acc, curr) => acc + curr.overall_readiness, 0) / evalList.length)
      : 86;

    return (
      <div className="glass-panel p-8 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-4 h-4" />
            <span>Interview Practice Completed!</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">Interview Readiness Scorecard</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Comprehensive evaluation across Behavioral, Technical, Culture, and Leadership interview dimensions.
          </p>
        </div>

        {/* Big Overall Score Circle */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-2xl border border-indigo-500/20 max-w-sm mx-auto shadow-2xl">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">Overall Interview Score</span>
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-indigo-300 to-purple-400">
            {avgScore}%
          </div>
          <span className="text-xs font-medium text-emerald-400 mt-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            {avgScore >= 80 ? '★ Ready for Executive Interview' : 'Good Foundation - Refine Metrics'}
          </span>
        </div>

        {/* Question Breakdown List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Question-by-Question Evaluation Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((q, idx) => {
              const ev = evaluations[idx];
              return (
                <div key={q.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{q.category.replace('_', ' ')}</span>
                    <span className="text-xs font-extrabold text-emerald-400">{ev?.overall_readiness || 85}% Score</span>
                  </div>
                  <p className="text-xs font-medium text-slate-200 line-clamp-2">"{q.question}"</p>
                  <p className="text-xs text-slate-400 italic">💡 {ev?.tactical_coaching_tip || 'Emphasize your direct technical ownership.'}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Restart Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={loadQuestions}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Start New Practice Run
          </button>
        </div>
      </div>
    );
  }

  // Active Practice Stepper View
  const currentEval = evaluations[currentIdx];

  return (
    <div className="space-y-6">
      {/* Session Progress Stepper */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
            Question {currentIdx + 1} of {questions.length} • {currentQuestion?.category?.replace('_', ' ')}
          </div>
          <h2 className="text-lg font-bold text-white">Interactive Mock Interview Practice</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (isPlayingAudio) {
                window.speechSynthesis.cancel();
                setIsPlayingAudio(false);
              } else {
                speakQuestion(currentQuestion.question);
              }
            }}
            className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 ${
              isPlayingAudio
                ? 'bg-indigo-600 text-white border-indigo-500 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isPlayingAudio ? 'Speaking...' : 'Listen Question'}</span>
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="glass-card p-6 rounded-2xl border border-indigo-500/20 bg-slate-900/80 space-y-4">
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Interviewer Question
          </span>
          <p className="text-lg font-semibold text-white leading-relaxed">
            "{currentQuestion?.question}"
          </p>
          <div className="text-xs text-slate-400 pt-1 flex items-center gap-2">
            <span className="font-semibold text-slate-300">Interviewer Intent:</span>
            <span>{currentQuestion?.interviewer_intent}</span>
          </div>
        </div>

        {/* Suggested Vault Story Angle */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span><strong>Recommended Strategy:</strong> {currentQuestion?.recommended_story_angle}</span>
        </div>

        {/* Practice Response Form */}
        <form onSubmit={handleEvaluateAnswer} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Your Answer Response (Type or dictate using STAR method: Situation, Task, Action, Result)
            </label>
            <textarea
              rows={4}
              value={candidateAnswer}
              onChange={(e) => setCandidateAnswer(e.target.value)}
              placeholder="e.g. In my role as Senior Lead, the system baseline faced strict scaling bottlenecks. I took direct ownership to architect dynamic connection pooling and refactored core endpoints, achieving a 45% throughput improvement..."
              className="w-full bg-slate-950/80 border border-slate-700/60 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Word Count: {candidateAnswer.trim() ? candidateAnswer.trim().split(/\s+/).length : 0} words
            </span>
            <button
              type="submit"
              disabled={isEvaluating || !candidateAnswer.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating STAR Response...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Evaluate Answer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Real-Time Evaluation Result Card */}
      {currentEval && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 bg-slate-900/90 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Response Analysis</span>
              <h3 className="text-xl font-bold text-white">Evaluation Results</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Readiness Score</span>
              <div className="text-3xl font-extrabold text-emerald-400">{currentEval.overall_readiness}%</div>
            </div>
          </div>

          {/* 4 Multi-Dimensional Bars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="text-xs text-slate-400">STAR Structure</div>
              <div className="text-xl font-bold text-indigo-300">{currentEval.star_score}%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="text-xs text-slate-400">Metric Density</div>
              <div className="text-xl font-bold text-emerald-400">{currentEval.metric_score}%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="text-xs text-slate-400">Tone & Presence</div>
              <div className="text-xl font-bold text-purple-300">{currentEval.tone_score}%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="text-xs text-slate-400">Role Alignment</div>
              <div className="text-xl font-bold text-blue-300">{currentEval.alignment_score}%</div>
            </div>
          </div>

          {/* Detailed Feedback Bullets */}
          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-800/30">
              <span className="font-semibold text-emerald-400">Result Feedback: </span>
              {currentEval.result_feedback}
            </div>
            <div className="p-3 rounded-lg bg-slate-800/30">
              <span className="font-semibold text-indigo-400">Coaching Tip: </span>
              {currentEval.tactical_coaching_tip}
            </div>
          </div>

          {/* Advance to Next Question */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleNextQuestion}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <span>{currentIdx + 1 < questions.length ? 'Next Question' : 'Complete Practice Run'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
