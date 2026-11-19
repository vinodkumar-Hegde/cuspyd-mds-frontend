import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';
import { apiResult } from '../services/apiClient';
import { contentApi } from '../services/contentApi';
import { SUBJECTS } from '../types';

export default function AdminHighYield() {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(Object.keys(SUBJECTS)[0]);
  const year = String(new Date().getFullYear());
  const [qFile, setQFile] = useState<File | null>(null);
  const [aFile, setAFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    const { data, error } = await apiResult(contentApi.highYield());
    if (error) alert(error.message);
    if (data) setTopics(data);
  };

  const uploadFile = async (file: File) => {
    return (await adminApi.upload('high-yield', file)).publicUrl;
  };

  const handleUpload = async () => {
    if (!qFile || !aFile || !topic) return;
    setUploading(true);

    try {
        const qUrl = await uploadFile(qFile);
        const aUrl = await uploadFile(aFile);

        await adminApi.createHighYield({
          subject_id: subject,
          year: year,
          topic_name: topic,
          question_image_url: qUrl,
          answer_image_url: aUrl
        });
        alert('Uploaded successfully');
        fetchTopics();
    } catch (e) {
        console.error(e);
        alert(e instanceof Error ? e.message : 'Unable to upload topic');
    } finally {
        setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try { await adminApi.deleteHighYield(id); } catch (e) { alert(e instanceof Error ? e.message : 'Unable to delete topic'); return; }
    fetchTopics();
  };

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">Manage High Yield Images</h2>
      <div className="space-y-4">
        <input className="w-full p-3 border rounded" placeholder="Topic Name" onChange={e => setTopic(e.target.value)} />
        <select className="w-full p-3 border rounded" onChange={e => setSubject(e.target.value)}>
            {Object.entries(SUBJECTS).map(([id, s]) => <option key={id} value={id}>{s.name}</option>)}
        </select>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold mb-2">Question Image</label>
                <input type="file" onChange={e => setQFile(e.target.files?.[0] || null)} />
            </div>
            <div>
                <label className="block text-sm font-bold mb-2">Answer Image</label>
                <input type="file" onChange={e => setAFile(e.target.files?.[0] || null)} />
            </div>
        </div>
        
        <button className="bg-blue-600 text-white p-3 rounded-lg font-bold" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Topic Images'}
        </button>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-xl font-bold">Existing Topics</h3>
        {topics.map(t => (
            <div key={t.id} className="flex justify-between items-center p-4 border rounded">
                <span>{t.topic_name}</span>
                <button onClick={() => handleDelete(t.id)} className="text-red-500"><Trash2 size={20} /></button>
            </div>
        ))}
      </div>
    </div>
  );
}
