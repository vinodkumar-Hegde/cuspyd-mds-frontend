/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle, Loader2, Upload, XCircle } from 'lucide-react';
import { useState } from 'react';
import { adminApi, mapQuestion } from '../services/adminApi';
import { Question, SubjectId } from '../types';

interface BulkUploaderProps {
  onUploadSuccess: (questions: Question[]) => Promise<unknown>;
  selectedSubject: SubjectId;
  selectedYear: 'BDS-I' | 'BDS-II' | 'BDS-III' | 'BDS-IV';
}

export default function BulkUploader({ onUploadSuccess, selectedSubject, selectedYear }: BulkUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedQuestions, setStagedQuestions] = useState<Question[] | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true); setFeedback(null); setStagedQuestions(null);
    try {
      const rows = await adminApi.previewImport(file, selectedSubject, selectedYear);
      setStagedQuestions(rows.map(row => mapQuestion({...row, id:crypto.randomUUID()})));
      setFeedback({type:'success', message:`Validated ${rows.length} questions. Click Submit to upload.`});
    } catch (e) {handleError(e instanceof Error ? e.message : 'Unable to read file');}
    finally {setIsProcessing(false);}
  };
  const handleSubmit = async () => {
    if (!stagedQuestions || isProcessing) return;
    setIsProcessing(true);
    try {
      await onUploadSuccess(stagedQuestions);
      setFeedback({type:'success', message:`Uploaded ${stagedQuestions.length} questions.`});
      setStagedQuestions(null);
    } catch (e) {handleError(e instanceof Error ? e.message : 'Unable to save questions');}
    finally {setIsProcessing(false);}
  };

  const handleError = (msg: string) => {
    setFeedback({ type: 'error', message: msg });
    setIsProcessing(false);
  };

  return (
    <div className="space-y-4">
      <div 
        className={`
          relative border-2 border-dashed rounded-[2rem] p-10 transition-all text-center
          ${isProcessing ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white border-blue-100 hover:border-blue-400 cursor-pointer'}
        `}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (isProcessing) return;
          const file = e.dataTransfer.files[0];
          if (file) processFile(file);
        }}
      >
        <input 
          type="file" 
          id="bulk-upload" 
          className="hidden" 
          accept=".csv,.xlsx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
          disabled={isProcessing}
        />
        <label htmlFor="bulk-upload" className="cursor-pointer">
          <div className="flex flex-col items-center">
            {isProcessing ? (
              <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
            ) : (
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <Upload size={32} />
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-900">Upload Question Bank</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
              Drag and drop your spreadsheet here or click to browse. Supports CSV, XLSX.
            </p>
          </div>
        </label>
      </div>

      {stagedQuestions && (
        <button 
          onClick={handleSubmit} disabled={isProcessing}
          className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl hover:bg-blue-700 transition"
        >
          Submit {stagedQuestions.length} Questions
        </button>
      )}

      {feedback && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {feedback.type === 'success' ? <CheckCircle className="shrink-0" size={20} /> : <XCircle className="shrink-0" size={20} />}
          <div className="text-sm font-semibold">
            {feedback.message}
          </div>
        </div>
      )}
    </div>
  );
}
