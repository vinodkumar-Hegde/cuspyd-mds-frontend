import type { Page } from '../services/apiClient';

export default function Pagination({query, label = 'Records'}: {
  query: {page: Page<unknown>; loading:boolean; error:string; setOffset:(offset:number)=>void; refresh:(reset?:boolean)=>void}; label?: string;
}) {
  const {page, loading, error, setOffset} = query;
  return <nav aria-label={`${label} pagination`} className="my-4 flex flex-wrap items-center justify-between gap-3 text-sm">
    {error && <p role="alert">{error} <button onClick={() => query.refresh()} className="underline">Retry</button></p>}
    <p aria-live="polite">{loading ? 'Loading…' : page.total ? `${page.offset + 1}–${Math.min(page.offset + page.items.length, page.total)} of ${page.total}` : 'No records'}</p>
    <div className="flex gap-2">
      <button type="button" aria-label={`${label} previous page`} disabled={loading || page.offset === 0}
        onClick={() => setOffset(Math.max(0, page.offset - page.limit))} className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40">Previous</button>
      <button type="button" aria-label={`${label} next page`} disabled={loading || page.offset + page.limit >= page.total}
        onClick={() => setOffset(page.offset + page.limit)} className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40">Next</button>
    </div>
  </nav>;
}
