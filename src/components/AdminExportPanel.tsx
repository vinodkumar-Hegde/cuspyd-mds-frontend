import { Download, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { exportData, type Dataset, type ExportFormat } from '../services/exportApi';

const labels: Record<Dataset, string> = {questions:'Questions and answer keys',tests:'Tests and configuration',high_yield_topics:'High-yield topics'};
export default function AdminExportPanel() {
  const [dataset,setDataset] = useState<Dataset>('questions');
  const [format,setFormat] = useState<ExportFormat>('xlsx');
  const [filterBy,setFilterBy] = useState('');
  const [filterValue,setFilterValue] = useState('');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [done,setDone] = useState('');
  const filters = dataset === 'tests' ? [{v:'type',t:'Test type'},{v:'status',t:'Status'}] : [{v:'subject_id',t:'Subject ID'},{v:'year',t:'Year'}];
  async function download() {
    setError('');setDone('');setBusy(true);
    try {
      await exportData(dataset,format,filterBy,filterValue.trim());
      setDone('Export generated and downloaded. An audit record has been saved.');
    } catch(e) {setError(e instanceof Error ? e.message : 'Export failed');}
    finally {setBusy(false);}
  }
  return <section className="max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="Export question bank">
    <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><FileSpreadsheet size={22}/></span><div><h2 className="text-xl font-semibold text-slate-900">Export data</h2><p className="text-sm text-slate-500">Download a controlled snapshot from PostgreSQL</p></div></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2 text-sm font-medium text-slate-700">Data type<select value={dataset} onChange={e=>{setDataset(e.target.value as Dataset);setFilterBy('');setFilterValue('');}} className="block w-full rounded-lg border border-slate-300 bg-white p-3">{(Object.keys(labels) as Dataset[]).map(k=><option key={k} value={k}>{labels[k]}</option>)}</select></label>
      <label className="space-y-2 text-sm font-medium text-slate-700">File format<select value={format} onChange={e=>setFormat(e.target.value as ExportFormat)} className="block w-full rounded-lg border border-slate-300 bg-white p-3"><option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV (.csv)</option><option value="json">JSON (.json)</option></select></label>
      <label className="space-y-2 text-sm font-medium text-slate-700">Filter (optional)<select value={filterBy} onChange={e=>{setFilterBy(e.target.value);setFilterValue('');}} className="block w-full rounded-lg border border-slate-300 bg-white p-3"><option value="">All rows</option>{filters.map(f=><option value={f.v} key={f.v}>{f.t}</option>)}</select></label>
      <label className="space-y-2 text-sm font-medium text-slate-700">Filter value<input disabled={!filterBy} value={filterValue} onChange={e=>setFilterValue(e.target.value)} placeholder={filterBy ? `Enter ${filterBy}` : 'Choose a filter first'} className="block w-full rounded-lg border border-slate-300 bg-white p-3 disabled:bg-slate-50"/></label>
    </div>
    <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><ShieldAlert size={18} className="mt-0.5 shrink-0"/><p>Administrator only. Exports may contain answer keys; store and share them securely. Maximum 10,000 rows per request.</p></div>
    {error && <div role="alert" className="text-sm text-red-700">{error}</div>}
    {done && <div role="status" className="text-sm text-emerald-800">{done}</div>}
    <button disabled={busy || Boolean(filterBy && !filterValue.trim())} onClick={()=>void download()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"><Download size={17}/>{busy?'Preparing…':'Export data'}</button>
  </section>;
}
