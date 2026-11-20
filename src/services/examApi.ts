import { apiGet, apiPage, apiPost } from './apiClient';

export interface ExamResult {
  schema_version: number; scoring_source: 'server' | 'imported'; review_available: boolean;
  session_id: string; test: {id:string|null; title:string; type:string; status:string; questions:string[]};
  results: {score:number; correct:number; wrong:number; unattempted:number; answers:Record<string,number>} | null;
  questions: {id:string; text:string; options:string[]; correctOption:number; explanation:string}[];
  notice?: string;
}

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
  list: (offset=0, signal?:AbortSignal, category='', year='', search='') => apiPage<any>(`/api/v1/exams?category=${encodeURIComponent(category)}&year=${encodeURIComponent(year)}&search=${encodeURIComponent(search)}`, offset, signal),
  imageBased: (offset=0, signal?:AbortSignal, year='', search='') => apiPage<ExamQuestion>(`/api/v1/exams/image-based?year=${encodeURIComponent(year)}&search=${encodeURIComponent(search)}`, offset, signal),
  questions: (id: string) => apiGet<ExamQuestion[]>(`/api/v1/exams/${encodeURIComponent(id)}/questions`),
  submit: (id: string, answers: Record<string, number>, requestId: string) =>
    apiPost<ExamResult>(`/api/v1/exams/${encodeURIComponent(id)}/submit`, {answers, request_id:requestId}),
  history: (offset=0, signal?:AbortSignal) => apiPage<any>('/api/v1/exams/history', offset, signal),
  result: (sessionId: string) => apiGet<ExamResult>(`/api/v1/exams/history/${encodeURIComponent(sessionId)}/result`),
};
