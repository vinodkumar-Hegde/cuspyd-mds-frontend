import { apiGet, apiPage } from './apiClient';
export interface HighYieldTopic {id:string; subject_id:string; year:string; topic_name:string; question_image_url:string|null; answer_image_url:string|null}
export interface Syndrome {id:string; name:string; description:string; image_url:string}
export const contentApi = {
  featureSettings: () => apiGet<{feature_key:string;is_visible:boolean}[]>('/api/v1/content/feature-settings'),
  highYield: (offset=0, signal?:AbortSignal, subjectId?:string) => apiPage<HighYieldTopic>(`/api/v1/content/high-yield${subjectId ? `?subject_id=${encodeURIComponent(subjectId)}` : ''}`, offset, signal),
  highYieldSubjects: () => apiGet<{subject_id:string; total:number}[]>('/api/v1/content/high-yield/subjects'),
  syndromes: (offset=0, signal?:AbortSignal) => apiPage<Syndrome>('/api/v1/content/syndromes', offset, signal),
  flowcharts: (offset=0, signal?:AbortSignal) => apiPage<any>('/api/v1/content/flowcharts', offset, signal),
  backgrounds: (offset=0, signal?:AbortSignal) => apiPage<any>('/api/v1/content/subject-backgrounds', offset, signal),
};
