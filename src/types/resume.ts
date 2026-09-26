export interface Profile {
  id: string;
  name: string;
  email: string;
  title: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary?: string;
}

export interface MasterExperience {
  id: string;
  profile_id: string;
  company: string;
  role_title: string;
  location: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  raw_summary: string;
  skills_used: string[];
  embedding_simulated?: number[];
  created_at: string;
}

export interface QuantifiedMetric {
  value?: string; // e.g., "40%", "$1.2M", "250ms"
  type?: 'performance' | 'revenue' | 'scale' | 'efficiency' | 'quality';
  label?: string;
}

export interface MasterAchievement {
  id: string;
  experience_id: string;
  raw_bullet: string;
  quantified_metric: QuantifiedMetric;
  action_verb: string;
  context: string;
  vector_tags: string[];
  created_at: string;
}

export interface MasterEducation {
  id: string;
  degree: string;
  field_of_study: string;
  institution: string;
  location: string;
  start_date: string;
  end_date: string;
  gpa?: string;
  honors?: string[];
}

export interface MasterProject {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  url?: string;
  achievements: string[];
}

export interface MasterSkill {
  id: string;
  name: string;
  category: 'Hard Skill' | 'Soft Skill' | 'Tool & Framework' | 'Domain Responsibility';
  years_experience: number;
}

export interface CompanyIntelligence {
  mission_statement?: string;
  core_values?: string[];
  culture_insights?: string;
  first_impression_hooks?: string[];
}

export interface TargetJob {
  id: string;
  title: string;
  company: string;
  location: string;
  raw_description: string;
  parsed_hard_skills: string[];
  parsed_soft_skills: string[];
  parsed_responsibilities: string[];
  parsed_metrics: string[];
  company_intelligence?: CompanyIntelligence;
  current_step?: number;
  status?: string;
  last_accessed_at?: string;
  tailored_resume_payload?: any;
  selected_theme?: string;
  ats_score?: number;
  created_at: string;
}

export type MatchCategory = 'FULL_MATCH' | 'UNQUANTIFIED_MATCH' | 'POTENTIAL_GAP';

export interface JDMatchItem {
  id: string;
  jd_requirement: string;
  category: MatchCategory;
  similarity_score: number; // 0.00 to 1.00
  matched_achievement_id?: string;
  matched_achievement_bullet?: string;
  reason: string;
  metric_missing?: boolean;
}

export interface ElicitationMessage {
  id: string;
  sender: 'system' | 'user' | 'assistant';
  text: string;
  timestamp: string;
  isProposal?: boolean;
  proposedXYZBullet?: string;
  gapId?: string;
}

export interface ElicitationSession {
  id: string;
  target_job_id: string;
  gap_title: string;
  target_requirement: string;
  generated_question: string;
  messages: ElicitationMessage[];
  synthesized_bullet?: string;
  status: 'PENDING' | 'ANSWERED' | 'SKIPPED';
}

export interface DraftXYZBullet {
  id: string;
  gap_title: string;
  target_requirement: string;
  user_action?: string;
  user_metric?: string;
  synthesized_bullet: string;
  status: 'PENDING' | 'APPROVED' | 'EDITING';
}

export type ResumeStyleId = 
  | 'classic'
  | 'modern_executive'
  | 'warm_modern'
  | 'minimalist'
  | 'leadership'
  | 'creative';

export interface GeneratedResume {
  id: string;
  target_job_id: string;
  profile_id: string;
  title: string;
  summary: string;
  selected_style?: ResumeStyleId;
  selected_achievements: {
    experience_id: string;
    achievement_ids: string[];
  }[];
  skills_highlighted: string[];
  ats_score: number;
  pdf_url?: string;
  docx_url?: string;
  created_at: string;
}
