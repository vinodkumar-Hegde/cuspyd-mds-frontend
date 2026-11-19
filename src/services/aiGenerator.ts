/** Admin-only question generation via FastAPI; never send AI credentials to browser. */
import { apiPost } from './apiClient';
export async function generateQuestionsFromPYQs(subjectId: string, year: string, count: number): Promise<any[]> {
  const response = await apiPost<{questions: any[]}>('/api/v1/ai/generate-questions', {subjectId, year, count});
  return response.questions;
}
