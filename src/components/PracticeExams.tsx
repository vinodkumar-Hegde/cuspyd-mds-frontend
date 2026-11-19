/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    Baby,
    Bone,
    BookOpen,
    Clock,
    Construction,
    FlaskConical,
    GraduationCap,
    Layers,
    Microscope,
    PenTool,
    Search,
    Shield,
    Smile,
    Stethoscope,
    Target,
    Trophy,
    Users,
    Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useMemo, useState } from 'react';
import { examApi } from '../services/examApi';
import { SUBJECTS, SUBJECT_BDS_YEAR, SubjectId, TestGenerated } from '../types';

const SUBJECT_ICON_MAP: Record<SubjectId, any> = {
  anatomy: Bone,
  physiology_biochem: FlaskConical,
  dental_anatomy: Smile,
  pathology_micro: Microscope,
  pharmacology: Zap,
  medicine: Stethoscope,
  surgery: Shield,
  materials: Construction,
  oral_path: Microscope,
  oral_med_rad: Target,
  pedodontics: Baby,
  orthodontics: Smile,
  periodontology: Shield,
  prosthodontics: Layers,
  conservative_endo: PenTool,
  oral_surgery: Shield,
  public_health: Users,
};

const ExamTile = ({ test, icon: Icon, iconColor, displayName, onClick, borderClass }: { test: TestGenerated, icon: any, iconColor: string, displayName: string, onClick: () => void, borderClass: string }) => {
  const isNew = useMemo(() => {
    if (!test.createdAt) return false;
    const created = new Date(test.createdAt).getTime();
    const now = new Date().getTime();
    return (now - created) < (24 * 60 * 60 * 1000);
  }, [test.createdAt]);

  return (
    <motion.button
      onClick={onClick}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-white rounded-[2rem] border-4 ${borderClass} p-6 flex flex-col items-center text-center hover:shadow-2xl hover:shadow-slate-200 transition-all group w-full relative`}
    >
      {isNew && (
        <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg transform rotate-12">
            NEW
        </span>
      )}
      <div className={`p-4 rounded-3xl ${iconColor} bg-slate-50 mb-4`}>
        <Icon size={32} />
      </div>
      <h3 className="text-sm font-black text-slate-900 mb-1 leading-tight">{test.title}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
        {test.questions.length} Questions
      </p>
      <div className="mt-auto w-full px-4 py-2 rounded-xl bg-slate-50 text-[10px] font-black text-slate-600">
        {displayName}
      </div>
    </motion.button>
  );
};

export default function PracticeExams() {
  const [activeCategory, setActiveCategory] = useState<'RANKER' | 'MOCK' | 'MT' | 'ST' | 'IMG'>('RANKER');
  const [activeYear, setActiveYear] = useState<'BDS-I' | 'BDS-II' | 'BDS-III' | 'BDS-IV'>('BDS-I');
  const [activeImageYear, setActiveImageYear] = useState<'BDS-I' | 'BDS-II' | 'BDS-III' | 'BDS-IV'>('BDS-I');
  const [searchTerm, setSearchTerm] = useState('');
  const [tests, setTests] = useState<TestGenerated[]>([]);
  const [imageBasedQuestions, setImageBasedQuestions] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    async function load() {
      try {
        const [exams, images] = await Promise.all([examApi.list(), examApi.imageBased()]);
        if (!live) return;
        setTests(exams.map(t => ({...t, createdAt:t.created_at, subjectId:t.subject_id})));
        setImageBasedQuestions(images.map(q => ({...q, subjectId:q.subject_id, imageUrl:q.image_url})));
        setError('');
      } catch (e) { if (live) setError(e instanceof Error ? e.message : 'Unable to load exams'); }
    }
    void load();
    const refresh = () => { if (!document.hidden) void load(); };
    window.addEventListener('focus', refresh);
    return () => {live = false; window.removeEventListener('focus', refresh);};
  }, []);

  const filteredTests = useMemo<TestGenerated[]>(() => {

    // Image tiles are rendered by the IMG-specific view below, not as tests.
    if (activeCategory === 'IMG') return [];

    const filtered = tests.filter((test: TestGenerated) => {
        const normalizedType = test.type === 'GT' ? 'MOCK' : test.type;

        let matchesCategory = normalizedType === activeCategory;

        // Year Filter for Subjects
        if (matchesCategory && activeCategory === 'ST' && test.subjectId) {
            if (SUBJECT_BDS_YEAR[test.subjectId] !== activeYear) {
                matchesCategory = false;
            }
        }

      const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isVisible = matchesCategory && matchesSearch;
      
      return isVisible;
    });

    return filtered;
  }, [tests, imageBasedQuestions, activeCategory, activeYear, searchTerm]);

  const categories = [
    { id: 'RANKER', label: 'Ranker Test', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-100' },
    { id: 'MOCK', label: 'Mock', icon: Target, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'MT', label: 'Mini', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 'ST', label: 'Subject', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { id: 'IMG', label: 'Image Based', icon: Microscope, color: 'text-pink-600', bg: 'bg-pink-100' },
  ];

  const categoryNewStatus = useMemo(() => {
    const now = new Date().getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    const status: Record<string, boolean> = {};
    
    categories.forEach(cat => {
        if (cat.id === 'IMG') {
            status[cat.id] = imageBasedQuestions.some(q => {
                if (!q.createdAt) return false;
                const created = new Date(q.createdAt).getTime();
                return (now - created) < twentyFourHours;
            });
        } else {
            status[cat.id] = tests.some(test => {
                if (!test.createdAt) return false;
                const created = new Date(test.createdAt).getTime();
                if (now - created > twentyFourHours) return false;
                
                const normalizedType = test.type === 'GT' ? 'MOCK' : test.type;
                return normalizedType === cat.id;
            });
        }
    });
    
    return status;
  }, [tests, imageBasedQuestions]);

  return (
    <div className="space-y-8 pb-12">
      {error && <p role="alert" className="p-4 text-red-700 bg-red-50">{error}</p>}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Practice Arena</h1>
          <p className="text-slate-500 font-medium">Select a standardized test series to measure your proficiency.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`
              flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap border-2 relative
              ${activeCategory === cat.id 
                ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' 
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}
            `}
          >
            {categoryNewStatus[cat.id] && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            )}
            <cat.icon size={18} className={activeCategory === cat.id ? 'text-white' : cat.color} />
            {cat.label}
          </button>
        ))}
      </div>

      {(activeCategory === 'ST' || activeCategory === 'IMG') && (
        <div className="flex gap-2 pb-4">
          {['BDS-I', 'BDS-II', 'BDS-III', 'BDS-IV'].map(year => (
            <button
              key={year}
              onClick={() => activeCategory === 'ST' ? setActiveYear(year as any) : setActiveImageYear(year as any)}
              className={`
                px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2
                ${(activeCategory === 'ST' ? activeYear : activeImageYear) === year 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}
              `}
            >
              {year === 'BDS-I' ? 'All Subjects' : year}
            </button>
          ))}
        </div>
      )}

      {/* Exam Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {activeCategory === 'IMG' 
            ? (() => {
                const filteredQuestions = imageBasedQuestions.filter(q => SUBJECT_BDS_YEAR[q.subjectId as SubjectId] === activeImageYear);
                const groupedBySubject = filteredQuestions.reduce((acc, q) => {
                    const subject = q.subjectId;
                    if (!acc[subject]) acc[subject] = [];
                    acc[subject].push(q);
                    return acc;
                }, {} as Record<string, any[]>);

                return Object.entries(groupedBySubject).map(([subjectId, questions]: [string, any[]]) => {
                    // Group questions into sets of 5-10
                    const questionSets: any[][] = [];
                    for (let i = 0; i < questions.length; i += 1) { // Using 7 as a middle ground
                      questionSets.push(questions.slice(i, i + 1));
                    }
                    
                    return (
                      <div key={subjectId} className="col-span-full mb-10">
                        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                          {React.createElement(SUBJECT_ICON_MAP[subjectId as SubjectId] || BookOpen, { size: 24 })}
                          {SUBJECTS[subjectId as SubjectId]?.name || subjectId}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {questionSets.map((set, setIdx) => {


                               const test = { 
                                 id: set[0].id, 
                                 title: `${SUBJECTS[subjectId as SubjectId]?.name || subjectId} Image Set ${setIdx + 1}`, 
                                 type: 'IMG', 
                                 questions: set.map((q: any) => q.id), 
                                 status: 'PUBLISHED', 
                                 createdAt: set[0].createdAt, 
                                 subjectId: subjectId 
                               };
                                const created = new Date(test.createdAt).getTime();
                                const now = new Date().getTime();
                                const isNew = (now - created) < (24 * 60 * 60 * 1000);

                                const Icon = SUBJECT_ICON_MAP[subjectId as SubjectId] || Microscope;
                                return (
                                 <motion.button
                                    key={test.id}
                                    onClick={() => window.dispatchEvent(new CustomEvent('start-exam', { detail: test }))}
                                    layout
                                    className="bg-white rounded-[2rem] border-4 border-pink-400 p-6 flex flex-col items-center text-center hover:shadow-2xl hover:shadow-pink-200 transition-all w-full relative"
                                  >
                                    {isNew && (
                                        <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg transform rotate-12">
                                            NEW
                                        </span>
                                    )}
                                    <div className="p-4 rounded-3xl text-pink-600 bg-pink-50 mb-4">
                                      <Icon size={32} />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 mb-1">Image Set {setIdx + 1}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                                      {set.length} Questions
                                    </p>
                                    <div className="mt-auto w-full px-4 py-2 rounded-xl bg-pink-50 text-[10px] font-black text-pink-600">
                                      Start Practice
                                    </div>
                                  </motion.button>
                               );
                            })}
                        </div>
                      </div>
                    );
                });
              })()
            : filteredTests.map((test: TestGenerated) => {
                 const finalType = test.type === 'GT' ? 'MOCK' : test.type;
                 const categoryConfig = categories.find(c => c.id === finalType);
                 const displayName = categoryConfig?.label || finalType;
                 const CategoryIcon = finalType === 'RANKER' ? GraduationCap : (finalType === 'ST' ? SUBJECT_ICON_MAP[test.subjectId as SubjectId] || BookOpen : (categoryConfig?.icon || BookOpen));
                 const iconColor = finalType === 'RANKER' ? 'text-amber-500' : (categoryConfig?.color || 'text-slate-600');
                 const borderClass = finalType === 'RANKER' ? 'border-amber-400' : 
                                    finalType === 'MOCK' ? 'border-blue-400' : 
                                    finalType === 'MT' ? 'border-purple-400' : 'border-emerald-400';
    
                 return (
                   <ExamTile
                      key={test.id}
                      test={test}
                      icon={CategoryIcon}
                      iconColor={iconColor}
                      displayName={displayName}
                      onClick={() => window.dispatchEvent(new CustomEvent('start-exam', { detail: test }))}
                      borderClass={borderClass}
                   />
              )})}
        </AnimatePresence>

        {(activeCategory === 'IMG' ? imageBasedQuestions.length === 0 : filteredTests.length === 0) && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
            <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
              <BookOpen size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No active tests found</h3>
            <p className="text-slate-500 font-bold max-w-sm mx-auto">
              We haven't published any {activeCategory} practice tests yet. Check the dashboard for upcoming schedules!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
