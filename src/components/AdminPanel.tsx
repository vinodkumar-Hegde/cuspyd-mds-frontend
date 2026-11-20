/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity, BookOpen, Download, FileText, GitBranch, LayoutGrid, Plus, Settings, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminApi, mapTest, questionPayload } from '../services/adminApi';
import { generateQuestionsFromPYQs } from '../services/aiGenerator';
import { Question, SubjectId, SUBJECTS, TestGenerated } from '../types';
import AdminExportPanel from './AdminExportPanel';
import { useApiPage } from '../hooks/useApiPage';
import Pagination from './Pagination';
import QuestionBank from './QuestionBank';
import AdminFeatureToggle from './AdminFeatureToggle';
import AdminHighYield from './AdminHighYield';
import AdminUsersPanel from './AdminUsersPanel';
import BulkUploader from './BulkUploader';
import ExamActivityPanel from './ExamActivityPanel';
import FlowChartAdminPanel from './FlowChartAdminPanel';
import ManualQuestionForm from './ManualQuestionForm';
import AdminSyndromes from './Syndromes/AdminSyndromes';
import TestArchitect from './TestArchitect';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'pool' | 'generator' | 'tests' | 'users' | 'activity' | 'highYield' | 'features' | 'export' | 'flowChartAdmin' | 'syndromes'>('pool');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(Object.keys(SUBJECTS)[0] || '');
  const [selectedYear, setSelectedYear] = useState<'BDS-I' | 'BDS-II' | 'BDS-III' | 'BDS-IV'>('BDS-I');
  const testsQuery = useApiPage(adminApi.tests);
  const tests = testsQuery.page.items.map(mapTest);
  const [editingTest, setEditingTest] = useState<TestGenerated | null>(null);

  const [error, setError] = useState('');
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiCount, setAiCount] = useState(10);
  useEffect(() => { void fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    try {
      const counts = await adminApi.questionCounts();
      setQuestionCounts(counts);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load question bank'); }
  };
  const fetchTests = () => testsQuery.refresh();
  const handleUpdateTest = async () => {
    if (!editingTest) return;
    try {
      await adminApi.editTest(editingTest.id, {admin_message: editingTest.adminMessage || ''});
      setEditingTest(null);
      await fetchTests();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save exam'); }
  };
  const handleDeleteTest = async (id: string) => {
    if (!confirm('Archive this exam? Existing results will remain available.')) return;
    try { await adminApi.archiveTest(id); await fetchTests(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to archive exam'); }
  };
  const archiveAll = async (type?: string) => {
    if (!confirm(`Archive all ${type || ''} exams? Existing results will remain available.`)) return;
    try { await adminApi.archiveTests(type); await fetchTests(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to archive exams'); }
  };
  const handleDeleteAllTests = () => archiveAll();
  const handleDeleteAllSTTests = () => archiveAll('ST');

  const handleBulkUpload = async (newQuestions: Question[]) => {
    const data = await adminApi.createQuestions(newQuestions.map(questionPayload));
    await fetchQuestions();
    return data;
  };
  const handleGenerateAI = async (testType: 'RANKER' | 'MOCK') => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError('');
    try {
      const generated = await generateQuestionsFromPYQs(selectedSubject, selectedYear, aiCount);
      const data = await handleBulkUpload(generated.map(q => ({...q, subjectId:selectedSubject, year:selectedYear})));
      await adminApi.createTest({title:`${testType} practice - ${new Date().toLocaleDateString()}`,
        type:testType, questions:data.map(q => q.id), status:'PUBLISHED', subject_id:selectedSubject});
      await fetchTests();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to generate exam'); }
    finally { setIsGenerating(false); }
  };
  const handleGenerateTest = async (test: TestGenerated) => {
    try {
      await adminApi.createTest({title:test.title, type:test.type, questions:test.questions,
        status:test.status, publish_date:test.publishDate || null, subject_id:test.subjectId || null,
        weightage:test.weightage});
      await fetchTests();
      setActiveTab('tests');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to publish exam'); }
  };

  return (
    <div className="space-y-8 pb-12">
      {error && <p role="alert" className="p-4 bg-red-50 text-red-700">{error}</p>}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Command Center</h1>
          <p className="text-slate-500 font-medium">Manage your {Object.values(questionCounts).reduce((sum, count) => sum + count, 0)} questions and generate exam schedules.</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'pool', label: 'Question Bank', icon: BookOpen },
          { id: 'generator', label: 'Test Architect', icon: LayoutGrid },
          { id: 'tests', label: 'Published Tests', icon: FileText },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'activity', label: 'Activity', icon: Activity },
          { id: 'highYield', label: 'High Yield', icon: LayoutGrid },
          { id: 'features', label: 'Features', icon: Settings },
          { id: 'export', label: 'Export Data', icon: Download },
          { id: 'flowChartAdmin', label: 'Flow Charts', icon: GitBranch },
          { id: 'syndromes', label: 'Syndromes', icon: LayoutGrid },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => {

              setActiveTab(tab.id as any);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'pool' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="text-blue-600" /> Bulk Data Ingestion
                </h3>
                <div className="flex gap-2">
                  <select 
                    value={selectedSubject} 
                    onChange={(e) => setSelectedSubject(e.target.value as SubjectId)}
                    className="bg-slate-50 p-2 rounded-xl text-sm font-bold border border-slate-200"
                  >
                    {Object.values(SUBJECTS).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value as any)}
                    className="bg-slate-50 p-2 rounded-xl text-sm font-bold border border-slate-200"
                  >
                    {['BDS-I', 'BDS-II', 'BDS-III', 'BDS-IV'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <BulkUploader 
                selectedSubject={selectedSubject}
                selectedYear={selectedYear}
                onUploadSuccess={handleBulkUpload}
              />
            </div>
            <ManualQuestionForm onSuccess={fetchQuestions} />
            <QuestionBank subjectId={selectedSubject} year={selectedYear} revision={Object.values(questionCounts).reduce((sum, value) => sum + value, 0)} />
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Database Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-xs uppercase font-black text-blue-600 tracking-widest mb-1">Total Bank</p>
                  <p className="text-2xl font-black text-slate-900">{Object.values(questionCounts).reduce((sum, count) => sum + count, 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'generator' && (
        <TestArchitect 
          questions={questions}
          questionCounts={questionCounts} 
          onGenerate={handleGenerateTest} 
          onUpdateQuestions={setQuestions}
        />
      )}

      {activeTab === 'tests' && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-900">Exam Control Center</h2>
            <Pagination query={testsQuery} label="Admin exams" />
            <div className="flex gap-2">
                <label className="text-sm">AI questions<input type="number" min={1} max={20} value={aiCount} onChange={e => setAiCount(Number(e.target.value))} className="w-16 border rounded p-2" /></label>
                <button 
                  onClick={handleDeleteAllSTTests}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700"
                >
                  Archive All ST Tests
                </button>
                <button 
                  onClick={handleDeleteAllTests}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-700"
                >
                  Archive All Tests
                </button>
                <button 
                  onClick={() => handleGenerateAI('RANKER')} 
                  disabled={isGenerating}
                  className={`bg-purple-600 text-white px-4 py-2 rounded-xl font-bold text-sm ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isGenerating ? 'Generating...' : 'Generate Ranker Practice (AI)'}
                </button>
                <button 
                  onClick={() => handleGenerateAI('MOCK')} 
                  disabled={isGenerating}
                  className={`bg-purple-800 text-white px-4 py-2 rounded-xl font-bold text-sm ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isGenerating ? 'Generating...' : 'Generate Mock Practice (AI)'}
                </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div key={test.id} className="p-8 bg-white border border-slate-200 rounded-[2rem] flex flex-col gap-4">
                <h4 className="font-black text-slate-900 text-lg leading-tight">{test.title}</h4>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setEditingTest(test)}
                        className="flex-1 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100"
                    >
                        <Settings size={14}/> Manage
                    </button>
                    <button 
                        onClick={() => handleDeleteTest(test.id)}
                        className="flex-1 text-xs font-bold text-red-600 bg-red-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100"
                    >
                        <X size={14}/> Archive
                    </button>
                </div>
              </div>
            ))}
          </div>

          {editingTest && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white p-8 rounded-3xl w-full max-w-lg space-y-4">
                   <h3 className="font-black text-xl">Manage Test Config</h3>
                   <input 
                      placeholder="Admin Status Message (e.g., Coming Soon)"
                      value={editingTest.adminMessage || ''}
                      onChange={e => setEditingTest({...editingTest, adminMessage: e.target.value})}
                      className="w-full p-3 border rounded-xl"
                   />
                   <div className="flex gap-2">
                       <button onClick={handleUpdateTest} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold">Save Changes</button>
                       <button onClick={() => setEditingTest(null)} className="p-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                   </div>
               </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && <AdminUsersPanel />}
      {activeTab === 'activity' && <ExamActivityPanel />}
      {activeTab === 'highYield' && <AdminHighYield />}
      {activeTab === 'features' && <AdminFeatureToggle />}
       {activeTab === 'export' && <AdminExportPanel />}
      {activeTab === 'flowChartAdmin' && <FlowChartAdminPanel />}
      {activeTab === 'syndromes' && <AdminSyndromes />}
      
    </div>
  );
}
