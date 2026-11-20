import { useEffect, useState } from 'react';
import type { Page } from '../services/apiClient';

export function useApiPage<T>(load: (offset: number, signal: AbortSignal) => Promise<Page<T>>, enabled = true) {
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState<Page<T>>({items: [], total: 0, limit: 50, offset: 0});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { setOffset(0); setPage({items: [], total: 0, limit: 50, offset: 0}); }, [load]);
  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setError('');
    load(offset, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setPage(result);
      if (result.total > 0 && result.items.length === 0 && offset >= result.total) {
        setOffset(Math.floor((result.total - 1) / result.limit) * result.limit);
      }
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load records');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [load, offset, revision, enabled]);
  const refresh = (reset = false) => { if (reset) setOffset(0); setRevision(value => value + 1); };
  return {page, loading, error, setOffset, refresh};
}
