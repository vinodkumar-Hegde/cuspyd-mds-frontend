import { Activity, ArrowLeft, BookOpen, Brain, BriefcaseMedical, Building2, ChevronLeft, ChevronRight, Heart, Ligature, Microscope, Scale, Search, ShieldCheck, Smile, Stethoscope, Syringe, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { apiResult, mediaUrl } from '../services/apiClient';
import { contentApi } from '../services/contentApi';
import { SUBJECTS, SubjectId } from '../types';

const AnimatedIcon = ({ icon: Icon, size, className }: { icon: any, size: number, className?: string }) => (
    <motion.div
        whileHover={{ rotate: 10, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className={className}
    >
        <Icon size={size} />
    </motion.div>
);

const SubjectIcons: Record<string, any> = {
    'anatomy': Heart,
    'physiology_biochem': Activity,
    'dental_anatomy': Smile,
    'pathology_micro': Microscope,
    'pharmacology': Syringe,
    'medicine': Stethoscope,
    'surgery': BriefcaseMedical,
    'materials': Scale,
    'oral_path': ShieldCheck,
    'oral_med_rad': Search,
    'pedodontics': Users,
    'orthodontics': Ligature,
    'periodontology': Zap,
    'prosthodontics': Brain,
    'conservative_endo': BookOpen,
    'oral_surgery': Building2,
    'public_health': Activity,
};

const getIcon = (id: string) => SubjectIcons[id] || BookOpen;

export default function HighYieldComponent({ onBack }: { onBack: () => void }) {
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<SubjectId | null>(null);
    const [flipStates, setFlipStates] = useState<Record<string, boolean>>({});
    const [topics, setTopics] = useState<any[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
    const [allTopics, setAllTopics] = useState<any[]>([]); // New state
    const [currentIndex, setCurrentIndex] = useState(0);

    // ... inside useEffect for availableSubjects:

    useEffect(() => {
        setCurrentIndex(0);
        setFlipStates({});
    }, [selectedSubject]);

    useEffect(() => {
        async function fetchAvailableSubjects() {
            const { data, error } = await apiResult(contentApi.highYield());
            if (error) {
                setErrorMessage(error.message);
                return;
            }

            const subjectIds = Array.from(new Set(data.map(item => item.subject_id)));
            const subjects = Object.values(SUBJECTS).filter(s => subjectIds.includes(s.id));
            
            setAvailableSubjects(subjects);
            setAllTopics(data);
        }
        fetchAvailableSubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            async function fetchTopics() {
                const { data, error } = await apiResult(contentApi.highYield(selectedSubject));
                if (error) {
                    setErrorMessage(error.message);
                } else if (data) {
                    setTopics(data);
                }
            }
            fetchTopics();
        } else {
            setTopics([]);
        }
    }, [selectedSubject]);

    const toggleFlip = (id: string) => {
        setFlipStates(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (!selectedSubject) {
        return (
            <div className="p-8 bg-stone-50 min-h-screen">
                {errorMessage && <p role="alert" className="p-4 text-red-700">{errorMessage}</p>}
                <div className="flex justify-between items-center mb-8">
                    <button className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition" onClick={onBack}>
                        <div className="p-2 bg-white rounded-full shadow-md"><ArrowLeft size={20}/></div>
                        Back to Dashboard
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableSubjects.map(subject => {
                        const Icon = getIcon(subject.id);
                        const count = allTopics.filter(t => t.subject_id === subject.id).length;
                        return (
                        <motion.div 
                            key={subject.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedSubject(subject.id)}
                            className="cursor-pointer bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center gap-4 text-center"
                        >
                            <motion.div 
                                className="bg-indigo-50 p-6 rounded-3xl text-indigo-600"
                            >
                                <AnimatedIcon icon={Icon} size={40} />
                            </motion.div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">{subject.name}</h3>
                                <p className="text-slate-500 font-bold text-sm mt-1">{count} Questions</p>
                            </div>
                        </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-stone-50 min-h-screen relative">
            {errorMessage && <p role="alert" className="p-4 text-red-700">{errorMessage}</p>}
            <button className="absolute left-6 top-6 p-3 bg-white rounded-full shadow-lg text-slate-600 hover:bg-slate-100 z-50transition-all" onClick={() => setSelectedSubject(null)}>
                <ArrowLeft size={24}/>
            </button>
            
            <div className="mb-8 text-center pt-12">
                <h2 className="text-4xl font-black text-stone-900 mb-2">{SUBJECTS[selectedSubject!].name}</h2>
            </div>
            
            {topics.length > 0 && (
                <div className="flex flex-col items-center w-full">
                    
                    <div className="flex flex-col items-center w-full mb-8">
                        <motion.h3 
                            key={`${currentIndex}-${flipStates[topics[currentIndex]?.id] ? 'answer' : 'question'}`}
                            className="text-xl font-bold mb-6 px-6 py-2 rounded-full bg-slate-100 text-slate-800"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {flipStates[topics[currentIndex]?.id] ? `A-${currentIndex + 1}` : `Q-${currentIndex + 1}`}
                        </motion.h3>
                        <motion.div 
                            key={topics[currentIndex]?.id}
                            className="w-full cursor-pointer relative"
                            onClick={() => toggleFlip(topics[currentIndex]?.id)}
                            animate={{ rotateY: flipStates[topics[currentIndex]?.id] ? 180 : 0 }}
                            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            <motion.div 
                                className="w-full aspect-[3/4] md:aspect-video bg-white rounded-3xl shadow-lg flex items-center justify-center backface-hidden overflow-hidden" 
                                style={{ backfaceVisibility: "hidden" }}
                            >
                              {!flipStates[topics[currentIndex]?.id] && <div className="absolute bottom-4 right-4 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold">Tap on for answer</div>}
                              {topics[currentIndex]?.question_image_url ? <img src={mediaUrl(topics[currentIndex].question_image_url)} alt="Question" className="w-full h-full object-contain" /> : <p className='font-bold text-slate-900 text-center text-lg p-8'>{topics[currentIndex].topic_name}</p>}
                            </motion.div>
                            <motion.div 
                                className="w-full aspect-[3/4] md:aspect-video bg-indigo-50 rounded-3xl shadow-lg flex items-center justify-center absolute inset-0 backface-hidden overflow-hidden" 
                                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                            >
                              {topics[currentIndex]?.answer_image_url ? <img src={mediaUrl(topics[currentIndex].answer_image_url)} alt="Answer" className="w-full h-full object-contain" /> : <p className='font-bold text-indigo-900 text-lg p-8'>Answer</p>}
                            </motion.div>
                        </motion.div>
                    </div>

                    <div className="flex items-center justify-center gap-6 w-full">
                        <motion.button 
                            whileHover={{ scale: 1.05, backgroundColor: "#f1f5f9" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                            className="p-4 bg-white rounded-full shadow-md text-slate-600 disabled:opacity-50"
                        >
                            <ChevronLeft size={28} />
                        </motion.button>
                        
                        <span className="font-black text-violet-900 text-lg bg-white px-6 py-2 rounded-full shadow-md border-2 border-violet-100">{currentIndex + 1} / {topics.length}</span>

                        <motion.button 
                            whileHover={{ scale: 1.05, backgroundColor: "#f1f5f9" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentIndex(prev => Math.min(topics.length - 1, prev + 1))}
                            disabled={currentIndex === topics.length - 1}
                            className="p-4 bg-white rounded-full shadow-md text-slate-600 disabled:opacity-50"
                        >
                            <ChevronRight size={28} />
                        </motion.button>
                    </div>
            
                </div>
            )}
        </div>
    );
}
