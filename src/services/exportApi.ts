import { ApiError, apiFetch, token } from './apiClient';

export type Dataset = 'questions' | 'tests' | 'high_yield_topics';
export type ExportFormat = 'csv' | 'xlsx' | 'json';

export async function exportData(dataset: Dataset, format: ExportFormat, filterBy = '', filterValue = '') {
  const params = new URLSearchParams({format});
  if (filterBy && filterValue) {
    params.set('filter_by', filterBy);
    params.set('filter_value', filterValue);
  }
  const accessToken = token();
  if (!accessToken) throw new ApiError(401, 'Sign in as an administrator to export');
  const response = await apiFetch(`/api/v1/admin/exports/${dataset}?${params}`);
  const file = await response.blob();
  const objectUrl = URL.createObjectURL(file);
  const disposition = response.headers.get('Content-Disposition') || '';
  const fromHeader = /filename="?([a-zA-Z0-9_.-]+)"?/.exec(disposition)?.[1];
  const filename = fromHeader || `mdslate_${dataset}.${format}`;
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
}
