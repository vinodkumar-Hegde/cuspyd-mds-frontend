/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    FileText,
    History,
    LayoutDashboard,
    LayoutGrid,
    Lock,
    LogOut,
    Mail,
    Phone,
    PlusCircle,
    Target,
    Users,
    X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';


interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  features: Record<string, boolean>;
}

export default function Layout({ children, activeTab, setActiveTab, features }: LayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'highYield', label: 'High Yield Questions', icon: Target, feature: 'high_yield' },
    { id: 'syndromes', label: 'Syndromes', icon: LayoutGrid, feature: 'syndromes' },
    { id: 'exams', label: 'Practice Exams', icon: FileText, feature: 'practice_exams' },
    { id: 'history', label: 'Test History', icon: History, feature: 'test_history' },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: PlusCircle });
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col">

      <div className="flex flex-1">
        {/* Sidebar Toggle Button */}
      <button 
        onClick={toggleSidebar} 
        className={`fixed top-1/2 -translate-y-1/2 z-[80] p-1 rounded-full bg-white shadow-xl border border-slate-200 transition-all duration-300
          ${isSidebarOpen ? 'left-[280px]' : 'left-4'}
        `}
      >
        <motion.div
          animate={{ rotate: isSidebarOpen ? 180 : 0 }}
          className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white"
        >
          {isSidebarOpen ? <X size={20} /> : <Users size={20} />}
        </motion.div>
      </button>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[65] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-100 z-[70] transition-all duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:fixed lg:translate-x-0 lg:h-screen lg:shrink-0
        ${isSidebarOpen ? 'lg:w-72' : 'lg:w-0 lg:border-none'}
      `}>
        <div className={`p-6 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 lg:w-72 ${isSidebarOpen ? '' : 'lg:hidden'}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="Cuspyd Logo" className="h-full w-auto object-contain" />
              </div>
              <span className="font-bold text-slate-800 text-xl">Cuspyd</span>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isLocked = item.feature && features[item.feature] === false;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isLocked) return;
                    setActiveTab(item.id);
                    // On mobile, close sidebar after navigation
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all
                    ${activeTab === item.id 
                    ? 'bg-secondary-main/10 text-secondary-main' 
                    : (item.id === 'syndromes' 
                       ? 'bg-white text-slate-800 border border-slate-200' 
                       : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}
                    ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      {item.label}
                  </div>
                  {isLocked && <Lock size={16} className="text-slate-400" />}
                </button>
              );
            })}
            
            <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-600 hover:bg-red-50 transition-all mt-4"
            >
                <LogOut size={20} />
                Sign Out
            </button>
          </nav>
        </div>

        <div className={`mt-auto border-t border-slate-100 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 lg:w-72 ${isSidebarOpen ? '' : 'lg:hidden'}`}>
          <div className="p-6 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center font-bold text-slate-500">
              {user?.name?.charAt(0) || 'D'}
             </div>
             <div>
               <p className="text-sm font-bold text-slate-900">{user?.name || 'Doctor'}</p>
               <p className="text-xs text-slate-500">NEET MDS Candidate</p>
             </div>
          </div>
          <div className="px-6 pb-6 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Need Help?</p>
            <motion.a 
               href="tel:+918877534567"
               whileHover={{ scale: 1.05 }}
               className="flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Phone size={16} />
              </div>
              +91-8877534567
            </motion.a>
            <motion.a 
               href="mailto:help@cuspyd.com"
               whileHover={{ scale: 1.05 }}
               className="flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mail size={16} />
              </div>
              help@cuspyd.com
            </motion.a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto px-4 py-20 lg:py-8 lg:px-10 relative transition-all duration-300 ${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  </div>
  );
}
