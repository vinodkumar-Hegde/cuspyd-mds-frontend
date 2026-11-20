import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Image, Search } from 'lucide-react';
import { useApiPage } from '../hooks/useApiPage';
import { examApi } from '../services/examApi';
import { mediaUrl } from '../services/apiClient';
import { SUBJECTS } from '../types';
import Pagination from './Pagination';

const categories = [
  {id:'RANKER', label:'Ranker Test'}, {id:'MOCK', label:'Mock'},
  {id:'MT', label:'Mini'}, {id:'ST', label:'Subject'}, {id:'IMG', label:'Image Based'},
];

export default function PracticeExams() {
  const [category, setCategory] = useState('RANKER');
  const [year, setYear] = useState('');
  const [search, setSearch] = useState('');
  const [queryText, setQueryText] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setQueryText(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  const loadExams = useCallback((offset:number, signal:AbortSignal) =>
    examApi.list(offset, signal, category === 'IMG' ? '' : category, category === 'ST' ? year : '', queryText), [category, year, queryText]);
  const loadImages = useCallback((offset:number, signal:AbortSignal) =>
    examApi.imageBased(offset, signal, year, queryText), [year, queryText]);
  const exams = useApiPage(loadExams, category !== 'IMG');
  const images = useApiPage(loadImages, category === 'IMG');
  const query = category === 'IMG' ? images : exams;
  const start = (test:unknown) => window.dispatchEvent(new CustomEvent('start-exam', {detail:test}));
  return <section className="space-y-6 pb-12">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-black text-slate-900">Practice Arena</h1><p className="text-slate-600">Choose a published exam or image question.</p></div>
      <label className="flex items-center gap-2 rounded-xl border bg-white p-3"><Search size={18}/>
        <input aria-label="Search exams" placeholder="Search exams..." value={search} onChange={event => setSearch(event.target.value)} />
      </label>
    </header>
    <div className="flex flex-wrap gap-2" aria-label="Exam categories">
      {categories.map(item => <button key={item.id} onClick={() => {setCategory(item.id); setYear('');}}
        aria-pressed={category === item.id} className={`rounded-xl border px-5 py-3 font-bold ${category === item.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>{item.label}</button>)}
    </div>
    {(category === 'ST' || category === 'IMG') && <label className="flex items-center gap-3">Year
      <select aria-label="Exam year" value={year} onChange={event => setYear(event.target.value)} className="rounded-xl border bg-white p-3">
        <option value="">All years</option>
        {['BDS-I','BDS-II','BDS-III','BDS-IV'].map(value => <option key={value}>{value}</option>)}
      </select>
    </label>}
    <Pagination query={query} label="Practice exams" />
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {category === 'IMG' ? images.page.items.map(question => <button key={question.id}
        onClick={() => start({id:question.id, title:question.text, type:'IMG', questions:[question.id]})}
        className="space-y-4 rounded-3xl border bg-white p-6 text-left shadow-sm hover:border-pink-400">
        <p className="flex items-center gap-2 text-sm font-bold text-pink-700"><Image size={18}/>{SUBJECTS[question.subject_id]?.name || question.subject_id}</p>
        {question.image_url && <img src={mediaUrl(question.image_url)} alt="Practice question" className="h-36 w-full object-contain"/>}
        <h2 className="line-clamp-3 font-bold">{question.text}</h2><p className="text-sm text-slate-500">{question.year} · Start practice</p>
      </button>) : exams.page.items.map(test => <button key={test.id} onClick={() => start(test)}
        className="space-y-4 rounded-3xl border bg-white p-6 text-left shadow-sm hover:border-blue-400">
        <BookOpen className="text-blue-600"/><h2 className="text-xl font-bold">{test.title}</h2>
        <p className="text-sm text-slate-600">{test.type} · {test.questions.length} questions</p>
        {test.admin_message && <p className="text-sm text-slate-600">{test.admin_message}</p>}
        <span className="block font-semibold text-blue-700">Start exam</span>
      </button>)}
    </div>
    {!query.loading && !query.error && query.page.total === 0 && <p>No published practice is available for this selection.</p>}
  </section>;
}
