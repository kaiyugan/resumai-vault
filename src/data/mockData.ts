import type {
  Profile,
  MasterExperience,
  MasterAchievement,
  MasterEducation,
  MasterSkill,
  TargetJob,
  JDMatchItem
} from '../types/resume';

export const initialProfile: Profile = {
  id: 'prof-1',
  name: 'Candidate Name',
  email: 'candidate@example.com',
  title: 'Target Professional Title',
  phone: '+1 (555) 000-0000',
  location: 'City, State',
  linkedin: 'linkedin.com/in/candidate',
  github: 'github.com/candidate'
};

export const initialExperiences: MasterExperience[] = [];
export const initialAchievements: MasterAchievement[] = [];
export const initialEducations: MasterEducation[] = [];
export const initialSkills: MasterSkill[] = [];
export const initialTargetJobs: TargetJob[] = [];
export const sampleMatchesForJob1: JDMatchItem[] = [];
