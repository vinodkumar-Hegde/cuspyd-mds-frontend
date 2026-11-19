/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth } from '../AuthContext';
import HighYieldComponent from './HighYieldComponent';

export default function HighYieldQuestions() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, Dr. {user?.name?.split(' ')[0]}</h1>
          <p className="text-slate-500 font-medium">Review your subjects and practice with the available questions.</p>
        </div>
      </header>

      <HighYieldComponent onBack={() => window.dispatchEvent(new CustomEvent('navigate-tab', {detail:'dashboard'}))} />
    </div>
  );
}
