export interface ResumeAnalysis {
  file_name: string;
  word_count: number;
  ats_score: number;
  quality_label: "poor" | "average" | "good" | "excellent";
  section_stats: {
    total_sections: number;
    sections_found: string[];
    has_experience: boolean;
    has_education: boolean;
    has_skills: boolean;
    has_projects: boolean;
  };
  llm_skills: {
    skills: {
      technical: string[];
      soft: string[];
      tools: string[];
      languages: string[];
    };
    experience_years: number;
    job_titles: string[];
    key_achievements: string[];
    improvement_suggestions: string[];
  };
  llm_feedback: {
    ats_feedback: {
      strengths: string[];
      weaknesses: string[];
      keyword_suggestions: string[];
      overall_assessment: string;
    };
    rewrite_suggestions: {
      summary: string;
      skills_to_add: string[];
      action_verbs: string[];
    };
  };
  status: string;
}

export interface JobMatch {
  file_name: string;
  match_score: number;
  match_level: string;
  status: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}