import { Activity, AlertCircle, ArrowUpRight, BarChart3, BookOpen, CheckCircle2, Clock3, FileQuestion, Image as ImageIcon, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { statsApi, type Overview, type SubjectStat } from '../services/statsApi';

const number = (value: number | null | undefined) => value === null || value === undefined ? '—' : value.toLocaleString('en-IN');
const prettyDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: React.ComponentType<{size?:number; className?: string}> }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label={label}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p></div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600"><Icon size={19}/></span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [subjects, setSubjects] = useState<SubjectStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const [nextOverview, nextSubjects] = await Promise.all([statsApi.overview(), statsApi.subjects()]);
      if (signal?.aborted) return;
      setOverview(nextOverview);
      setSubjects(nextSubjects);
    } catch (e) {
      if (!signal?.aborted) setError(e instanceof Error ? e.message : 'Unable to load statistics');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  return (
    <main className="min-h-[60vh] space-y-6 pb-12" aria-label="Statistics dashboard">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-500"><BarChart3 size={15}/> Learning analytics</div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Live statistics from the MDSLate PostgreSQL database.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> Refresh
        </button>
      </header>
      {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={18}/><span>{error}. Check FastAPI and your account access.</span></div>}
      {loading && !overview && <div role="status" className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading your statistics…</div>}
      {overview && <>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Question bank metrics">
          <MetricCard label="Total questions" value={number(overview.question_count)} detail="Current question bank" icon={FileQuestion}/>
          <MetricCard label="Available tests" value={number(overview.available_tests)} detail={`${number(overview.test_count)} tests in database`} icon={BookOpen}/>
          <MetricCard label="Subjects" value={number(overview.subject_count)} detail="Subjects represented in questions" icon={BarChart3}/>
          <MetricCard label="Image questions" value={number(overview.question_images)} detail="Questions with an image" icon={ImageIcon}/>
        </section>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Your learning results">
          <MetricCard label="Completed exams" value={number(overview.my_completed_exams)} detail="Your completed sessions" icon={CheckCircle2}/>
          <MetricCard label="Average score" value={overview.my_average_score_last_500 === null ? '—' : String(overview.my_average_score_last_500)} detail={`Based on last ${overview.metrics_sample_size} scored sessions`} icon={Activity}/>
          <MetricCard label="Accuracy" value={overview.my_accuracy_last_500 === null ? '—' : `${overview.my_accuracy_last_500}%`} detail="Across scored questions in sampled sessions" icon={ShieldCheck}/>
        </section>
        {overview.is_admin && overview.admin && <section aria-label="Administration" className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900"><Users size={18}/> Administration</h2>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-slate-500">Accounts</p><p className="mt-1 text-xl font-semibold">{number(overview.admin.account_count)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-slate-500">Inactive accounts</p><p className="mt-1 text-xl font-semibold">{number(overview.admin.disabled_accounts)}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-slate-500">All completed sessions</p><p className="mt-1 text-xl font-semibold">{number(overview.admin.total_completed_exams)}</p></div>
          </div>
        </section>}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2"><Activity size={18} className="text-slate-600"/><h2 className="font-semibold text-slate-900">Your exam activity</h2></div>
            <p className="mb-4 text-xs text-slate-500">Completed sessions by day · last 7 days (UTC)</p>
            <div className="h-60 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={overview.my_activity_7d} margin={{top:8,right:5,left:-25,bottom:0}}>
              <CartesianGrid stroke="#eef2f7" vertical={false}/><XAxis dataKey="date" tickFormatter={prettyDate} tick={{fontSize:11,fill:'#64748b'}} tickLine={false} axisLine={false}/>
              <YAxis allowDecimals={false} tick={{fontSize:11,fill:'#64748b'}} tickLine={false} axisLine={false}/>
              <Tooltip labelFormatter={label => prettyDate(String(label))}/><Bar dataKey="attempts" fill="#789DD9" name="Completed" radius={[5,5,0,0]} maxBarSize={38}/>
            </BarChart></ResponsiveContainer></div>
          </article>
          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2"><BookOpen size={18} className="text-slate-600"/><h2 className="font-semibold text-slate-900">Question distribution</h2></div>
            <p className="mb-4 text-xs text-slate-500">Top subjects by question count</p>
            <div className="space-y-3">
              {subjects.slice(0,7).map(s => <div key={s.subject} className="flex items-center gap-3 text-sm">
                <span className="w-36 shrink-0 truncate text-slate-600" title={s.subject}>{s.subject.replaceAll('_',' ')}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#789DD9]" style={{width:`${Math.max(2,100*s.questions/Math.max(1,subjects[0]?.questions||1))}%`}}/></div>
                <span className="w-14 text-right tabular-nums text-slate-700">{number(s.questions)}</span>
              </div>)}
              {subjects.length===0 && <p className="text-sm text-slate-500">No question data available.</p>}
            </div>
          </article>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Recent exam history">
          <div className="mb-4 flex items-center gap-2"><Clock3 size={18} className="text-slate-600"/><h2 className="font-semibold text-slate-900">Recent completed exams</h2></div>
          {overview.my_recent_exams.length === 0 ? <p className="text-sm text-slate-500">No completed exams yet.</p> :
            <div className="divide-y divide-slate-100">{overview.my_recent_exams.map(exam => <div key={exam.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span className="text-slate-800">{exam.type || 'Exam'}</span>
              <div className="flex items-center gap-5"><span className="text-slate-500">{prettyDate(exam.completed_at)}</span><span className="min-w-14 text-right font-medium tabular-nums text-slate-900">{exam.score===null ? '—' : exam.score}</span><ArrowUpRight size={14} className="text-slate-400"/></div>
            </div>)}</div>}
        </section>
      </>}
    </main>
  );
}
