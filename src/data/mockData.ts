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
  name: '',
  email: '',
  title: '',
  phone: '',
  location: '',
  linkedin: '',
  github: ''
};

export const initialExperiences: MasterExperience[] = [];
export const initialAchievements: MasterAchievement[] = [];
export const initialEducations: MasterEducation[] = [];
export const initialSkills: MasterSkill[] = [];
export const initialTargetJobs: TargetJob[] = [];
export const sampleMatchesForJob1: JDMatchItem[] = [];
