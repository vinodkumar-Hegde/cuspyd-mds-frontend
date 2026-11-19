import { apiGet, apiPost } from './apiClient';

export interface ExamQuestion {
  id: string;
  subject_id: string;
  year: string;
  text: string;
  options: string[];
  topic?: string;
  image_url?: string;
}

export const examApi = {
  list: () => apiGet<any[]>('/api/v1/exams'),
  imageBased: () => apiGet<ExamQuestion[]>('/api/v1/exams/image-based'),
  questions: (id: string) => apiGet<ExamQuestion[]>(`/api/v1/exams/${encodeURIComponent(id)}/questions`),
  submit: (id: string, answers: Record<string, number>, requestId: string) =>
    apiPost<any>(`/api/v1/exams/${encodeURIComponent(id)}/submit`, {answers, request_id:requestId}),
  history: () => apiGet<any[]>('/api/v1/exams/history'),
  result: (sessionId: string) => apiGet<any>(`/api/v1/exams/history/${encodeURIComponent(sessionId)}/result`),
};
