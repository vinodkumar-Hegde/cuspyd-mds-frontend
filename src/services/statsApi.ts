import { apiGet } from './apiClient';

export interface RecentExam { id: string; type: string; completed_at: string; score: number | null }
export interface ActivityPoint { date: string; attempts: number }
export interface SubjectStat { subject: string; questions: number; image_questions: number }
export interface Overview {
  question_count: number;
  question_images: number;
  test_count: number;
  available_tests: number;
  subject_count: number;
  my_completed_exams: number;
  my_average_score_last_500: number | null;
  my_accuracy_last_500: number | null;
  my_activity_7d: ActivityPoint[];
  my_recent_exams: RecentExam[];
  metrics_sample_size: number;
  is_admin: boolean;
  admin?: { account_count: number; disabled_accounts: number; total_completed_exams: number };
}
export const statsApi = {
  overview: () => apiGet<Overview>('/api/v1/stats/overview'),
  subjects: () => apiGet<SubjectStat[]>('/api/v1/stats/subjects'),
};
