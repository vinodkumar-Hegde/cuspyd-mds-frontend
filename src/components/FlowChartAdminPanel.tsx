import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';
import { apiPost, apiResult } from '../services/apiClient';
import { contentApi } from '../services/contentApi';
import { SUBJECTS, SubjectId } from '../types';

export default function FlowChartAdminPanel() {

    const [subjectId, setSubjectId] = useState<SubjectId | ''>('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [explanation, setExplanation] = useState('');
    const [bulkData, setBulkData] = useState('');
    const [loading, setLoading] = useState(false);
    const [existingQuestions, setExistingQuestions] = useState<any[]>([]);

    useEffect(() => {
        async function fetchQuestions() {
            const { data } = await apiResult(contentApi.flowcharts());
            if (data) setExistingQuestions(data);
        }
        fetchQuestions();
    }, []);

    const processQuestion = async (q: { question: string; answer: string; explanation: string }) => {
        return apiPost<{ nodes: unknown[]; edges: unknown[] }>('/api/v1/ai/flowchart', {
            question: q.question,
            answer: q.answer,
            explanation: q.explanation,
        });
    };

    const handleBulkSubmit = async () => {
        setLoading(true);
        try {
            const data = JSON.parse(bulkData);
            if (!Array.isArray(data)) throw new Error('Bulk data must be an array of questions');
            
            if (data.length === 0 || data.length > 100) throw new Error('Upload between 1 and 100 questions');
            const rows = [];
            for (const q of data) {
                rows.push({subject_id:subjectId || null, question_text:q.question, correct_answer:q.answer,
                    explanation:q.explanation, generated_flowchart:await processQuestion(q)});
            }
            await adminApi.createFlowcharts(rows);
            setExistingQuestions(await contentApi.flowcharts());
            alert('Bulk upload successful!');
            setBulkData('');
        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : 'Unable to save flowcharts');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const flowchart = await processQuestion({question, answer, explanation});

            const { error } = await apiResult(adminApi.createFlowcharts([{
                subject_id: subjectId || null,
                question_text: question,
                correct_answer: answer,
                explanation: explanation,
                generated_flowchart: flowchart
            }]));

            if (error) throw error;
            
            alert('Flowchart question created successfully!');
            setQuestion('');
            setAnswer('');
            setExplanation('');
        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : 'Unable to save flowcharts');
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Admin: Upload Flow Chart Question</h1>
            <div className="space-y-4">
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value as SubjectId)} className="w-full p-2 border rounded">
                    <option value="">None / General</option>
                    {Object.values(SUBJECTS).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div className='border-t pt-4'>
                    <h2 className='text-xl font-bold mb-2'>Existing Flow Chart Questions ({existingQuestions.length})</h2>
                    <div className='max-h-60 overflow-y-auto space-y-2'>
                        {existingQuestions.map(q => (
                            <div key={q.id} className='p-2 bg-white rounded border text-sm'>
                                {q.question_text}
                            </div>
                        ))}
                    </div>
                </div>
                <div className='border-t pt-4'>
                    <h2 className='text-xl font-bold mb-2'>Single Upload</h2>
                    <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Question" className="w-full p-2 border rounded" rows={3}/>
                    <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Correct Answer" className="w-full p-2 border rounded" rows={2}/>
                    <textarea value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="Explanation" className="w-full p-2 border rounded" rows={3}/>
                    <button 
                      onClick={handleSubmit} 
                      disabled={loading}
                      className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                    >
                        {loading ? 'Generative AI working...' : 'Submit'}
                    </button>
                </div>
                <div className='border-t pt-4'>
                    <h2 className='text-xl font-bold mb-2'>Bulk Upload (JSON Array)</h2>
                    <textarea value={bulkData} onChange={e => setBulkData(e.target.value)} placeholder='[{"question": "...", "answer": "...", "explanation": "..."}]' className="w-full p-2 border rounded" rows={10}/>
                    <button 
                      onClick={handleBulkSubmit} 
                      disabled={loading}
                      className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                    >
                        {loading ? 'Generative AI working...' : 'Bulk Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
}
