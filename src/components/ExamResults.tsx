import { AlertCircle, CheckCircle2, ChevronLeft, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import type { ExamResult } from '../services/examApi';

export default function ExamResults({ results, onExit, onReattempt, onLater }: { results: ExamResult, onExit: () => void, onReattempt?: () => void, onLater?: () => void }) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const test = results.test;
  const answers = results.results?.answers || {};
  const score = results.results?.score ?? 'Unavailable';
  const correct = results.results?.correct ?? '—';
  const wrong = results.results?.wrong ?? '—';
  const unattempted = results.results?.unattempted ?? '—';
  
  const questions = results.questions || [];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300">
      <button 
        onClick={onExit}
        className="fixed top-1/2 left-2 z-50 p-2 sm:p-3 bg-white border border-slate-200 rounded-full shadow-lg hover:bg-slate-50 transition-colors text-slate-600"
        title="Back"
      >
        <ChevronLeft size={24} />
      </button>
      {onReattempt && test.id && (
        <>
            <button 
                onClick={() => setShowConfirmation(true)}
                className="fixed top-1/2 right-2 z-50 bg-blue-600 text-white font-black px-6 py-4 rounded-2xl hover:bg-blue-700 shadow-lg"
            >
                Re-attempt
            </button>
            
            {showConfirmation && (
                <AnimatePresence>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white p-8 rounded-3xl text-center shadow-2xl"
                        >
                            <h2 className="text-2xl font-black mb-6">Take the exam:</h2>
                            <div className="flex gap-4">
                                <button onClick={() => { setShowConfirmation(false); onReattempt?.(); }} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold animate-pulse">Now</button>
                                <button onClick={() => { setShowConfirmation(false); onLater?.(); }} className="bg-slate-200 text-slate-800 px-8 py-3 rounded-xl font-bold">Later</button>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}
        </>
      )}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Exam Results: {test?.title}</h2>
            {results.notice && <p role="status" className="my-4 rounded-xl bg-amber-50 p-4 text-amber-900">{results.notice}</p>}
            <div className="flex gap-4">
              <p className="text-slate-500 font-bold mb-6 text-xl">Score: <span className='text-3xl text-slate-900'>{score}</span></p>
              <p className="text-emerald-600 font-bold mb-6">Correct: {correct}</p>
              <p className="text-red-600 font-bold mb-6">Wrong: {wrong}</p>
              <p className="text-slate-500 font-bold mb-6">Unattempted: {unattempted}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="text-amber-500" /> Answer Key & Explanations
            </h3>
              <div className="space-y-4">
                {questions.length > 0 ? questions.map((q: any, i: number) => {
                  const selectedOption = answers ? answers[q.id] : undefined;
                  const isCorrect = selectedOption === q.correctOption;
                  
                  return (
                    <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                      <p className="font-bold text-slate-900">{i+1}. {q.text}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((option: string, optIdx: number) => (
                            <div key={optIdx} className={`p-3 rounded-lg border text-sm font-medium ${
                               optIdx === q.correctOption 
                                 ? 'bg-emerald-100 border-emerald-400 text-emerald-900 ring-1 ring-emerald-400' 
                                 : (optIdx === selectedOption && !isCorrect)
                                   ? 'bg-red-100 border-red-400 text-red-900 ring-1 ring-red-400' 
                                   : 'bg-slate-50 border-slate-200 text-slate-700'
                             }`}>
                               <div className="flex items-center gap-2">
                                 <span className={`font-bold ${
                                     optIdx === q.correctOption 
                                       ? 'text-emerald-700' 
                                       : (optIdx === selectedOption)
                                         ? 'text-red-700' 
                                         : 'text-slate-500'
                                   }`}>
                                    {String.fromCharCode(65 + optIdx)}.
                                 </span>
                                 {option}
                                 {optIdx === selectedOption && <span className="ml-auto text-[10px] font-black uppercase tracking-wider bg-white/50 px-2 py-0.5 rounded-full border border-current">Marked</span>}
                                 {optIdx === q.correctOption && <CheckCircle2 size={16} className={`${optIdx === selectedOption ? '' : 'ml-auto'} text-emerald-600`} />}
                                 {(optIdx === selectedOption && !isCorrect) && <AlertCircle size={16} className="ml-auto text-red-600" />}
                               </div>
                             </div>
                        ))}
                      </div>

                      <div className={`font-bold p-3 rounded-lg flex items-center gap-2 ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {isCorrect ? <CheckCircle2 /> : <AlertCircle />}
                        {isCorrect ? 'Correct!' : `Wrong! Correct option was ${String.fromCharCode(65 + q.correctOption)}`}
                      </div>

                      <p className="text-sm text-slate-600 bg-slate-100 p-4 rounded-xl"><span className='font-bold'>Explanation:</span> {q.explanation}</p>
                    </div>
                  );
                }) : <p>Questions not available for historical sessions.</p>}
            </div>
          </div>
        </div>
      <button 
        onClick={onExit}
        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800"
      >
        Back to app
      </button>
    </div>
  );
}
