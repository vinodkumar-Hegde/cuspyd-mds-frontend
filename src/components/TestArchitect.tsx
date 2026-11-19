/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    Calendar,
    CheckCircle2,
    ChevronRight,
    Dices,
    Edit3,
    Eye,
    Lock,
    Save,
    Settings2,
    TrendingUp,
    X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useMemo, useState } from 'react';
import { adminApi, mapQuestion } from '../services/adminApi';
import { Question, SubjectId, SUBJECTS, TestGenerated } from '../types';

interface TestArchitectProps {
  questions: Question[];
  questionCounts: Record<string, number>;
  onGenerate: (test: TestGenerated) => void;
  onUpdateQuestions: (updated: Question[]) => void;
}

export default function TestArchitect({ questions, questionCounts, onGenerate, onUpdateQuestions }: TestArchitectProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [testType, setTestType] = useState<TestGenerated['type']>('RANKER');
  const [weightage, setWeightage] = useState<Record<string, number>>({});
  const [generatedTest, setGeneratedTest] = useState<TestGenerated | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Initialize weightage based on test type
  React.useEffect(() => {
    const initial: Record<string, number> = {};
    
    // Proportional weightage for MT if using defaults
    Object.values(SUBJECTS).forEach(s => {
      if (testType === 'RANKER' || testType === 'MOCK') {
        initial[s.id] = s.weightage;
      } else if (testType === 'MT') {
        // Approximate 60 questions (scales ~25% of GT)
        initial[s.id] = Math.ceil(s.weightage * 0.25);
      } else {
        initial[s.id] = 0;
      }
    });
    setWeightage(initial);
  }, [testType]);

  const totalQuestions = Object.values(weightage).reduce((a, b) => a + b, 0);

  const poolStatus = useMemo(() => {


        
    const status: Record<string, { available: number; required: number }> = {};
    Object.keys(SUBJECTS).forEach(sid => {
      const available = questionCounts[sid] || 0;

      status[sid] = { available, required: weightage[sid] || 0 };
    });
    return status;
  }, [questionCounts, weightage]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canGenerate = !busy && totalQuestions > 0 && totalQuestions <= 500 && Object.values(poolStatus).every(s => s.required <= s.available);

  const handleGenerate = async () => {
    setBusy(true); setError('');
    try {
      const selected = (await adminApi.selectQuestions(weightage)).map(mapQuestion);
      onUpdateQuestions(selected);
      setGeneratedTest({id:crypto.randomUUID(), title:`${testType} Test - ${new Date().toLocaleDateString()}`,
        type:testType, questions:selected.map(q => q.id), weightage:{...weightage}, status:'DRAFT',
        createdAt:new Date().toISOString(), subjectId:testType === 'ST' ? selected[0]?.subjectId : undefined});
      setStep(2);
    } catch (e) {setError(e instanceof Error ? e.message : 'Unable to select questions');}
    finally {setBusy(false);}
  };
  const handleSaveEditedQuestion = async () => {
    if (!editingQuestion || busy) return;
    setBusy(true); setError('');
    try {
      const saved = mapQuestion(await adminApi.editQuestion(editingQuestion));
      onUpdateQuestions(questions.map(q => q.id === saved.id ? saved : q));
      setEditingQuestion(null);
    } catch (e) {setError(e instanceof Error ? e.message : 'Unable to save question');}
    finally {setBusy(false);}
  };

  return (
    <div className="space-y-8 relative">
      {error && <p role="alert" className="p-4 text-red-700 bg-red-50">{error}</p>}
      {/* Question Editor Modal */}
      <AnimatePresence>
        {editingQuestion && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 lg:p-10"
            onClick={() => setEditingQuestion(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 space-y-6 overflow-y-auto max-h-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-black text-slate-900">Edit Question Details</h4>
                <button onClick={() => setEditingQuestion(null)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Question Text</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl min-h-[100px] outline-none focus:border-blue-500 transition-all font-medium"
                    value={editingQuestion.text}
                    onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editingQuestion.options.map((opt, i) => (
                    <div key={i}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Option {String.fromCharCode(65 + i)}</label>
                      <input 
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-medium"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...editingQuestion.options];
                          newOpts[i] = e.target.value;
                          setEditingQuestion({...editingQuestion, options: newOpts});
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Detailed Explanation</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl min-h-[80px] outline-none focus:border-blue-500 transition-all text-sm font-medium"
                    value={editingQuestion.explanation}
                    onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setEditingQuestion(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >Cancel</button>
                <button 
                  onClick={handleSaveEditedQuestion}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-slate-400">
        <span className={step === 1 ? 'text-blue-600' : ''}>1. Configuration</span>
        <ChevronRight size={16} />
        <span className={step === 2 ? 'text-blue-600' : ''}>2. Review & Edit</span>
        <ChevronRight size={16} />
        <span className={step === 3 ? 'text-blue-600' : ''}>3. Publication</span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="config"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Settings2 className="text-blue-600" /> Test Parameters
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {(['RANKER', 'MOCK', 'MT', 'ST'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTestType(t)}
                      className={`p-4 rounded-2xl border-2 transition-all text-left ${testType === t ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                    >
                      <div className="font-black text-lg leading-none mb-1">{t}</div>
                      <div className="text-[10px] font-black uppercase opacity-60 tracking-wider">
                        {t === 'ST' ? '30 Qns' : t === 'MT' ? '60 Qns' : '240 Qns'}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.values(SUBJECTS).map(s => (
                    <div key={s.id} className="p-4 bg-slate-50 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-slate-700 truncate min-w-0 pr-2">{s.name}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${poolStatus[s.id].available >= poolStatus[s.id].required ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {poolStatus[s.id].available} available
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <input 
                          type="number"
                          min="0"
                          max={poolStatus[s.id].available}
                          value={weightage[s.id] || 0}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(parseInt(e.target.value) || 0, poolStatus[s.id].available));
                            setWeightage({...weightage, [s.id]: val});
                          }}
                          className="w-16 p-2 rounded-lg border border-slate-200 text-sm font-bold text-blue-600 focus:border-blue-500 outline-none text-right"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-900/10">
                <h3 className="text-xl font-bold mb-6">Test Summary</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm font-bold border-b border-white/10 pb-4">
                    <span className="text-slate-400">Total Questions</span>
                    <span className={`text-2xl ${totalQuestions > 0 ? 'text-white' : 'text-slate-600'}`}>{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold border-b border-white/10 pb-4">
                    <span className="text-slate-400">Recommended for {testType}</span>
                    <span className="text-blue-400">{testType === 'ST' ? 30 : (testType === 'MT' ? 60 : 240)}</span>
                  </div>
                </div>

                {/* Removed insufficient questions warning per user request */}

                <button
                  disabled={!canGenerate}
                  onClick={handleGenerate}
                  className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${canGenerate ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                >
                  <Dices size={20} /> Generate Random Test
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && generatedTest && (
          <motion.div 
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Eye className="text-blue-600" /> Preview & Edit Test
              </h3>
              <button 
                onClick={() => setStep(3)}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all"
              >
                Proceed to Publication
              </button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
              {generatedTest.questions.map((qid, idx) => {
                const q = questions.find(q => q.id === qid);
                if (!q) return null;
                return (
                  <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group relative">
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingQuestion(q)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-xs font-black text-slate-500">{idx + 1}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 px-2 py-0.5 rounded">{SUBJECTS[q.subjectId as SubjectId]?.name || 'Unknown Subject'}</span>
                    </div>
                    <p className="font-bold text-slate-900 mb-4">{q.text}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {q.options.map((opt, oidx) => (
                        <div key={oidx} className={`p-3 rounded-xl border ${q.correctOption === oidx ? 'bg-emerald-50 border-emerald-100 text-emerald-700 font-bold' : 'bg-white border-slate-100 text-slate-500'}`}>
                          {String.fromCharCode(65 + oidx)}. {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 3 && generatedTest && (
          <motion.div 
            key="publish"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center py-12"
          >
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Test Generated Successfully</h2>
            <div className="bg-slate-100 rounded-2xl p-4 inline-block mb-6">
                <p className="text-sm font-bold text-slate-600">Test ID: <span className="text-slate-900 font-mono">{generatedTest.id}</span></p>
            </div>
            <p className="text-slate-500 mb-12">Your test "{generatedTest.title}" is ready for publication. Select your release preference below.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-4">
                <button 
                  onClick={() => {

                    onGenerate({
                      ...generatedTest, 
                      status: 'PUBLISHED', 
                      publishDate: new Date().toISOString()
                    });
                  }}
                  className="w-full p-8 bg-white border-2 border-slate-100 hover:border-blue-600 rounded-[2rem] transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp size={24} />
                  </div>
                  <h4 className="font-black text-slate-900 mb-2">Publish Instantly</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">Students can take the test immediately after publication.</p>
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-8 bg-white border-2 border-slate-100 rounded-[2rem] transition-all group active:scale-95">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Calendar size={24} />
                  </div>
                  <h4 className="font-black text-slate-900 mb-2">Schedule Release</h4>
                  <div className="space-y-3 mt-4">
                    <input 
                      type="datetime-local" 
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-purple-500 transition-all"
                      id="schedule-date"
                      defaultValue={new Date(Date.now() + 86400000).toISOString().slice(0, 16)}
                    />
                    <button 
                      onClick={() => {
                        const dateInput = document.getElementById('schedule-date') as HTMLInputElement;
                        onGenerate({
                          ...generatedTest, 
                          status: 'SCHEDULED', 
                          publishDate: new Date(dateInput.value).toISOString()
                        });
                      }}
                      className="w-full py-3 bg-purple-600 text-white rounded-xl font-black text-sm hover:bg-purple-700 shadow-lg shadow-purple-600/20"
                    >
                      Confirm Schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 font-bold text-sm">
              <Lock size={16} />
              <span>Answers and explanations are shown after an exam is submitted</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
