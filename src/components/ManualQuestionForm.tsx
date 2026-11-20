import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { adminApi } from '../services/adminApi';
import { apiResult } from '../services/apiClient';
import { SUBJECTS, SubjectId } from '../types';

interface ManualQuestionFormProps {
  onSuccess: () => void;
}

export default function ManualQuestionForm({ onSuccess }: ManualQuestionFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: (Object.keys(SUBJECTS)[0] || '') as SubjectId,
    year: 'BDS-I' as 'BDS-I' | 'BDS-II' | 'BDS-III' | 'BDS-IV',
    text: '',
    options: ['', '', '', ''],
    correctOption: 0,
    explanation: '',
    topic: '',
    image: null as File | null,
    imagePracticeEnabled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';
      if (formData.image) {
        imageUrl = (await adminApi.upload('question-images', formData.image)).publicUrl;
      }

      const { error } = await apiResult(adminApi.createQuestions([{
          subject_id: formData.subjectId,
          year: formData.year,
          text: formData.text,
          options: formData.options,
          correct_option: formData.correctOption,
          explanation: formData.explanation,
          topic: formData.topic,
          image_url: imageUrl || undefined,
          image_practice_enabled: formData.imagePracticeEnabled,
        }]));

      if (error) throw error;

      alert('Question uploaded successfully!');
      onSuccess();
      setFormData({
        subjectId: Object.keys(SUBJECTS)[0] || '',
        year: 'BDS-I',
        text: '',
        options: ['', '', '', ''],
        correctOption: 0,
        explanation: '',
        topic: '',
        image: null,
        imagePracticeEnabled: false,
      });
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
      <h3 className="text-xl font-bold mb-4">Manual Question Entry</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <select value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value as SubjectId})} className="p-3 border rounded-xl">
          {Object.values(SUBJECTS).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={formData.year} onChange={e => setFormData({...formData, year: e.target.value as any})} className="p-3 border rounded-xl">
          {['BDS-I', 'BDS-II', 'BDS-III', 'BDS-IV'].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <textarea placeholder="Question Text" value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} className="w-full p-3 border rounded-xl" rows={3} required />
      
      {formData.options.map((opt, i) => (
        <input key={i} placeholder={`Option ${String.fromCharCode(65+i)}`} value={opt} onChange={e => {
          const ops = [...formData.options];
          ops[i] = e.target.value;
          setFormData({...formData, options: ops});
        }} className="w-full p-3 border rounded-xl" required />
      ))}
      
      <select value={formData.correctOption} onChange={e => setFormData({...formData, correctOption: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl">
        {formData.options.map((_, i) => <option key={i} value={i}>Correct Option: {String.fromCharCode(65+i)}</option>)}
      </select>

      <label className="block">Question image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setFormData({...formData, image: e.target.files?.[0] || null, imagePracticeEnabled:false})} className="w-full p-3 border rounded-xl" /></label>
      <label className="flex items-center gap-2"><input type="checkbox" disabled={!formData.image} checked={formData.imagePracticeEnabled} onChange={e => setFormData({...formData, imagePracticeEnabled:e.target.checked})} />Publish for image practice</label>
      <textarea placeholder="Explanation" value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} className="w-full p-3 border rounded-xl" rows={2} />
      
      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50">
        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Upload Question'}
      </button>
    </form>
  );
}
