import { mediaUrl } from '../services/apiClient';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Flag,
    LayoutGrid,
    SendHorizontal
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { examApi } from '../services/examApi';
import { EXAM_SECONDS_PER_QUESTION, Question, SubjectId, SUBJECTS } from '../types';

export default function ExamSimulator({ test, onComplete }: { test: any, onComplete: (results: any) => void }) {
  const submissionId = useRef(crypto.randomUUID());
  const [questions, setQuestions] = useState<Omit<Question, 'correctOption' | 'explanation'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
        if (!test || !test.questions || test.questions.length === 0) {
            setLoading(false);
            return;
        }
        const data = await examApi.questions(test.id).catch(error => {
           setSubmitError(error instanceof Error ? error.message : 'Unable to fetch exam');
           return [];
         });
        
        if (data) {
            const mapped = data.map((q: any) => ({
                id: q.id,
                subjectId: q.subject_id,
                year: q.year,
                text: q.text,
                options: q.options,
                topic: q.topic,
                imageUrl: q.image_url
            }));
            setQuestions(mapped);
        }
        setLoading(false);
    };
    fetchQuestions();
  }, [test]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);

  const deadline = useRef(0);
  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (!questions.length) return;
    deadline.current = Date.now() + questions.length * EXAM_SECONDS_PER_QUESTION * 1000;
    const tick = () => setTimeLeft(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [questions.length]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const graded = await examApi.submit(test.id, answers, submissionId.current);
      onComplete(graded); // backend saved and scored the attempt
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit exam');
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (timeLeft === 0 && deadline.current && Date.now() >= deadline.current && !autoSubmitted.current && !isSubmitting) {
      autoSubmitted.current = true;
      void handleSubmitExam();
    }
  }, [timeLeft, isSubmitting]);

  if (loading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-white font-bold text-slate-500">Loading Exam...</div>;
  }

  if (questions.length === 0) {
      return <div className="fixed inset-0 flex items-center justify-center bg-white font-bold text-red-500">{submitError || 'No questions found for this test.'}</div>;
  }

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isSubmitting || timeLeft <= 0) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: index }));
  };

  const toggleReview = () => {
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const prevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const progress = (Object.keys(answers).length / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-slate-50 z-[100] flex flex-col">
      {submitError && <div role="alert" className="p-3 text-red-700 bg-red-50">{submitError}</div>}
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] sm:text-sm font-bold tracking-widest">{test.title}</div>
          {test.subjectId && (
            <div className="text-[10px] text-slate-500 font-bold">
              Subject: {SUBJECTS[test.subjectId as SubjectId]?.name || 'N/A'}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-6">
          <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl font-mono text-sm sm:text-xl font-bold ${timeLeft < 300 ? 'bg-red-50 text-red-600' : 'bg-slate-900 text-white'}`}>
            <Clock size={16} />
            {formatTime(timeLeft)}
          </div>
           <div className="flex items-center gap-2">
            <button 
              onClick={() => { void handleSubmitExam(); }} disabled={isSubmitting}
              className="flex items-center gap-1 sm:gap-2 bg-emerald-600 text-white px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:bg-emerald-700 shadow-lg"
            >
              Submit
              <SendHorizontal size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Question Area */}
        <div className="flex-1 overflow-y-auto bg-white m-0 sm:m-4 sm:rounded-3xl border-b sm:border border-slate-100 shadow-sm relative">
          <div className="p-4 lg:p-12 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Question {currentIndex + 1} of {questions.length}</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleReview}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-sm ${markedForReview.has(currentQuestion.id) ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  <Flag size={14} fill={markedForReview.has(currentQuestion.id) ? 'currentColor' : 'none'} />
                  Review
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:gap-10">
              {currentQuestion.imageUrl && (
                <div className="w-full flex justify-center">
                  <div className="max-w-md w-full">
                    <img 
                      src={mediaUrl(currentQuestion.imageUrl)} 
                      alt="Question" 
                      referrerPolicy="no-referrer"
                      className="rounded-2xl border border-slate-200 shadow-sm w-full h-auto"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex-1">
                <motion.h2 
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-lg sm:text-2xl font-semibold text-slate-900 leading-snug"
                >
                  {currentQuestion.text}
                </motion.h2>


              </div>
            </div>

            <div className="grid gap-8 sm:gap-10 sm:mt-12">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`
                    flex items-center gap-3 sm:gap-4 p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left font-medium text-xs sm:text-base
                    ${answers[currentQuestion.id] === idx
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-slate-100 hover:border-slate-200 text-slate-600'}
                  `}
                >
                  <span className={`
                    w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold shrink-0 text-xs sm:text-sm
                    ${answers[currentQuestion.id] === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}
                  `}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="border-t border-slate-100 p-3 sm:p-6 bg-white shrink-0 sticky bottom-0">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button 
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30 text-xs sm:text-sm"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              
              <button 
                onClick={nextQuestion}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg text-xs sm:text-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Question Palette - Always visible as a slide-over/panel on mobile if needed, but for now, hiding until triggered or just making it compact */}
        <aside className="hidden lg:flex w-80 flex-col bg-white border-l border-slate-200 shrink-0">

          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <LayoutGrid size={18} className="text-blue-600" />
              Question Palette
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-600 rounded-sm" /> Answered</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-400 rounded-sm" /> Review</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-200 rounded-sm" /> Not Visited</div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isMarked = markedForReview.has(q.id);
                const isActive = currentIndex === idx;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`
                      h-10 rounded-lg text-sm font-bold transition-all
                      ${isActive ? 'ring-2 ring-slate-900 ring-offset-2' : ''}
                      ${isMarked ? 'bg-amber-400 text-white' : isAnswered ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm font-bold mb-2">
              <span className="text-slate-500">Exam Progress</span>
              <span className="text-blue-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
