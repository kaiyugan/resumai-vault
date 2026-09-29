import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Profile,
  MasterExperience,
  MasterAchievement,
  MasterEducation,
  MasterSkill,
  TargetJob,
  JDMatchItem,
  ElicitationSession,
  ElicitationMessage,
  GeneratedResume,
  ResumeStyleId
} from '../types/resume';
import {
  initialProfile,
  initialExperiences,
  initialAchievements,
  initialEducations,
  initialSkills,
  initialTargetJobs
} from '../data/mockData';
import { sanitizeText, spellCheckAndPolishBullet, isHeaderDuplicate } from '../utils/textSanitizer';
import { telemetry } from '../services/telemetryService';

interface ResumeContextType {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  experiences: MasterExperience[];
  achievements: MasterAchievement[];
  educations: MasterEducation[];
  skills: MasterSkill[];
  targetJobs: TargetJob[];
  selectedJobId: string;
  setSelectedJobId: (id: string) => void;
  selectedJob: TargetJob | undefined;
  matchItems: JDMatchItem[];
  elicitationSessions: ElicitationSession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  activeSession: ElicitationSession | undefined;
  generatedResume: GeneratedResume | null;
  selectedStyle: ResumeStyleId;
  setSelectedStyle: (style: ResumeStyleId) => void;
  
  step: number;
  setStep: (step: number) => void;
  currentJob: TargetJob | null;
  setCurrentJob: (job: TargetJob | null) => void;
  finalizeAndSaveApplication: (resumePayload: any) => Promise<void>;
  saveJobApplicationState: (stepNum: number, stateUpdate?: any) => Promise<void>;

  // Actions
  addExperience: (exp: Omit<MasterExperience, 'id' | 'created_at'>) => void;
  addAchievement: (ach: Omit<MasterAchievement, 'id' | 'created_at'>) => void;
  updateAchievement: (id: string, bulletText: string, metricVal?: string) => void;
  deleteAchievement: (id: string) => void;
  ingestUnstructuredText: (rawText: string) => Promise<boolean>;
  addTargetJob: (job: Omit<TargetJob, 'id' | 'created_at'>) => void;
  addJobFromURL: (url: string) => Promise<boolean>;
  startElicitation: (matchItem: JDMatchItem) => void;
  sendElicitationMessage: (text: string) => void;
  commitXYZBulletToVault: (sessionId: string) => void;
  commitDirectXYZBulletToVault: (requirement: string, synthesizedBullet: string, metricValue?: string) => void;
  runQualityPolishOnAllBullets: () => void;
  calculateATSScore: () => number;
  compilationTimestamp: string;
  loadDemoData: () => void;
  clearVault: () => void;
}

const anyKeywordIn = (text: string, keywords: string[]): boolean => {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
};

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [experiences, setExperiences] = useState<MasterExperience[]>(initialExperiences);
  const [achievements, setAchievements] = useState<MasterAchievement[]>(initialAchievements);
  const [educations] = useState<MasterEducation[]>(initialEducations);
  const [skills, setSkills] = useState<MasterSkill[]>(initialSkills);
  const [targetJobs, setTargetJobs] = useState<TargetJob[]>(initialTargetJobs);
  const [selectedJobId, setSelectedJobId] = useState<string>('job-1');
  const [matchItems, setMatchItems] = useState<JDMatchItem[]>([]);
  const [elicitationSessions, setElicitationSessions] = useState<ElicitationSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [generatedResume] = useState<GeneratedResume | null>(null);
  const [compilationTimestamp] = useState<string>(new Date().toLocaleDateString());
  const [selectedStyle, setSelectedStyleState] = useState<ResumeStyleId>('classic');
  const [step, setStepState] = useState<number>(1);
  const [currentJob, setCurrentJobState] = useState<TargetJob | null>(initialTargetJobs[0] || null);

  const setStep = (newStep: number) => {
    setStepState(newStep);
    telemetry.trackEvent({
      event_name: 'step_navigated',
      step_number: newStep,
      metadata: { job_id: currentJob?.id, job_title: currentJob?.title }
    });
  };

  const setSelectedStyle = (style: ResumeStyleId) => {
    setSelectedStyleState(style);
    telemetry.trackEvent({
      event_name: 'theme_selected',
      metadata: { style_id: style }
    });
  };

  const setCurrentJob = (job: TargetJob | null) => {
    setCurrentJobState(job);
    if (job) {
      setSelectedJobId(job.id);
      telemetry.trackEvent({
        event_name: 'job_selected',
        metadata: { job_id: job.id, job_title: job.title, company: job.company }
      });
    }
  };

  const saveJobApplicationState = async (stepNum: number, stateUpdate?: any) => {
    if (!currentJob) return;
    try {
      const { updateJobStateAPI } = await import('../services/apiClient');
      const updated = await updateJobStateAPI(currentJob.id, {
        current_step: stepNum,
        selected_theme: selectedStyle,
        ats_score: calculateATSScore(),
        ...stateUpdate
      });
      if (updated) {
        setCurrentJobState(updated);
      }
      telemetry.trackEvent({
        event_name: 'application_state_saved',
        step_number: stepNum,
        ats_score_tailored: calculateATSScore(),
        metadata: { job_id: currentJob.id }
      });
    } catch (e) {
      console.warn('Auto-save application state warning:', e);
    }
  };

  const finalizeAndSaveApplication = async (resumePayload: any) => {
    if (!currentJob) return;
    try {
      const { updateJobStateAPI } = await import('../services/apiClient');
      const score = calculateATSScore();
      const updated = await updateJobStateAPI(currentJob.id, {
        current_step: 4,
        status: 'FINALIZED',
        selected_theme: selectedStyle,
        ats_score: score,
        tailored_resume_payload: resumePayload
      });
      if (updated) {
        setCurrentJobState(updated);
      }
      telemetry.trackEvent({
        event_name: 'resume_exported',
        step_number: 4,
        ats_score_tailored: score,
        metadata: { job_id: currentJob.id, theme: selectedStyle }
      });
    } catch (e) {
      console.warn('Finalize application error:', e);
    }
  };

  const selectedJob = currentJob || targetJobs.find((j) => j.id === selectedJobId) || targetJobs[0];
  const activeSession = elicitationSessions.find((s) => s.id === activeSessionId);

  // Recalculate dynamic matches whenever target job or achievements change
  useEffect(() => {
    if (!selectedJob) {
      setMatchItems([]);
      return;
    }

    const computeMatches = (job: TargetJob, achievementsList: MasterAchievement[]): JDMatchItem[] => {
      let reqs: string[] = [];
      if (job.parsed_responsibilities && job.parsed_responsibilities.length > 0) {
        reqs.push(...job.parsed_responsibilities);
      }
      if (job.parsed_hard_skills && job.parsed_hard_skills.length > 0) {
        reqs.push(...job.parsed_hard_skills);
      }
      if (job.parsed_metrics && job.parsed_metrics.length > 0) {
        reqs.push(...job.parsed_metrics);
      }

      reqs = Array.from(new Set(reqs.map((r) => r.trim()))).filter((r) => r.length > 3);

      if (reqs.length === 0 && job.raw_description) {
        const lines = job.raw_description
          .split('\n')
          .map((l) => l.trim().replace(/^[•\-*\d.]+\s*/, ''))
          .filter((l) => l.length > 15 && l.length < 120);
        reqs = lines.slice(0, 6);
      }

      if (reqs.length === 0) {
        reqs = ['Core Role Responsibilities', 'Domain & Technical Mastery', 'Key Performance Metrics Delivery'];
      }

      const stopWords = new Set([
        'with', 'that', 'this', 'from', 'have', 'your', 'and', 'for', 'the', 'into', 'over', 'across', 'through',
        'lead', 'manage', 'drive', 'work', 'using', 'build', 'team', 'teams', 'experience', 'ability', 'skills', 'role'
      ]);

      return reqs.map((req, idx) => {
        const reqLower = req.toLowerCase();
        const reqWords = reqLower.split(/\W+/).filter((w) => w.length > 2 && !stopWords.has(w));

        let bestScore = 0;
        let bestAch: MasterAchievement | null = null;

        for (const ach of achievementsList) {
          const achLower = ach.raw_bullet.toLowerCase();
          const tagsLower = (ach.vector_tags || []).map((t) => t.toLowerCase()).join(' ');
          const achWords = new Set(achLower.split(/\W+/).concat(tagsLower.split(/\W+/)));

          if (reqWords.length === 0) continue;

          let matchCount = 0;
          for (const w of reqWords) {
            if (achWords.has(w) || achLower.includes(w)) {
              matchCount++;
            }
          }

          let bonus = 0;
          if (achLower.includes(reqLower) || reqLower.includes(achLower)) {
            bonus = 0.35;
          }

          const score = Math.min(0.98, (matchCount / (reqWords.length || 1)) + bonus);

          if (score > bestScore) {
            bestScore = score;
            bestAch = ach;
          }
        }

        const hasMetric = Boolean(
          bestAch &&
            bestAch.quantified_metric &&
            bestAch.quantified_metric.value
        );

        if (bestScore >= 0.40 && bestAch) {
          if (hasMetric) {
            return {
              id: `match-${job.id}-${idx}`,
              jd_requirement: req,
              category: 'FULL_MATCH' as const,
              similarity_score: Math.max(0.85, Math.round(bestScore * 100) / 100),
              matched_achievement_id: bestAch.id,
              matched_achievement_bullet: bestAch.raw_bullet,
              metric_missing: false,
              reason: `Verified match with Master Vault achievement (${bestAch.quantified_metric.value || 'Verified Metric'}).`
            };
          } else {
            return {
              id: `match-${job.id}-${idx}`,
              jd_requirement: req,
              category: 'UNQUANTIFIED_MATCH' as const,
              similarity_score: Math.max(0.78, Math.round(bestScore * 100) / 100),
              matched_achievement_id: bestAch.id,
              matched_achievement_bullet: bestAch.raw_bullet,
              metric_missing: true,
              reason: `High relevance to vault achievement, but missing concrete quantified metric.`
            };
          }
        } else {
          return {
            id: `match-${job.id}-${idx}`,
            jd_requirement: req,
            category: 'POTENTIAL_GAP' as const,
            similarity_score: Math.min(0.55, Math.round(bestScore * 100) / 100),
            matched_achievement_id: undefined,
            matched_achievement_bullet: undefined,
            metric_missing: true,
            reason: `No explicit achievement or metric indexed in Master Vault for this target requirement.`
          };
        }
      });
    };

    const updatedMatches = computeMatches(selectedJob, achievements);
    setMatchItems(updatedMatches);
  }, [selectedJobId, selectedJob, achievements, targetJobs]);

  // Actions
  const addExperience = (exp: Omit<MasterExperience, 'id' | 'created_at'>) => {
    const newExp: MasterExperience = {
      ...exp,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setExperiences((prev) => [newExp, ...prev]);
  };

  const addAchievement = (ach: Omit<MasterAchievement, 'id' | 'created_at'>) => {
    const newAch: MasterAchievement = {
      ...ach,
      id: `ach-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setAchievements((prev) => [...prev, newAch]);
  };

  const updateAchievement = (id: string, bulletText: string, metricVal?: string) => {
    setAchievements((prev) =>
      prev.map((ach) => {
        if (ach.id === id) {
          return {
            ...ach,
            raw_bullet: bulletText,
            quantified_metric: metricVal ? { value: metricVal } : ach.quantified_metric
          };
        }
        return ach;
      })
    );
  };

  const deleteAchievement = (id: string) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  };

  const ingestUnstructuredText = async (rawText: string): Promise<boolean> => {
    try {
      const { ingestTextAPI } = await import('../services/apiClient');
      const res = await ingestTextAPI(rawText, profile.id);
      
      if (res && res.parsed_data) {
        const pd = res.parsed_data;
        const p = pd.profile || {};
        
        // Update Profile
        setProfile((prev) => ({
          ...prev,
          name: p.name || prev.name,
          title: p.title || prev.title,
          email: p.email || prev.email,
          phone: p.phone || prev.phone,
          location: p.location || prev.location,
          linkedin: p.linkedin || prev.linkedin,
          summary: p.summary || prev.summary
        }));

        // Update Experiences (replace default or append)
        if (pd.experiences && pd.experiences.length > 0) {
          const newExps: MasterExperience[] = pd.experiences.map((e: any, idx: number) => ({
            id: e.id || `exp-ingest-${Date.now()}-${idx}`,
            profile_id: profile.id,
            company: e.company || 'Organization',
            role_title: e.role_title || 'Role Title',
            location: e.location || 'Location',
            start_date: e.start_date || '2022-01-01',
            end_date: e.end_date || 'Present',
            is_current: e.is_current ?? true,
            raw_summary: e.raw_summary || '',
            skills_used: e.skills_used || [],
            created_at: new Date().toISOString()
          }));
          
          setExperiences(newExps);

          // Update Achievements
          if (pd.achievements && pd.achievements.length > 0) {
            const newAchs: MasterAchievement[] = pd.achievements.map((a: any, idx: number) => ({
              id: a.id || `ach-ingest-${Date.now()}-${idx}`,
              experience_id: a.experience_id || newExps[0]?.id || 'exp-1',
              raw_bullet: a.raw_bullet,
              quantified_metric: a.quantified_metric || {},
              action_verb: a.action_verb || a.raw_bullet.split(' ')[0] || 'Achieved',
              context: a.context || 'Ingested Career Bullet',
              vector_tags: a.vector_tags || ['Uploaded Resume'],
              created_at: new Date().toISOString()
            }));
            setAchievements(newAchs);
          }
        }

        // Update Skills
        if (pd.skills && pd.skills.length > 0) {
          const newSkills: MasterSkill[] = pd.skills.map((sk: string, idx: number) => ({
            id: `sk-ingest-${Date.now()}-${idx}`,
            name: sk,
            category: 'Hard Skill',
            years_experience: 3
          }));
          setSkills(newSkills);
        }

        return true;
      }
    } catch (err) {
      console.warn('Backend API ingestion offline, running client-side multi-entity extraction:', err);
    }

    // Helper to validate clean human-readable strings (filtering binary garbage like tWcl, y?UE, (@)
    const isValidReadableString = (str: string) => {
      if (!str || str.trim().length < 3) return false;
      const letters = str.match(/[a-zA-Z]/g) || [];
      if (letters.length < 3) return false;
      // Reject binary PDF token symbols
      if (/^[\W_]+$/.test(str)) return false;
      const words = str.match(/[a-zA-Z]{2,}/g) || [];
      return words.length > 0;
    };

    // Client-side Fallback Multi-Entity Parsing
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => isValidReadableString(l));

    if (lines.length === 0) return false;

    // Contact info
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = rawText.match(/\+?\d[\d\s\-()]{8,}/);
    const linkedinMatch = rawText.match(/linkedin\.com\/in\/[\w-]+/);

    const firstLineCandidate = lines[0] && !lines[0].includes('@') && isValidReadableString(lines[0]) ? lines[0].slice(0, 40) : '';
    const parsedName = firstLineCandidate || profile.name;
    const parsedEmail = emailMatch ? emailMatch[0] : profile.email;
    const parsedPhone = phoneMatch ? phoneMatch[0] : profile.phone;
    const parsedLinkedin = linkedinMatch ? linkedinMatch[0] : profile.linkedin;

    // Search for Candidate Role Title
    let candidateTitle = profile.title;
    for (const l of lines.slice(0, 10)) {
      if (anyKeywordIn(l, ['manager', 'lead', 'director', 'engineer', 'recruiting', 'specialist', 'architect', 'consultant', 'analyst', 'developer'])) {
        if (!l.includes('@') && l.length < 60 && isValidReadableString(l)) {
          candidateTitle = l;
          break;
        }
      }
    }

    // Search for Summary
    let parsedSummary = '';
    const summaryIdx = lines.findIndex((l) => l.toUpperCase().includes('SUMMARY') || l.toUpperCase().includes('PROFILE'));
    if (summaryIdx !== -1 && lines[summaryIdx + 1] && isValidReadableString(lines[summaryIdx + 1])) {
      parsedSummary = lines[summaryIdx + 1];
    } else {
      parsedSummary = `Experienced ${candidateTitle} with a strong history of leading key initiatives, optimizing operational workflows, and driving high-impact results.`;
    }

    setProfile({
      ...profile,
      name: parsedName,
      title: candidateTitle,
      email: parsedEmail,
      phone: parsedPhone,
      linkedin: parsedLinkedin,
      summary: parsedSummary
    });

    // Detect multiple experiences
    const parsedExperiences: MasterExperience[] = [];
    const parsedAchievements: MasterAchievement[] = [];
    
    // Group lines into experience headers and bullets
    const headerRegex = /(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\b.*?(?:Present|\d{4}))/i;
    let currentExp: MasterExperience | null = null;

    lines.forEach((line, idx) => {
      const matchDate = line.match(headerRegex);
      const isHeader = matchDate || (line.includes('|') || line.includes('–') || anyKeywordIn(line, ['manager', 'engineer', 'lead', 'director', 'staffing', 'recruiting', 'consultant']));

      if (isHeader && !line.startsWith('•') && !line.startsWith('-') && line.length < 90 && isValidReadableString(line)) {
        const parts = line.split(/[|•–-]/).map((p) => p.trim()).filter((p) => isValidReadableString(p));
        const rawRole = parts[0] || 'Role Title';
        const rawCompany = parts[1] || 'Company / Organization';

        const role = isValidReadableString(rawRole) ? rawRole : candidateTitle;
        const company = isValidReadableString(rawCompany) ? rawCompany : 'Organization';
        const expId = `exp-parsed-${Date.now()}-${parsedExperiences.length + 1}`;

        currentExp = {
          id: expId,
          profile_id: profile.id,
          company: company,
          role_title: role,
          location: 'Remote / Hybrid',
          start_date: matchDate ? matchDate[0].split('–')[0]?.trim() || '2022-01-01' : '2022-01-01',
          end_date: line.toLowerCase().includes('present') ? 'Present' : '2024-01-01',
          is_current: line.toLowerCase().includes('present'),
          raw_summary: line,
          skills_used: [],
          created_at: new Date().toISOString()
        };
        parsedExperiences.push(currentExp);
      } else if (currentExp && line.length > 15 && isValidReadableString(line)) {
        const metricMatch = line.match(/\d+%|\$\d+|\d+\+/);
        parsedAchievements.push({
          id: `ach-parsed-${Date.now()}-${idx}`,
          experience_id: currentExp.id,
          raw_bullet: line.replace(/^[•\-*\d.]+\s*/, ''),
          quantified_metric: metricMatch ? { value: metricMatch[0] } : {},
          action_verb: line.split(' ')[0] || 'Achieved',
          context: `Ingested Bullet for ${currentExp.company}`,
          vector_tags: ['Uploaded Resume', currentExp.company],
          created_at: new Date().toISOString()
        });
      }
    });

    if (parsedExperiences.length > 0) {
      setExperiences(parsedExperiences);
      setAchievements(parsedAchievements);
    } else {
      // Fallback single experience if formatting was unstructured plain paragraph
      const fallbackExpId = `exp-parsed-${Date.now()}`;
      const fallbackExp: MasterExperience = {
        id: fallbackExpId,
        profile_id: profile.id,
        company: 'Career History',
        role_title: candidateTitle,
        location: 'City, State',
        start_date: '2022-01-01',
        is_current: true,
        raw_summary: rawText.slice(0, 250),
        skills_used: [],
        created_at: new Date().toISOString()
      };
      setExperiences([fallbackExp]);

      const fallbackAchs = lines
        .filter((l) => l.length > 20 && isValidReadableString(l))
        .map((l, i) => ({
          id: `ach-fallback-${Date.now()}-${i}`,
          experience_id: fallbackExpId,
          raw_bullet: l.replace(/^[•\-*\d.]+\s*/, ''),
          quantified_metric: {},
          action_verb: l.split(' ')[0] || 'Achieved',
          context: 'Parsed Resume',
          vector_tags: ['Uploaded Resume'],
          created_at: new Date().toISOString()
        }));
      setAchievements(fallbackAchs);
    }

    // Extract Skills cleanly
    const knownSkills = [
      'Recruiting Strategy', 'Technical Staffing', 'Talent Acquisition', 'LATAM Expansion', 'Team Leadership',
      'Pipeline Management', 'Workday', 'Greenhouse', 'Sourcing', 'TypeScript', 'JavaScript', 'Python',
      'Next.js', 'React', 'FastAPI', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Project Management',
      'Product Strategy', 'Data Analytics', 'SQL', 'Git', 'Agile', 'Scrum'
    ];
    const foundSkills = knownSkills.filter((s) => rawText.toLowerCase().includes(s.toLowerCase()));
    if (foundSkills.length > 0) {
      setSkills(
        foundSkills.map((s, idx) => ({
          id: `sk-parsed-${Date.now()}-${idx}`,
          name: s,
          category: 'Hard Skill',
          years_experience: 3
        }))
      );
    }

    return true;
  };

  const addTargetJob = (job: Omit<TargetJob, 'id' | 'created_at'>) => {
    const newJob: TargetJob = {
      ...job,
      id: `job-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setTargetJobs((prev) => [newJob, ...prev]);
    setSelectedJobId(newJob.id);
  };

  const addJobFromURL = async (url: string): Promise<boolean> => {
    try {
      const { deconstructJobURLAPI } = await import('../services/apiClient');
      const res = await deconstructJobURLAPI(url);
      if (res) {
        const newJob: TargetJob = {
          id: res.id || `job-${Date.now()}`,
          title: res.title,
          company: res.company,
          location: res.location,
          raw_description: res.raw_description,
          parsed_hard_skills: res.parsed_hard_skills || [],
          parsed_soft_skills: res.parsed_soft_skills || [],
          parsed_responsibilities: res.parsed_responsibilities || [],
          parsed_metrics: res.parsed_metrics || [],
          company_intelligence: res.company_intelligence,
          created_at: new Date().toISOString()
        };
        setTargetJobs((prev) => [newJob, ...prev]);
        setSelectedJobId(newJob.id);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('URL parsing backend fallback:', err);
      // Client-side fallback if server offline
      let extractedTitle = 'Target Role';
      let companyName = 'Target Company';

      const slugMatch = url.match(/\/view\/([a-zA-Z0-9-]+)/) || url.match(/([a-zA-Z0-9-]+(?:-at-|-role-)[a-zA-Z0-9-]+)/);
      if (slugMatch) {
        const slug = slugMatch[1].replace(/-/g, ' ');
        if (slug.toLowerCase().includes(' at ')) {
          const parts = slug.split(/\s+at\s+/i);
          extractedTitle = parts[0].replace(/\b\w/g, (c) => c.toUpperCase());
          companyName = parts[1].replace(/\b\w/g, (c) => c.toUpperCase());
        } else {
          extractedTitle = slug.replace(/\b\w/g, (c) => c.toUpperCase());
        }
      }

      if (companyName === 'Target Company') {
        const domain = url.match(/https?:\/\/(?:www\.)?([^/]+)/)?.[1] || 'Company';
        const dName = domain.split('.')[0];
        if (!['linkedin', 'greenhouse', 'lever', 'workday', 'indeed'].includes(dName.toLowerCase())) {
          companyName = dName.toUpperCase();
        }
      }

      const urlLower = (extractedTitle + " " + url).toLowerCase();
      const isRecruiting = ['recruiting', 'staffing', 'talent', 'sourcing', 'hiring', 'workday', 'greenhouse'].some((k) => urlLower.includes(k));
      const isSales = ['sales', 'account', 'quota', 'pipeline', 'revenue', 'crm'].some((k) => urlLower.includes(k));

      let hardSkills = ['Strategic Operations', 'Process Optimization', 'Resource Allocation'];
      let softSkills = ['Executive Leadership', 'Stakeholder Management'];
      let responsibilities = ['Lead key organizational initiatives', 'Optimize workflow and delivery targets'];
      let metrics = ['Target Attainment > 100%', 'Operational Efficiency +30%'];

      if (isRecruiting) {
        hardSkills = ['Technical Staffing', 'Recruiting Strategy', 'Talent Acquisition', 'LATAM Expansion', 'Pipeline Management', 'Workday / Greenhouse'];
        softSkills = ['Inclusive Leadership', 'Executive Alignment', 'Mentorship & Growth'];
        responsibilities = [
          'Lead and mentor recruiting teams supporting technical and business expansions',
          'Partner with senior executive leadership to achieve organizational staffing goals',
          'Optimize recruitment workflows through AI integration and candidate sourcing'
        ];
        metrics = ['Staffing Target Attainment', 'Manager Inclusion Feedback Top 20%', 'Turnaround Time Reduction'];
      } else if (isSales) {
        hardSkills = ['Sales Strategy', 'Account Management', 'Enterprise Pipeline Growth', 'CRM & Salesforce', 'Deal Structuring'];
        softSkills = ['Client Relationship Building', 'Executive Pitching', 'Negotiation'];
        responsibilities = [
          'Drive enterprise pipeline growth and revenue expansion across key accounts',
          'Partner with executive stakeholders to negotiate and close complex deals'
        ];
        metrics = ['Quota Attainment > 100%', 'ARR Growth', 'Pipeline Conversion Rate'];
      }

      const fallbackJob: TargetJob = {
        id: `job-${Date.now()}`,
        title: extractedTitle,
        company: companyName,
        location: 'Remote / Hybrid',
        raw_description: `Imported from URL: ${url}\n\nPosition: ${extractedTitle} at ${companyName}. Focuses on leadership, strategy, stakeholder alignment, and achieving target operational metrics.`,
        parsed_hard_skills: hardSkills,
        parsed_soft_skills: softSkills,
        parsed_responsibilities: responsibilities,
        parsed_metrics: metrics,
        company_intelligence: {
          mission_statement: `Driving excellence and product innovation at ${companyName}.`,
          core_values: ['Leadership Rigor', 'Customer Success', 'Strategic Execution'],
          culture_insights: 'Engaged, high-performance team prioritizing rapid execution and strategic alignment.',
          first_impression_hooks: [
            `Emphasize your track record of achieving target metrics in your introduction.`,
            `Highlight your experience leading cross-functional teams and managing key stakeholders.`,
            `Ask insightful questions about ${companyName}'s strategic growth roadmap.`
          ]
        },
        created_at: new Date().toISOString()
      };
      setTargetJobs((prev) => [fallbackJob, ...prev]);
      setSelectedJobId(fallbackJob.id);
      return true;
    }
  };

  const startElicitation = (matchItem: JDMatchItem) => {
    if (!selectedJob) return;

    // Check if session already exists for this gap/item
    const existing = elicitationSessions.find((s) => s.target_requirement === matchItem.jd_requirement);
    if (existing) {
      setActiveSessionId(existing.id);
      return;
    }

    let question = '';
    if (matchItem.category === 'UNQUANTIFIED_MATCH') {
      question = `In your role where you "${matchItem.matched_achievement_bullet}", what was the concrete metric or percentage outcome? For example, how many engineers were impacted, or by what percentage did throughput/velocity improve?`;
    } else {
      question = `The target position requires expertise in "${matchItem.jd_requirement}". Have you worked on a project involving this? If so, what specific action did you take and what quantifiable outcome resulted from it?`;
    }

    const newSession: ElicitationSession = {
      id: `session-${Date.now()}`,
      target_job_id: selectedJob.id,
      gap_title: matchItem.jd_requirement,
      target_requirement: matchItem.jd_requirement,
      generated_question: question,
      status: 'PENDING',
      messages: [
        {
          id: `msg-1`,
          sender: 'assistant',
          text: question,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          gapId: matchItem.id
        }
      ]
    };

    setElicitationSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  const sendElicitationMessage = async (userText: string) => {
    if (!activeSessionId) return;

    const currentSession = elicitationSessions.find((s) => s.id === activeSessionId);
    if (!currentSession) return;

    const userMsg: ElicitationMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update session with user message
    setElicitationSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s))
    );

    // Simulate LLM Synthesis of Google XYZ Bullet:
    // Accomplished [X], as measured by [Y], by doing [Z]
    setTimeout(() => {
      let xyzBullet = '';
      const numbers = userText.match(/\d+%/g) || userText.match(/\$\d+[\d,.]*/g) || userText.match(/\b\d+\b/g);
      const metricStr = numbers ? numbers.join(', ') : 'quantified performance targets';
      const cleanUserText = userText.trim().replace(/\.$/, '');

      if (currentSession.target_requirement) {
        xyzBullet = `Accomplished ${currentSession.target_requirement}, as measured by ${metricStr}, by executing ${cleanUserText}.`;
      } else {
        xyzBullet = `Enhanced operational impact, as measured by ${metricStr}, by delivering ${cleanUserText}.`;
      }

      const assistantMsg: ElicitationMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: `Based on your answer, I have synthesized a high-impact **Google XYZ bullet point**:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isProposal: true,
        proposedXYZBullet: xyzBullet
      };

      setElicitationSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                synthesized_bullet: xyzBullet,
                messages: [...s.messages, assistantMsg]
              }
            : s
        )
      );
    }, 1000);
  };

  const commitXYZBulletToVault = (sessionId: string) => {
    const session = elicitationSessions.find((s) => s.id === sessionId);
    if (!session || !session.synthesized_bullet) return;

    // Create new Master Achievement
    const newAchievement: MasterAchievement = {
      id: `ach-xyz-${Date.now()}`,
      experience_id: experiences[0]?.id || 'exp-1',
      raw_bullet: session.synthesized_bullet,
      quantified_metric: { value: 'Verified Metric' },
      action_verb: session.synthesized_bullet.split(' ')[0] || 'Accomplished',
      context: session.gap_title,
      vector_tags: ['Google XYZ Synthesized', session.gap_title],
      created_at: new Date().toISOString()
    };

    setAchievements((prev) => [newAchievement, ...prev]);

    // Update match item status to FULL_MATCH!
    setMatchItems((prev) =>
      prev.map((m) => {
        if (m.jd_requirement === session.target_requirement) {
          return {
            ...m,
            category: 'FULL_MATCH',
            similarity_score: 0.95,
            matched_achievement_id: newAchievement.id,
            matched_achievement_bullet: newAchievement.raw_bullet,
            reason: 'Newly synthesized Google XYZ metric committed to Master Vault!'
          };
        }
        return m;
      })
    );

    // Update session status
    setElicitationSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'ANSWERED' } : s))
    );
  };

  const commitDirectXYZBulletToVault = (requirement: string, synthesizedBullet: string, metricValue?: string) => {
    const newAchievement: MasterAchievement = {
      id: `ach-xyz-${Date.now()}`,
      experience_id: experiences[0]?.id || 'exp-1',
      raw_bullet: synthesizedBullet,
      quantified_metric: { value: metricValue || 'Verified Impact' },
      action_verb: synthesizedBullet.split(' ')[0] || 'Accomplished',
      context: requirement,
      vector_tags: ['Google XYZ Synthesized', requirement],
      created_at: new Date().toISOString()
    };

    setAchievements((prev) => [newAchievement, ...prev]);

    setMatchItems((prev) =>
      prev.map((m) => {
        if (m.jd_requirement === requirement) {
          return {
            ...m,
            category: 'FULL_MATCH',
            similarity_score: 0.95,
            matched_achievement_id: newAchievement.id,
            matched_achievement_bullet: newAchievement.raw_bullet,
            reason: 'Newly synthesized Google XYZ metric committed to Master Vault!'
          };
        }
        return m;
      })
    );
  };

  const runQualityPolishOnAllBullets = () => {
    setProfile((prev) => ({
      ...prev,
      name: sanitizeText(prev.name),
      title: sanitizeText(prev.title),
      summary: spellCheckAndPolishBullet(prev.summary || '')
    }));

    setExperiences((prevExps) =>
      prevExps.map((e) => ({
        ...e,
        company: sanitizeText(e.company),
        role_title: sanitizeText(e.role_title),
        location: sanitizeText(e.location)
      }))
    );

    setAchievements((prevAchs) =>
      prevAchs
        .filter((a) => !isHeaderDuplicate(a.raw_bullet))
        .map((a) => ({
          ...a,
          raw_bullet: spellCheckAndPolishBullet(a.raw_bullet)
        }))
    );
  };

  const calculateATSScore = () => {
    if (matchItems.length === 0) return 85;
    const fullMatches = matchItems.filter((m) => m.category === 'FULL_MATCH').length;
    const unquantified = matchItems.filter((m) => m.category === 'UNQUANTIFIED_MATCH').length;
    const total = matchItems.length;

    const rawScore = ((fullMatches * 1.0 + unquantified * 0.6) / total) * 100;
    return Math.min(98, Math.round(rawScore));
  };

  const loadDemoData = () => {
    setProfile(initialProfile);
    setExperiences(initialExperiences);
    setAchievements(initialAchievements);
    setSkills(initialSkills);
  };

  const clearVault = () => {
    setExperiences([]);
    setAchievements([]);
    setSkills([]);
  };

  return (
    <ResumeContext.Provider
      value={{
        profile,
        setProfile,
        experiences,
        achievements,
        educations,
        skills,
        targetJobs,
        selectedJobId,
        setSelectedJobId,
        selectedJob,
        matchItems,
        elicitationSessions,
        activeSessionId,
        setActiveSessionId,
        activeSession,
        generatedResume,
        selectedStyle,
        setSelectedStyle,
        step,
        setStep,
        currentJob,
        setCurrentJob,
        finalizeAndSaveApplication,
        saveJobApplicationState,
        addExperience,
        addAchievement,
        updateAchievement,
        deleteAchievement,
        ingestUnstructuredText,
        addTargetJob,
        addJobFromURL,
        startElicitation,
        sendElicitationMessage,
        commitXYZBulletToVault,
        commitDirectXYZBulletToVault,
        runQualityPolishOnAllBullets,
        calculateATSScore,
        compilationTimestamp,
        loadDemoData,
        clearVault
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};
