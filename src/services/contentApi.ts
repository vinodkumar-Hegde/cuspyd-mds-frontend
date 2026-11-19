import { apiGet } from './apiClient';
export const contentApi = {
  featureSettings: () => apiGet<{feature_key:string;is_visible:boolean}[]>('/api/v1/content/feature-settings'),
  highYield: (subjectId?: string) => apiGet<any[]>(`/api/v1/content/high-yield${subjectId ? `?subject_id=${encodeURIComponent(subjectId)}` : ''}`),
  syndromes: () => apiGet<any[]>('/api/v1/content/syndromes'),
  flowcharts: () => apiGet<any[]>('/api/v1/content/flowcharts'),
  backgrounds: () => apiGet<any[]>('/api/v1/content/subject-backgrounds'),
};
