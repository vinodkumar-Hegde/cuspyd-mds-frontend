import { useCallback, useState } from 'react';
import { useApiPage } from '../hooks/useApiPage';
import { adminApi, mapQuestion, type QuestionRecord } from '../services/adminApi';
import { mediaUrl } from '../services/apiClient';
import Pagination from './Pagination';

export default function QuestionBank({subjectId, year, revision}: {subjectId:string; year:string; revision:number}) {
  const load = useCallback((offset:number, signal:AbortSignal) =>
    adminApi.questions(offset, signal, subjectId, year), [subjectId, year, revision]);
  const query = useApiPage(load);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function setPublished(record:QuestionRecord, enabled:boolean) {
    setBusy(true); setError('');
    try {
      await adminApi.editQuestion({...mapQuestion(record), imagePracticeEnabled:enabled});
      query.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update question'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 rounded-2xl border bg-white p-6">
    <h3 className="text-xl font-bold">Question bank</h3>
    <p className="text-sm text-slate-600">Publish an image question for practice when it is ready. Questions used by unreleased exams remain hidden from image practice.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <Pagination query={query} label="Questions" />
    {query.page.items.map(record => <article key={record.id} className="space-y-3 border-t py-4">
      <p className="font-medium">{record.text}</p>
      {record.image_url && <img src={mediaUrl(record.image_url)} alt="Question image" className="max-h-40 max-w-full object-contain" />}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={Boolean(record.image_practice_enabled)} disabled={busy || !record.image_url}
          onChange={event => void setPublished(record, event.target.checked)} />
        Publish for image practice
      </label>
    </article>)}
  </section>;
}
