/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Dashboard from './components/Dashboard';
import ExamResults from './components/ExamResults';
import ExamSimulator from './components/ExamSimulator';
import HighYieldQuestions from './components/HighYieldQuestions';
import Landing from './components/Landing';
import Layout from './components/Layout';
import PracticeExams from './components/PracticeExams';
import SyndromesViewer from './components/Syndromes/SyndromesViewer';
import TestHistory from './components/TestHistory';
import { contentApi } from './services/contentApi';
import { examApi } from './services/examApi';
const AdminPanel = lazy(() => import('./components/AdminPanel'));

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('highYield');
  const [isExaming, setIsExaming] = useState(false);
  const [completedResults, setCompletedResults] = useState<any>(null);
  const [currentTest, setCurrentTest] = useState<any>(null);
  const [features, setFeatures] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    const fetchFeatures = () => contentApi.featureSettings().then(data => {
      setFeatures(Object.fromEntries(data.map(f => [f.feature_key, f.is_visible])));
    }).catch(error => console.error('Feature flags request failed:', error));
    void fetchFeatures();
    const refresh = () => {if (!document.hidden) void fetchFeatures();};
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [user]);

  useEffect(() => {
    const handleStartExam = (e: any) => {
      setCurrentTest(e.detail);
      setIsExaming(true);
    };
    const navigate = (event: Event) => setActiveTab((event as CustomEvent<string>).detail);
    window.addEventListener('navigate-tab', navigate);
    window.addEventListener('start-exam', handleStartExam);
    return () => {window.removeEventListener('start-exam', handleStartExam); window.removeEventListener('navigate-tab', navigate);};
  }, []);

  if (loading) return <div role="status" className="p-8">Checking session…</div>;
  if (!user) return <Landing />;

  if (completedResults) {
    return (
      <ExamResults 
        results={completedResults} 
        onExit={() => {
          setCompletedResults(null);
        }} 
        onReattempt={() => {
           setCurrentTest(completedResults.test || completedResults.tests);
           setCompletedResults(null);
           setIsExaming(true);
        }}
        onLater={() => {
           setCompletedResults(null);
           setActiveTab('exams');
        }}
      />
    );
  }

  if (isExaming) {
    return (
      <ExamSimulator 
        test={currentTest}
        onComplete={(results) => { setCompletedResults(results); setIsExaming(false); }} 
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'highYield':
        return features.high_yield !== false ? <HighYieldQuestions /> : <Dashboard />;
      case 'exams':
        return features.practice_exams !== false ? <PracticeExams /> : <HighYieldQuestions />;
      case 'syndromes':
        return features.syndromes !== false ? <SyndromesViewer /> : <Dashboard />;
      case 'history':
        return features.test_history !== false ? (
          <TestHistory onViewResult={async (session: any) => {
            try { setCompletedResults(await examApi.result(session.id)); }
            catch (error) { console.error('Unable to load history result:', error); }
          }} />
        ) : <HighYieldQuestions />;
      case 'admin':
        return user.role === 'admin' ? <Suspense fallback={<div role="status">Loading administration…</div>}><AdminPanel /></Suspense> : <Dashboard />;
      default:
        return <HighYieldQuestions />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} features={features}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
