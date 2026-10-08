export interface ContactInfo {
  full_name: string;
  job_title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  current: boolean;
  bullets: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  link: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  location: string;
  start_date: string;
  end_date: string;
  gpa: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: number; // 0 - 100
  category: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  url: string;
}

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  certifications: CertificationItem[];
}

export type TemplateLayout = 
  | 'left-sidebar'
  | 'right-sidebar'
  | 'banner-left-sidebar'
  | 'banner-right-sidebar'
  | 'single-column';

export type HeadingStyle =
  | 'underline'
  | 'filled-bar'
  | 'left-border'
  | 'spaced-caps'
  | 'serif-sentence'
  | 'dot-marker';

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  layout: TemplateLayout;
  headingStyle: HeadingStyle;
  skillStyle: 'bars' | 'pills';
  hasTimeline: boolean;
  hasAvatar: boolean;
  isAtsClassic?: boolean;
  category: 'Modern' | 'Executive' | 'Creative' | 'ATS Minimal' | 'Technical';
}

export interface Issue {
  category: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  concrete_fix: string;
  evidence: string;
  penalty: number;
}

export interface CategoryScore {
  score: number;
  weight: number;
  status: string;
  issues_count: number;
}

export interface JobMatchDetails {
  matched_skills: string[];
  missing_skills: string[];
  coverage: number;
  similarity: number;
}

export interface AIRewrite {
  original: string;
  rewrite: string;
  reason: string;
}

export interface AIAnalysis {
  strengths: string[];
  weaknesses: string[];
  rewrites: AIRewrite[];
}

export interface AnalysisResult {
  overall_score: number;
  grade: string;
  category_scores: Record<string, CategoryScore>;
  issues: Issue[];
  job_match: JobMatchDetails;
  pages: number;
  word_count: number;
  sections_found: string[];
  ai_analysis?: AIAnalysis | null;
}

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface ResumeRecord {
  id: number;
  user_id?: number | null;
  title: string;
  template_id: string;
  accent_color: string;
  font_family: string;
  data: ResumeData;
  created_at: string;
  updated_at: string;
}
