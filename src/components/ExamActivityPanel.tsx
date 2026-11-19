import { Activity, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminApi, type ActivityRecord } from '../services/adminApi';

export default function ExamActivityPanel() {
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function refresh() {
    setLoading(true);
    try { setRecords(await adminApi.activity()); setError(''); }
    catch(e) {setError(e instanceof Error ? e.message : 'Unable to load activity');}
    finally {setLoading(false);}
  }
  useEffect(()=>{void refresh();},[]);
  return <section className="rounded-2xl border border-slate-200 bg-white p-6">
    <header className="mb-5 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Activity size={19}/> Exam activity</h2><button onClick={()=>void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"><RefreshCw size={14}/>Refresh</button></header>
    {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
    <div className="overflow-x-auto"><table className="min-w-[600px] w-full text-left text-sm"><thead className="border-b border-slate-200 text-slate-500"><tr><th className="pb-3 font-medium">Student</th><th className="pb-3 font-medium">Exam type</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Date</th></tr></thead><tbody className="divide-y divide-slate-100">{records.map(r=><tr key={r.id}><td className="py-3">{r.student_name||r.student_email||'Unknown'}</td><td className="py-3">{r.type}</td><td className="py-3">{r.is_completed?'Completed':'In progress'}</td><td className="py-3">{r.start_time?new Date(r.start_time).toLocaleString('en-IN'):'—'}</td></tr>)}</tbody></table></div>
    {loading && <p role="status" className="mt-4 text-sm text-slate-500">Loading…</p>}
    {!loading && !records.length && !error && <p className="mt-4 text-sm text-slate-500">No exam activity.</p>}
    <p className="mt-4 text-xs text-slate-500">Showing at most 200 recent sessions. Detailed answer data is not included.</p>
  </section>;
}
