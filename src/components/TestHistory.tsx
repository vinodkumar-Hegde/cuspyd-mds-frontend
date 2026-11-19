import { useEffect, useState } from 'react';
import { examApi } from '../services/examApi';

export default function TestHistory({ onViewResult }: { onViewResult: (results: any) => void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [groupedSessions, setGroupedSessions] = useState<Record<string, any[]>>({});

  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = (await examApi.history()).filter(s => s.is_completed);
      setSessions(data);
      setGroupedSessions(data.reduce((acc: Record<string, any[]>, s: any) => {
        const type = s.tests?.type || 'Other';
        (acc[type] ||= []).push(s);
        return acc;
      }, {}));
    } catch (error) {setErrorMessage(error instanceof Error ? error.message : 'Unable to load history');}
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Exam History</h1>
        {errorMessage && <p role="alert">{errorMessage}</p>}
        {Object.entries(groupedSessions).map(([type, typeSessions]) => (
            <div key={type} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-700">{type}</h2>
                {typeSessions.map((session: any) => (
                    <div key={session.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <div>
                            <h3 className="font-bold text-slate-900">{session.tests?.title}</h3>
                            <p className="text-sm text-slate-500">
                              {session.tests?.id || "N/A"}
                            </p>
                        </div>
                        <button 
                          onClick={() => onViewResult(session)}
                          className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-sm"
                        >
                          View Results
                        </button>
                    </div>
                ))}
            </div>
        ))}
        {sessions.length === 0 && <p className="text-slate-500">No completed exams yet.</p>}
    </div>
  );
}
