import type { Question, TestGenerated } from '../types';
import { apiDelete, apiGet, apiPage, apiPatch, apiPost, apiRequest } from './apiClient';
export interface ActivityRecord {
  id: string; type: string; is_completed: boolean; start_time: string | null;
  end_time: string | null; student_name: string | null; student_email: string | null;
}
export interface QuestionRecord {
  id: string; subject_id: string; year: string; text: string; options: string[];
  correct_option: number; explanation: string; topic?: string; image_url?: string;
  image_practice_enabled?: boolean;
}
export function mapQuestion(q: QuestionRecord): Question {
  return {id:q.id, subjectId:q.subject_id as Question['subjectId'], year:q.year as Question['year'],
    text:q.text, options:q.options, correctOption:q.correct_option, explanation:q.explanation,
    topic:q.topic, imageUrl:q.image_url, imagePracticeEnabled:q.image_practice_enabled};
}
export function questionPayload(q: Question) {
  return {subject_id:q.subjectId, year:q.year, text:q.text, options:q.options,
    correct_option:q.correctOption, explanation:q.explanation || '', topic:q.topic || undefined, image_url:q.imageUrl || undefined,
    image_practice_enabled:q.imagePracticeEnabled || false};
}
export function mapTest(t: any): TestGenerated {
  return {...t, createdAt:t.created_at, subjectId:t.subject_id, publishDate:t.publish_date,
    adminMessage:t.admin_message, answerKey:t.answer_key, explanations:t.explanations};
}
export const adminApi = {
  async previewImport(file: File, subject: string, year: string) {
    const form = new FormData(); form.append('file', file); form.append('subject_id', subject); form.append('year', year);
    return apiRequest<Omit<QuestionRecord, 'id'>[]>('/api/v1/admin/questions/import-preview', {method:'POST', body:form});
  },
  activity: () => apiGet<ActivityRecord[]>('/api/v1/admin/activity'),
  questions: (offset=0, signal?:AbortSignal, subjectId='', year='') => apiPage<QuestionRecord>(`/api/v1/admin/questions?subject_id=${encodeURIComponent(subjectId)}&year=${encodeURIComponent(year)}`, offset, signal),
  questionCounts: () => apiGet<Record<string, number>>('/api/v1/admin/question-counts'),
  createQuestions: (questions: Omit<QuestionRecord, 'id'>[]) => apiPost<QuestionRecord[]>('/api/v1/admin/questions', questions),
  editQuestion: (question: Question) => apiPatch<QuestionRecord>(`/api/v1/admin/questions/${encodeURIComponent(question.id)}`, questionPayload(question)),
  selectQuestions: (weightage: Record<string,number>) => apiPost<QuestionRecord[]>('/api/v1/admin/question-selection', {weightage}),
  tests: (offset=0, signal?:AbortSignal) => apiPage<any>('/api/v1/admin/tests', offset, signal),
  createTest: (test: unknown) => apiPost<any>('/api/v1/admin/tests', test),
  editTest: (id: string, values: unknown) => apiPatch(`/api/v1/admin/tests/${encodeURIComponent(id)}`, values),
  archiveTest: (id: string) => apiDelete(`/api/v1/admin/tests/${encodeURIComponent(id)}`),
  archiveTests: (type?: string) => apiPost<{archived:number}>('/api/v1/admin/tests/archive', {type:type || null}),
  users: (offset=0, signal?:AbortSignal, search='') => apiPage<any>(`/api/v1/admin/users?search=${encodeURIComponent(search)}`, offset, signal),
  createHighYield: (values: unknown) => apiPost('/api/v1/admin/high-yield', values),
  deleteHighYield: (id: string) => apiDelete(`/api/v1/admin/high-yield/${encodeURIComponent(id)}`),
  createSyndrome: (values: unknown) => apiPost('/api/v1/admin/syndromes', values),
  createBackground: (values: unknown) => apiPost('/api/v1/admin/subject-backgrounds', values),
  createFlowcharts: (values: unknown[]) => apiPost('/api/v1/admin/flowcharts', values),
  updateFeature: (key: string, visible: boolean) => apiPatch(`/api/v1/admin/features/${encodeURIComponent(key)}`, {is_visible:visible}),
  async upload(bucket: 'high-yield' | 'subject-backgrounds' | 'question-images' | 'syndromes', file: File) {
    const form = new FormData();
    form.append('file', file);
    return apiRequest<{path:string;publicUrl:string}>(`/api/uploads/${bucket}`, {method:'POST', body:form});
  },
};
