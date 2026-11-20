import { useState } from 'react';
import { useApiPage } from '../hooks/useApiPage';
import { examApi } from '../services/examApi';
import Pagination from './Pagination';

export default function TestHistory({onViewResult}: {onViewResult:(session:{id:string})=>Promise<void>}) {
  const query = useApiPage(examApi.history);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function view(session:{id:string}) {
    setBusy(true); setError('');
    try { await onViewResult(session); }
    catch(reason) { setError(reason instanceof Error ? reason.message : 'Unable to load result'); }
    finally {setBusy(false);}
  }
  return <section className="space-y-6">
    <h1 className="text-3xl font-bold">Exam History</h1>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <Pagination query={query} label="History" />
    {query.page.items.map(session => <article key={session.id} className="flex items-center justify-between gap-4 rounded-2xl border bg-white p-6">
      <div><h2 className="font-bold">{session.test?.title || 'Historical exam'}</h2>
        <p className="text-sm text-slate-600">{session.type} · {session.end_time ? new Date(session.end_time).toLocaleString() : 'Time unavailable'}</p>
      </div>
      <button disabled={busy} onClick={() => void view(session)} className="rounded-xl bg-blue-50 px-4 py-2 font-bold text-blue-700 disabled:opacity-50">View Results</button>
    </article>)}
    {!query.loading && !query.error && !query.page.total && <p>No completed exams yet.</p>}
  </section>;
}
