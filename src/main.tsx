import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { apiGet } from './services/apiClient';
import { setCatalog } from './types';

function Bootstrap() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    apiGet<Parameters<typeof setCatalog>[0]>('/api/v1/catalog').then(catalog => {
      if (!live) return;
      setCatalog(catalog);
      setReady(true);
    }).catch(e => { if (live) setError(e.message); });
    return () => {live = false;};
  }, [attempt]);
  if (ready) return <App />;
  return <main className="p-8" role={error ? 'alert' : 'status'}>
    {error || 'Loading application…'}
    {error && <button className="ml-4 underline" onClick={() => {setError(''); setAttempt(v => v+1);}}>Try again</button>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Bootstrap /></StrictMode>);
