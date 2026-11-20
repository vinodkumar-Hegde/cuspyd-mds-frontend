import { Download, Filter, Users } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useApiPage } from '../hooks/useApiPage';
import Pagination from './Pagination';
import { adminApi } from '../services/adminApi';

export default function AdminUsersPanel() {
  const [filter, setFilter] = useState('');
  const loadUsers = useCallback((offset:number, signal:AbortSignal) => adminApi.users(offset, signal, filter), [filter]);
  const query = useApiPage(loadUsers);
  const filteredProfiles = query.page.items;

  const exportCSV = () => {
    const headers = ['Created At', 'Name', 'Email', 'Mobile', 'Role', 'College'];
    const cell = (value: unknown) => {
      let text = String(value ?? '');
      if (/^\s*[=+\-@\t\r\n]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    const csvContent = [headers.map(cell).join(','), ...filteredProfiles.map(p => 
        [p.created_at, p.name, p.email, p.mobile, p.role, p.college].map(cell).join(',')
    )].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.csv';
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };


  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="text-purple-600" /> Users ({query.page.total})
        </h2>
        <div className="flex gap-2">
            <div className="relative">
                <Filter className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                    placeholder="Filter by name/email" 
                    value={filter} 
                    onChange={e => setFilter(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl bg-slate-100 text-sm font-bold border-none"
                />
            </div>
            <button onClick={exportCSV} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                <Download size={16} /> Export this page
            </button>
        </div>
      </div>
      <Pagination query={query} label="Users" />
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
              <th className="pb-4">Created At</th>
              <th className="pb-4">Name</th>
              <th className="pb-4">Email</th>
              <th className="pb-4">Mobile</th>
              <th className="pb-4">Role</th>
              <th className="pb-4">College</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProfiles.map(profile => (
              <tr key={profile.id} className="text-sm font-bold text-slate-900">
                <td className="py-4">{new Date(profile.created_at).toLocaleDateString()}</td>
                <td className="py-4">{profile.name}</td>
                <td className="py-4">{profile.email}</td>
                <td className="py-4">{profile.mobile}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${profile.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                    {profile.role}
                  </span>
                </td>
                <td className="py-4">{profile.college}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
